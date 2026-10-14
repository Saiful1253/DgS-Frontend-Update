 
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
import { ServiceGroup } from "@/types/service";
import { saveServiceGroup } from "@/services/service/service.service";
import { serviceGroupSchema } from "@/zod/service.validation";
import { validateDraft, isDraftValid, firstError } from "@/lib/form-validation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface EditGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: ServiceGroup | null;
  pillars?: PillarOptionSource[];
  onDeleteRequest?: () => void;
}

export default function EditGroupModal({
  open,
  onOpenChange,
  group,
  pillars,
  onDeleteRequest,
}: EditGroupModalProps) {
  const router = useRouter();
  const pillarOptions = toPillarOptions(pillars);

  const [pillar, setPillar] = useState<string>(group?.pillar || pillarOptions[0]?.value || "");
  const [name, setName] = useState(group?.name || "");
  const [slug, setSlug] = useState(group?.slug || "");
  const [displayOrder, setDisplayOrder] = useState(group?.display_order ?? 0);
  const [isActive, setIsActive] = useState(group?.is_active ?? true);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [autoSlug, setAutoSlug] = useState(false);

  useEffect(() => {
    if (group && open) {
      setPillar(group.pillar);
      setName(group.name);
      setSlug(group.slug);
      setDisplayOrder(group.display_order ?? 0);
      setIsActive(group.is_active ?? true);
      setAutoSlug(false);
      setErrors({});
    }
  }, [group, open]);

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
    if (!group?.id) return;
    setLoading(true);
    setErrors({});

    // Validate before any side effect. The action re-checks with the same
    // schema, but only after the round trip — which is what made an empty form
    // look like a broken submit.
    const { ok, fieldErrors, draft } = validateDraft(serviceGroupSchema, {
      id: group.id,
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
        toast.success(res.message || "Group updated successfully");
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
        toast.error(res.message || "Failed to update group");
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
            Edit Service Group
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-group-pillar" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Pillar <span className="text-red-500">*</span>
            </Label>
            <Select value={pillar} onValueChange={(val) => setPillar(val)}>
              <SelectTrigger id="edit-group-pillar" className="h-10 rounded-lg border-slate-200">
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
            <Label htmlFor="edit-group-name" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Group Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-group-name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Custom Software & Web Platforms"
              className="h-10 rounded-lg border-slate-200"
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-group-slug" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
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
              id="edit-group-slug"
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
            <Label htmlFor="edit-group-order" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Display Order
            </Label>
            <Input
              id="edit-group-order"
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
                Inactive groups are hidden from the client portal regardless of their services
              </p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

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
                title="Delete Group"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete Group</span>
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
