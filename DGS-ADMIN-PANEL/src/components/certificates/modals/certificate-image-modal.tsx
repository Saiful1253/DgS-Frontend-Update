/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileText, ImageIcon, Loader2 } from "lucide-react";

interface CertificateImageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl?: string | null;
  fileUrl?: string | null;
  thumbUrl?: string | null;
  fileType?: "image" | "pdf";
  title?: string;
}

export default function CertificateImageModal({
  open,
  onOpenChange,
  imageUrl,
  fileUrl,
  thumbUrl,
  fileType,
  title = "Certification Document",
}: CertificateImageModalProps) {
  const [downloading, setDownloading] = useState(false);

  // Target download URL: for PDF, always use the real fileUrl; for image, use imageUrl or fileUrl
  const targetDownloadUrl = fileUrl || imageUrl;
  const isPdf =
    fileType === "pdf" ||
    Boolean(targetDownloadUrl && targetDownloadUrl.toLowerCase().includes(".pdf"));

  const pdfViewUrl = isPdf && targetDownloadUrl
    ? `/api/pdf-proxy?url=${encodeURIComponent(targetDownloadUrl)}`
    : targetDownloadUrl;

  // For Cloudinary-backed PDFs, render page 1 and page 2 so multi-page documents show in full
  const pdfPages = useMemo(() => {
    if (!isPdf || !targetDownloadUrl) return [];
    if (targetDownloadUrl.includes("cloudinary.com")) {
      return [
        targetDownloadUrl.replace("/upload/", "/upload/pg_1/").replace(/\.pdf$/i, ".jpg"),
        targetDownloadUrl.replace("/upload/", "/upload/pg_2/").replace(/\.pdf$/i, ".jpg"),
      ];
    }
    return [targetDownloadUrl.replace(/\.pdf$/i, ".jpg") || thumbUrl || ""];
  }, [isPdf, targetDownloadUrl, thumbUrl]);

  if (!imageUrl && !fileUrl) return null;

  const handleDownload = async () => {
    const downloadSrc = isPdf ? pdfViewUrl : targetDownloadUrl;
    if (!downloadSrc || downloading) return;
    setDownloading(true);
    try {
      const response = await fetch(downloadSrc);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;

      const safeTitle = title.toLowerCase().replace(/[^a-z0-9]/g, "_");
      const ext = isPdf
        ? "pdf"
        : blob.type.includes("pdf")
        ? "pdf"
        : blob.type.split("/")[1] || "png";

      link.download = `${safeTitle || "certificate"}.${ext}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback programmatically
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="z-[60]"
        className="z-[60] max-w-4xl p-3 sm:p-5 bg-slate-950/95 border-slate-800 text-white overflow-hidden shadow-2xl [&>button]:text-slate-400 [&>button]:hover:text-white [&>button]:top-4 [&>button]:right-4"
      >
        <DialogHeader className="px-1 pt-1 pb-1 flex flex-row items-center justify-between space-y-0 pr-10">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            {isPdf ? (
              <FileText className="h-4 w-4 text-red-500 shrink-0" />
            ) : (
              <ImageIcon className="h-4 w-4 text-[#00668a] shrink-0" />
            )}
            <DialogTitle className="text-sm font-semibold truncate text-slate-200">
              {title} {isPdf ? "(PDF)" : ""}
            </DialogTitle>
          </div>
          <div className="flex items-center gap-2 shrink-0 mr-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={downloading}
              onClick={handleDownload}
              className="h-8 text-xs border-slate-700 bg-slate-900/80 text-slate-200 hover:bg-slate-800 hover:text-white"
            >
              {downloading ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5 mr-1" />
              )}
              {isPdf ? "Download PDF" : "Download"}
            </Button>
          </div>
        </DialogHeader>

        <div className="relative mt-2 rounded-lg bg-black/60 border border-slate-800/80 flex items-center justify-center p-2 min-h-[350px] max-h-[75vh] overflow-y-auto overflow-x-hidden">
          {isPdf ? (
            <div className="flex flex-col items-center gap-4 w-full max-h-[72vh] overflow-y-auto overflow-x-hidden">
              {pdfPages.map((pageUrl, idx) => (
                <div key={idx} className="relative flex flex-col items-center w-full">
                  <img
                    src={pageUrl}
                    alt={`${title} - Page ${idx + 1}`}
                    onError={(e) => {
                      if (idx > 0) {
                        (e.currentTarget.parentElement as HTMLElement)?.remove();
                      }
                    }}
                    className="max-h-[70vh] w-auto max-w-full object-contain rounded select-none shadow-2xl bg-white"
                  />
                  {pdfPages.length > 1 && (
                    <span className="mt-1.5 text-[11px] font-medium text-slate-400">
                      Page {idx + 1} of {pdfPages.length}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-2 flex items-center justify-center w-full h-full overflow-auto">
              <img
                src={thumbUrl || imageUrl || fileUrl || ""}
                alt={title}
                className="max-h-[70vh] w-auto max-w-full object-contain rounded select-none shadow-lg"
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
