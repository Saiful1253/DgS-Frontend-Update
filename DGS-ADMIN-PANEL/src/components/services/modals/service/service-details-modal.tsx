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
import { Service } from "@/types/service";
import {
  Layers,
  Calendar,
  Clock,
  Edit2,
  ExternalLink,
  ImageIcon,
  Trash2,
} from "lucide-react";

interface ServiceDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service | null;
  onEditClick?: () => void;
  onDeleteClick?: () => void;
}

export default function ServiceDetailsModal({
  open,
  onOpenChange,
  service,
  onEditClick,
  onDeleteClick,
}: ServiceDetailsModalProps) {
  if (!service) return null;

  const pillarName = service.pillarEntity?.display_label || service.pillar || "Software Development";
  const createdDate = service.created_at ? new Date(service.created_at).toLocaleString() : "N/A";
  const updatedDate = service.updated_at ? new Date(service.updated_at).toLocaleString() : "N/A";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6">
        <DialogHeader className="space-y-3 pr-8 sm:pr-10">
          <div className="flex items-start gap-3 sm:gap-3.5">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-[#e6eff6] text-[#00668a] overflow-hidden p-1.5 shadow-2xs mt-0.5">
              {service.icon_url ? (
                <img
                  src={service.icon_url}
                  alt={service.name}
                  className="h-full w-full object-contain"
                />
              ) : (
                <Layers className="h-6 w-6 sm:h-7 sm:w-7" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base sm:text-xl font-bold text-slate-900 tracking-tight break-words leading-snug">
                {service.name}
              </DialogTitle>
              <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 flex-wrap">
                <span className="text-[11px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  #{service.id}
                </span>
                <Badge
                  className={
                    service.is_active
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] sm:text-xs"
                      : "bg-amber-50 text-amber-700 border-amber-200 text-[11px] sm:text-xs"
                  }
                >
                  {service.is_active ? "Active" : "Inactive"}
                </Badge>
                <span className="text-[11px] sm:text-xs font-mono text-slate-400 break-all">
                  /{service.slug}
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Full Description */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Full Description
            </span>
            <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 p-3 sm:p-3.5 rounded-lg border border-slate-200/80 max-h-40 overflow-y-auto">
              {service.description || "No description provided."}
            </div>
          </div>

          {/* Service Media & Icon Asset Preview */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Service Media / Icon Asset
            </span>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 rounded-lg bg-slate-50 border border-slate-200/80">
              <div className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white p-2 shadow-2xs">
                {service.icon_url ? (
                  <img
                    src={service.icon_url}
                    alt={service.name}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <ImageIcon className="h-6 w-6 text-slate-300" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-semibold text-slate-800 block">
                  {service.icon_url ? "Uploaded Icon Asset" : "No Icon Asset"}
                </span>
                {service.icon_url ? (
                  <a
                    href={service.icon_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-[#00668a] hover:underline font-medium mt-1 break-all"
                  >
                    <span className="truncate">View original image asset</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                ) : (
                  <span className="text-xs text-slate-400 italic block mt-1">
                    No icon uploaded — the client portal falls back to a generic pillar glyph
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Detailed Taxonomy & Metadata Grid */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Service Taxonomy & Properties
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-xs">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Pillar
                </span>
                <span className="font-semibold text-slate-800 block truncate" title={pillarName}>{pillarName}</span>
                {service.pillar_id && (
                  <span className="text-[10px] font-mono text-slate-400">ID: #{service.pillar_id}</span>
                )}
              </div>

              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Service Group
                </span>
                <span className="font-semibold text-slate-800 block truncate" title={service.group?.name || "None"}>
                  {service.group?.name || "None"}
                </span>
                {service.group_id && (
                  <span className="text-[10px] font-mono text-slate-400">ID: #{service.group_id}</span>
                )}
              </div>

              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Display Order
                </span>
                <span className="font-mono font-semibold text-slate-800 block">
                  {service.display_order}
                </span>
              </div>

              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  URL Slug
                </span>
                <span className="font-mono text-slate-700 text-[11px] block truncate" title={`/${service.slug}`}>
                  /{service.slug}
                </span>
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
                title="Delete Service"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete Service</span>
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
              <span>Edit Service</span>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
