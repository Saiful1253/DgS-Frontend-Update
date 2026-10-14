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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toPillarOptions, type PillarOptionSource, SERVICE_PILLARS, SERVICE_PILLAR_LABELS } from "@/lib/service-pillars";
import { Service, ServiceGroup } from "@/types/service";
import { saveService } from "@/services/service/service.service";
import { serviceSchema } from "@/zod/service.validation";
import { validateDraft, isDraftValid, firstError } from "@/lib/form-validation";
import { ImageUploadField, type ImageUploadFieldHandle } from "@/components/common/image-upload-field";
import { Trash2, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import CreatePillarModal from "../pillar/create-pillar-modal";
import CreateGroupModal from "../group/create-group-modal";

interface EditServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service | null;
  groups: ServiceGroup[];
  pillars?: PillarOptionSource[];
  onDeleteRequest?: () => void;
}

export default function EditServiceModal({
  open,
  onOpenChange,
  service,
  groups,
  pillars,
  onDeleteRequest,
}: EditServiceModalProps) {
  const router = useRouter();

  const [localPillars, setLocalPillars] = useState<PillarOptionSource[]>(() => {
    if (pillars && pillars.length > 0) return [...pillars];
    return SERVICE_PILLARS.map((p, idx) => ({
      name: p,
      display_label: SERVICE_PILLAR_LABELS[p]?.tab || p,
      display_order: idx * 10,
      is_active: true,
    }));
  });

  const [localGroups, setLocalGroups] = useState<ServiceGroup[]>(() => {
    return groups ? [...groups] : [];
  });

  const pillarOptions = toPillarOptions(localPillars);

  const [pillar, setPillar] = useState<string>(service?.pillar || pillarOptions[0]?.value || "");
  const [groupId, setGroupId] = useState<string>(service?.group_id ? String(service.group_id) : "none");
  const [name, setName] = useState(service?.name || "");
  const [slug, setSlug] = useState(service?.slug || "");
  const [description, setDescription] = useState(service?.description || "");
  const [iconUrl, setIconUrl] = useState(service?.icon_url || "");
  const iconRef = useRef<ImageUploadFieldHandle>(null);
  const [displayOrder, setDisplayOrder] = useState(service?.display_order ?? 0);
  const [isActive, setIsActive] = useState(service?.is_active ?? true);

  // Sub-modal triggers for on-the-go creation
  const [createPillarOpen, setCreatePillarOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [autoSlug, setAutoSlug] = useState(false);

  useEffect(() => {
    if (pillars && pillars.length > 0) {
      setLocalPillars([...pillars]);
    }
  }, [pillars]);

  useEffect(() => {
    if (groups) {
      setLocalGroups([...groups]);
    }
  }, [groups]);

  useEffect(() => {
    if (service && open) {
      setPillar(service.pillar);
      setGroupId(service.group_id ? String(service.group_id) : "none");
      setName(service.name);
      setSlug(service.slug);
      setDescription(service.description || "");
      setIconUrl(service.icon_url || "");
      setDisplayOrder(service.display_order ?? 0);
      setIsActive(service.is_active ?? true);
      setAutoSlug(false);
      setErrors({});
      setCreatePillarOpen(false);
      setCreateGroupOpen(false);
    }
  }, [service, open]);

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

  const filteredGroups = localGroups.filter((g) => g.pillar === pillar);

  // Live gate for the submit button; handleSubmit re-checks because a disabled
  // button is a hint, not a guarantee (Enter still submits).
  const isFormValid = isDraftValid(serviceSchema, {
    id: service?.id,
    name: name.trim(),
    slug: slug.trim(),
    pillar,
    group_id: groupId !== "none" ? Number(groupId) : null,
    description: description.trim(),
    icon_url: iconUrl.trim(),
    display_order: Number.isFinite(displayOrder) ? displayOrder : 0,
    is_active: isActive,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service?.id) return;
    setLoading(true);
    setErrors({});

    // Validate before any side effect, and before the icon upload is flushed.
    const { ok, fieldErrors, draft } = validateDraft(serviceSchema, {
      id: service.id,
      name: name.trim(),
      slug: slug.trim(),
      pillar,
      group_id: groupId !== "none" ? Number(groupId) : null,
      description: description.trim(),
      icon_url: iconUrl.trim(),
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
      // Deferred like the pillar modal. `icon_url` is optional in the schema, so
      // validating the pre-flush (existing) URL above is correct; the freshly
      // uploaded URL is substituted here, and a failed upload aborts the save
      // rather than silently writing the old or an empty icon.
      const flushed = await iconRef.current?.flush();
      if (flushed === null) {
        setLoading(false);
        return;
      }

      const res = await saveService(
        flushed ? { ...payload, icon_url: flushed } : payload,
      );
      if (res.success) {
        toast.success(res.message || "Service updated successfully");
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
        toast.error(res.message || "Failed to update service");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl rounded-2xl border-slate-200 p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight text-slate-900">
              Edit Service
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Pillar Selector with on-the-go modal trigger */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-svc-pillar" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Pillar <span className="text-red-500">*</span>
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setCreatePillarOpen(true)}
                    className="h-5 text-[10px] gap-1 px-1.5 text-primary hover:text-primary/90 hover:bg-sky-50 font-semibold"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Add New</span>
                  </Button>
                </div>

                <Select
                  value={pillar}
                  onValueChange={(val) => {
                    setPillar(val);
                    setGroupId("none");
                  }}
                >
                  <SelectTrigger id="edit-svc-pillar" className="h-10 rounded-lg border-slate-200">
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

              {/* Service Group Selector with on-the-go modal trigger */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-svc-group" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Service Group
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setCreateGroupOpen(true)}
                    className="h-5 text-[10px] gap-1 px-1.5 text-primary hover:text-primary/90 hover:bg-sky-50 font-semibold"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Add New</span>
                  </Button>
                </div>

                <Select value={groupId} onValueChange={setGroupId}>
                  <SelectTrigger id="edit-svc-group" className="h-10 rounded-lg border-slate-200">
                    <SelectValue placeholder="Select Group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Group (Ungrouped)</SelectItem>
                    {filteredGroups.map((g) => (
                      <SelectItem key={g.id} value={String(g.id)}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.group_id && <p className="text-xs text-red-500">{errors.group_id}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-svc-name" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Service Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-svc-name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Custom Web Application Development"
                className="h-10 rounded-lg border-slate-200"
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-svc-slug" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
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
                id="edit-svc-slug"
                value={slug}
                onChange={(e) => {
                  setAutoSlug(false);
                  setSlug(e.target.value);
                }}
                placeholder="custom-software-development"
                className="h-10 font-mono text-xs rounded-lg border-slate-200"
              />
              {errors.slug && <p className="text-xs text-red-500">{errors.slug}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-svc-desc" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="edit-svc-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the service scope, outcomes, and value proposition..."
                className="rounded-lg border-slate-200"
              />
              {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
            </div>

            {/* Image & Icon Upload / Insert URL (Full Width) */}
            <ImageUploadField
              ref={iconRef}
              id="edit-svc-icon"
              value={iconUrl}
              onChange={setIconUrl}
              error={errors.icon_url}
              deferUpload
            />

            {/* Display Order & Active Visibility (Balanced 2-Column Row) */}
            <div className="grid grid-cols-2 gap-4 items-center">
              <div className="space-y-1.5">
                <Label htmlFor="edit-svc-order" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Display Order
                </Label>
                <Input
                  id="edit-svc-order"
                  type="number"
                  min={0}
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(Number(e.target.value))}
                  className="h-10 rounded-lg border-slate-200"
                />
                {errors.display_order && <p className="text-xs text-red-500">{errors.display_order}</p>}
              </div>

              <div className="flex items-center justify-between rounded-lg border border-slate-200 p-2.5 bg-slate-50 h-10 mt-5">
                <span className="text-xs font-semibold text-slate-900">Active Visibility</span>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </div>

            <DialogFooter className="pt-2 flex items-center justify-between">
              <div>
                {onDeleteRequest && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onOpenChange(false);
                      onDeleteRequest();
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs gap-1.5 h-9 px-2.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Service
                  </Button>
                )}
              </div>
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

      {/* On-the-fly Pillar Creator Modal */}
      <CreatePillarModal
        open={createPillarOpen}
        onOpenChange={setCreatePillarOpen}
        onSuccess={(created) => {
          const rawData = created?.data || created;
          const createdPillar: PillarOptionSource = {
            name: rawData?.name || "",
            display_label: rawData?.display_label || rawData?.name || "",
            display_order: rawData?.display_order ?? 0,
            is_active: rawData?.is_active ?? true,
          };
          if (createdPillar.name) {
            setLocalPillars((prev) => {
              const list = prev ? [...prev] : [];
              if (!list.some((p) => p.name.toLowerCase() === createdPillar.name.toLowerCase())) {
                return [...list, createdPillar];
              }
              return list;
            });
            setPillar(createdPillar.name);
            setGroupId("none");
            if (errors.pillar) {
              setErrors((prev) => {
                const next = { ...prev };
                delete next.pillar;
                return next;
              });
            }
          }
        }}
      />

      {/* On-the-fly Service Group Creator Modal */}
      <CreateGroupModal
        open={createGroupOpen}
        onOpenChange={setCreateGroupOpen}
        pillars={localPillars}
        defaultPillar={pillar}
        onSuccess={(created) => {
          const rawData = created?.data || created;
          if (rawData) {
            const createdGroup: ServiceGroup = {
              id: rawData?.id || Date.now(),
              pillar: rawData?.pillar || pillar,
              name: rawData?.name || "",
              slug: rawData?.slug || "",
              display_order: rawData?.display_order ?? 0,
              services_count: 0,
              ...rawData,
            };
            setLocalGroups((prev) => [...prev, createdGroup]);
            if (createdGroup.id) {
              setGroupId(String(createdGroup.id));
            }
            if (errors.group_id) {
              setErrors((prev) => {
                const next = { ...prev };
                delete next.group_id;
                return next;
              });
            }
          }
        }}
      />
    </>
  );
}
