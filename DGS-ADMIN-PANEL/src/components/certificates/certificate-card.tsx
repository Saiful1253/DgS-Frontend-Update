/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Award,
  Calendar,
  Check,
  Edit2,
  ExternalLink,
  Eye,
  FileText,
  Flame,
  GripVertical,
  ImageIcon,
  Landmark,
  Maximize2,
  Medal,
  Scale,
  ShieldCheck,
  Star,
  Trash2,
} from "lucide-react";
import { updateCertificate } from "@/services/certificate/certificate.service";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { Certificate } from "@/types/certificate";
import CertificateDetailsModal from "./modals/certificate-details-modal";
import { cn } from "@/lib/utils";

const ICON_BY_KEY: Record<string, React.ElementType> = {
  award: Award,
  medal: Medal,
  flame: Flame,
  shield: ShieldCheck,
  scale: Scale,
  file: FileText,
};

function cleanHtmlText(html: string | null): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>?/gm, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export interface CertificateMediaPayload {
  fileUrl: string;
  thumbUrl?: string | null;
  fileType?: "image" | "pdf";
  title?: string;
}

interface CertificateCardProps {
  certificate: Certificate;
  rootProps?: Record<string, unknown>;
  dragHandleProps?: Record<string, unknown>;
  onEdit: (cert: Certificate) => void;
  onDelete: (cert: Certificate) => void;
  onOpenImage: (media: CertificateMediaPayload) => void;
  onQuickOrderUpdate?: (certId: number, newOrder: number) => void;
  isDragging?: boolean;
  isTarget?: boolean;
}

