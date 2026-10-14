/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import type { Technology } from "@/types/technology";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Edit2,
  Trash2,
  Code2,
  Tag,
  GripVertical,
  Check,
  
  
  Database,
  Cloud,
  Terminal,
  Smartphone,
  Sparkles,
  Layers,
  Palette,
  BarChart3,
  Server,
} from "lucide-react";
import { toggleTechnologyActive, updateTechnology } from "@/services/technology/technology.service";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import TechnologyDetailsModal from "./technology-details-modal";
import DeleteTechnologyDialog from "./delete-technology-dialog";
import { cn } from "@/lib/utils";

function getCategoryVisuals(category?: string) {
  const cat = (category || "").toLowerCase();
  if (cat.includes("front") || cat.includes("react") || cat.includes("ui") || cat.includes("web")) {
    return {
      icon: Code2,
      containerClass: "bg-sky-50 text-sky-600 border-sky-200/80 group-hover:border-sky-300",
      badgeClass: "bg-sky-50 text-sky-700 border-sky-200/80",
    };
  }
  if (
    cat.includes("back") ||
    cat.includes("server") ||
    cat.includes("api") ||
    cat.includes("nest") ||
    cat.includes(".net")
  ) {
    return {
      icon: Server,
      containerClass: "bg-indigo-50 text-indigo-600 border-indigo-200/80 group-hover:border-indigo-300",
      badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
    };
  }
  if (cat.includes("data") || cat.includes("sql") || cat.includes("postgres")) {
    return {
      icon: Database,
      containerClass: "bg-emerald-50 text-emerald-600 border-emerald-200/80 group-hover:border-emerald-300",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    };
  }
  if (cat.includes("cloud") || cat.includes("aws") || cat.includes("azure")) {
    return {
      icon: Cloud,
      containerClass: "bg-blue-50 text-blue-600 border-blue-200/80 group-hover:border-blue-300",
      badgeClass: "bg-blue-50 text-blue-700 border-blue-200/80",
    };
  }
  if (
    cat.includes("devops") ||
    cat.includes("docker") ||
    cat.includes("k8s") ||
    cat.includes("pipeline")
  ) {
    return {
      icon: Terminal,
      containerClass: "bg-amber-50 text-amber-700 border-amber-200/80 group-hover:border-amber-300",
      badgeClass: "bg-amber-50 text-amber-800 border-amber-200/80",
    };
  }
  if (cat.includes("mobile") || cat.includes("flutter") || cat.includes("app")) {
    return {
      icon: Smartphone,
      containerClass: "bg-purple-50 text-purple-600 border-purple-200/80 group-hover:border-purple-300",
      badgeClass: "bg-purple-50 text-purple-700 border-purple-200/80",
    };
  }
  if (
    cat.includes("ai") ||
    cat.includes("automation") ||
    cat.includes("agent") ||
    cat.includes("claude")
  ) {
    return {
      icon: Sparkles,
      containerClass: "bg-rose-50 text-rose-600 border-rose-200/80 group-hover:border-rose-300",
      badgeClass: "bg-rose-50 text-rose-700 border-rose-200/80",
    };
  }
  if (
    cat.includes("tune") ||
    cat.includes("video") ||
    cat.includes("image") ||
    cat.includes("design")
  ) {
    return {
      icon: Palette,
      containerClass: "bg-pink-50 text-pink-600 border-pink-200/80 group-hover:border-pink-300",
      badgeClass: "bg-pink-50 text-pink-700 border-pink-200/80",
    };
  }
  if (cat.includes("marketing") || cat.includes("analytics")) {
    return {
      icon: BarChart3,
      containerClass: "bg-teal-50 text-teal-600 border-teal-200/80 group-hover:border-teal-300",
      badgeClass: "bg-teal-50 text-teal-700 border-teal-200/80",
    };
  }
  return {
    icon: Layers,
    containerClass: "bg-[#e6eff6] text-[#00668a] border-[#00668a]/20 group-hover:border-[#00668a]/40",
    badgeClass: "bg-[#e6eff6] text-[#00668a] border-[#00668a]/30",
  };
}

interface Props {
  technology: Technology;
  /** dnd-kit sortable props for the card root. */
  rootProps?: Record<string, unknown>;
  /** dnd-kit listeners for the grip only, so the card stays clickable. */
  dragHandleProps?: Record<string, unknown>;
  onQuickOrderUpdate?: (technologyId: number | string, newOrder: number) => void;
  onDeleted?: (technologyId: number | string) => void;
  onEdit?: (technology: Technology) => void;
  isDragging?: boolean;
  isTarget?: boolean;
}

