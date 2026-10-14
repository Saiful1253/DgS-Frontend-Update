 
"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toPillarOptions, type PillarOptionSource } from "@/lib/service-pillars";
import { saveServiceGroup } from "@/services/service/service.service";
import { serviceGroupSchema } from "@/zod/service.validation";
import { validateDraft, isDraftValid, firstError } from "@/lib/form-validation";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface CreateGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pillars?: PillarOptionSource[];
  defaultPillar?: string;
  /**
   * The created group. Typed loosely for the same reason as the pillar modal:
   * callers unwrap the action's `{ data }` envelope themselves, so the shape
   * legitimately arrives as either the envelope or the bare entity.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSuccess?: (group: any) => void;
}

export default function CreateGroupModal({
  open,
  onOpenChange,
  pillars,
  defaultPillar,
  onSuccess,
}: CreateGroupModalProps) {
  const router = useRouter();
  const pillarOptions = toPillarOptions(pillars);

  const [pillar, setPillar] = useState<string>(defaultPillar || pillarOptions[0]?.value || "");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [autoSlug, setAutoSlug] = useState(true);

  useEffect(() => {
    if (open) {
      setPillar(defaultPillar || pillarOptions[0]?.value || "");
      setName("");
      setSlug("");
      setDisplayOrder(0);
      setIsActive(true);
      setAutoSlug(true);
      setErrors({});
    }
  }, [open, defaultPillar]);

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

  // Live gate for the submit button; handleSubmit re-checks because a disabled
  // button is a hint, not a guarantee (Enter still submits).
  const isFormValid = isDraftValid(serviceGroupSchema, {
    name: name.trim(),
    slug: slug.trim(),
    pillar,
    display_order: Number.isFinite(displayOrder) ? displayOrder : 0,
    is_active: isActive,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    // Validate before any side effect. The action re-checks with the same
    // schema, but only after the round trip — which is what made an empty form
    // look like a broken submit.
    const { ok, fieldErrors, draft } = validateDraft(serviceGroupSchema, {
      name: name.trim(),
      slug: slug.trim(),
      pillar,
      display_order: Number.isFinite(displayOrder) ? displayOrder : 0,
      is_active: isActive,
    });
    if (!ok) {
      setErrors(fieldErrors);
      toast.error(firstError(fieldErrors) || "Please fill in the required fields");
      setLoading(false);
      return;
    }

    const payload = draft;

    try {
      const res = await saveServiceGroup(payload);
      if (res.success) {
        toast.success(res.message || "Service Group created successfully");
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
        toast.error(res.message || "Failed to create group");
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
            Create Service Group
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="create-group-pillar" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Pillar <span className="text-red-500">*</span>
            </Label>
            <Select value={pillar} onValueChange={(val) => setPillar(val)}>
              <SelectTrigger id="create-group-pillar" className="h-10 rounded-lg border-slate-200">
                <SelectValue placeholder="Select Pillar" />
              </SelectTrigger>
              <SelectContent>
                {pillarOptions.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.pillar && <p className="text-xs text-red-500">{errors.pillar}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="create-group-name" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Group Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="create-group-name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Custom Software & Web Platforms"
              className="h-10 rounded-lg border-slate-200"
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="create-group-slug" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
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
              id="create-group-slug"
              value={slug}
              onChange={(e) => {
                setAutoSlug(false);
                setSlug(e.target.value);
              }}
              placeholder="custom-software-web-platforms"
              className="h-10 font-mono text-xs rounded-lg border-slate-200"
            />
            {errors.slug && <p className="text-xs text-red-500">{errors.slug}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="create-group-order" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Display Order
            </Label>
            <Input
              id="create-group-order"
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
              <p className="text-[11px] text-slate-500">
                Turn off to stage the group without publishing it
              </p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          <DialogFooter className="pt-2 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !isFormValid} className="bg-[#00668a] hover:bg-[#004c69]">
              {loading ? "Creating..." : "Create Group"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
