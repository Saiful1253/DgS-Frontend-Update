 
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
import { saveServicePillar } from "@/services/service/service.service";
import { servicePillarSchema } from "@/zod/service.validation";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface CreatePillarModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * The created pillar. Typed loosely because callers unwrap the action's
   * `{ data }` envelope themselves via `created?.data || created`, and the shape
   * legitimately arrives as either the envelope or the bare entity. Tightening
   * this means changing every call site in the same commit as the icon work.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSuccess?: (pillar: any) => void;
}

export default function CreatePillarModal({
  open,
  onOpenChange,
  onSuccess,
}: CreatePillarModalProps) {
  const router = useRouter();
  const iconRef = useRef<ImageUploadFieldHandle>(null);

  const [name, setName] = useState("");
  const [displayLabel, setDisplayLabel] = useState("");
  const [slug, setSlug] = useState("");
  const [blurb, setBlurb] = useState("");
  const [icon, setIcon] = useState("");
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

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

  const [autoSlug, setAutoSlug] = useState(true);

  useEffect(() => {
    if (open) {
      setName("");
      setDisplayLabel("");
      setSlug("");
      setBlurb("");
      setIcon("");
      setDisplayOrder(0);
      setIsActive(true);
      setAutoSlug(true);
      setErrors({});
    }
  }, [open]);

  const handleNameChange = (val: string) => {
    setName(val);
    clearError("name");
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

  // No live `isDraftValid` gate on purpose, matching create-service: the submit
  // button stays enabled and handleSubmit is the single validation point, so
  // clicking it surfaces the field-level errors instead of a dead button. That
  // ordering is also what keeps the icon local — `servicePillarSchema` is
  // checked before `flush()` runs, so an invalid form never reaches Cloudinary.

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    // Validate before uploading, never after. Flushing first meant an empty form
    // still pushed the icon to Cloudinary and only then reported the missing
    // fields, burning a write and stranding an asset nobody can reference.
    const draft = {
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
      // The icon is held locally after selection and only persisted here, so
      // cancelling the dialog never leaves an orphan asset behind.
      const flushed = await iconRef.current?.flush();
      if (flushed === null) {
        setLoading(false);
        return;
      }

      const payload = { ...draft, icon: (flushed ?? icon).trim() };

      const res = await saveServicePillar(payload);
      if (res.success) {
        toast.success(res.message || "Service Pillar created successfully");
        onOpenChange(false);
        onSuccess?.(res.data?.data || res.data || payload);
        router.refresh();
      } else {
        if (res.errors) {
          const flatErrors: Record<string, string> = {};
          Object.entries(res.errors).forEach(([k, v]) => {
            flatErrors[k] = Array.isArray(v) ? v[0] : (v as string);
          });
          setErrors(flatErrors);
        }
        toast.error(res.message || "Failed to create pillar");
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
            Create Service Pillar
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="create-pillar-name" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Pillar Internal Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="create-pillar-name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Software Development"
              className="h-10 rounded-lg border-slate-200"
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="create-display-label" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Display Tab Label <span className="text-red-500">*</span>
            </Label>
            <Input
              id="create-display-label"
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
              <Label htmlFor="create-pillar-slug" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
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
              id="create-pillar-slug"
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
            <Label htmlFor="create-blurb" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Blurb / Tagline Description
            </Label>
            <Textarea
              id="create-blurb"
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
            id="create-pillar-icon"
            value={icon}
            onChange={setIcon}
            label="Pillar Icon"
            hint="PNG, JPG, WebP or SVG — max 5MB. Square format recommended."
            uploadAction={uploadServicePillarIcon}
            assetNoun="Icon"
            previewAlt="Pillar icon"
            deferUpload
            error={errors.icon}
          />

          <div className="space-y-1.5">
            <Label htmlFor="create-pillar-order" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Display Order
            </Label>
            <Input
              id="create-pillar-order"
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

          <DialogFooter className="pt-2 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-[#00668a] hover:bg-[#004c69]">
              {loading ? "Creating..." : "Create Pillar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
