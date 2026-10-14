/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Rows3 } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import BlogCard from "./BlogCard";
import BlogsSkeleton from "@/components/skeletons/BlogsSkeleton";
import { getBlogs } from "@/services/blog/blog.service";
import type { Blog } from "@/types/cms/blog";

interface BlogsListingProps {
  initialBlogs: Blog[];
  currentPage: number;
  totalPages: number;
  initialSearch: string;
}

function buildPageUrl(page: number, search: string, category: string): string {
  const params = new URLSearchParams();
  params.set("page", String(page));
  if (search) params.set("search", search);
  if (category) params.set("category", category);
  return `/blogs?${params.toString()}`;
}

export default function BlogsListing({
  initialBlogs,
  currentPage: initialCurrentPage,
  totalPages: initialTotalPages,
  initialSearch,
}: BlogsListingProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = searchParams.get("page");
  const search = searchParams.get("search");
  const category = searchParams.get("category");

  const [blogs, setBlogs] = useState<Blog[]>(initialBlogs);
  const [currentPage, setCurrentPage] = useState<number>(initialCurrentPage);
  const [totalPages, setTotalPages] = useState<number>(initialTotalPages);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [query, setQuery] = useState<string>(initialSearch);
  const [knownCategories, setKnownCategories] = useState<Set<string>>(
    () => new Set(initialBlogs.map((b) => b.category).filter(Boolean) as string[])
  );
  const categoriesRef = useRef(knownCategories);

  const activeSearch = search ?? "";
  const activeCategory = category ?? "";

  useEffect(() => {
    let active = true;

    async function load() {
      setIsLoading(true);
      try {
        const list = await getBlogs({
          page: Number(page) || 1,
          limit: 9,
          search: activeSearch || undefined,
          category: activeCategory || undefined,
        });
        if (active) {
          setBlogs(list.data || []);
          setCurrentPage(list.page || 1);
          setTotalPages(list.totalPages || Math.max(1, Math.ceil((list.total || 0) / (list.limit || 9))));
          const cats = new Set(categoriesRef.current);
          (list.data || []).forEach((b: any) => b?.category && cats.add(b.category));
          categoriesRef.current = cats;
          setKnownCategories(new Set(cats));
        }
      } catch (err) {
        console.error("Failed to load blogs:", err);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
     
  }, [page, activeSearch, activeCategory]);

  const categories = useMemo(() => Array.from(knownCategories).sort(), [knownCategories]);

  const applyFilter = (nextSearch: string, nextCategory: string, nextPage: number) => {
    router.push(buildPageUrl(nextPage, nextSearch.trim(), nextCategory), { scroll: true });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilter(query, activeCategory, 1);
  };

  return (
    <section className="text-slate-900 bg-slate-50/50 min-h-screen">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-primary via-primary/90 to-[#003b52] text-white">
        <div className="container mx-auto px-6 py-16 md:py-24">
          <div className="max-w-4xl space-y-4">
            <span className="inline-flex items-center rounded-full bg-white/10 border border-white/20 text-white text-[11px] font-bold uppercase tracking-widest px-3 py-1">
              Milanova Technologies Blog
            </span>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight leading-tight">
              Engineering Insights
            </h1>
            <p className="text-white/85 text-sm md:text-base font-medium max-w-2xl">
              Practical articles on software architecture, cloud infrastructure, AI, DevOps, and
              technology strategy — written by our engineers, for builders.
            </p>

            {/* Search + Category Filter */}
            <div className="flex flex-col md:flex-row md:items-center gap-3 pt-4">
              <form
                onSubmit={handleSearch}
                className="flex items-center gap-2 bg-white/95 rounded-full pl-4 pr-1.5 py-1.5 shadow-lg w-full md:w-96"
              >
                <Search size={16} className="text-slate-400 shrink-0" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search articles..."
                  className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none min-w-0"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary text-white text-xs font-bold uppercase tracking-wider px-4 h-9 hover:bg-primary-hover transition-colors shrink-0"
                >
                  Search
                </button>
              </form>

              <select
                value={activeCategory}
                onChange={(e) => applyFilter(activeSearch, e.target.value, 1)}
                className="h-12 rounded-full border border-white/30 bg-white/10 backdrop-blur text-white text-sm font-semibold px-4 outline-none focus:ring-2 focus:ring-white/40 cursor-pointer"
              >
                <option value="" className="text-slate-700">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c} className="text-slate-700">{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-12 md:py-16">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
            <Rows3 size={14} className="text-brand-accent" />
            <span>
              {activeSearch || activeCategory ? "Filtered Articles" : "Latest Articles"}
            </span>
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Page {currentPage} of {totalPages}
          </span>
        </div>

        {isLoading ? (
          <BlogsSkeleton gridOnly />
        ) : blogs.length === 0 ? (
          <div className="flex min-h-[240px] items-center justify-center text-muted-foreground bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
            <div className="text-center space-y-2">
              <p className="text-sm font-bold uppercase tracking-wider">No articles found</p>
              <p className="text-xs">Try a different search term or category.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog) => (
              <BlogCard key={blog.id} blog={blog} />
            ))}
          </div>
        )}

        <div className="mt-12">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            buildPageUrl={(page) => buildPageUrl(page, activeSearch, activeCategory)}
          />
        </div>
      </div>
    </section>
  );
}