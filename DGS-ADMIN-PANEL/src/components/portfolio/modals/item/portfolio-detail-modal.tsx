 
"use client";

import React, { useState } from "react";
import {
  ExternalLink,
  Edit,
  Tag,
  Building,
  Image as ImageIcon,
  Star,
  Loader2,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn, embedYouTubeVideos } from "@/lib/utils";
import { PortfolioItem } from "@/types/portfolio";

interface PortfolioDetailModalProps {
  item: PortfolioItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (item: PortfolioItem) => void;
  onToggleFeatured: (item: PortfolioItem) => void;
  featuredLoading?: boolean;
}

export default function PortfolioDetailModal({
  item,
  open,
  onOpenChange,
  onEdit,
  onToggleFeatured,
  featuredLoading,
}: PortfolioDetailModalProps) {
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<string | null>(null);

  if (!item) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col p-0 bg-white border border-slate-200 shadow-2xl rounded-2xl">
          {/* 1. Clean Admin Header */}
          <DialogHeader className="p-5 sm:p-6 pb-4 sm:pb-5 border-b border-slate-200 bg-white pr-12 shrink-0">
            {/* Badges Row */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[11px] font-bold uppercase tracking-wider">
                {item.category}
              </span>

              {item.project_status && (
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-[11px] font-bold border capitalize",
                  item.project_status === "completed"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                )}>
                  {item.project_status}
                </span>
              )}

              {item.is_featured && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                  Featured Showcase
                </span>
              )}

              {item.address && (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-500" />
                  <span>{item.address}</span>
                </span>
              )}

              {item.slug && (
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px] font-mono border border-slate-200">
                  {item.slug}
                </span>
              )}
            </div>

            {/* Title, Client & Quick Action Links */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="space-y-1 min-w-0 flex-1">
                <DialogTitle className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                  {item.project_name}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Detailed case study breakdown for {item.project_name}
                </DialogDescription>
                {item.client_name && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium pt-0.5">
                    <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      Client Partner:{" "}
                      <strong className="text-slate-800 font-semibold">{item.client_name}</strong>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2.5 mt-2.5 border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
                  <Tag className="w-3 h-3 text-slate-400" />
                  <span>Tags:</span>
                </span>
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200/80"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </DialogHeader>

          {/* 2. Scrollable Body */}
          <div className="overflow-y-auto flex-1 p-6 sm:p-8 space-y-7 bg-slate-50/50">
            {/* Main Showcase Cover Visual */}
            {item.cover_image && (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-primary" />
                    <span>Project Showcase Visual</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedPreviewImage(item.cover_image || null)}
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    <span>View Fullscreen</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
                <div
                  onClick={() => setSelectedPreviewImage(item.cover_image || null)}
                  className="aspect-21/9 w-full max-h-80 overflow-hidden bg-slate-950 flex items-center justify-center cursor-pointer group relative"
                  title="Click to enlarge"
                >
                  <img
                    src={item.cover_image}
                    alt={item.project_name}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5 backdrop-blur-xs">
                    <ExternalLink className="w-4 h-4" />
                    <span>Click to enlarge cover image</span>
                  </div>
                </div>
              </div>
            )}

            {/* Detailed Description */}
            {item.description && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Project Description &amp; Scope</h4>
                <div
                  className="text-sm text-slate-700 leading-relaxed prose prose-sm max-w-none [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_iframe]:w-full [&_iframe]:aspect-video [&_iframe]:rounded-xl [&_iframe]:my-4 [&_iframe]:shadow-md [&_iframe]:border-0"
                  dangerouslySetInnerHTML={{ __html: embedYouTubeVideos(item.description) }}
                />
              </div>
            )}




          </div>

          {/* 3. Action Footer */}
          <div className="p-3 sm:p-4 sm:px-8 bg-white border-t border-slate-200 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto text-xs font-semibold border-slate-200 text-slate-700"
            >
              Close
            </Button>

            <div className="flex flex-wrap items-center justify-end gap-2 w-full sm:w-auto">

              {(
                <Button
                  variant="outline"
                  size="sm"
                  disabled={featuredLoading}
                  onClick={() => onToggleFeatured(item)}
                  className={cn(
                    "text-xs font-bold gap-1.5 shrink-0 whitespace-nowrap",
                    item.is_featured
                      ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                      : "border-amber-300 text-amber-600 hover:bg-amber-50"
                  )}
                  title={
                    item.is_featured
                      ? "Remove from featured showcase"
                      : "Mark as featured showcase"
                  }
                >
                  {featuredLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : item.is_featured ? (
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ) : (
                    <Star className="w-4 h-4" />
                  )}
                  <span>{item.is_featured ? "Unfeature" : "Mark Featured"}</span>
                </Button>
              )}

              {(
                <Button
                  size="sm"
                  onClick={() => {
                    onOpenChange(false);
                    onEdit(item);
                  }}
                  className="bg-primary hover:bg-primary/90 text-white text-xs font-bold gap-1.5 shadow-xs shrink-0 whitespace-nowrap"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Case Study</span>
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox / Zoom Dialog for individual diagrams and cover images */}
      <Dialog
        open={Boolean(selectedPreviewImage)}
        onOpenChange={(op) => !op && setSelectedPreviewImage(null)}
      >
        <DialogContent className="sm:max-w-4xl p-2 bg-slate-950 border-slate-800 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Enlarged Visual Preview</DialogTitle>
            <DialogDescription>Full view of diagram or showcase asset</DialogDescription>
          </DialogHeader>
          <div className="relative max-h-[85vh] flex items-center justify-center p-2">
            {selectedPreviewImage && (
              <img
                src={selectedPreviewImage}
                alt="Enlarged Visual"
                className="max-h-[80vh] w-auto max-w-full object-contain rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
