"use client";

import { useMemo, useState } from "react";
import { Search, X, Filter, Loader2, MapPin } from "lucide-react";
import type { PublicPortfolioList, PublicPortfolioProject } from "@/types/portfolio/portfolio";
import { ALL_PROJECTS, PORTFOLIO_CATEGORIES } from "@/types/portfolio/portfolio";
import PortfolioCard from "@/components/portfolio/PortfolioCard";
import {
  BANGLADESH_DISTRICTS,
  PROJECT_STATUSES,
} from "@/lib/bangladesh-locations";
import { listPublicPortfolios } from "@/services/portfolio/portfolio.service";

const PAGE_SIZE = 20;

export default function PortfolioClientView({
  projects: initialProjects,
  categories,
  meta: initialMeta,
}: PublicPortfolioList) {
  const [projects, setProjects] = useState<PublicPortfolioProject[]>(initialProjects || []);
  const [activeCategory, setActiveCategory] = useState<string>(ALL_PROJECTS);
  const [activeStatus, setActiveStatus] = useState<string>("all");
  const [activeDistrict, setActiveDistrict] = useState<string>("all");
  const [query, setQuery] = useState<string>("");

  const [page, setPage] = useState<number>(initialMeta?.page || 1);
  const [hasMore, setHasMore] = useState<boolean>(
    initialMeta ? initialMeta.page < initialMeta.totalPages : initialProjects.length >= PAGE_SIZE
  );
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  // Unified tabs
  const tabs = useMemo(() => {
    const merged = new Set<string>([ALL_PROJECTS]);
    PORTFOLIO_CATEGORIES.forEach((c) => merged.add(c));
    categories.forEach((c) => merged.add(c));
    return Array.from(merged);
  }, [categories]);

  // Filter items in memory for instant reactivity across loaded items
  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();

    return projects.filter((project: PublicPortfolioProject) => {
      // 1. Category Filter
      if (activeCategory !== ALL_PROJECTS) {
        if ((project.category ?? "").toLowerCase() !== activeCategory.toLowerCase()) {
          return false;
        }
      }

      // 2. Status Filter
      if (activeStatus !== "all") {
        if ((project.project_status || "completed") !== activeStatus) {
          return false;
        }
      }

      // 4. District Filter
      if (activeDistrict !== "all") {
        if ((project.district || "").toLowerCase() !== activeDistrict.toLowerCase()) {
          return false;
        }
      }

      // 5. Search Filter
      if (!term) return true;

      const haystack = [
        project.project_name,
        project.client_name,
        project.district,
        project.area,
        project.address,
        project.description,
        ...(project.tags ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [projects, activeCategory, activeStatus, activeDistrict, query]);

  // Featured Work Highlight (Max 4 cards)
  const featured = useMemo(
    () => projects.filter((p) => p.is_featured).slice(0, 4),
    [projects]
  );

  const hasActiveFilters =
    activeCategory !== ALL_PROJECTS ||
    activeStatus !== "all" ||
    activeDistrict !== "all" ||
    Boolean(query.trim());

  const handleResetFilters = () => {
    setActiveCategory(ALL_PROJECTS);
    setActiveStatus("all");
    setActiveDistrict("all");
    setQuery("");
  };

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);

    try {
      const nextPage = page + 1;
      const res = await listPublicPortfolios(
        activeCategory === ALL_PROJECTS ? undefined : activeCategory,
        query.trim() || undefined,
        undefined,
        nextPage,
        PAGE_SIZE,
        activeStatus === "all" ? undefined : activeStatus,
        undefined,
        activeDistrict === "all" ? undefined : activeDistrict
      );

      if (res.success && res.data) {
        const payload = res.data as PublicPortfolioList;
        const newItems = payload.projects || payload.data || [];
        if (newItems.length > 0) {
          setProjects((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const fresh = newItems.filter((p: PublicPortfolioProject) => !existingIds.has(p.id));
            return [...prev, ...fresh];
          });
          setPage(nextPage);
        }
        if (payload.meta) {
          setHasMore(nextPage < payload.meta.totalPages);
        } else {
          setHasMore(newItems.length >= PAGE_SIZE);
        }
      } else {
        setHasMore(false);
      }
    } catch {
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* 1. Featured Work Highlights (4x1 preview) */}
      {featured.length > 0 && !hasActiveFilters && (
        <section aria-labelledby="featured-heading" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-black uppercase tracking-widest text-brand-accent">
                Highlights
              </span>
              <h2
                id="featured-heading"
                className="text-2xl font-bold tracking-tight text-foreground"
              >
                Featured Engineering Showcase
              </h2>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((project) => (
              <PortfolioCard key={project.id} project={project} />
            ))}
          </div>
        </section>
      )}

      {/* 2. Comprehensive Filter Engine */}
      <section aria-labelledby="all-projects-heading" className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-border pb-6">
          <div>
            <h2
              id="all-projects-heading"
              className="text-2xl font-bold tracking-tight text-foreground"
            >
              All Projects Catalogue
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Showing {visible.length} {visible.length === 1 ? "project" : "projects"}
              {hasActiveFilters ? " matching your active filters" : ""}
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full lg:max-w-md">
            <label htmlFor="portfolio-search" className="sr-only">
              Search portfolio projects
            </label>
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              id="portfolio-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, location, client, tags, description…"
              className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-9 text-xs font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-accent shadow-xs"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-card/60 p-4 rounded-2xl border border-border/80">

          {/* Project Status Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Project Status
            </label>
            <select
              value={activeStatus}
              onChange={(e) => setActiveStatus(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-brand-accent cursor-pointer"
            >
              <option value="all">All Statuses</option>
              {PROJECT_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Location / District Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3 text-brand-accent" />
              <span>District / Location</span>
            </label>
            <select
              value={activeDistrict}
              onChange={(e) => setActiveDistrict(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-brand-accent cursor-pointer"
            >
              <option value="all">All Bangladesh Locations</option>
              {BANGLADESH_DISTRICTS.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters Button */}
          <div className="flex items-end">
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={handleResetFilters}
                className="w-full h-9 px-3 rounded-lg text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 flex items-center justify-center gap-1.5 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            ) : (
              <div className="w-full h-9 px-3 rounded-lg text-xs font-medium text-muted-foreground/60 flex items-center justify-center border border-dashed border-border/60">
                Filters Active: None
              </div>
            )}
          </div>
        </div>

        {/* Category Pill Tabs */}
        <div
          role="tablist"
          aria-label="Portfolio categories"
          className="flex flex-wrap gap-2 pt-2"
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
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                  isActive
                    ? "bg-brand-accent text-white shadow-xs"
                    : "bg-muted text-muted-foreground hover:bg-brand-accent/10 hover:text-brand-accent"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* 3. Responsive 4-Column Grid */}
        {visible.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((project) => (
              <PortfolioCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border py-20 text-center space-y-3">
            <Filter className="w-8 h-8 text-muted-foreground mx-auto opacity-50" />
            <h3 className="text-base font-bold text-foreground">No projects found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No projects match your current filter settings. Try clearing some filters or searching for another keyword.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-accent text-white text-xs font-bold uppercase tracking-wider shadow-xs hover:bg-brand-accent/90"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear All Filters</span>
              </button>
            )}
          </div>
        )}

        {/* 4. Load More / Infinite Pagination Button */}
        {hasMore && visible.length >= PAGE_SIZE && (
          <div className="pt-8 text-center">
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="px-6 py-3 rounded-xl bg-card border border-border text-foreground hover:border-brand-accent/40 hover:text-brand-accent text-xs font-black uppercase tracking-wider shadow-xs inline-flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-brand-accent" />
                  <span>Loading More Projects…</span>
                </>
              ) : (
                <span>Load More Projects</span>
              )}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
