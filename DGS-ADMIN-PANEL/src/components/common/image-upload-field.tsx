/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Trash2, Upload, RefreshCw } from "lucide-react";
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
}

const MAX_BYTES = 5 * 1024 * 1024;

function ImageUploadFieldInner(
  {
    id,
    value,
    onChange,
    label = "Service Icon / Image",
    hint = "PNG, JPG, WebP or SVG — max 5MB. Square format recommended.",
    error,
    uploadAction = uploadServiceIcon,
    assetNoun = "Icon",
    acceptedLabel = "Current Icon Asset",
    previewAlt = "Service icon",
    deferUpload = false,
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
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image must be 5MB or smaller");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    if (deferUpload) {
      clearPending();
      setPending(file);
      setPendingPreview(URL.createObjectURL(file));
      setImgError(false);
      return;
    }

    const url = await upload(file);
    if (url) onChange(url);
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
          toast.success("Image uploaded successfully");
        }
        return url;
      },
    }),
    [pending, upload, onChange, clearPending],
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
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {hasImage ? (
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative h-14 w-14 shrink-0 rounded-lg border border-slate-200 bg-white overflow-hidden flex items-center justify-center p-1 shadow-2xs">
              <img
                src={previewSrc}
                alt={previewAlt}
                onError={() => setImgError(true)}
                className="h-full w-full object-contain"
              />
            </div>
            {/* No status text while a selection is pending: "uploaded" would be
                a lie and the pending copy was noise. The preview speaks for
                itself — it uploads when the form is saved. */}
            {!pending && (
              <div className="min-w-0">
                <span className="text-xs font-semibold text-slate-800 block">
                  {acceptedLabel}
                </span>
                <span className="text-[11px] text-emerald-600 font-medium block">
                  ✓ Active {assetNoun.toLowerCase()} uploaded
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
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
              }}
              className="h-8 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 gap-1"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Remove</span>
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !busy && inputRef.current?.click()}
          className={cn(
            "p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-[#00668a]/50 bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-2",
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

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export const ImageUploadField = React.forwardRef(ImageUploadFieldInner);

ImageUploadField.displayName = "ImageUploadField";

export default ImageUploadField;
