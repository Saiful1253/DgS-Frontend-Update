import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import type { PublicPortfolioProject } from "@/types/portfolio/portfolio";
import PortfolioCard from "@/components/portfolio/PortfolioCard";

interface FeaturedPortfolioSectionProps {
  projects: PublicPortfolioProject[];
}

export default function FeaturedPortfolioSection({
  projects,
}: FeaturedPortfolioSectionProps) {
  if (!projects || projects.length === 0) {
    return null;
  }

  // Enforce max 8 cards in 4x2 responsive grid
  const displayProjects = projects.slice(0, 8);

  return (
    <section className="py-20 md:py-28 border-b border-border bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-accent/10 border border-brand-accent/20 text-brand-accent text-xs font-black uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Engineered Projects</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground">
              Featured Case Studies &amp; Installations
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Explore our turnkey LPG reticulation, industrial gas infrastructure, and
              commercial pipeline installations executed across Bangladesh.
            </p>
          </div>

          <Link
            href="/portfolio"
            className="inline-flex items-center gap-2 self-start md:self-end px-5 py-3 rounded-xl bg-card border border-border text-foreground hover:border-brand-accent hover:text-brand-accent text-xs font-black uppercase tracking-wider shadow-xs transition-all group shrink-0"
          >
            <span>View More Projects</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>

        {/* 4x2 Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayProjects.map((project) => (
            <PortfolioCard key={project.id} project={project} />
          ))}
        </div>

        {/* Mobile View More link */}
        <div className="text-center pt-4 md:hidden">
          <Link
            href="/portfolio"
            className="inline-flex items-center justify-center gap-2 w-full px-6 py-3.5 rounded-xl bg-brand-accent text-white text-xs font-black uppercase tracking-wider shadow-sm"
          >
            <span>View All {projects.length}+ Projects</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
