/* eslint-disable @next/next/no-img-element */
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
import { Badge } from "@/components/ui/badge";
import {
  Award,
  Calendar,
  Clock,
  Edit2,
  FileText,
  Flame,
  ImageIcon,
  Landmark,
  Maximize2,
  Medal,
  Scale,
  ShieldCheck,
  Star,
  Trash2,
} from "lucide-react";
import type { Certificate } from "@/types/certificate";

const ICON_BY_KEY: Record<string, React.ElementType> = {
  award: Award,
  medal: Medal,
  flame: Flame,
  shield: ShieldCheck,
  scale: Scale,
  file: FileText,
};

function normalizeHtml(html: string | null): string {
  if (!html) return "";
  return html.replace(/&nbsp;/g, " ").replace(/\u00a0/g, " ");
}

interface CertificateDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certificate: Certificate | null;
  onEditClick?: () => void;
  onDeleteClick?: () => void;
  onImageClick?: (media: {
    fileUrl: string;
    thumbUrl?: string | null;
    fileType?: "image" | "pdf";
    title?: string;
  }) => void;
}

export default function CertificateDetailsModal({
  open,
  onOpenChange,
  certificate,
  onEditClick,
  onDeleteClick,
  onImageClick,
}: CertificateDetailsModalProps) {
  if (!certificate) return null;

  const [iconError, setIconError] = useState(false);

  useEffect(() => {
    setIconError(false);
  }, [certificate?.category_icon]);

  const isIconUrl = Boolean(
    !iconError &&
      certificate.category_icon &&
      (certificate.category_icon.startsWith("http") || certificate.category_icon.startsWith("/"))
  );
  const IconComp = (!isIconUrl && certificate.category_icon && ICON_BY_KEY[certificate.category_icon]) || Award;

  const createdDate = certificate.created_at
    ? new Date(certificate.created_at).toLocaleString()
    : "N/A";
  const updatedDate = certificate.updated_at
    ? new Date(certificate.updated_at).toLocaleString()
    : "N/A";

  const previewImage =
    certificate.thumb_url ||
    (certificate.file_type === "pdf" && certificate.file_url
      ? certificate.file_url.replace(/\.pdf$/i, ".jpg")
      : certificate.file_url);
  const isImageFile = certificate.file_type === "image" || Boolean(certificate.thumb_url) || certificate.file_type === "pdf";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-w-full max-h-[85vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6 w-full min-w-0">
        <DialogHeader className="space-y-3 pr-8 sm:pr-10 w-full min-w-0 text-left">
          <div className="flex items-start gap-3 sm:gap-3.5 w-full min-w-0">
            {/* Logo in left corner */}
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-[#e6eff6] text-[#00668a] overflow-hidden p-1.5 shadow-2xs mt-0.5">
              {isIconUrl ? (
                <img
                  src={certificate.category_icon!}
                  alt={certificate.title}
                  onError={() => setIconError(true)}
                  className="h-full w-full object-contain"
                />
              ) : (
                <IconComp className="h-6 w-6 sm:h-7 sm:w-7 text-[#00668a]" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 tracking-tight break-words leading-snug">
                {certificate.title}
              </DialogTitle>
              <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 flex-wrap">
                <span className="text-[11px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  #{certificate.id}
                </span>
                {certificate.reg_no && (
                  <span className="text-[11px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#fff2eb] text-[#f97316]">
                    {certificate.reg_no}
                  </span>
                )}
                <Badge
                  className={
                    certificate.is_active
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px]"
                      : "bg-amber-50 text-amber-700 border-amber-200 text-[11px]"
                  }
                >
                  {certificate.is_active ? "Active" : "Inactive"}
                </Badge>
                {certificate.is_featured && (
                  <Badge className="bg-amber-50 text-amber-800 border-amber-200 text-[11px] gap-1">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    Featured
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-1 w-full min-w-0">
          {/* Certificate Picture / Document Preview */}
          {previewImage && (
            <div className="w-full min-w-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Certification Document / Image Asset
              </span>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 rounded-xl bg-slate-50 border border-slate-200/80 w-full min-w-0">
                <div
                  className="relative group/pic flex h-20 w-28 sm:h-22 sm:w-32 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5 shadow-2xs overflow-hidden cursor-pointer hover:border-[#00668a] transition-all"
                  onClick={() =>
                    onImageClick?.({
                      fileUrl: certificate.file_url,
                      thumbUrl: certificate.thumb_url,
                      fileType: certificate.file_type,
                      title: certificate.title,
                    })
                  }
                  title="Click to view full document in modal"
                >
                  {isImageFile ? (
                    <img
                      src={previewImage}
                      alt={certificate.title}
                      className="h-full w-full object-contain transition-transform duration-200 group-hover/pic:scale-105"
                    />
                  ) : (
                    <FileText className="h-8 w-8 text-red-500" />
                  )}
                  <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover/pic:opacity-100 transition-opacity flex items-center justify-center">
                    <Maximize2 className="h-4 w-4 text-white drop-shadow" />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <span className="text-xs font-semibold text-slate-800 block">
                    {certificate.file_type === "pdf" ? "PDF Document" : "Certificate Image"}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Click the image preview to open it in a separate full-size modal.
                  </p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() =>
                        onImageClick?.({
                          fileUrl: certificate.file_url,
                          thumbUrl: certificate.thumb_url,
                          fileType: certificate.file_type,
                          title: certificate.title,
                        })
                      }
                      className="inline-flex items-center gap-1.5 text-xs text-[#00668a] hover:underline font-semibold"
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                      View Full Size
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Description Section */}
          <div className="w-full min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Description / Details
            </span>
            {certificate.description ? (
              <div
                className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 sm:p-3.5 rounded-lg border border-slate-200/80 max-h-40 overflow-y-auto w-full min-w-0 break-words [overflow-wrap:anywhere] [word-break:break-word]"
                dangerouslySetInnerHTML={{ __html: normalizeHtml(certificate.description) }}
              />
            ) : (
              <div className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-slate-200/80 w-full min-w-0">
                No description provided.
              </div>
            )}
          </div>

          {/* Taxonomy & Properties Grid */}
          <div className="w-full min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Certification Properties & Metadata
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-xs w-full min-w-0">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Issuing Authority
                </span>
                <span className="font-semibold text-slate-800 block truncate" title={certificate.issuing_authority || ""}>
                  {certificate.issuing_authority || "—"}
                </span>
              </div>

              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Year / Sub-Label
                </span>
                <span className="font-semibold text-slate-800 block truncate" title={`${certificate.year ?? ""} ${certificate.sub_label ?? ""}`}>
                  {certificate.year ? `Year: ${certificate.year}` : ""}{" "}
                  {certificate.sub_label ? `(${certificate.sub_label})` : (!certificate.year ? "—" : "")}
                </span>
              </div>

              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Registration / Licence No.
                </span>
                <span className="font-mono font-semibold text-slate-800 block truncate" title={certificate.reg_no || ""}>
                  {certificate.reg_no || "—"}
                </span>
              </div>

              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Display Order
                </span>
                <span className="font-mono font-semibold text-slate-800 block">
                  {certificate.display_order}
                </span>
              </div>

              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  File Type
                </span>
                <span className="font-semibold text-slate-800 uppercase block">
                  {certificate.file_type}
                </span>
              </div>

              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Verification Link
                </span>
                {certificate.verification_link && !certificate.verification_link.includes("cloudinary.com") ? (
                  <a
                    href={certificate.verification_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#00668a] hover:underline font-mono text-[11px] truncate max-w-full"
                    title={certificate.verification_link}
                  >
                    <span className="truncate">{certificate.verification_link}</span>
                  </a>
                ) : (
                  <span className="text-slate-400 block">—</span>
                )}
              </div>

              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Created Date
                </span>
                <span className="text-slate-600 text-[11px] flex items-center gap-1 mt-0.5 truncate">
                  <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                  <span className="truncate">{createdDate}</span>
                </span>
              </div>

              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Last Updated
                </span>
                <span className="text-slate-600 text-[11px] flex items-center gap-1 mt-0.5 truncate">
                  <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                  <span className="truncate">{updatedDate}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer (Matching ServiceDetailsModal layout) */}
        <DialogFooter className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-3 border-t border-slate-100 w-full min-w-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-xs flex-1 sm:flex-none"
            >
              Close
            </Button>

            {onDeleteClick && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  onOpenChange(false);
                  onDeleteClick();
                }}
                className="h-8 w-8 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors shrink-0"
                title="Delete Certification"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete Certification</span>
              </Button>
            )}
          </div>

          {onEditClick && (
            <Button
              type="button"
              onClick={() => {
                onOpenChange(false);
                onEditClick();
              }}
              className="bg-[#00668a] hover:bg-[#004c69] text-white text-xs font-bold gap-1.5 w-full sm:w-auto"
            >
              <Edit2 className="h-3.5 w-3.5" />
              <span>Edit Certification</span>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
