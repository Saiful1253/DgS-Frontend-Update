/* eslint-disable @next/next/no-img-element */
 
"use client";

import React, { useState, useEffect } from "react";
import { Service, ServiceGroup } from "@/types/service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Edit2,
  Trash2,
  Layers,
  Tag,
  GripVertical,
  Check,
  Columns,
  Calendar,
} from "lucide-react";
import { toggleServiceActive, saveService } from "@/services/service/service.service";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import DeleteServiceDialog from "./modals/service/delete-service-dialog";
import EditServiceModal from "./modals/service/edit-service-modal";
import ServiceDetailsModal from "./modals/service/service-details-modal";
import { cn } from "@/lib/utils";

interface Props {
  service: Service;
  groups: ServiceGroup[];
  /** dnd-kit sortable props for the card root. */
  rootProps?: Record<string, unknown>;
  /** dnd-kit listeners for the grip only, so the card stays clickable. */
  dragHandleProps?: Record<string, unknown>;
  onQuickOrderUpdate?: (serviceId: number, newOrder: number) => void;
  onDeleted?: (serviceId: number) => Promise<void> | void;
  isDragging?: boolean;
  isTarget?: boolean;
}

export default function ServiceCard({
  service,
  groups,
  rootProps,
  dragHandleProps,
  onQuickOrderUpdate,
  onDeleted,
  isDragging = false,
  isTarget = false,
}: Props) {
  const router = useRouter();
  const [isActive, setIsActive] = useState(service.is_active);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Manual display order state
  const [manualOrder, setManualOrder] = useState<string>(String(service.display_order ?? 0));
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);

  useEffect(() => {
    setManualOrder(String(service.display_order ?? 0));
  }, [service.display_order]);

  const pillarName = service.pillarEntity?.display_label || service.pillar || "Software Development";
  const formattedDate = service.created_at
    ? new Date(service.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  const handleToggleStatus = async (checked: boolean) => {
    if (updatingStatus) return;
    setUpdatingStatus(true);
    setIsActive(checked);
    try {
      const res = await toggleServiceActive(service.id, checked);
      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else {
        setIsActive(!checked);
        toast.error(res.message || "Failed to toggle status");
      }
    } catch {
      setIsActive(!checked);
      toast.error("An error occurred");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSaveManualOrder = async () => {
    const val = parseInt(manualOrder, 10);
    if (isNaN(val) || val < 0) {
      toast.error("Please enter a valid non-negative order number");
      setManualOrder(String(service.display_order ?? 0));
      setIsEditingOrder(false);
      return;
    }

    if (val === service.display_order) {
      setIsEditingOrder(false);
      return;
    }

    if (onQuickOrderUpdate) {
      onQuickOrderUpdate(service.id, val);
      setIsEditingOrder(false);
      return;
    }

    setSavingOrder(true);
    try {
      const res = await saveService({
        ...service,
        display_order: val,
      });
      if (res.success) {
        toast.success(`Display order updated to ${val}`);
        setIsEditingOrder(false);
        router.refresh();
      } else {
        toast.error(res.message || "Failed to update order");
      }
    } catch {
      toast.error("Failed to save order");
    } finally {
      setSavingOrder(false);
    }
  };

  return (
    <>
      <div
        {...(rootProps ?? {})}
        onClick={() => setDetailsOpen(true)}
        title="Click to view service details"
      className={cn(
        "group relative flex flex-col justify-between rounded-xl border bg-white p-3.5 sm:p-5 shadow-xs transition-all duration-200 cursor-pointer h-full w-full overflow-hidden",
        isDragging && "opacity-40 border-dashed border-[#00668a] scale-[0.98]",
        isTarget && "border-2 border-[#00668a] bg-[#e6eff6]/30 shadow-md",
        !isDragging && !isTarget && "border-slate-200 hover:border-[#00668a]/50 hover:shadow-md"
      )}
    >
      <div>
        <div className="flex items-start justify-between gap-2 min-w-0">
          <div className="flex items-start gap-2 min-w-0 flex-1">
            {dragHandleProps && (
              <div
                {...dragHandleProps}
                title="Drag to reorder card"
                onClick={(e) => e.stopPropagation()}
                className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-600 rounded transition-colors shrink-0 touch-none mt-0.5"
              >
                <GripVertical className="h-4 w-4" />
              </div>
            )}
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-[#e6eff6] text-[#00668a] overflow-hidden p-1">
              {service.icon_url ? (
                <img src={service.icon_url} alt={service.name} className="h-full w-full object-contain" />
              ) : (
                <Layers className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm truncate max-w-[140px] sm:max-w-full" title={service.name}>{service.name}</h3>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 shrink-0">
                  #{service.id}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs font-mono text-slate-400 truncate">/{service.slug}</p>
            </div>
          </div>

          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 ml-1" onClick={(e) => e.stopPropagation()}>
            {(
              <div className="flex items-center mr-0.5" title={isActive ? "Active service" : "Inactive service"}>
                <Switch
                  checked={isActive}
                  onCheckedChange={handleToggleStatus}
                  disabled={updatingStatus}
                  aria-label="Toggle active status"
                />
              </div>
            )}

            {(
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditOpen(true);
                  }}
                  className="h-7 w-7 sm:h-8 sm:w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Edit service"
                >
                  <Edit2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteOpen(true);
                  }}
                  className="h-7 w-7 sm:h-8 sm:w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete service"
                >
                  <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Taxonomy Badges: Pillar & Group */}
        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
          <Badge
            variant="outline"
            className="text-[#00668a] bg-[#e6eff6] border-[#00668a]/30 font-semibold text-[11px] gap-1"
            title="Service Pillar"
          >
            <Columns className="h-3 w-3 shrink-0" />
            <span className="truncate">{pillarName}</span>
          </Badge>
          {service.group ? (
            <Badge
              variant="secondary"
              className="bg-slate-100 text-slate-700 font-semibold text-[11px] gap-1"
              title="Service Group"
            >
              <Tag className="h-3 w-3 shrink-0" />
              <span className="truncate">{service.group.name}</span>
            </Badge>
          ) : (
            <Badge variant="outline" className="text-slate-400 border-dashed text-[11px]">
              Ungrouped
            </Badge>
          )}
        </div>

        {/* Description Preview */}
        <p className="mt-2.5 text-xs text-slate-600 leading-relaxed line-clamp-2">
          {service.description || "No description provided."}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
          {/* Manual Order Adjustment Control */}
          {(
            isEditingOrder ? (
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={0}
                  value={manualOrder}
                  onChange={(e) => setManualOrder(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveManualOrder();
                    if (e.key === "Escape") setIsEditingOrder(false);
                  }}
                  className="h-6 w-14 text-xs font-mono px-1.5 py-0 border-slate-300"
                  autoFocus
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleSaveManualOrder}
                  disabled={savingOrder}
                  className="h-6 w-6 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                  title="Save order"
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingOrder(true)}
                title="Click to manually adjust display order"
                className="text-[11px] font-medium text-slate-500 hover:text-[#00668a] bg-slate-50 hover:bg-[#e6eff6] px-1.5 py-0.5 rounded border border-slate-200 transition-colors"
              >
                Order: <span className="font-bold font-mono">{service.display_order}</span>
              </button>
            )
          )}

          {/* Creation date */}
          {formattedDate && (
            <div className="flex items-center gap-1 text-[11px] text-slate-400" title={`Created on ${formattedDate}`}>
              <Calendar className="h-3 w-3" />
              <span>{formattedDate}</span>
            </div>
          )}
        </div>

        <Badge
          className={
            isActive
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          }
        >
          {isActive ? "Active" : "Inactive"}
        </Badge>
      </div>
    </div>

    <ServiceDetailsModal
      open={detailsOpen}
      onOpenChange={setDetailsOpen}
      service={service}
      onEditClick={() => setEditOpen(true)}
      onDeleteClick={() => setDeleteOpen(true)}
    />

    {(
      <>
        <EditServiceModal
          open={editOpen}
          onOpenChange={setEditOpen}
          service={service}
          groups={groups}
          onDeleteRequest={() => setDeleteOpen(true)}
        />
        <DeleteServiceDialog
          service={service}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onDeleted={async () => {
            await onDeleted?.(service.id);
          }}
        />
      </>
    )}
  </>
);
}

