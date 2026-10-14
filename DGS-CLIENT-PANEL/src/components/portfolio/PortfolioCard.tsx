import Image from "next/image";
import { ArrowRight, ExternalLink } from "lucide-react";
import type { PublicPortfolioProject } from "@/types/portfolio/portfolio";

/**
 * Strip rich-text HTML to a plain snippet (SRS §4.2 renders the challenge and
 * solution summaries directly onto the card).
 */
function toSnippet(html?: string | null, maxLength = 180): string {
  if (!html) return "";
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}

interface PortfolioCardProps {
  project: PublicPortfolioProject;
  /** Rendered as a plain <article> instead of a link (used inside the detail page). */
  disableLink?: boolean;
}

export default function PortfolioCard({
  project,
  disableLink = false,
}: PortfolioCardProps) {
  const challenge = toSnippet(project.primary_challenge);
  const solution = toSnippet(project.primary_solution);
  const tags = (project.tags ?? []).slice(0, 4);

  const body = (
    <>
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {project.cover_image ? (
          <Image
            src={project.cover_image}
            alt={project.project_name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-brand-accent/10">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-accent">
              {project.category}
            </span>
          </div>
        )}

        {/* Category overlay badge — SRS §4.2 */}
        <span className="absolute left-4 top-4 bg-white/90 backdrop-blur-sm text-brand-accent text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
          {project.category}
        </span>
      </div>

      <div className="p-6 flex flex-col flex-1 gap-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-bold leading-tight text-foreground group-hover:text-brand-accent transition-colors">
            {project.project_name}
          </h3>
          {project.client_logo && (
            <Image
              src={project.client_logo}
              alt={project.client_name ?? project.project_name}
              width={64}
              height={32}
              className="shrink-0 object-contain opacity-80"
            />
          )}
        </div>

        {project.client_name && (
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
            {project.client_name}
          </p>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-brand-accent/10 text-brand-accent text-[10px] font-bold uppercase tracking-wider px-2.5 py-1"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="space-y-3 text-sm text-muted-foreground">
          {challenge && (
            <div>
              <span className="block text-[10px] font-black uppercase tracking-widest text-brand-accent mb-1">
                The Challenge
              </span>
              <p className="line-clamp-3 leading-relaxed">{challenge}</p>
            </div>
          )}
          {solution && (
            <div>
              <span className="block text-[10px] font-black uppercase tracking-widest text-brand-accent mb-1">
                The Solution
              </span>
              <p className="line-clamp-3 leading-relaxed">{solution}</p>
            </div>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-accent">
            Read Full Case Study
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </span>
          {project.live_url && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
              aria-label="Live demo available"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Live
            </span>
          )}
        </div>
      </div>
    </>
  );

  const shell = `group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 dark:border-zinc-800/80 bg-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-accent/20 hover:shadow-sm dark:bg-zinc-900/40`;

  if (disableLink) {
    return <article className={shell}>{body}</article>;
  }

  return (
    <a
      href={`/portfolio/${project.slug}`}
      className={`${shell} focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent`}
    >
      {body}
    </a>
  );
}
