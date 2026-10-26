/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Trash2, Upload, RefreshCw, FileText, Eye } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { uploadServiceIcon, type ActionResult } from "@/services/service/service.service";
import { cn } from "@/lib/utils";

export interface ImageUploadFieldHandle {
  /**
   * Uploads a pending selection.
   *
   * Tri-state on purpose, so a caller can tell "nothing was chosen" from "the
   * upload failed" — collapsing the latter into `null` would let a form save
   * while silently dropping the image the admin picked.
   *
   * - `undefined` — nothing pending, keep the current value
   * - `string`    — uploaded, persist this URL
   * - `null`      — pending upload failed, abort the save
   */
  flush: () => Promise<string | null | undefined>;
  hasPending: () => boolean;
}

interface Props {
  id: string;
  value: string;
  onChange: (url: string) => void;
  label?: string;
  hint?: string;
  error?: string;
  onFileSelect?: (file: File | null) => void;
  /**
   * Which server action performs the upload. Defaults to the service uploader so
   * existing call sites keep working, but it must be passed for any other module:
   * the action carries the target Cloudinary folder and the label the
   * caller is checked against, so hardcoding one action here meant a pillar icon
   * silently landed in the `services/` folder and demanded
   * `services.services.manage` from whoever was editing pillars.
   */
  uploadAction?: (formData: FormData) => Promise<ActionResult>;
  assetNoun?: string;
  acceptedLabel?: string;
  previewAlt?: string;
  /**
   * Hold the chosen file and upload it only when the parent submits.
   *
   * Uploading on selection meant abandoning a modal still billed a Cloudinary
   * write and left an orphan asset on the server. The preview is unaffected — a
   * local object URL renders immediately either way.
   */
  deferUpload?: boolean;
  /** Suppress internal success toast on flush when parent handles submission toast. */
  suppressSuccessToast?: boolean;
  /**
   * MIME prefixes the file picker accepts. Defaults to images only.
   *
   * Widened to `["image/", "application/pdf"]` for certificate uploads, which
   * cannot go through `/upload/image` — that route converts to webp, which
   * destroys a PDF scan.
   */
  allowedMimePrefixes?: string[];
  maxBytes?: number;
  /**
   * Render the current value as a file chip instead of an image thumbnail.
   *
   * A PDF has no inline preview to show, so the field would otherwise render a
   * broken `<img>`; this draws the filename and lets the form surface the file
   * type it is about to persist.
   */
  filePreview?: boolean;
  /**
   * Optional callback when clicking the preview icon/box or filename to view the file full size
   */
  onPreviewClick?: () => void;
  /** Render compact single-line or small dropzone suitable for small icons */
  compact?: boolean;
}

const MAX_BYTES = 5 * 1024 * 1024;

/** `["image/"]` → `"image/*"`, so the browser picker offers the same set. */
function toAcceptAttr(prefixes: string[]): string {
  return prefixes.map((p) => (p.endsWith("/") ? `${p}*` : p)).join(",");
}

