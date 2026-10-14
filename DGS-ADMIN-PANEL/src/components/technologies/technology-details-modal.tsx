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
import type { Technology } from "@/types/technology";
import {
  Code2,
  Calendar,
  Clock,
  Edit2,
  ExternalLink,
  ImageIcon,
  Trash2,
  Tag,
} from "lucide-react";

interface TechnologyDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  technology: Technology | null;
  onEditClick?: () => void;
  onDeleteClick?: () => void;
}

export default function TechnologyDetailsModal({
  open,
  onOpenChange,
  technology,
  onEditClick,
  onDeleteClick,
}: TechnologyDetailsModalProps) {
  if (!technology) return null;

  const createdDate = technology.created_at
    ? new Date(technology.created_at).toLocaleString()
    : "N/A";
  const updatedDate = technology.updated_at
    ? new Date(technology.updated_at).toLocaleString()
    : "N/A";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6 rounded-2xl border-slate-200 shadow-2xl">
        <DialogHeader className="space-y-3 pr-8 sm:pr-10">
          <div className="flex items-start gap-3 sm:gap-3.5">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-[#e6eff6] text-[#00668a] overflow-hidden p-2 shadow-2xs mt-0.5">
              {technology.icon_url ? (
                <img
                  src={technology.icon_url}
                  alt={technology.name}
                  className="h-full w-full object-contain"
                />
              ) : (
                <Code2 className="h-6 w-6 sm:h-7 sm:w-7" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base sm:text-xl font-bold text-slate-900 tracking-tight break-words leading-snug">
                {technology.name}
              </DialogTitle>
              <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 flex-wrap">
                <span className="text-[11px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  #{technology.id}
                </span>
                <Badge
                  className={
                    technology.is_active
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] sm:text-xs"
                      : "bg-amber-50 text-amber-700 border-amber-200 text-[11px] sm:text-xs"
                  }
                >
                  {technology.is_active ? "Active" : "Inactive"}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[#00668a] bg-[#e6eff6] border-[#00668a]/30 font-semibold text-[11px] sm:text-xs gap-1"
                >
                  <Tag className="h-3 w-3 shrink-0" />
                  <span>{technology.category}</span>
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Proficiency Tagline */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Proficiency Tagline & Scope
            </span>
            <div className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 sm:p-3.5 rounded-lg border border-slate-200/80">
              {technology.proficiency_tagline || "No proficiency tagline provided."}
            </div>
          </div>

          {/* Technology Icon / Media Asset Preview */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Technology Icon / Asset
            </span>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 rounded-lg bg-slate-50 border border-slate-200/80">
              <div className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white p-2 shadow-2xs">
                {technology.icon_url ? (
                  <img
                    src={technology.icon_url}
                    alt={technology.name}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <ImageIcon className="h-6 w-6 text-slate-300" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-semibold text-slate-800 block">
                  {technology.icon_url ? "Uploaded Icon Asset" : "No Icon Asset"}
                </span>
                {technology.icon_url ? (
                  <a
                    href={technology.icon_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-[#00668a] hover:underline font-medium mt-1 break-all"
                  >
                    <span className="truncate">View original image asset</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                ) : (
                  <span className="text-xs text-slate-400 italic block mt-1">
                    No custom icon uploaded — falls back to standard code glyph.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Taxonomy & Metadata Grid */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Taxonomy &amp; Properties
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-xs">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Category
                </span>
                <span className="font-semibold text-slate-800 block truncate">
                  {technology.category}
                </span>
              </div>

              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Display Order
                </span>
                <span className="font-mono font-semibold text-slate-800 block">
                  {technology.display_order}
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
                title="Delete Technology"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete Technology</span>
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
              <span>Edit Technology</span>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