export default function TechnologyCard({
  technology,
  rootProps,
  dragHandleProps,
  onQuickOrderUpdate,
  onDeleted,
  onEdit,
  isDragging = false,
  isTarget = false,
}: Props) {
  const router = useRouter();
  const [isActive, setIsActive] = useState(technology.is_active);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Manual display order state
  const [manualOrder, setManualOrder] = useState<string>(String(technology.display_order ?? 0));
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);

  useEffect(() => {
    setIsActive(technology.is_active);
  }, [technology.is_active]);

  useEffect(() => {
    setManualOrder(String(technology.display_order ?? 0));
  }, [technology.display_order]);

  const handleToggleStatus = async (checked: boolean) => {
    if (updatingStatus) return;
    setUpdatingStatus(true);
    setIsActive(checked);
    try {
      const res = await toggleTechnologyActive(technology.id, checked);
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
      setManualOrder(String(technology.display_order ?? 0));
      setIsEditingOrder(false);
      return;
    }

    if (val === technology.display_order) {
      setIsEditingOrder(false);
      return;
    }

    if (onQuickOrderUpdate) {
      onQuickOrderUpdate(technology.id, val);
      setIsEditingOrder(false);
      return;
    }

    setSavingOrder(true);
    try {
      const res = await updateTechnology(technology.id, {
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

  const visuals = getCategoryVisuals(technology.category);
  const FallbackIcon = visuals.icon;

  return (
    <>
      <div
        {...(rootProps ?? {})}
        onClick={() => setDetailsOpen(true)}
        title="Click to view technology details"
        className={cn(
          "group relative flex flex-col justify-between rounded-xl border bg-white p-3.5 shadow-xs transition-all duration-200 cursor-pointer h-full w-full overflow-hidden hover:shadow-md hover:border-[#00668a]/50",
          isDragging && "opacity-40 border-dashed border-[#00668a] scale-[0.98]",
          isTarget && "border-2 border-[#00668a] bg-[#e6eff6]/30 shadow-md",
          !isDragging && !isTarget && "border-slate-200"
        )}
      >
        <div className="space-y-2">
          {/* Top Row: Grip + Icon + (Title #ID on row 1, Category Badge on row 2) */}
          <div className="flex items-center gap-2.5 min-w-0">
            {dragHandleProps && (
              <div
                {...dragHandleProps}
                title="Drag to reorder card"
                onClick={(e) => e.stopPropagation()}
                className="cursor-grab active:cursor-grabbing p-1 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors shrink-0 touch-none"
              >
                <GripVertical className="h-3.5 w-3.5" />
              </div>
            )}
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border p-1.5 shadow-2xs group-hover:scale-105 transition-all duration-200",
                visuals.containerClass
              )}
            >
              {technology.icon_url ? (
                <img
                  src={technology.icon_url}
                  alt={technology.name}
                  className="h-full w-full object-contain"
                />
              ) : (
                <FallbackIcon className="h-4 w-4" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3
                className="font-bold text-slate-900 text-sm truncate"
                title={technology.name}
              >
                {technology.name}
              </h3>
              <div className="mt-1 flex items-center">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] font-semibold px-2 py-0 rounded h-4.5 gap-1 inline-flex items-center",
                    visuals.badgeClass
                  )}
                  title="Category"
                >
                  <Tag className="h-2.5 w-2.5 shrink-0" />
                  <span className="truncate">{technology.category}</span>
                </Badge>
              </div>
            </div>
          </div>

          {/* Proficiency / Architecture Tagline Box */}
          <div className="rounded-lg bg-slate-50/80 border border-slate-100/90 px-2.5 py-1.5 text-xs text-slate-600 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00668a]/60 shrink-0" />
            <span className="truncate font-medium text-[11px] text-slate-600">
              {technology.proficiency_tagline || "Enterprise standard stack competency"}
            </span>
          </div>
        </div>

        {/* Bottom row: Order on Left | Actions (Active Switch + Edit + Delete) on Right */}
        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <div
            className="flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
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
                  className="text-[11px] font-medium text-slate-500 hover:text-[#00668a] bg-slate-50 hover:bg-[#e6eff6] px-2 py-0.5 rounded border border-slate-200 transition-colors"
                >
                  Order: <span className="font-bold font-mono">{technology.display_order}</span>
                </button>
              )
            )}
          </div>

          {/* Action Controls: Switch + Edit + Delete */}
          <div
            className="flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            {(
              <div
                className="flex items-center gap-1.5 mr-1"
                title={isActive ? "Active technology" : "Inactive technology"}
              >
                <Switch
                  checked={isActive}
                  onCheckedChange={handleToggleStatus}
                  disabled={updatingStatus}
                  aria-label="Toggle active status"
                  className="scale-90"
                />
                <span
                  className={cn(
                    "text-[10px] font-semibold select-none",
                    isActive ? "text-emerald-600" : "text-slate-400"
                  )}
                >
                  {isActive ? "Active" : "Hidden"}
                </span>
              </div>
            )}

            {(
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(technology);
                  }}
                  className="h-7 w-7 text-slate-400 hover:text-[#00668a] hover:bg-[#e6eff6] rounded-md transition-colors"
                  title="Edit technology"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteOpen(true);
                  }}
                  className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="Delete technology"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <TechnologyDetailsModal
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        technology={technology}
        onEditClick={() => onEdit?.(technology)}
        onDeleteClick={() => setDeleteOpen(true)}
      />

      {(
        <DeleteTechnologyDialog
          technology={technology}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onDeleted={onDeleted ?? (() => {})}
        />
      )}
    </>
  );
}