export default function CertificateCard({
  certificate,
  rootProps,
  dragHandleProps,
  onEdit,
  onDelete,
  onOpenImage,
  onQuickOrderUpdate,
  isDragging = false,
  isTarget = false,
}: CertificateCardProps) {
  const router = useRouter();
  const [isActive, setIsActive] = useState(certificate.is_active);
  const [isFeatured, setIsFeatured] = useState(certificate.is_featured);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Manual display order state (matching ServiceCard)
  const [manualOrder, setManualOrder] = useState<string>(String(certificate.display_order ?? 0));
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);

  useEffect(() => {
    setIsActive(certificate.is_active);
    setIsFeatured(certificate.is_featured);
    setManualOrder(String(certificate.display_order ?? 0));
  }, [certificate]);

  const isCategoryIconUrl = Boolean(
    certificate.category_icon &&
      (certificate.category_icon.startsWith("http") || certificate.category_icon.startsWith("/"))
  );
  const IconComp =
    (!isCategoryIconUrl && certificate.category_icon && ICON_BY_KEY[certificate.category_icon]) ||
    Award;

  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [certificate.category_icon, certificate.thumb_url, certificate.file_url]);

  const previewImage =
    certificate.thumb_url ||
    (certificate.file_type === "pdf" && certificate.file_url
      ? certificate.file_url.replace(/\.pdf$/i, ".jpg")
      : certificate.file_url);
  const isImageFile = certificate.file_type === "image" || Boolean(certificate.thumb_url) || certificate.file_type === "pdf";

  // Determine logo source: custom icon image -> certificate preview image -> preset glyph
  const logoUrl = !imgError
    ? isCategoryIconUrl
      ? certificate.category_icon
      : isImageFile && previewImage
      ? previewImage
      : null
    : null;

  const cleanDescription = cleanHtmlText(certificate.description);

  const handleToggleActive = async (checked: boolean) => {
    if (updatingStatus) return;
    setUpdatingStatus(true);
    setIsActive(checked);
    try {
      const res = await updateCertificate(certificate.id, { is_active: checked });
      if (res.success) {
        toast.success(checked ? "Certificate activated" : "Certificate deactivated");
        router.refresh();
      } else {
        setIsActive(!checked);
        toast.error(res.message || "Failed to update status");
      }
    } catch {
      setIsActive(!checked);
      toast.error("Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleToggleFeatured = async () => {
    const next = !isFeatured;
    setIsFeatured(next);
    try {
      const res = await updateCertificate(certificate.id, { is_featured: next });
      if (res.success) {
        toast.success(next ? "Added to featured" : "Removed from featured");
        router.refresh();
      } else {
        setIsFeatured(!next);
        toast.error(res.message || "Failed to toggle featured status");
      }
    } catch {
      setIsFeatured(!next);
      toast.error("Failed to toggle featured status");
    }
  };

  const handleSaveManualOrder = async () => {
    const val = parseInt(manualOrder, 10);
    if (isNaN(val) || val < 0) {
      toast.error("Please enter a valid non-negative order number");
      setManualOrder(String(certificate.display_order ?? 0));
      setIsEditingOrder(false);
      return;
    }

    if (val === certificate.display_order) {
      setIsEditingOrder(false);
      return;
    }

    if (onQuickOrderUpdate) {
      onQuickOrderUpdate(certificate.id, val);
      setIsEditingOrder(false);
      return;
    }

    setSavingOrder(true);
    try {
      const res = await updateCertificate(certificate.id, { display_order: val });
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
        title="Click to view certification details"
        className={cn(
          "group relative flex flex-col justify-between rounded-xl border bg-white p-3.5 sm:p-5 shadow-xs transition-all duration-200 cursor-pointer h-full w-full overflow-hidden select-none",
          isDragging && "opacity-40 border-dashed border-[#00668a] scale-[0.98]",
          isTarget && "border-2 border-[#00668a] bg-[#e6eff6]/30 shadow-md",
          !isDragging && !isTarget && "border-slate-200 hover:border-[#00668a]/50 hover:shadow-md"
        )}
      >
        <div>
          {/* Header Row */}
          <div className="flex items-start justify-between gap-2 min-w-0">
            <div className="flex items-start gap-2.5 min-w-0 flex-1">
              {dragHandleProps && (
                <div
                  {...dragHandleProps}
                  title="Drag to reorder certificate"
                  onClick={(e) => e.stopPropagation()}
                  className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-600 rounded transition-colors shrink-0 touch-none mt-0.5"
                >
                  <GripVertical className="h-4 w-4" />
                </div>
              )}

              {/* Logo of certification in the left corner */}
              <div
                className={cn(
                  "flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-[#e6eff6] text-[#00668a] overflow-hidden p-1 shadow-2xs relative group/logo",
                  previewImage && "cursor-pointer hover:border-[#00668a] hover:ring-2 hover:ring-[#00668a]/20 transition-all"
                )}
                onClick={(e) => {
                  if (previewImage) {
                    e.stopPropagation();
                    onOpenImage({
                      fileUrl: certificate.file_url,
                      thumbUrl: certificate.thumb_url,
                      fileType: certificate.file_type,
                      title: certificate.title,
                    });
                  }
                }}
                title={previewImage ? "Click to view full image in modal" : undefined}
              >
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={certificate.title}
                    onError={() => setImgError(true)}
                    className="h-full w-full object-contain transition-transform group-hover/logo:scale-110"
                  />
                ) : (
                  <IconComp className="h-6 w-6 text-[#00668a]" />
                )}
                {previewImage && (
                  <div className="absolute inset-0 bg-slate-900/35 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center">
                    <Maximize2 className="h-3.5 w-3.5 text-white drop-shadow" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3
                    className="font-bold text-slate-900 text-xs sm:text-sm truncate max-w-[140px] sm:max-w-full"
                    title={certificate.title}
                  >
                    {certificate.title}
                  </h3>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 shrink-0">
                    #{certificate.id}
                  </span>
                </div>
                {certificate.reg_no ? (
                  <p className="text-[11px] sm:text-xs font-mono font-bold text-[#f97316] truncate">
                    {certificate.reg_no}
                  </p>
                ) : (
                  <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                    {certificate.issuing_authority || "No authority specified"}
                  </p>
                )}
              </div>
            </div>

            {/* Actions Menu */}
            <div
              className="flex items-center gap-1 shrink-0 ml-1"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={handleToggleFeatured}
                title={isFeatured ? "Featured on storefront (click to toggle)" : "Not featured (click to toggle)"}
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  isFeatured
                    ? "text-amber-500 hover:text-amber-600 bg-amber-50"
                    : "text-slate-300 hover:text-slate-500 hover:bg-slate-100"
                )}
              >
                <Star className={cn("h-4 w-4", isFeatured && "fill-amber-500")} />
              </button>

              <div
                className="flex items-center"
                title={isActive ? "Active certification" : "Inactive certification"}
              >
                <Switch
                  checked={isActive}
                  onCheckedChange={handleToggleActive}
                  disabled={updatingStatus}
                  aria-label="Toggle active status"
                />
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(certificate)}
                className="h-7 w-7 sm:h-8 sm:w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                title="Edit certification"
              >
                <Edit2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(certificate)}
                className="h-7 w-7 sm:h-8 sm:w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete certification"
              >
                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>

          {/* Badges: Authority, Year, File Type */}
          <div className="mt-3 flex items-center gap-1.5 flex-wrap">
            {certificate.issuing_authority && (
              <Badge
                variant="outline"
                className="text-[#00668a] bg-[#e6eff6] border-[#00668a]/30 font-semibold text-[11px] gap-1"
                title="Issuing Authority"
              >
                <Landmark className="h-3 w-3 shrink-0" />
                <span className="truncate max-w-[150px]">{certificate.issuing_authority}</span>
              </Badge>
            )}

            {certificate.year && (
              <Badge
                variant="secondary"
                className="bg-slate-100 text-slate-700 font-semibold text-[11px] gap-1"
                title="Year Issued"
              >
                <Calendar className="h-3 w-3 shrink-0" />
                <span>{certificate.year}</span>
              </Badge>
            )}

            {previewImage ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenImage({
                    fileUrl: certificate.file_url,
                    thumbUrl: certificate.thumb_url,
                    fileType: certificate.file_type,
                    title: certificate.title,
                  });
                }}
                className={cn(
                  "font-semibold text-[11px] gap-1 px-2 py-0.5 rounded-md border flex items-center transition-all cursor-pointer shadow-2xs",
                  certificate.file_type === "pdf"
                    ? "border-red-200 text-red-700 bg-red-50 hover:bg-red-100"
                    : "border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 hover:border-slate-300"
                )}
                title="Click to preview full document in modal"
              >
                {certificate.file_type === "pdf" ? (
                  <FileText className="h-3 w-3 shrink-0 text-red-500" />
                ) : (
                  <Eye className="h-3 w-3 shrink-0 text-[#00668a]" />
                )}
                <span>{certificate.file_type.toUpperCase()}</span>
              </button>
            ) : (
              <Badge
                variant="outline"
                className={cn(
                  "font-semibold text-[11px] gap-1",
                  certificate.file_type === "pdf"
                    ? "border-red-200 text-red-700 bg-red-50/50"
                    : "border-slate-200 text-slate-600 bg-slate-50"
                )}
              >
                {certificate.file_type === "pdf" ? (
                  <FileText className="h-3 w-3 shrink-0 text-red-500" />
                ) : (
                  <ImageIcon className="h-3 w-3 shrink-0 text-slate-500" />
                )}
                <span>{certificate.file_type.toUpperCase()}</span>
              </Badge>
            )}

            {certificate.sub_label && (
              <span className="text-[11px] text-slate-400 truncate max-w-[120px]">
                {certificate.sub_label}
              </span>
            )}
          </div>

          {/* Description Preview */}
          <p className="mt-2.5 text-xs text-slate-600 leading-relaxed line-clamp-2">
            {cleanDescription || "No description provided."}
          </p>
        </div>

        {/* Card Footer: Display Order Editor & Verification Link */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div
            className="flex items-center gap-2 flex-wrap"
            onClick={(e) => e.stopPropagation()}
          >
            {isEditingOrder ? (
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min="0"
                  value={manualOrder}
                  onChange={(e) => setManualOrder(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void handleSaveManualOrder();
                    } else if (e.key === "Escape") {
                      setManualOrder(String(certificate.display_order ?? 0));
                      setIsEditingOrder(false);
                    }
                  }}
                  className="h-6 w-14 text-xs font-mono p-1 text-center"
                  autoFocus
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                  onClick={handleSaveManualOrder}
                  disabled={savingOrder}
                  title="Save order"
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingOrder(true)}
                className="font-mono text-[11px] bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-600 transition-colors cursor-pointer"
                title="Click to edit display order"
              >
                Order: <span className="font-bold text-slate-900">{certificate.display_order}</span>
              </button>
            )}
          </div>

          <div
            className="flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            {certificate.verification_link && !certificate.verification_link.includes("cloudinary.com") && (
              <a
                href={certificate.verification_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-medium text-[#00668a] hover:underline"
                title="Open verification link"
              >
                <span>Verify</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            <span className="text-[10px] text-slate-400">
              {certificate.created_at
                ? new Date(certificate.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                : ""}
            </span>
          </div>
        </div>
      </div>

      <CertificateDetailsModal
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        certificate={certificate}
        onEditClick={() => onEdit(certificate)}
        onDeleteClick={() => onDelete(certificate)}
        onImageClick={onOpenImage}
      />
    </>
  );
}
