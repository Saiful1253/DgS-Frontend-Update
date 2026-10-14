/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ServiceGroup, Service } from "@/types/service";
import {
  Tag,
  Layers,
  Calendar,
  Clock,
  Edit2,
  Trash2,
} from "lucide-react";

interface GroupDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: ServiceGroup | null;
  assignedServices: Service[];
  onEditClick?: () => void;
  onDeleteClick?: () => void;
}

export default function GroupDetailsModal({
  open,
  onOpenChange,
  group,
  assignedServices,
  onEditClick,
  onDeleteClick,
}: GroupDetailsModalProps) {
  if (!group) return null;

  const pillarName = group.pillarEntity?.display_label || group.pillar || "Software Development";
  const createdDate = group.created_at ? new Date(group.created_at).toLocaleString() : "N/A";
  const updatedDate = group.updated_at ? new Date(group.updated_at).toLocaleString() : "N/A";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6">
        <DialogHeader className="space-y-3 pr-8 sm:pr-10">
          <div className="flex items-start gap-3 sm:gap-3.5">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-[#e6eff6] text-[#00668a] shadow-2xs mt-0.5">
              <Tag className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>

            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base sm:text-xl font-bold text-slate-900 tracking-tight break-words leading-snug">
                {group.name}
              </DialogTitle>
              <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 flex-wrap">
                <span className="text-[11px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  #{group.id}
                </span>
                <span className="text-[11px] sm:text-xs font-mono text-slate-400 break-all">
                  /{group.slug}
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Assigned Services List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Assigned Services ({assignedServices.length})
              </span>
            </div>

            {assignedServices.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center text-xs text-slate-400">
                No services are currently assigned to this group.
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 divide-y divide-slate-100 max-h-56 overflow-y-auto">
                {assignedServices.map((s) => (
                  <div key={s.id} className="p-2.5 sm:p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                        {s.icon_url ? (
                          <img src={s.icon_url} alt={s.name} className="h-full w-full object-contain" />
                        ) : (
                          <Layers className="h-4 w-4 text-[#00668a]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-slate-900 block truncate" title={s.name}>{s.name}</span>
                        <span className="text-[11px] font-mono text-slate-400 block truncate">/{s.slug}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 justify-between sm:justify-end w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <span className="text-[10px] font-mono font-medium text-slate-400">Order: {s.display_order}</span>
                      <Badge
                        className={
                          s.is_active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"
                            : "bg-amber-50 text-amber-700 border-amber-200 text-[10px]"
                        }
                      >
                        {s.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Group Taxonomy & Metadata Properties */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Group Properties & Metadata
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-xs">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Pillar
                </span>
                <span className="font-semibold text-slate-800 block truncate" title={pillarName}>{pillarName}</span>
                {group.pillar_id && (
                  <span className="text-[10px] font-mono text-slate-400">ID: #{group.pillar_id}</span>
                )}
              </div>

              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Display Order
                </span>
                <span className="font-mono font-semibold text-slate-800 block">
                  {group.display_order}
                </span>
              </div>

              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Status
                </span>
                <Badge
                  variant="outline"
                  className={
                    group.is_active === false
                      ? "bg-amber-50 text-amber-700 border-amber-200 text-[10px]"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"
                  }
                >
                  {group.is_active === false ? "Inactive" : "Active"}
                </Badge>
              </div>

              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Created Date
                </span>
                <span className="text-slate-600 text-[11px] flex items-center gap-1 mt-0.5 flex-wrap">
                  <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                  <span className="truncate">{createdDate}</span>
                </span>
              </div>

              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Last Updated
                </span>
                <span className="text-slate-600 text-[11px] flex items-center gap-1 mt-0.5 flex-wrap">
                  <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                  <span className="truncate">{updatedDate}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onOpenChange(false);
              }}
              className="text-xs flex-1 sm:flex-none"
            >
              Close
            </Button>

            {onDeleteClick && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenChange(false);
                  onDeleteClick();
                }}
                className="h-8 w-8 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors shrink-0"
                title="Delete Group"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete Group</span>
              </Button>
            )}
          </div>

          {onEditClick && (
            <Button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenChange(false);
                onEditClick();
              }}
              className="bg-[#00668a] hover:bg-[#004c69] text-white text-xs font-bold gap-1.5 w-full sm:w-auto"
            >
              <Edit2 className="h-3.5 w-3.5" />
              <span>Edit Group</span>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
