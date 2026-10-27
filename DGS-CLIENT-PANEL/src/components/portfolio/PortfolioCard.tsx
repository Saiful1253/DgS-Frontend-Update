import Image from "next/image";
import { ArrowRight, MapPin, CheckCircle2, Clock } from "lucide-react";
import type { PublicPortfolioProject } from "@/types/portfolio/portfolio";

function toSnippet(html?: string | null, maxLength = 160): string {
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
  disableLink?: boolean;
}

export default function PortfolioCard({
  project,
  disableLink = false,
}: PortfolioCardProps) {
  const isCompleted = (project.project_status || "completed") === "completed";
  const locationLabel = [project.area, project.district].filter(Boolean).join(", ");

  const descSnippet = toSnippet(project.description);
  const tags = (project.tags ?? []).slice(0, 3);

  const projectUrl = project.slug.startsWith("/portfolio/")
    ? project.slug
    : `/portfolio/${project.slug}`;

  const body = (
    <>
      <div className="relative aspect-[16/10] overflow-hidden bg-muted group">
        {project.cover_image ? (
          <Image
            src={project.cover_image}
            alt={project.project_name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-brand-accent/10">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-accent">
              {project.category || "Project"}
            </span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute left-3 top-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="bg-white/95 dark:bg-zinc-900/90 backdrop-blur-sm text-brand-accent text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-xs border border-brand-accent/20">
              {project.category || "General"}
            </span>
          </div>

          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-xs flex items-center gap-1 ${
              isCompleted
                ? "bg-emerald-600 text-white"
                : "bg-sky-600 text-white"
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
        </div>

        {/* Bottom Banner Info: Location */}
        {locationLabel && (
          <div className="absolute bottom-2.5 right-3 flex items-center justify-end pointer-events-none text-[10px] font-bold text-white">
            <span className="px-2 py-0.5 rounded-md bg-zinc-950/80 backdrop-blur-xs flex items-center gap-1 truncate max-w-[180px]">
              <MapPin className="w-3 h-3 text-brand-accent shrink-0" />
              <span className="truncate">{locationLabel}</span>
            </span>
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1 gap-3.5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-bold leading-tight text-foreground group-hover:text-brand-accent transition-colors line-clamp-2">
            {project.project_name}
          </h3>
          {project.client_logo && (
            <Image
              src={project.client_logo}
              alt={project.client_name ?? project.project_name}
              width={64}
              height={28}
              className="shrink-0 object-contain opacity-80"
            />
          )}
        </div>

        {project.client_name && (
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
            {project.client_name}
          </p>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-brand-accent/10 text-brand-accent text-[10px] font-bold uppercase tracking-wider px-2 py-0.5"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Description or Challenge/Solution */}
        <div className="space-y-2 text-xs text-muted-foreground leading-relaxed flex-1">
          {descSnippet ? (
            <p className="line-clamp-3 leading-relaxed">{descSnippet}</p>
          ) : null}
        </div>

        <div className="mt-auto flex items-center justify-between pt-2 border-t border-border/50">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-accent group-hover:underline">
            View Details
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </>
  );

  const shell = `group flex h-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-accent/40 hover:shadow-md`;

  if (disableLink) {
    return <article className={shell}>{body}</article>;
  }

  return (
    <a
      href={projectUrl}
      className={`${shell} focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent`}
    >
      {body}
    </a>
  );
}
