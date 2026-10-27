"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  ExternalLink,
  FileText,
  Flame,
  Medal,
  Minus,
  Plus,
  RotateCcw,
  Scale,
  ShieldCheck,
  X,
} from "lucide-react";
import { normalizeBlogEmbedUrls } from "@/lib/blog-content";
import type { Certificate } from "@/types/certificate";
import Image from "next/image";
import { motion, AnimatePresence, type Variants } from "framer-motion";

// ─── Design tokens ────────────────────────────────────────────────────────────

const ACCENT = "#f97316";
const ACCENT_DARK = "#ea580c";
const PILL_BG = "#fff2eb";
const HEADING = "#0f2438";

const ICON_BY_KEY: Record<string, React.ElementType> = {
  award: Award,
  medal: Medal,
  flame: Flame,
  shield: ShieldCheck,
  scale: Scale,
  file: FileText,
};

function toSnippet(html: string | null, maxLength = 140): string {
  const text = (html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}

const CERTIFICATE_PLACEHOLDER = "/certificate-placeholder.png";

function getCloudinaryPdfPageUrl(
  fileUrl: string | null | undefined,
): string | null {
  if (
    !fileUrl ||
    !fileUrl.includes("cloudinary.com") ||
    !/\.pdf(?:$|[?#])/i.test(fileUrl) ||
    !fileUrl.includes("/upload/")
  ) {
    return null;
  }
  return fileUrl
    .replace("/upload/", "/upload/pg_1/")
    .replace(/\.pdf(?=($|[?#]))/i, ".jpg");
}

// ─── Framer Motion variants ───────────────────────────────────────────────────

const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: "easeIn" } },
};

const panelVariants: Variants = {
  hidden: { opacity: 0, scale: 0.92, y: 28 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.94,
    y: 16,
    transition: { duration: 0.22, ease: "easeIn" },
  },
};

const bodyVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { delay: 0, duration: 0.3, ease: "easeOut" },
  },
};

// ─── Certificate modal ────────────────────────────────────────────────────────

function CertificateModal({
  open,
  onClose,
  certificate,
  title,
  descriptionHtml,
  hasFile,
  isPdf,
  pdfPages,
}: {
  open: boolean;
  onClose: () => void;
  certificate: Certificate;
  title: string;
  descriptionHtml: string | null;
  hasFile: boolean;
  isPdf: boolean;
  pdfPages: string[];
}) {
  const [pdfZoom, setPdfZoom] = useState(1);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />

          {/* Centering wrapper — not a flex container itself so the panel can control size */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={title}
              className="relative w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl pointer-events-auto"
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              {/* ── Header ──────────────────────────────────────────────── */}
              <div
                className="relative px-6 pt-6 pb-5 overflow-hidden"
                style={{
                  background:
                    "linear-gradient(135deg, #0c1f30 0%, #17354f 55%, #0c1f30 100%)",
                }}
              >
                {/* Glow accents */}
                <div
                  className="pointer-events-none absolute -top-12 -right-12 h-44 w-44 rounded-full opacity-25 blur-3xl"
                  style={{ background: ACCENT }}
                />
                <div
                  className="pointer-events-none absolute -bottom-8 left-1/3 h-28 w-28 rounded-full opacity-10 blur-2xl"
                  style={{ background: ACCENT }}
                />

                {/* Close */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/60 transition-all hover:bg-white/20 hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="flex items-start gap-3">
                  {/* Icon badge */}
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      background: `${ACCENT}22`,
                      border: `1px solid ${ACCENT}44`,
                    }}
                  >
                    <BadgeCheck className="h-5 w-5" style={{ color: ACCENT }} />
                  </div>

                  <div className="flex-1 min-w-0 pr-8">
                    {certificate.reg_no && (
                      <span
                        className="mb-2 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                        style={{ background: `${ACCENT}25`, color: ACCENT }}
                      >
                        {certificate.reg_no}
                      </span>
                    )}
                    <h2 className="text-lg font-bold leading-snug text-white">
                      {title}
                    </h2>
                    {(certificate.issuing_authority || certificate.year) && (
                      <p className="mt-1 text-sm text-white/50">
                        {[certificate.issuing_authority, certificate.year]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Body ────────────────────────────────────────────────── */}
              <motion.div
                className="bg-white"
                variants={bodyVariants}
                initial="hidden"
                animate="visible"
              >
                {hasFile ? (
                  <div className="px-4 pt-4 pb-4">
                    {isPdf ? (
                      <div className="certificate-pdf-scroll w-full max-h-[60vh] overflow-auto rounded-xl border border-slate-100 bg-slate-50">
                        <div className="sticky top-0 z-10 flex items-center justify-end gap-2 border-b border-slate-200 bg-slate-100/95 px-3 py-2 backdrop-blur">
                          <button
                            type="button"
                            onClick={() =>
                              setPdfZoom((zoom) => Math.max(0.5, zoom - 0.25))
                            }
                            disabled={pdfZoom <= 0.5}
                            aria-label="Zoom out PDF pages"
                            className="rounded-md border border-slate-300 bg-white p-1.5 text-slate-700 disabled:opacity-40"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="min-w-12 text-center text-xs font-medium text-slate-600">
                            {Math.round(pdfZoom * 100)}%
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setPdfZoom((zoom) => Math.min(2.5, zoom + 0.25))
                            }
                            disabled={pdfZoom >= 2.5}
                            aria-label="Zoom in PDF pages"
                            className="rounded-md border border-slate-300 bg-white p-1.5 text-slate-700 disabled:opacity-40"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPdfZoom(1)}
                            disabled={pdfZoom === 1}
                            aria-label="Reset PDF zoom"
                            className="rounded-md border border-slate-300 bg-white p-1.5 text-slate-700 disabled:opacity-40"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex min-w-full flex-col items-center gap-4 p-3">
                          {pdfPages.map((pageUrl, idx) => (
                            <div
                              key={idx}
                              className="relative flex flex-col items-center"
                              style={{
                                width: `${pdfZoom * 100}%`,
                                minWidth: `${pdfZoom * 100}%`,
                              }}
                            >
                              <img
                                src={pageUrl}
                                alt={`${title} – Page ${idx + 1}`}
                                onError={(e) => {
                                  if (idx > 0)
                                    (
                                      e.currentTarget.parentElement as HTMLElement
                                    )?.remove();
                                }}
                                className="h-auto w-full max-w-none rounded-lg bg-white object-contain shadow-md"
                              />
                              {pdfPages.length > 1 && (
                                <span className="mt-1.5 text-[11px] font-medium text-slate-400">
                                  Page {idx + 1} of {pdfPages.length}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={certificate.file_url!}
                        alt={title}
                        className="max-h-[60vh] w-full rounded-xl object-contain border border-slate-100"
                      />
                    )}
                  </div>
                ) : (
                  /* No document uploaded yet */
                  <div className="px-6 py-12 text-center">
                    <div
                      className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
                      style={{ background: `${ACCENT}10` }}
                    >
                      <FileText
                        className="h-8 w-8"
                        style={{ color: ACCENT }}
                        strokeWidth={1.5}
                      />
                    </div>
                    <p
                      className="text-base font-bold"
                      style={{ color: HEADING }}
                    >
                      {certificate.issuing_authority ?? "Issuing authority"}
                      {certificate.year ? ` · ${certificate.year}` : ""}
                    </p>
                    <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
                      The scanned document for this certificate is available on
                      request — ask us and we&apos;ll send a copy with verification
                      details.
                    </p>
                    <Link
                      href="/contact?topic=regulatory-approvals"
                      className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
                      style={{ backgroundColor: ACCENT }}
                    >
                      Request a copy
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                )}

                {/* Description */}
                {descriptionHtml && (
                  <div className="max-h-36 overflow-y-auto overflow-x-hidden border-t border-slate-100 px-6 py-4 prose prose-sm max-w-none text-sm text-slate-600 break-words [word-break:break-word] [&_a]:underline">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: normalizeBlogEmbedUrls(descriptionHtml),
                      }}
                    />
                  </div>
                )}

                {/* Verification link */}
                {certificate.verification_link && (
                  <div className="border-t border-slate-100 px-6 py-3">
                    <a
                      href={certificate.verification_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold transition-colors hover:underline"
                      style={{ color: ACCENT_DARK }}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Verify with the issuing authority
                    </a>
                  </div>
                )}
              </motion.div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export default function CertificationCard({
  certificate,
}: {
  certificate: Certificate;
}) {
  const [open, setOpen] = useState(false);

  const title = certificate.title;
  const descriptionHtml = certificate.description;
  const description = toSnippet(descriptionHtml);

  const isIconUrl = Boolean(
    certificate.category_icon &&
    (certificate.category_icon.startsWith("http") ||
      certificate.category_icon.startsWith("/")),
  );
  const Icon =
    (!isIconUrl &&
      certificate.category_icon &&
      ICON_BY_KEY[certificate.category_icon]) ||
    FileText;

  const isPdf = certificate.file_type === "pdf";
  const hasFile = Boolean(certificate.file_url);

  const previewUrls = [
    certificate.thumb_url,
    isPdf
      ? getCloudinaryPdfPageUrl(certificate.file_url)
      : certificate.file_url,
    CERTIFICATE_PLACEHOLDER,
  ].filter((url): url is string => Boolean(url));

  const [failedPreviewUrls, setFailedPreviewUrls] = useState<string[]>([]);
  const previewSrc =
    previewUrls.find((url) => !failedPreviewUrls.includes(url)) ||
    CERTIFICATE_PLACEHOLDER;

  const pdfPages = useMemo(() => {
    if (!isPdf || !certificate.file_url) return [];
    if (certificate.file_url.includes("cloudinary.com")) {
      return [
        certificate.file_url
          .replace("/upload/", "/upload/pg_1/")
          .replace(/\.pdf$/i, ".jpg"),
        certificate.file_url
          .replace("/upload/", "/upload/pg_2/")
          .replace(/\.pdf$/i, ".jpg"),
      ];
    }
    return [
      certificate.thumb_url || certificate.file_url.replace(/\.pdf$/i, ".jpg"),
    ];
  }, [isPdf, certificate.file_url, certificate.thumb_url]);

  const footerLabel =
    certificate.sub_label ??
    [certificate.issuing_authority, certificate.year]
      .filter(Boolean)
      .join(" · ");

  return (
    <>
      <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,36,56,0.06)] transition-shadow duration-300 hover:shadow-[0_12px_32px_rgba(15,36,56,0.10)]">
        <div>
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-50">
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 cursor-zoom-in overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm"
            >
              <Image
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-contain"
                src={previewSrc}
                alt={certificate.title}
                onError={() =>
                  setFailedPreviewUrls((failed) =>
                    failed.includes(previewSrc)
                      ? failed
                      : [...failed, previewSrc],
                  )
                }
                onClick={() => setOpen(true)}
              />
            </motion.span>

            <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-3">
              {isIconUrl ? (
                <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/95 p-2 shadow-sm">
                  <Image
                    src={certificate.category_icon!}
                    alt=""
                    fill
                    sizes="40px"
                    className="object-contain p-2"
                  />
                </span>
              ) : (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/95 shadow-sm">
                  <Icon
                    className="h-5 w-5"
                    style={{ color: ACCENT }}
                    strokeWidth={1.5}
                  />
                </span>
              )}
              <span
                className="max-w-[75%] truncate rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider shadow-sm"
                style={{ backgroundColor: PILL_BG, color: ACCENT }}
              >
                {certificate.reg_no ?? "Certificate"}
              </span>
            </div>
          </div>
        </div>

        {/* Title + body */}
        <h3
          className="mt-5 text-lg font-bold leading-snug"
          style={{ color: HEADING }}
        >
          {title}
        </h3>
        <p className="mt-2.5 text-sm leading-relaxed text-slate-500">
          {description}
        </p>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <span className="truncate text-xs font-medium text-slate-400">
            {footerLabel}
          </span>

          <motion.button
            type="button"
            onClick={() => setOpen(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white shadow-sm"
            style={{ backgroundColor: ACCENT }}
          >
            <BadgeCheck className="h-3.5 w-3.5" />
            View Certificate
          </motion.button>
        </div>
      </article>

      <CertificateModal
        open={open}
        onClose={() => setOpen(false)}
        certificate={certificate}
        title={title}
        descriptionHtml={descriptionHtml}
        hasFile={hasFile}
        isPdf={isPdf}
        pdfPages={pdfPages}
      />
    </>
  );
}
