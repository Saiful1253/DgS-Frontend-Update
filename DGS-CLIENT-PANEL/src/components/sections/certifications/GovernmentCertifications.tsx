import Link from "next/link";
import { ArrowRight, BadgeCheck, CheckCircle2, FileText } from "lucide-react";
import { getCertificates } from "@/services/certificate/certificate.service";
import type { CertificatePage } from "@/types/certificate";
import { HOME_CERTIFICATION_PAGE_SIZE } from "@/zod/certificate.validation";
import CertificationsGrid from "./CertificationsGrid";

/**
 * "Government & Regulatory Certifications" — the home-page compliance block
 * (certifications_implementation_plan.md, mockup §1).
 *
 * Featured certifications in a three-column grid, with a dark CTA card closing
 * the block. Only `is_active && is_featured` rows reach here — the public query
 * enforces it, so nothing has to be filtered in this file.
 *
 * The page size is six: two clean rows of three. Five from the mockup would
 * leave a single card beside the CTA, and eight would break the grid.
 */

const ACCENT = "#f97316";
const ACCENT_DARK = "#ff5722";
const HEADING = "#0f2438";
const CTA_BG = "#16283d";

export default async function GovernmentCertifications() {
  const page: CertificatePage = await getCertificates({
    limit: HOME_CERTIFICATION_PAGE_SIZE,
    featured: true,
  }).catch(() => ({
    items: [],
    total: 0,
    hasMore: false,
    offset: 0,
    limit: HOME_CERTIFICATION_PAGE_SIZE,
  }));

  // No compliance content published yet is a content state, not an error —
  // rendering an empty "certifications" heading would be worse than silence.
  if (page.items.length === 0) return null;

  return (
    <section id="certifications" suppressHydrationWarning className="scroll-mt-24 bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-10">
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <p
              className="text-xs font-black uppercase tracking-[0.2em]"
              style={{ color: ACCENT }}
            >
              Legal Accreditations
            </p>
            <h2
              className="mt-3 text-3xl font-black tracking-tight md:text-4xl"
              style={{ color: HEADING }}
            >
              Government &amp; Regulatory Certifications
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-500">
              Digital Gas Service operates with complete legal compliance and
              adheres strictly to the national codes for gas reticulation, industrial
              piping and fire protection.
            </p>
          </div>

          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            Bangladesh Govt. Approved
          </span>
        </div>

        {/* ── Grid: 3 up, 1 on mobile ────────────────────────────── */}
        <div className="mt-12">
          <CertificationsGrid
            initialPage={page}
            pageSize={HOME_CERTIFICATION_PAGE_SIZE}
          />
        </div>

        {/* ── Footer: CTA + full library ────────────────────────── */}
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          <article
            className="flex h-full flex-col rounded-2xl p-6"
            style={{ backgroundColor: CTA_BG }}
          >
            <FileText className="h-8 w-8" style={{ color: ACCENT_DARK }} strokeWidth={1.5} />
            <h3 className="mt-5 text-lg font-bold leading-snug text-white">
              Need Regulatory Approvals?
            </h3>
            <p className="mt-2.5 text-sm leading-relaxed text-slate-300">
              Our specialised legal and regulatory team prepares and submits your
              licensing paperwork — so you can start construction without waiting on
              approvals.
            </p>

            <div className="mt-auto pt-5">
              <Link
                href="/contact?topic=regulatory-approvals"
                className="inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
                style={{ backgroundColor: ACCENT }}
              >
                Get Approval Support
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </article>
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href="/certificates"
            className="inline-flex items-center gap-2 text-sm font-bold hover:underline"
            style={{ color: ACCENT_DARK }}
          >
            <BadgeCheck className="h-4 w-4" />
            View the full certificate library
          </Link>
        </div>
      </div>
    </section>
  );
}