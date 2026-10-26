"use client";

import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
  Star,
  Plus,
  Sparkles,
  Loader2,
  UploadCloud,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { testimonialCreateSchema } from "@/zod/testimonial.validation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { createTestimonialAction } from "@/actions/testimonial.actions";
import ImageUploadField from "@/components/common/image-upload-field";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface Props {
  onAdded?: () => void;
  trigger?: React.ReactNode;
}

export default function AddTestimonialModal({ onAdded, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form States
  const [authorName, setAuthorName] = useState("");
  const [authorRole, setAuthorRole] = useState("");
  const [authorCompany, setAuthorCompany] = useState("");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [status, setStatus] = useState<"pending" | "approved" | "rejected">("approved");
  const [isFeatured, setIsFeatured] = useState(true);
  const [content, setContent] = useState("");
  const [screenshot, setScreenshot] = useState<{ file: File; preview: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setAuthorName("");
    setAuthorRole("");
    setAuthorCompany("");
    setRating(5);
    setHoverRating(null);
    setStatus("approved");
    setIsFeatured(true);
    setContent("");
    if (screenshot?.preview) URL.revokeObjectURL(screenshot.preview);
    setScreenshot(null);
    setErrors({});
  };

  const handleClose = () => {
    if (submitting) return;
    resetForm();
    setOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error("File size exceeds 5MB limit.");
      return;
    }

    if (screenshot?.preview) URL.revokeObjectURL(screenshot.preview);

    setScreenshot({
      file,
      preview: URL.createObjectURL(file),
    });
    setErrors((prev) => ({ ...prev, file: undefined }));
  };

  const handleRemoveImage = () => {
    if (screenshot?.preview) URL.revokeObjectURL(screenshot.preview);
    setScreenshot(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const rawData = {
      author_name: authorName.trim(),
      customer_name: authorName.trim(),
      author_role: authorRole.trim() || undefined,
      author_company: authorCompany.trim() || undefined,
      rating,
      type: screenshot ? "image" : "text",
      is_featured: status === "rejected" ? false : isFeatured,
      status,
      content: content.trim(),
    };

    const parsed = testimonialCreateSchema.safeParse(rawData);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors(
        Object.fromEntries(
          Object.entries(fieldErrors).map(([k, v]) => [k, v?.[0]])
        )
      );
      toast.error("Please fill in the required fields correctly.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("data", JSON.stringify(rawData));
      if (screenshot?.file) {
        formData.append("file", screenshot.file);
      }

      const res = await createTestimonialAction(formData);
      if (res.success) {
        toast.success(res.message || "Testimonial published successfully");
        handleClose();
        onAdded?.();
      } else {
        if (res.errors) {
          setErrors(res.errors);
        }
        toast.error(res.message || "Failed to create testimonial");
      }
    } catch {
      toast.error("An unexpected error occurred while saving.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : handleClose())}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button className="h-10 px-4 rounded-xl bg-[#00668a] hover:bg-[#004c69] text-white font-bold text-xs gap-1.5 shadow-sm cursor-pointer">
            <Plus className="w-4 h-4" />
            <span>Add Testimonial</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white p-6 rounded-2xl shadow-2xl">
        <DialogHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-[#00668a]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Add Client Testimonial
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Publish verified client feedback, executive endorsements, and reviews displayed on the public storefront.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 pt-2">
          {/* Client / Author Name */}
          <div className="space-y-1.5">
            <Label
              htmlFor="create-author-name"
              className="text-xs font-semibold text-slate-700 uppercase tracking-wider"
            >
              Client / Author Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="create-author-name"
              placeholder="e.g. Engr. Tariqul Islam"
              value={authorName}
              onChange={(e) => {
                setAuthorName(e.target.value);
                setErrors((prev) => ({ ...prev, author_name: undefined }));
              }}
              className={cn(
                "h-10 text-sm rounded-lg border-slate-200 bg-white",
                errors.author_name && "border-red-500 focus-visible:ring-red-500"
              )}
            />
            {errors.author_name && (
              <p className="text-xs text-red-500 font-medium">{errors.author_name}</p>
            )}
          </div>

          {/* Designation & Company (Side by Side) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="create-author-role"
                className="text-xs font-semibold text-slate-700 uppercase tracking-wider"
              >
                Designation / Role
              </Label>
              <Input
                id="create-author-role"
                placeholder="e.g. Chief MEP Consultant"
                value={authorRole}
                onChange={(e) => setAuthorRole(e.target.value)}
                className="h-10 text-sm rounded-lg border-slate-200 bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="create-author-company"
                className="text-xs font-semibold text-slate-700 uppercase tracking-wider"
              >
                Company / Organization
              </Label>
              <Input
                id="create-author-company"
                placeholder="e.g. Shanta Holdings Ltd."
                value={authorCompany}
                onChange={(e) => setAuthorCompany(e.target.value)}
                className="h-10 text-sm rounded-lg border-slate-200 bg-white"
              />
            </div>
          </div>

          {/* Rating Stars & Moderation Status (Side by Side) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Rating Stars <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center justify-between h-10 px-3.5 rounded-lg border border-slate-200 bg-white">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      className="p-0.5 hover:scale-110 transition-transform cursor-pointer focus:outline-hidden"
                      aria-label={`Select ${star} stars`}
                    >
                      <Star
                        className={cn(
                          "w-4 h-4 transition-colors",
                          star <= (hoverRating ?? rating)
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-200 hover:text-amber-200"
                        )}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold text-[#00668a]">
                  {rating} of 5 Stars
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Moderation Status
              </Label>
              <Select
                value={status}
                onValueChange={(val: "pending" | "approved" | "rejected") => {
                  setStatus(val);
                  if (val === "rejected") {
                    setIsFeatured(false);
                  }
                }}
              >
                <SelectTrigger className="h-10 text-sm rounded-lg border-slate-200 bg-white">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Approved (Live on website)</SelectItem>
                  <SelectItem value="pending">Pending Moderation</SelectItem>
                  <SelectItem value="rejected">Rejected / Hidden</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Feedback & Quote Content */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="create-content"
                className="text-xs font-semibold text-slate-700 uppercase tracking-wider"
              >
                Feedback & Quote Content <span className="text-red-500">*</span>
              </Label>
              <span className="text-[11px] text-slate-400 font-medium">
                {content.length} characters
              </span>
            </div>
            <textarea
              id="create-content"
              rows={3}
              placeholder="Write the full feedback, endorsement details, and experience with DGS..."
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setErrors((prev) => ({ ...prev, content: undefined }));
              }}
              className={cn(
                "w-full text-sm rounded-lg border border-slate-200 bg-white p-3 focus:outline-hidden focus:ring-2 focus:ring-[#00668a] transition-all resize-none",
                errors.content && "border-red-500"
              )}
            />
            {errors.content && (
              <p className="text-xs text-red-500 font-medium">{errors.content}</p>
            )}
          </div>

          {/* Feature in Marquee Toggle Segment (Matching create-why-choose-us-modal pattern) */}
          <div className="pt-2 border-t border-slate-100">
            <div
              className={cn(
                "p-4 rounded-xl border transition-all",
                status === "rejected"
                  ? "bg-slate-100/70 border-slate-200 opacity-60 cursor-not-allowed"
                  : isFeatured
                  ? "bg-amber-50/70 border-amber-200"
                  : "bg-slate-50 border-slate-200"
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor="create-is-featured"
                      className={cn(
                        "text-xs font-bold text-slate-900",
                        status === "rejected" ? "cursor-not-allowed text-slate-500" : "cursor-pointer"
                      )}
                    >
                      Feature in Public Marquee
                    </Label>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        status === "rejected"
                          ? "bg-red-100 text-red-700"
                          : isFeatured
                          ? "bg-amber-200/90 text-amber-900"
                          : "bg-slate-200 text-slate-600"
                      )}
                    >
                      {status === "rejected"
                        ? "Auto-Unfeatured (Rejected)"
                        : isFeatured
                        ? "Featured"
                        : "Standard"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {status === "rejected"
                      ? "Rejected reviews cannot be featured in public marquee."
                      : "Puts review in public homepage scrolling marquee loop."}
                  </p>
                </div>
                <Switch
                  id="create-is-featured"
                  checked={status === "rejected" ? false : isFeatured}
                  disabled={status === "rejected"}
                  onCheckedChange={(checked) => {
                    if (status === "rejected") {
                      setIsFeatured(false);
                      return;
                    }
                    setIsFeatured(checked);
                  }}
                  className="data-[state=checked]:bg-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Photo / Screenshot Uploader (Matching Service / Standard ImageUploadField Pattern) */}
          <div className="space-y-1.5">
            <ImageUploadField
              id="create-testimonial-image"
              value=""
              onChange={() => {}}
              onFileSelect={(file) => {
                if (file) {
                  setScreenshot({
                    file,
                    preview: URL.createObjectURL(file),
                  });
                  setErrors((prev) => ({ ...prev, file: undefined }));
                } else {
                  if (screenshot?.preview) URL.revokeObjectURL(screenshot.preview);
                  setScreenshot(null);
                }
              }}
              label="Attached Photo or Screenshot Proof (Optional)"
              hint="Client headshot or review screenshot — PNG, JPG, or WebP max 5MB"
              assetNoun="Client Photo"
              acceptedLabel="Selected Client Photo"
              previewAlt="Client Photo"
              deferUpload
              error={errors.file}
            />
          </div>

          <DialogFooter className="gap-2 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={handleClose}
              className="text-xs font-semibold h-10 px-4 rounded-lg border-slate-200 w-full sm:w-auto cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="text-xs font-bold h-10 px-5 rounded-lg bg-[#00668a] hover:bg-[#005573] text-white shadow-xs gap-1.5 w-full sm:w-auto cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Testimonial</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
