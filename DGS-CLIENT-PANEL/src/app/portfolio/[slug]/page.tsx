import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { getPublicPortfolioBySlug } from "@/services/portfolio/portfolio.service";
import type { PortfolioChallenge } from "@/types/portfolio/portfolio";

export const revalidate = 3600;

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublicPortfolioBySlug(slug);
  if (!project) return { title: "Case Study Not Found | MilanoVA Technologies" };

  return {
    title: `${project.project_name} Case Study | MilanoVA Technologies`,
    description:
      project.primary_challenge?.replace(/<[^>]*>/g, "").slice(0, 160) ??
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

/** SRS §4.3.2 — tab-wise media view over the challenge screenshots. */
function ChallengeScreenshots({ challenges }: { challenges: PortfolioChallenge[] }) {
  const withImages = challenges.filter((c) => c.supporting_image);
  if (withImages.length === 0) return null;

  return (
    <section aria-labelledby="screens-heading" className="space-y-4">
      <h2 id="screens-heading" className="text-2xl font-bold tracking-tight text-foreground">
        Screens &amp; Diagrams
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {withImages.map((c) => (
          <figure key={c.id} className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="relative aspect-[16/10] bg-muted">
              <Image
                src={c.supporting_image as string}
                alt={c.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            {c.title && (
              <figcaption className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {c.title}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </section>
  );
}

export default async function PortfolioDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const project = await getPublicPortfolioBySlug(slug);

  if (!project) notFound();

  const challenges = [...(project.challenges ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  );
  const tiers = [...(project.pricing_tiers ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  );

  // SRS §4.3.3 — split each entry into bullet points for the standard-vs-ours
  // comparison and the challenge list.
  const toPoints = (value?: string | null): string[] =>
    toText(value)
      .split(/\n|(?<=\.)\s+/)
      .map((line) => line.replace(/^[-•*]\s*/, "").trim())
      .filter(Boolean);

  return (
    <article className="mx-auto max-w-5xl px-4 py-12 md:px-10 md:py-16">
      <Link
        href="/portfolio"
        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-accent hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Portfolio
      </Link>

      <header className="mt-8 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-brand-accent/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-brand-accent">
            {project.category}
          </span>
          {project.client_name && (
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {project.client_name}
            </span>
          )}
        </div>

        <h1 className="text-4xl font-black tracking-tight text-foreground md:text-5xl">
          {project.project_name}
        </h1>

        {(project.tags ?? []).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {(project.tags ?? []).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-muted px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {project.cover_image && (
        <div className="relative mt-8 aspect-[21/9] overflow-hidden rounded-2xl bg-muted">
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

      {/* Project URLs — SRS §4.3 header */}
      {(project.live_url || project.app_store_url || project.play_store_url) && (
        <div className="mt-6 flex flex-wrap gap-3">
          {project.live_url && (
            <a
              href={project.live_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-button bg-brand-accent px-5 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-brand-accent-hover"
            >
              Live Demo
              <ArrowRight className="h-4 w-4" />
            </a>
          )}
          {project.app_store_url && (
            <a
              href={project.app_store_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-button border border-border px-5 py-3 text-xs font-bold uppercase tracking-wider text-foreground hover:border-brand-accent hover:text-brand-accent"
            >
              App Store
            </a>
          )}
          {project.play_store_url && (
            <a
              href={project.play_store_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-button border border-border px-5 py-3 text-xs font-bold uppercase tracking-wider text-foreground hover:border-brand-accent hover:text-brand-accent"
            >
              Play Store
            </a>
          )}
        </div>
      )}

      {/* 1. Primary challenge & solution — SRS §4.3.1 */}
      {(project.primary_challenge || project.primary_solution) && (
        <section className="mt-14 grid gap-8 md:grid-cols-2">
          {project.primary_challenge && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-xs font-black uppercase tracking-widest text-brand-accent">
                The Challenge
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {toText(project.primary_challenge)}
              </p>
            </div>
          )}
          {project.primary_solution && (
            <div className="rounded-2xl border border-brand-accent/20 bg-brand-accent/5 p-6">
              <h2 className="text-xs font-black uppercase tracking-widest text-brand-accent">
                The Solution
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {toText(project.primary_solution)}
              </p>
            </div>
          )}
        </section>
      )}

      {/* 2. Tab-wise media view — SRS §4.3.2 */}
      <div className="mt-14">
        <ChallengeScreenshots challenges={challenges} />
      </div>

      {/* 3. Secondary challenges — SRS §4.3.3 */}
      {challenges.length > 0 && (
        <section aria-labelledby="challenges-heading" className="mt-14 space-y-6">
          <h2 id="challenges-heading" className="text-2xl font-bold tracking-tight text-foreground">
            Technical Challenges Solved
          </h2>
          {challenges.map((c, i) => (
            <div
              key={c.id}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Challenge {i + 1}
              </p>
              <h3 className="mt-1 text-lg font-bold text-foreground">
                {c.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {toText(c.challenge_description)}
              </p>
              {c.solution_provided && (
                <div className="mt-4 border-l-2 border-brand-accent pl-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-brand-accent">
                    Solution
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {toText(c.solution_provided)}
                  </p>
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* 4. Benchmark comparison — SRS §4.3.4, conditional on the flag */}
      {project.comparison_enabled && (
        <section aria-labelledby="comparison-heading" className="mt-14 space-y-6">
          <div>
            <h2 id="comparison-heading" className="text-2xl font-bold tracking-tight text-foreground">
              {project.comparison_title || "Industry Standard vs. Our Approach"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
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

      {/* 5. Pricing & engagement — SRS §4.3.5, conditional on the flag */}
      {project.pricing_enabled && tiers.length > 0 && (
        <section aria-labelledby="pricing-heading" className="mt-14 space-y-6">
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
