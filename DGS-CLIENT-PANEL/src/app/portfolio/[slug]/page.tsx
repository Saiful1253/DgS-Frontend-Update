import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Check,
  X,
  MapPin,
  CheckCircle2,
  Clock,
  Navigation,
} from "lucide-react";
import { getPublicPortfolioBySlug } from "@/services/portfolio/portfolio.service";
import { BRAND } from "@/lib/brand";
import { embedYouTubeVideos } from "@/lib/utils";

export const revalidate = 3600;

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublicPortfolioBySlug(slug);
  if (!project) return { title: `Project Not Found | ${BRAND.name}` };

  return {
    title: `${project.project_name} | ${BRAND.name}`,
    description:
      toText(project.description).slice(0, 160) ||
      `Case study for ${project.project_name}.`,
  };
}

function toText(html?: string | null): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export default async function PortfolioDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const project = await getPublicPortfolioBySlug(slug);

  if (!project) notFound();

  const isCompleted = (project.project_status || "completed") === "completed";
  const locationLabel = [project.address, project.area, project.district]
    .filter(Boolean)
    .join(", ");


  const tiers = [...(project.pricing_tiers ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  );

  const toPoints = (value?: string | null): string[] =>
    toText(value)
      .split(/\n|(?<=\.)\s+/)
      .map((line) => line.replace(/^[-•*]\s*/, "").trim())
      .filter(Boolean);

  return (
    <article className="mx-auto max-w-5xl px-4 py-12 md:px-10 md:py-16 space-y-10">
      {/* Back Link */}
      <Link
        href="/portfolio"
        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-accent hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Portfolio
      </Link>

      {/* Header Info */}
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="rounded-full bg-brand-accent/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-brand-accent">
            {project.category || "Project"}
          </span>

          <span
            className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 text-white ${
              isCompleted ? "bg-emerald-600" : "bg-sky-600"
            }`}
          >
            {isCompleted ? (
              <>
                <CheckCircle2 className="w-3 h-3" />
                <span>Completed</span>
              </>
            ) : (
              <>
                <Clock className="w-3 h-3" />
                <span>Ongoing</span>
              </>
            )}
          </span>

          {project.client_name && (
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground pl-1">
              Client: {project.client_name}
            </span>
          )}
        </div>

        <h1 className="text-3xl font-black tracking-tight text-foreground md:text-5xl">
          {project.project_name}
        </h1>

        {locationLabel && (
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <MapPin className="w-4 h-4 text-brand-accent shrink-0" />
            <span>{locationLabel}</span>
            {project.latitude && project.longitude && (
              <a
                href={`https://www.google.com/maps?q=${project.latitude},${project.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-brand-accent hover:underline ml-2"
              >
                <Navigation className="w-3 h-3" />
                <span>View Coordinates ({project.latitude}, {project.longitude})</span>
              </a>
            )}
          </div>
        )}

        {(project.tags ?? []).length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {(project.tags ?? []).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-muted px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Hero Media: High-Res Cover Visual */}
      {project.cover_image && (
        <div className="relative aspect-[21/9] overflow-hidden rounded-2xl bg-muted shadow-lg border border-border">
          <Image
            src={project.cover_image}
            alt={project.project_name}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-cover"
          />
        </div>
      )}

      {/* Project Overview / Description */}
      {project.description && (
        <section aria-labelledby="overview-heading" className="space-y-4 pt-4 border-t border-border">
          <h2 id="overview-heading" className="text-xl font-bold tracking-tight text-foreground">
            Project Overview
          </h2>
          <div
            className="prose dark:prose-invert max-w-none text-sm text-muted-foreground leading-relaxed [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_iframe]:w-full [&_iframe]:aspect-video [&_iframe]:rounded-xl [&_iframe]:my-4 [&_iframe]:shadow-md [&_iframe]:border-0"
            dangerouslySetInnerHTML={{ __html: embedYouTubeVideos(project.description) }}
          />
        </section>
      )}



      {/* 4. Benchmark Comparison — SRS §4.3.4 */}
      {project.comparison_enabled && (
        <section aria-labelledby="comparison-heading" className="space-y-6 pt-4">
          <div>
            <h2 id="comparison-heading" className="text-2xl font-bold tracking-tight text-foreground">
              {project.comparison_title || "Industry Standard vs. Our Approach"}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              How this engagement compares with a typical delivery of the same scope.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6 dark:border-red-900/50 dark:bg-red-950/20">
              <h3 className="text-xs font-black uppercase tracking-widest text-red-700 dark:text-red-400">
                Industry Standard
              </h3>
              <ul className="mt-4 space-y-2.5">
                {toPoints(project.industry_standard_text).map((point) => (
                  <li key={point} className="flex gap-2.5 text-sm text-muted-foreground">
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-brand-accent/20 bg-brand-accent/5 p-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-brand-accent">
                Our Approach
              </h3>
              <ul className="mt-4 space-y-2.5">
                {toPoints(project.our_approach_text).map((point) => (
                  <li key={point} className="flex gap-2.5 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-accent" aria-hidden="true" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* 5. Pricing & Engagement Options — SRS §4.3.5 */}
      {project.pricing_enabled && tiers.length > 0 && (
        <section aria-labelledby="pricing-heading" className="space-y-6 pt-4">
          <h2 id="pricing-heading" className="text-2xl font-bold tracking-tight text-foreground">
            {project.pricing_title || "Engagement Options"}
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {tiers.map((tier) => (
              <div
                key={tier.id}
                className={`flex flex-col rounded-2xl border p-6 ${
                  tier.is_most_popular
                    ? "border-brand-accent bg-brand-accent/5"
                    : "border-border bg-card"
                }`}
              >
                {tier.is_most_popular && (
                  <span className="mb-3 self-start rounded-full bg-brand-accent px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                    Recommended
                  </span>
                )}
                <h3 className="text-lg font-bold text-foreground">{tier.title}</h3>
                {tier.primary_price && (
                  <p className="mt-2 text-2xl font-black text-brand-accent">{tier.primary_price}</p>
                )}
                {tier.price_subtitle && (
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {toText(tier.price_subtitle)}
                  </p>
                )}
                {(tier.deliverables ?? []).length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {(tier.deliverables ?? []).map((feature) => (
                      <li key={feature} className="flex gap-2.5 text-sm text-muted-foreground">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-accent" aria-hidden="true" />
                        <span>{toText(feature)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
