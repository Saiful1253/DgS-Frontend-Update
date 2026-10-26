"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  FileText,
  ImageIcon,
  Star,
  Award,
  Medal,
  Flame,
  ShieldCheck,
  Scale,
  Upload,
  RefreshCw,
  Trash2,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { uploadCertificateIconAction } from "@/actions/upload.actions";

import {
  ImageUploadField,
  type ImageUploadFieldHandle,
} from "@/components/common/image-upload-field";
import CertificateImageModal from "./certificate-image-modal";
import RichTextEditor from "@/components/common/rich-text-editor";
import { certificateSchema } from "@/zod/certificate.validation";
import {
  clearFieldError,
  firstError,
  validateDraft,
  type FieldErrors,
} from "@/lib/form-validation";
import {
  createCertificate,
  updateCertificate,
  uploadCertificateFile,
} from "@/services/certificate/certificate.service";
import type {
  Certificate,
  CertificateFileType,
  CertificateIcon,
  CertificateUploadResult,
} from "@/types/certificate";
import { CERTIFICATE_ICONS } from "@/types/certificate";

/**
 * Create / edit form for one certificate (spec §4).
 *
 * Three decisions worth stating:
 *
 * 1. `file_type` is derived from the upload, never picked by hand. The admin
 *    chooses a file; `/upload/document` reports what Cloudinary stored, and the
 *    thumbnail for a PDF is page 1 of that same asset. A radio that can
 *    contradict the stored file is how a PDF ends up rendered through `<img>`.
 *
 * 2. Bangla and English are authored in tabs, not stacked. Two Quill instances
 *    on one screen is a scroll trap, and a stack invites the admin to fill one
 *    and forget the other.
 *
 * 3. Descriptions are optional, titles are not — for both languages.
 */

/**
 * Icon preview map for the picker.
 *
 * The same six keys are rendered by the storefront section; this copy exists so
 * the admin sees the chosen glyph while editing rather than after saving.
 */
const ICON_PREVIEW: Record<CertificateIcon, React.ElementType> = {
  award: Award,
  medal: Medal,
  flame: Flame,
  shield: ShieldCheck,
  scale: Scale,
  file: FileText,
};

const ICON_HINT: Record<CertificateIcon, string> = {
  award: "Licence / first-class award",
  medal: "Departmental approval",
  flame: "Fire & safety standard",
  shield: "Quality or accreditation mark",
  scale: "Regulatory registration",
  file: "Generic document",
};

const emptyForm = {
  title: "",
  description: "",
  file_url: "",
  thumb_url: "" as string | null,
  file_type: "image" as CertificateFileType,
  reg_no: "",
  category_icon: "",
  sub_label: "",
  issuing_authority: "",
  year: "" as number | "",
  verification_link: "",
  is_featured: false,
  is_active: true,
  display_order: 0,
};

type FormState = typeof emptyForm;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Null for create, populated for edit. */
  certificate: Certificate | null;
  /** Next display order when creating, so a new card lands at the end. */
  nextDisplayOrder: number;
  onSaved: (saved: Certificate) => void;
}

