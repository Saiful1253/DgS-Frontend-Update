"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import type { PublicPortfolioList, PublicPortfolioProject } from "@/types/portfolio/portfolio";
import { ALL_PROJECTS, PORTFOLIO_CATEGORIES } from "@/types/portfolio/portfolio";
import PortfolioCard from "@/components/portfolio/PortfolioCard";

/**
 * SRS §4.1 — the public portfolio grid.
 *
 * Filtering and search run client-side against the full published set. The
 * backend list endpoint deliberately does not paginate for this reason.
 */
export default function PortfolioClientView({
  projects,
  categories,
}: PublicPortfolioList) {
  // SRS §4.1: Software Engineering is the default active tab on load.
  const defaultCategory =
    categories.find((c) => /software engineering/i.test(c)) ??
    categories[0] ??
    ALL_PROJECTS;

  const [activeCategory, setActiveCategory] = useState(defaultCategory);
  const [query, setQuery] = useState("");

  // Union of the backend's categories and the seeded defaults, so a tab is
  // never missing just because the row set is empty.
  const tabs = useMemo(() => {
    const merged = new Set<string>([ALL_PROJECTS]);
    PORTFOLIO_CATEGORIES.forEach((c) => merged.add(c));
    categories.forEach((c) => merged.add(c));
    return Array.from(merged);
  }, [categories]);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();

    return projects.filter((project: PublicPortfolioProject) => {
      const matchesCategory =
        activeCategory === ALL_PROJECTS ||
        (project.category ?? "").toLowerCase() ===
          activeCategory.toLowerCase();

      if (!matchesCategory) return false;
      if (!term) return true;

      // SRS §4.1 — search targets name, challenge, solution, and tags.
      const haystack = [
        project.project_name,
        project.client_name,
        project.primary_challenge,
        project.primary_solution,
        ...(project.tags ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [projects, activeCategory, query]);

  const featured = useMemo(
    () => projects.filter((p) => p.is_featured).slice(0, 3),
    [projects]
  );

  return (
    <div className="space-y-12">
      {/* SRS §4.1 — "All Projects" preview: 3 featured per category */}
      {featured.length > 0 && (
        <section aria-labelledby="featured-heading">
          <h2
            id="featured-heading"
            className="text-2xl font-bold tracking-tight text-foreground mb-6"
          >
            Featured Work
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((project) => (
              <PortfolioCard key={project.id} project={project} />
            ))}
          </div>
        </section>
      )}

      {/* SRS §4.1 — category tabs + live search */}
      <section aria-labelledby="all-projects-heading">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <h2
            id="all-projects-heading"
            className="text-2xl font-bold tracking-tight text-foreground"
          >
            All Projects
          </h2>

          <div className="relative w-full lg:max-w-sm">
            <label htmlFor="portfolio-search" className="sr-only">
              Search portfolio projects
            </label>
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              id="portfolio-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects, challenges, tags…"
              className="w-full rounded-button border border-border bg-card py-2.5 pl-11 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div
          role="tablist"
          aria-label="Portfolio categories"
          className="mt-6 flex flex-wrap gap-2"
        >
          {tabs.map((tab) => {
            const isActive = tab === activeCategory;
            return (
              <button
                key={tab}
                role="tab"
                type="button"
                aria-selected={isActive}
                onClick={() => setActiveCategory(tab)}
                className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                  isActive
                    ? "bg-brand-accent text-white hover:bg-brand-accent-hover"
                    : "bg-muted text-muted-foreground hover:bg-brand-accent/10 hover:text-brand-accent"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {visible.length > 0 ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((project) => (
              <PortfolioCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <p className="mt-8 rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
            No projects match this filter yet.
          </p>
        )}
      </section>
    </div>
  );
}
