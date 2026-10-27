"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Download,
  Expand,
  ExternalLink,
  FileText,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { normalizeBlogEmbedUrls } from "@/lib/blog-content";
import type { Certificate } from "@/types/certificate";

/**
 * One certificate, rendered in the order the spec asks for (spec §4):
 * **title → file → description**. The title leads because a licence is
 * recognised by its name long before its document is opened; the description
 * trails because it is only relevant once the visitor is already interested.
 *
 * Media is opened in place rather than in a new tab: an image in the lightbox,
 * a PDF in the browser's own viewer. Both are native — no viewer dependency.
 */
export default function CertificateCard({ certificate }: { certificate: Certificate }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // English source; `<AutoTranslate>` translates it to Bangla on client
  // without triggering SSR hydration mismatches.
  const title = certificate.title;
  const description = certificate.description;
  const thumb = certificate.thumb_url || certificate.file_url;
  const isPdf = certificate.file_type === "pdf";
  const hasFile = Boolean(certificate.file_url);

  // For Cloudinary-backed PDFs, render page 1 and page 2 so multi-page documents show in full
  const pdfPages = useMemo(() => {
    if (!isPdf || !certificate.file_url) return [];
    if (certificate.file_url.includes("cloudinary.com")) {
      return [
        certificate.file_url.replace("/upload/", "/upload/pg_1/").replace(/\.pdf$/i, ".jpg"),
        certificate.file_url.replace("/upload/", "/upload/pg_2/").replace(/\.pdf$/i, ".jpg"),
      ];
    }
    return [certificate.thumb_url || certificate.file_url.replace(/\.pdf$/i, ".jpg")];
  }, [isPdf, certificate.file_url, certificate.thumb_url]);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow duration-300 hover:shadow-xl">
      {/* ── 1. Title ─────────────────────────────────────────────── */}
      <div className="space-y-1 px-5 pt-5">
        <h3 className="text-base font-bold leading-snug text-foreground">{title}</h3>
        {certificate.issuing_authority || certificate.year ? (
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            {certificate.issuing_authority}
            {certificate.issuing_authority && certificate.year ? " · " : ""}
            {certificate.year}
          </p>
        ) : null}
      </div>

      {/* ── 2. File ──────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        className="relative mx-5 mt-4 block aspect-[4/3] w-[calc(100%-2.5rem)] overflow-hidden rounded-xl border border-border bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
        aria-label={isPdf ? `View ${title} (PDF)` : `View ${title} full size`}
      >
        {thumb ? (
          // A Cloudinary URL with a transform baked in, so next/image's optimizer
          // would have to re-fetch it; plain <img> keeps the delivery as-is.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt={title}
            loading="lazy"
            className="h-full w-full object-contain p-2 transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1.5 text-muted-foreground">
            <FileText className="h-8 w-8" />
            <span className="text-[11px] font-semibold uppercase tracking-widest">
              On request
            </span>
          </div>
        )}

        {isPdf && thumb ? (
          <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-slate-900/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
            <FileText className="h-3 w-3" />
            PDF
          </span>
        ) : thumb ? (
          <span className="absolute bottom-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/0 text-white opacity-0 transition-all duration-300 group-hover:bg-slate-900/70 group-hover:opacity-100">
            <Expand className="h-4 w-4" />
          </span>
        ) : null}
      </button>

      {/* ── 3. Description ───────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        {description ? (
          <div
            className="prose prose-sm max-w-none text-sm leading-relaxed text-muted-foreground [&_a]:text-brand-accent [&_img]:max-w-full [&_p]:mb-2 [&_ul]:mb-2"
            // The editor is a trusted Quill instance in the admin CMS; the same
            // HTML is rendered by the blog body today.
            dangerouslySetInnerHTML={{ __html: normalizeBlogEmbedUrls(description) }}
          />
        ) : null}

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => setLightboxOpen(true)}
          >
            {isPdf ? <FileText className="h-3.5 w-3.5" /> : <Expand className="h-3.5 w-3.5" />}
            {isPdf ? "View Document" : "View Full Size"}
          </Button>

          {isPdf && hasFile ? (
            <Button size="sm" variant="ghost" className="gap-1.5" asChild>
              <a href={certificate.file_url!} download target="_blank" rel="noopener noreferrer">
                <Download className="h-3.5 w-3.5" />
                Download
              </a>
            </Button>
          ) : null}

          {certificate.verification_link ? (
            <Button size="sm" variant="ghost" className="gap-1.5" asChild>
              <a
                href={certificate.verification_link}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Verify
              </a>
            </Button>
          ) : null}
        </div>
      </div>

      {/* ── Viewer ───────────────────────────────────────────────── */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl p-0">
          <DialogHeader className="px-6 pt-5 pb-2 flex flex-row items-center justify-between space-y-0">
            <div>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <BadgeCheck className="h-5 w-5 text-brand-accent" />
                {title}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {certificate.sub_label || certificate.issuing_authority || "Certificate viewer"}
              </DialogDescription>
            </div>
            {hasFile && (
              <a
                href={isPdf ? `/api/pdf-proxy?url=${encodeURIComponent(certificate.file_url!)}` : certificate.file_url!}
                download={`${title.toLowerCase().replace(/[^a-z0-9]/g, "_")}.${isPdf ? "pdf" : "png"}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors mr-6 shrink-0"
              >
                <Download className="h-3.5 w-3.5" />
                {isPdf ? "Download PDF" : "Download"}
              </a>
            )}
          </DialogHeader>

          {hasFile ? (
            isPdf ? (
              <div className="px-4 pb-4">
                <div className="flex flex-col items-center gap-4 w-full max-h-[75vh] overflow-y-auto overflow-x-hidden rounded-xl border border-border bg-muted/20 p-2 sm:p-4">
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
                        className="max-h-[72vh] w-auto max-w-full object-contain rounded shadow-lg bg-white"
                      />
                      {pdfPages.length > 1 && (
                        <span className="mt-1.5 text-[11px] font-medium text-muted-foreground">
                          Page {idx + 1} of {pdfPages.length}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="px-4 pb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={certificate.file_url!}
                  alt={title}
                  className="max-h-[75vh] w-full rounded-xl object-contain"
                />
              </div>
            )
          ) : (
            <div className="px-6 py-10 text-center">
              <FileText className="mx-auto h-10 w-10 text-muted-foreground/60" />
              <p className="mt-3 text-sm font-semibold text-foreground">
                Document available on request
              </p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                Ask us for a scanned copy along with its verification details.
              </p>
              <Button asChild className="mt-5">
                <Link href="/contact?topic=regulatory-approvals">Request a copy</Link>
              </Button>
            </div>
          )}

          {description ? (
            <div className="max-h-40 overflow-y-auto overflow-x-hidden border-t border-border px-6 py-4 text-sm text-muted-foreground break-words [word-break:break-word]">
              <div dangerouslySetInnerHTML={{ __html: normalizeBlogEmbedUrls(description) }} />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </article>
  );
}