export default function CertificateFormModal({
  open,
  onOpenChange,
  certificate,
  nextDisplayOrder,
  onSaved,
}: Props) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const uploadRef = useRef<ImageUploadFieldHandle>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);
  const [iconUploading, setIconUploading] = useState(false);
  const [pendingIconFile, setPendingIconFile] = useState<File | null>(null);
  const [pendingIconPreview, setPendingIconPreview] = useState<string>("");

  const clearPendingIcon = useCallback(() => {
    setPendingIconPreview((curr) => {
      if (curr && curr.startsWith("blob:")) URL.revokeObjectURL(curr);
      return "";
    });
    setPendingIconFile(null);
  }, []);

  useEffect(() => clearPendingIcon, [clearPendingIcon]);

  /**
   * Metadata from the last successful upload, captured at upload time.
   *
   * The shared field only hands back a URL, but the file type has to be read
   * from the server's answer rather than guessed from the extension — the URL
   * is the one thing that must not decide how the file is rendered.
   */
  const uploadMeta = useRef<{ file_type: CertificateFileType; thumb_url: string } | null>(
    null
  );

  const uploadWithMeta = useCallback(async (formData: FormData) => {
    const res = await uploadCertificateFile(formData);
    if (res.success && res.data) {
      const data = res.data as CertificateUploadResult;
      uploadMeta.current = {
        file_type: data.file_type ?? "image",
        thumb_url: data.thumb_url ?? data.url,
      };
    }
    return res;
  }, []);

  useEffect(() => {
    if (!open) {
      clearPendingIcon();
      return;
    }
    clearPendingIcon();
    uploadMeta.current = null;
    setFieldErrors({});
    setForm(
      certificate
        ? {
            title: certificate.title ?? "",
            description: certificate.description ?? "",
            file_url: certificate.file_url ?? "",
            thumb_url: certificate.thumb_url ?? certificate.file_url ?? "",
            file_type: certificate.file_type ?? "image",
            reg_no: certificate.reg_no ?? "",
            category_icon: certificate.category_icon ?? "",
            sub_label: certificate.sub_label ?? "",
            issuing_authority: certificate.issuing_authority ?? "",
            year: certificate.year ?? "",
            verification_link: certificate.verification_link ?? "",
            is_featured: certificate.is_featured ?? false,
            is_active: certificate.is_active ?? true,
            display_order: certificate.display_order ?? 0,
          }
        : { ...emptyForm, display_order: nextDisplayOrder }
    );
  }, [open, certificate, nextDisplayOrder, clearPendingIcon]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => clearFieldError(prev, key as string));
  };

  /** Wrap a Quill onChange so it stores the HTML and clears a stale error. */
  const setHtml = (key: "description", html: string) => {
    setForm((prev) => ({ ...prev, [key]: html }));
    setFieldErrors((prev) => clearFieldError(prev, key));
  };

  const handleFileChange = (url: string) => {
    setForm((prev) => ({
      ...prev,
      file_url: url,
      file_type: url ? uploadMeta.current?.file_type ?? "image" : prev.file_type,
      thumb_url: url ? uploadMeta.current?.thumb_url ?? url : "",
    }));
    setFieldErrors((prev) => clearFieldError(prev, "file_url"));
  };

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image (PNG, SVG, JPG, WebP)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Icon must be under 5MB");
      return;
    }
    clearPendingIcon();
    setPendingIconFile(file);
    setPendingIconPreview(URL.createObjectURL(file));
    setFieldErrors((prev) => clearFieldError(prev, "category_icon"));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || iconUploading) return;

    // Pre-validate through Zod schema so all missing mandatory fields trigger fieldErrors
    const candidateFile =
      form.file_url || (uploadRef.current?.hasPending() ? "pending-file" : "");
    const candidateIcon =
      form.category_icon || (pendingIconFile ? "pending-icon" : "");

    const preValidationDraft = {
      ...form,
      file_url: candidateFile,
      category_icon: candidateIcon,
      description: form.description || null,
      issuing_authority: form.issuing_authority || null,
      verification_link: form.verification_link || null,
      reg_no: form.reg_no.trim() || null,
      sub_label: form.sub_label.trim() || null,
      year: form.year === "" ? null : Number(form.year),
    };

    const { ok: validBeforeUpload, fieldErrors: preErrors } = validateDraft(
      certificateSchema,
      preValidationDraft
    );

    if (!validBeforeUpload) {
      setFieldErrors(preErrors);
      toast.error(firstError(preErrors) || "Please fix the highlighted fields");
      return;
    }

    setSaving(true);
    try {
      let fileUrl = form.file_url;
      let thumbUrl = form.thumb_url;
      let fileType = form.file_type;

      // 1. Upload certificate document if pending
      if (uploadRef.current?.hasPending()) {
        const uploadedUrl = await uploadRef.current.flush();
        if (!uploadedUrl) {
          setSaving(false);
          return;
        }
        fileUrl = uploadedUrl;
        fileType = uploadMeta.current?.file_type ?? "image";
        thumbUrl = uploadMeta.current?.thumb_url ?? uploadedUrl;
      }

      // 2. Upload card icon if pending
      let categoryIconUrl = form.category_icon;
      if (pendingIconFile) {
        setIconUploading(true);
        const formData = new FormData();
        formData.append("file", pendingIconFile);
        const iconRes = await uploadCertificateIconAction(formData);
        const iconUrl = (iconRes.data as { url?: string } | undefined)?.url;
        if (!iconRes.success || !iconUrl) {
          toast.error(iconRes.message || "Failed to upload card icon");
          setSaving(false);
          setIconUploading(false);
          return;
        }
        categoryIconUrl = iconUrl;
        clearPendingIcon();
        setIconUploading(false);
      }

      const draft = {
        ...form,
        file_url: fileUrl,
        thumb_url: thumbUrl || null,
        file_type: fileType,
        description: form.description || null,
        issuing_authority: form.issuing_authority || null,
        verification_link: form.verification_link || null,
        reg_no: form.reg_no.trim() || null,
        // An unselected picker must persist as null, not as the string "".
        category_icon: categoryIconUrl || null,
        sub_label: form.sub_label.trim() || null,
        year: form.year === "" ? null : Number(form.year),
      };

      const { ok: valid, fieldErrors: valErrors, draft: parsed } = validateDraft(certificateSchema, draft);
      if (!valid) {
        setFieldErrors(valErrors);
        toast.error(firstError(valErrors) || "Please fix the highlighted fields");
        setSaving(false);
        return;
      }

      const res = certificate
        ? await updateCertificate(certificate.id, parsed)
        : await createCertificate(parsed);

      if (!res.success) {
        toast.error(res.message || "Failed to save certificate");
        setSaving(false);
        return;
      }

      toast.success(certificate ? "Certificate updated" : "Certificate created");
      onSaved(res.data as Certificate);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save certificate");
    } finally {
      setSaving(false);
      setIconUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {certificate ? "Edit Certificate" : "New Certificate"}
          </DialogTitle>
          <DialogDescription>
            Title first, then the file, then the description — the order the public
            certificate card renders in.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* ── Media ─────────────────────────────────────────────── */}
          <ImageUploadField
            ref={uploadRef}
            id="certificate-file"
            value={form.file_url}
            onChange={handleFileChange}
            uploadAction={uploadWithMeta}
            allowedMimePrefixes={["image/", "application/pdf"]}
            maxBytes={10 * 1024 * 1024}
            filePreview
            onPreviewClick={() => setPreviewModalOpen(true)}
            deferUpload={true}
            suppressSuccessToast={true}
            label="Certificate File (Image or PDF) *"
            hint="PDF or image — max 10MB. A PDF's first page becomes the grid thumbnail."
            assetNoun="File"
            acceptedLabel="Current certificate file"
            error={fieldErrors.file_url}
          />

          {form.file_url ? (
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="flex items-center gap-1.5 text-xs text-slate-500">
                {form.file_type === "pdf" ? (
                  <FileText className="h-3.5 w-3.5 text-red-500" />
                ) : (
                  <ImageIcon className="h-3.5 w-3.5 text-[#00668a]" />
                )}
                Stored as {form.file_type.toUpperCase()} —{" "}
                {form.file_type === "pdf"
                  ? "opens in the embedded PDF viewer on the site."
                  : "opens full size in the image lightbox."}
              </p>
              <button
                type="button"
                onClick={() => setPreviewModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs text-[#00668a] hover:underline font-semibold"
              >
                <Eye className="h-3.5 w-3.5" />
                Preview File
              </button>
            </div>
          ) : null}

          {/* ── Title ──────────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <Label
              htmlFor="certificate-title"
              className="text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
              Title *
            </Label>
            <Input
              id="certificate-title"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Titas Gas First Class Contractor License"
              className={fieldErrors.title ? "border-red-400" : ""}
            />
            {fieldErrors.title ? (
              <p className="text-xs text-red-600">{fieldErrors.title}</p>
            ) : (
              <p className="text-[11px] text-slate-500">
                Written in English. The Bangla version of the site is produced from this
                text automatically — no separate field to keep in step.
              </p>
            )}
          </div>

          {/* ── Regulatory identity ───────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="certificate-reg-no"
                className="text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Registration / License No.
              </Label>
              <Input
                id="certificate-reg-no"
                value={form.reg_no}
                onChange={(e) => set("reg_no", e.target.value)}
                placeholder="REG #TGS-1C-4402"
                className={fieldErrors.reg_no ? "border-red-400" : ""}
              />
              {fieldErrors.reg_no ? (
                <p className="text-xs text-red-600">{fieldErrors.reg_no}</p>
              ) : (
                <p className="text-[11px] text-slate-500">
                  Shown as the pill at the top of the card.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Card Icon *
              </Label>

              <input
                ref={iconInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={handleIconChange}
              />

              {pendingIconPreview || form.category_icon ? (
                <div className={`flex h-10 items-center justify-between rounded-md border bg-slate-50/70 px-2.5 ${fieldErrors.category_icon ? "border-red-400" : "border-slate-200"}`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-slate-200 bg-white p-0.5">
                      {pendingIconPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={pendingIconPreview}
                          alt="Card Icon Preview"
                          className="h-full w-full object-contain"
                        />
                      ) : form.category_icon.startsWith("http") || form.category_icon.startsWith("/") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={form.category_icon}
                          alt="Card Icon"
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        (() => {
                          const IconComp =
                            form.category_icon in ICON_PREVIEW
                              ? ICON_PREVIEW[form.category_icon as CertificateIcon]
                              : FileText;
                          return <IconComp className="h-4 w-4 text-[#00668a]" />;
                        })()
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="truncate text-xs font-medium text-slate-700 block max-w-[130px]">
                        {pendingIconFile
                          ? pendingIconFile.name
                          : form.category_icon.startsWith("http") || form.category_icon.startsWith("/")
                          ? "Icon image"
                          : ICON_HINT[form.category_icon as CertificateIcon] || "Preset icon"}
                      </span>
                      <span
                        className={`text-[10px] font-medium block ${
                          pendingIconFile ? "text-emerald-600" : "text-slate-400"
                        }`}
                      >
                        {pendingIconFile ? "✓ Ready — saves on submit" : "Active icon"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={saving || iconUploading}
                      onClick={() => iconInputRef.current?.click()}
                      className="h-7 px-2 text-xs text-slate-600 hover:text-slate-900"
                      title="Replace icon"
                    >
                      {iconUploading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#00668a]" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={saving || iconUploading}
                      onClick={() => {
                        clearPendingIcon();
                        set("category_icon", "");
                        if (iconInputRef.current) iconInputRef.current.value = "";
                      }}
                      className="h-7 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                      title="Remove icon"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={saving || iconUploading}
                  onClick={() => iconInputRef.current?.click()}
                  className={`flex h-10 w-full items-center justify-center gap-2 rounded-md border border-dashed px-3 text-xs font-medium transition-colors ${
                    fieldErrors.category_icon
                      ? "border-red-400 bg-red-50/20 text-red-600 hover:border-red-500"
                      : "border-slate-300 bg-white text-slate-600 hover:border-[#00668a] hover:bg-slate-50/70 hover:text-slate-900"
                  }`}
                >
                  {iconUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-[#00668a]" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className={`h-4 w-4 ${fieldErrors.category_icon ? "text-red-500" : "text-[#00668a]"}`} />
                      <span>Upload Icon (PNG / SVG)</span>
                    </>
                  )}
                </button>
              )}

              {fieldErrors.category_icon ? (
                <p className="text-xs text-red-600">{fieldErrors.category_icon}</p>
              ) : (
                <p className="text-[11px] text-slate-500">
                  Square PNG, SVG or WebP icon shown on card.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="certificate-sub-label"
                className="text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Sub-label / Footer Note
              </Label>
              <Input
                id="certificate-sub-label"
                value={form.sub_label}
                onChange={(e) => set("sub_label", e.target.value)}
                placeholder="Verified & Active License"
                className={fieldErrors.sub_label ? "border-red-400" : ""}
              />
              {fieldErrors.sub_label ? (
                <p className="text-xs text-red-600">{fieldErrors.sub_label}</p>
              ) : (
                <p className="text-[11px] text-slate-500">
                  Falls back to the issuing authority when empty.
                </p>
              )}
            </div>
          </div>

          {/* ── Description ────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Description (Rich Text)
            </Label>
            <RichTextEditor
              value={form.description}
              onChange={(content) => setHtml("description", content)}
              placeholder="Scope, validity, issuing body — anything a client should read before calling."
            />
          </div>

          {/* ── Provenance ────────────────────────────────────────── */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="certificate-authority"
                className="text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Issuing Authority
              </Label>
              <Input
                id="certificate-authority"
                value={form.issuing_authority}
                onChange={(e) => set("issuing_authority", e.target.value)}
                placeholder="Bangladesh Bureau of..."
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="certificate-year"
                className="text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Year
              </Label>
              <Input
                id="certificate-year"
                type="number"
                min={1900}
                max={2200}
                value={form.year}
                onChange={(e) =>
                  set("year", e.target.value === "" ? "" : Number(e.target.value))
                }
                placeholder="2024"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="certificate-verification"
                className="text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Verification Link
              </Label>
              <Input
                id="certificate-verification"
                value={form.verification_link}
                onChange={(e) => set("verification_link", e.target.value)}
                placeholder="https://…"
                className={fieldErrors.verification_link ? "border-red-400" : ""}
              />
              {fieldErrors.verification_link ? (
                <p className="text-xs text-red-600">{fieldErrors.verification_link}</p>
              ) : null}
            </div>
          </div>

          {/* ── Display Order, Featured & Active Status ─────────────── */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="certificate-order"
                className="text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Display Order
              </Label>
              <Input
                id="certificate-order"
                type="number"
                min={0}
                value={form.display_order}
                onChange={(e) => set("display_order", Number(e.target.value) || 0)}
                placeholder="0"
                className="h-10 rounded-md border-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Featured
              </Label>
              <div className="flex h-10 items-center justify-between rounded-md border border-slate-200 bg-slate-50/70 px-3">
                <span className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                  <Star className="h-3.5 w-3.5 text-amber-500" />
                  Show on Home
                </span>
                <Switch
                  checked={form.is_featured}
                  onCheckedChange={(v) => set("is_featured", v)}
                  aria-label="Featured on landing page"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Active Status
              </Label>
              <div className="flex h-10 items-center justify-between rounded-md border border-slate-200 bg-slate-50/70 px-3">
                <span className="text-xs font-medium text-slate-700">
                  Public Visible
                </span>
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(v) => set("is_active", v)}
                  aria-label="Active status"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving || iconUploading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || iconUploading} className="gap-2">
              {saving || iconUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving || iconUploading
                ? "Saving..."
                : certificate
                ? "Save Changes"
                : "Create Certificate"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      <CertificateImageModal
        open={previewModalOpen}
        onOpenChange={setPreviewModalOpen}
        fileUrl={form.file_url}
        thumbUrl={form.thumb_url}
        fileType={form.file_type}
        title={form.title || "Certificate Preview"}
      />
    </Dialog>
  );
}