function ImageUploadFieldInner(
  {
    id,
    value,
    onChange,
    label = "Service Icon / Image",
    hint = "PNG, JPG, WebP or SVG — max 5MB. Square format recommended.",
    error,
    onFileSelect,
    uploadAction = uploadServiceIcon,
    assetNoun = "Icon",
    acceptedLabel = "Current Icon Asset",
    previewAlt = "Service icon",
    deferUpload = false,
    suppressSuccessToast = false,
    allowedMimePrefixes = ["image/"],
    maxBytes = MAX_BYTES,
    filePreview = false,
    onPreviewClick,
    compact = false,
  }: Props,
  ref: React.Ref<ImageUploadFieldHandle>,
) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [pending, setPending] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string>("");

  // Object URLs are a leak until revoked; release on replace, clear and unmount.
  const clearPending = useCallback(() => {
    setPendingPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return "";
    });
    setPending(null);
  }, []);

  useEffect(() => clearPending, [clearPending]);

  const upload = useCallback(async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const res = await uploadAction(formData);
      const url = (res.data as { url?: string } | undefined)?.url;
      if (res.success && url) return url;
      toast.error(res.message || "Failed to upload image");
      return null;
    } catch {
      toast.error("Failed to upload image");
      return null;
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }, [uploadAction]);

  const handleFile = async (file: File) => {
    if (!allowedMimePrefixes.some((prefix) => file.type.startsWith(prefix))) {
      toast.error(
        allowedMimePrefixes.includes("application/pdf")
          ? "Please choose an image file or a PDF"
          : "Please choose an image file"
      );
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    if (file.size > maxBytes) {
      toast.error(`File must be ${Math.round(maxBytes / (1024 * 1024))}MB or smaller`);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    if (deferUpload) {
      clearPending();
      setPending(file);
      setPendingPreview(URL.createObjectURL(file));
      setImgError(false);
      onFileSelect?.(file);
      return;
    }

    const url = await upload(file);
    if (url) {
      onChange(url);
      onFileSelect?.(file);
    }
  };

  React.useImperativeHandle(
    ref,
    () => ({
      hasPending: () => pending !== null,
      flush: async () => {
        if (!pending) return undefined;
        const file = pending;
        const url = await upload(file);
        if (url) {
          onChange(url);
          clearPending();
          if (!suppressSuccessToast) {
            toast.success("Image uploaded successfully");
          }
        }
        return url;
      },
    }),
    [pending, upload, onChange, clearPending, suppressSuccessToast],
  );

  const previewSrc = pendingPreview || value;
  const hasImage = Boolean(previewSrc && !imgError);
  const busy = uploading;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="text-xs font-semibold text-slate-700 uppercase tracking-wider"
        >
          {label}
        </label>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={toAcceptAttr(allowedMimePrefixes)}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {filePreview && previewSrc ? (
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/70">
          <div
            className={cn(
              "flex items-center gap-3 min-w-0 flex-1",
              (onPreviewClick || previewSrc) && "cursor-pointer group/file"
            )}
            onClick={() => {
              if (onPreviewClick) {
                onPreviewClick();
              } else if (previewSrc) {
                window.open(previewSrc, "_blank", "noopener,noreferrer");
              }
            }}
            title="Click to view file"
          >
            <div className="h-14 w-14 shrink-0 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-[#00668a] group-hover/file:border-[#00668a] transition-colors">
              <FileText className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-slate-800 block truncate group-hover/file:text-[#00668a] transition-colors">
                {pending ? pending.name : previewSrc.split("/").pop() || acceptedLabel}
              </span>
              <span className="text-[11px] text-emerald-600 font-medium block">
                {pending
                  ? "✓ File ready — uploads when you save"
                  : `✓ Active ${assetNoun.toLowerCase()} uploaded`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {(onPreviewClick || previewSrc) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (onPreviewClick) {
                    onPreviewClick();
                  } else if (previewSrc) {
                    window.open(previewSrc, "_blank", "noopener,noreferrer");
                  }
                }}
                className="h-8 text-xs font-semibold gap-1.5 bg-white border-slate-200 text-slate-700 hover:text-[#00668a] hover:border-[#00668a]"
                title="View document"
              >
                <Eye className="h-3.5 w-3.5 text-slate-500" />
                <span>View</span>
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="h-8 text-xs font-semibold gap-1.5 bg-white border-slate-200"
            >
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#00668a]" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
              )}
              <span>{busy ? "Uploading..." : "Replace"}</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => {
                clearPending();
                onChange("");
                setImgError(false);
                onFileSelect?.(null);
              }}
              className="h-8 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 gap-1"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Remove</span>
            </Button>
          </div>
        </div>
      ) : hasImage ? (
        <div className={cn(
          "flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70",
          compact ? "p-2" : "p-3"
        )}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={cn(
              "relative shrink-0 rounded-lg border border-slate-200 bg-white overflow-hidden flex items-center justify-center shadow-2xs",
              compact ? "h-10 w-10 p-1" : "h-14 w-14 p-1"
            )}>
              <img
                src={previewSrc}
                alt={previewAlt}
                onError={() => setImgError(true)}
                className="h-full w-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-slate-800 block truncate max-w-[200px] sm:max-w-[260px]">
                {pending ? pending.name : acceptedLabel}
              </span>
              <span className="text-[10px] sm:text-[11px] text-emerald-600 font-medium block">
                {pending
                  ? "✓ Ready — uploads on save"
                  : `✓ Active ${assetNoun.toLowerCase()}`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="h-7 text-xs font-semibold gap-1 bg-white border-slate-200 px-2"
            >
              {busy ? (
                <Loader2 className="h-3 w-3 animate-spin text-[#00668a]" />
              ) : (
                <RefreshCw className="h-3 w-3 text-slate-500" />
              )}
              <span>{busy ? "Uploading..." : "Replace"}</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => {
                clearPending();
                onChange("");
                setImgError(false);
                onFileSelect?.(null);
              }}
              className="h-7 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-2 gap-1"
            >
              <Trash2 className="h-3 w-3" />
              <span>Remove</span>
            </Button>
          </div>
        </div>
      ) : compact ? (
        <div
          onClick={() => !busy && inputRef.current?.click()}
          className={cn(
            "p-2.5 px-3 rounded-xl border border-dashed bg-slate-50/60 hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-between gap-2.5",
            error
              ? "border-red-400 bg-red-50/20 hover:border-red-500"
              : "border-slate-300 hover:border-[#00668a]/60 hover:bg-sky-50/30",
            busy && "opacity-70 pointer-events-none cursor-not-allowed"
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 shrink-0 rounded-lg bg-sky-100 text-[#00668a] flex items-center justify-center">
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#00668a]" />
              ) : (
                <Upload className="h-4 w-4 text-[#00668a]" />
              )}
            </div>
            <div className="min-w-0 text-left">
              <p className="text-xs font-semibold text-slate-700 truncate">
                {busy ? "Uploading icon..." : "Upload Service Icon"}
              </p>
              {hint && <p className="text-[10px] text-slate-400 truncate">{hint}</p>}
            </div>
          </div>
          <span className="shrink-0 text-[11px] font-semibold text-[#00668a] bg-white border border-[#00668a]/30 px-2.5 py-1 rounded-md shadow-2xs hover:bg-[#e6eff6]">
            Browse
          </span>
        </div>
      ) : (
        <div
          onClick={() => !busy && inputRef.current?.click()}
          className={cn(
            "p-4 rounded-xl border-2 border-dashed bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-2",
            error
              ? "border-red-400 bg-red-50/20 hover:border-red-500"
              : "border-slate-200 hover:border-[#00668a]/50",
            busy && "opacity-70 pointer-events-none cursor-not-allowed"
          )}
        >
          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
            {busy ? (
              <Loader2 className="h-5 w-5 animate-spin text-[#00668a]" />
            ) : (
              <Upload className="h-5 w-5 text-[#00668a]" />
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-700">
              {busy ? "Uploading image..." : "Click to upload an image"}
            </p>
            {hint && <p className="text-[11px] text-slate-400 mt-0.5">{hint}</p>}
          </div>
        </div>
      )}

      {error && (!hasImage || !error.toLowerCase().includes("required")) && (
        <p className="text-xs text-red-500 font-medium">{error}</p>
      )}
    </div>
  );
}

export const ImageUploadField = React.forwardRef(ImageUploadFieldInner);

ImageUploadField.displayName = "ImageUploadField";

export default ImageUploadField;
