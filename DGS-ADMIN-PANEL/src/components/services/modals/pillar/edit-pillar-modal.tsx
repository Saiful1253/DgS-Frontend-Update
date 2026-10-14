 
"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  ImageUploadField,
  type ImageUploadFieldHandle,
} from "@/components/common/image-upload-field";
import { uploadServicePillarIcon } from "@/services/upload/upload.service";
import { ServicePillarEntity } from "@/types/service";
import { saveServicePillar } from "@/services/service/service.service";
import { servicePillarSchema } from "@/zod/service.validation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface EditPillarModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pillar: ServicePillarEntity | null;
  onDeleteRequest?: () => void;
}

export default function EditPillarModal({
  open,
  onOpenChange,
  pillar,
  onDeleteRequest,
}: EditPillarModalProps) {
  const router = useRouter();
  const iconRef = useRef<ImageUploadFieldHandle>(null);

  const [name, setName] = useState(pillar?.name || "");
  const [displayLabel, setDisplayLabel] = useState(pillar?.display_label || "");
  const [slug, setSlug] = useState(pillar?.slug || "");
  const [blurb, setBlurb] = useState(pillar?.blurb || "");
  const [icon, setIcon] = useState(pillar?.icon || "");
  const [displayOrder, setDisplayOrder] = useState(pillar?.display_order ?? 0);
  const [isActive, setIsActive] = useState(pillar?.is_active ?? true);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  /** Drop a field's error as soon as the admin edits it — a stale red message
   *  under a field they have now filled in is worse than no message. */
  const clearError = (field: string) =>
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });

  const [autoSlug, setAutoSlug] = useState(false);

  useEffect(() => {
    if (pillar && open) {
      setName(pillar.name);
      setDisplayLabel(pillar.display_label);
      setSlug(pillar.slug);
      setBlurb(pillar.blurb || "");
      setIcon(pillar.icon || "");
      setDisplayOrder(pillar.display_order ?? 0);
      setIsActive(pillar.is_active ?? true);
      setAutoSlug(false);
      setErrors({});
    }
  }, [pillar, open]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (autoSlug) {
      setSlug(
        val
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
      );
    }
  };

  // Live gate for the submit button. The same schema is re-checked inside
  // handleSubmit, because a disabled button is a hint, not a guarantee — the
  // form can still be submitted with Enter.
  const isFormValid = servicePillarSchema.safeParse({
    name: name.trim(),
    display_label: displayLabel.trim(),
    slug: slug.trim(),
    blurb: blurb.trim(),
    icon: icon.trim(),
    display_order: Number.isFinite(displayOrder) ? displayOrder : 0,
    is_active: isActive,
  }).success;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pillar?.id) return;
    setLoading(true);
    setErrors({});

    // Validate before uploading, never after — see create-pillar-modal.
    const draft = {
      id: pillar.id,
      name: name.trim(),
      display_label: displayLabel.trim(),
      slug: slug.trim(),
      blurb: blurb.trim(),
      icon: icon.trim(),
      display_order: Number.isFinite(displayOrder) ? displayOrder : 0,
      is_active: isActive,
    };

    const parsed = servicePillarSchema.safeParse(draft);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const flat: Record<string, string> = {};
      Object.entries(fieldErrors).forEach(([k, v]) => {
        if (v?.length) flat[k] = v[0];
      });
      setErrors(flat);
      toast.error(Object.values(flat)[0] || "Please fill in the required fields");
      setLoading(false);
      return;
    }

    try {
      // Selected icon is held locally and only written when the form is
      // submitted, so abandoning the dialog leaves no orphaned upload.
      const flushed = await iconRef.current?.flush();
      if (flushed === null) {
        setLoading(false);
        return;
      }

      const payload = { ...draft, icon: (flushed ?? icon).trim() };

      const res = await saveServicePillar(payload);
      if (res.success) {
        toast.success(res.message || "Pillar updated successfully");
        onOpenChange(false);
        router.refresh();
      } else {
        if (res.errors) {
          const flatErrors: Record<string, string> = {};
          Object.entries(res.errors).forEach(([k, v]) => {
            flatErrors[k] = Array.isArray(v) ? v[0] : (v as string);
          });
          setErrors(flatErrors);
        }
        toast.error(res.message || "Failed to update pillar");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl border-slate-200 p-6 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight text-slate-900">
            Edit Service Pillar
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-pillar-name" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Pillar Internal Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-pillar-name"
              value={name}
              onChange={(e) => {
                handleNameChange(e.target.value);
                clearError("name");
              }}
              placeholder="e.g. Software Development"
              className="h-10 rounded-lg border-slate-200"
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-display-label" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Display Tab Label <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-display-label"
              value={displayLabel}
              onChange={(e) => {
                  setDisplayLabel(e.target.value);
                  clearError("display_label");
                }}
              placeholder="e.g. Software & Cloud"
              className="h-10 rounded-lg border-slate-200"
            />
            {errors.display_label && <p className="text-xs text-red-500">{errors.display_label}</p>}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-pillar-slug" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                SEO Slug <span className="text-red-500">*</span>
              </Label>
              <button
                type="button"
                onClick={() => setAutoSlug(!autoSlug)}
                className="text-[11px] font-medium text-[#00668a] hover:underline"
              >
                {autoSlug ? "Manual Slug" : "Auto Slug"}
              </button>
            </div>
            <Input
              id="edit-pillar-slug"
              value={slug}
              onChange={(e) => {
                setAutoSlug(false);
                setSlug(e.target.value);
                clearError("slug");
              }}
              placeholder="software-development"
              className="h-10 font-mono text-xs rounded-lg border-slate-200"
            />
            {errors.slug && <p className="text-xs text-red-500">{errors.slug}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-blurb" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Blurb / Tagline Description
            </Label>
            <Textarea
              id="edit-blurb"
              rows={3}
              value={blurb}
              onChange={(e) => setBlurb(e.target.value)}
              placeholder="Engineering, AI, and cloud infrastructure for scalable operations."
              className="rounded-lg border-slate-200"
            />
            {errors.blurb && <p className="text-xs text-red-500">{errors.blurb}</p>}
          </div>

          <ImageUploadField
            ref={iconRef}
            deferUpload
            id="edit-pillar-icon"
            value={icon}
            onChange={setIcon}
            label="Pillar Icon"
            hint="PNG, JPG, WebP or SVG — max 5MB. Square format recommended."
            uploadAction={uploadServicePillarIcon}
            assetNoun="Icon"
            previewAlt="Pillar icon"
            error={errors.icon}
          />

          <div className="space-y-1.5">
            <Label htmlFor="edit-pillar-order" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Display Order
            </Label>
            <Input
              id="edit-pillar-order"
              type="number"
              min={0}
              value={displayOrder}
              onChange={(e) => setDisplayOrder(Number(e.target.value))}
              className="h-10 rounded-lg border-slate-200"
            />
            {errors.display_order && <p className="text-xs text-red-500">{errors.display_order}</p>}
          </div>

          <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3 bg-slate-50">
            <div>
              <p className="text-xs font-semibold text-slate-900">Active Visibility</p>
              <p className="text-[11px] text-slate-500">Visible as a pillar tab on client portal</p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          {!isFormValid && !loading && (
            <p className="text-[11px] text-slate-500">
              Required: pillar name, display tab label and SEO slug.
            </p>
          )}
          <DialogFooter className="pt-2 flex items-center justify-between gap-2">
            {onDeleteRequest ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  onOpenChange(false);
                  onDeleteRequest();
                }}
                className="h-10 w-10 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors shrink-0"
                title="Delete Pillar"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete Pillar</span>
              </Button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !isFormValid} className="bg-[#00668a] hover:bg-[#004c69]">
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
