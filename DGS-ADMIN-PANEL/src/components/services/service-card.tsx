/* eslint-disable @next/next/no-img-element */
 
"use client";

import React, { useState, useEffect } from "react";
import { Service } from "@/types/service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Edit2,
  Trash2,
  Layers,
  Tag,
  Check,
  Columns,
  Calendar,
  Star,
} from "lucide-react";
import { toggleServiceActive, toggleServiceFlagship } from "@/services/service/service.service";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import DeleteServiceDialog from "./modals/service/delete-service-dialog";
import EditServiceModal from "./modals/service/edit-service-modal";
import ServiceDetailsModal from "./modals/service/service-details-modal";
import { cn } from "@/lib/utils";

import { CategoryOptionSource } from "@/lib/service-categories";

function stripHtmlTags(html?: string | null): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

interface Props {
  service: Service;
  categories?: CategoryOptionSource[];
  featuredCount?: number;
  onFlagshipSwitched?: (featuredId: number) => void;
  onServiceUpdated?: (updated: Service) => void;
  onDeleted?: (serviceId: number) => Promise<void> | void;
  onOpenManageCategories?: () => void;
  onCategoriesUpdated?: (newCategories: CategoryOptionSource[]) => void;
}

export default function ServiceCard({
  service,
  categories,
  featuredCount,
  onFlagshipSwitched,
  onServiceUpdated,
  onDeleted,
  onOpenManageCategories,
  onCategoriesUpdated,
}: Props) {
  const router = useRouter();
  const [currentService, setCurrentService] = useState<Service>(service);
  const [isActive, setIsActive] = useState(service.is_active);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [isFlagship, setIsFlagship] = useState(Boolean(service.is_flagship));
  const [updatingFlagship, setUpdatingFlagship] = useState(false);

  useEffect(() => {
    setCurrentService(service);
    setIsActive(service.is_active);
    setIsFlagship(Boolean(service.is_flagship));
  }, [service]);

  const categoryName = currentService.categoryEntity?.display_label || currentService.category || "General Engineering";
  const formattedDate = currentService.created_at
    ? new Date(currentService.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  const handleToggleFlagship = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (updatingFlagship) return;
    const nextVal = !isFlagship;

    // Exactly one service must remain featured at a time
    if (isFlagship && !nextVal) {
      toast.error("At least one service must remain featured. Feature another service to switch.");
      return;
    }

    setUpdatingFlagship(true);
    setIsFlagship(nextVal);

    const loadingToast = toast.loading("Setting as featured flagship...");
    try {
      const res = await toggleServiceFlagship(service.id, nextVal);

      if (res.success) {
        toast.success("Service featured as flagship (others unfeatured)", { id: loadingToast });
        if (nextVal) {
          setIsActive(true);
        }
        onFlagshipSwitched?.(service.id);
        router.refresh();
      } else {
        setIsFlagship(!nextVal);
        toast.error(res.message || "Failed to update featured status", { id: loadingToast });
      }
    } catch (err: any) {
      setIsFlagship(!nextVal);
      toast.error(err?.message || "At least one service must be featured", { id: loadingToast });
    } finally {
      setUpdatingFlagship(false);
    }
  };

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

  return (
    <>
      <div
        onClick={() => setDetailsOpen(true)}
        title="Click to view service details"
        className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 sm:p-5 shadow-xs hover:border-[#00668a]/50 hover:shadow-md transition-all duration-200 cursor-pointer h-full w-full overflow-hidden"
      >
        <div>
          <div className="flex items-start justify-between gap-2 min-w-0">
            <div className="flex items-start gap-2.5 min-w-0 flex-1">
              <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-[#e6eff6] text-[#00668a] overflow-hidden p-0.5 relative">
              {service.image_url || service.icon_url ? (
                <img
                  src={service.image_url || service.icon_url || ""}
                  alt={service.name}
                  className="h-full w-full object-cover rounded-md relative z-10 bg-[#e6eff6]"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : null}
              <Layers className="h-5 w-5 absolute text-[#00668a]/60" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm truncate max-w-[140px] sm:max-w-full" title={service.name}>{service.name}</h3>
                {service.is_flagship && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                    ★ Flagship
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs font-mono text-slate-400 truncate">/{service.slug}</p>
            </div>
          </div>

          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 ml-1" onClick={(e) => e.stopPropagation()}>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                "h-7 w-7 sm:h-8 sm:w-8 transition-colors rounded-lg",
                isFlagship
                  ? "text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              )}
              disabled={updatingFlagship}
              onClick={handleToggleFlagship}
              aria-label={isFlagship ? "Remove flagship / unfeature" : "Mark as flagship / feature"}
              title={isFlagship ? "Remove from flagship featured" : "Feature as flagship"}
            >
              <Star className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", isFlagship && "fill-amber-400 text-amber-500")} />
            </Button>

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

        {/* Taxonomy Badges: Category & Badges */}
        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
          <Badge
            variant="outline"
            className="text-[#00668a] bg-[#e6eff6] border-[#00668a]/30 font-semibold text-[11px] gap-1"
            title="Service Category"
          >
            <Columns className="h-3 w-3 shrink-0" />
            <span className="truncate">{categoryName}</span>
          </Badge>
          {service.tier_label && (
            <Badge variant="outline" className="text-slate-600 bg-slate-50 border-slate-200 text-[11px]">
              {service.tier_label}
            </Badge>
          )}
          {service.badge_label && (
            <Badge variant="outline" className="text-orange-700 bg-orange-50 border-orange-200 text-[11px]">
              {service.badge_label}
            </Badge>
          )}
        </div>
        {/* Description Preview */}
        <p className="mt-2.5 text-xs text-slate-600 leading-relaxed line-clamp-2">
          {stripHtmlTags(service.description) || "No description provided."}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>

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
      service={currentService}
      onEditClick={() => setEditOpen(true)}
      onDeleteClick={() => setDeleteOpen(true)}
    />

    {(
      <>
        <EditServiceModal
          open={editOpen}
          onOpenChange={setEditOpen}
          service={currentService}
          categories={categories}
          featuredCount={featuredCount}
          onOpenManageCategories={onOpenManageCategories}
          onCategoriesUpdated={onCategoriesUpdated}
          onUpdated={(updated) => {
            setCurrentService(updated);
            onServiceUpdated?.(updated);
          }}
          onDeleteRequest={() => setDeleteOpen(true)}
        />
        <DeleteServiceDialog
          service={currentService}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onDeleted={async () => {
            await onDeleted?.(currentService.id);
          }}
        />
      </>
    )}
  </>
);
}

