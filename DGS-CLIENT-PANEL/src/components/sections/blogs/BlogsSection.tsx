/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Pagination } from "@/components/ui/pagination";
import BlogCard from "./BlogCard";
import { getBlogs } from "@/services/blog/blog.service";
import BlogsSkeleton from "@/components/skeletons/BlogsSkeleton";

interface BlogsSectionProps {
  blogData: any;
  currentPage: number;
  totalPages: number;
  filterParams?: { page?: string; search?: string; category?: string; sort?: string };
}

const normalizeBlogs = (src: any): any[] => {
  if (Array.isArray(src)) return src;
  if (src && Array.isArray(src.data)) return src.data;
  if (src && src.data && Array.isArray(src.data.data)) return src.data.data;
  return [];
};

function buildBlogPageUrl(
  page: number,
  filterParams?: BlogsSectionProps["filterParams"]
): string {
  const params = new URLSearchParams();
  params.set("blogPage", String(page));
  if (filterParams?.page) params.set("page", filterParams.page);
  if (filterParams?.search) params.set("search", filterParams.search);
  if (filterParams?.category) params.set("category", filterParams.category);
  if (filterParams?.sort) params.set("sort", filterParams.sort);
  return `/?${params.toString()}#blogs`;
}

export default function BlogsSection({
  blogData: initialBlogData,
  currentPage: initialCurrentPage,
  totalPages: initialTotalPages,
}: BlogsSectionProps) {
  const searchParams = useSearchParams();

  // Extract search params
  const blogPage = searchParams.get("blogPage");
  const pPage = searchParams.get("page");
  const pSearch = searchParams.get("search");
  const pCategory = searchParams.get("category");
  const pSort = searchParams.get("sort");

  // Latest search/category kept in refs so the loader effect re-runs only on
  // blogPage changes (matching existing behaviour) without stale closures.
  const pSearchRef = useRef(pSearch);
  const pCategoryRef = useRef(pCategory);
  pSearchRef.current = pSearch;
  pCategoryRef.current = pCategory;

  const [blogs, setBlogs] = useState<any[]>(normalizeBlogs(initialBlogData));
  const [currentPage, setCurrentPage] = useState<number>(initialCurrentPage);
  const [totalPages, setTotalPages] = useState<number>(initialTotalPages);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sync state with URL params on transition
  useEffect(() => {
    let active = true;

    async function loadFilteredBlogs() {
      setIsLoading(true);
      try {
        const list = await getBlogs({
          page: Number(blogPage) || 1,
          limit: 3,
          search: pSearchRef.current || undefined,
          category: pCategoryRef.current || undefined,
        });

        if (active) {
          setBlogs(normalizeBlogs(list));
          setCurrentPage(list.page || 1);
          setTotalPages(Math.ceil(list.total / list.limit));
        }
      } catch (error) {
        console.error("Failed to load blogs client-side:", error);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    if (blogPage) {
      loadFilteredBlogs();
    } else {
      setBlogs(normalizeBlogs(initialBlogData));
      setCurrentPage(initialCurrentPage);
      setTotalPages(initialTotalPages);
    }

    return () => {
      active = false;
    };
  }, [blogPage, initialBlogData, initialCurrentPage, initialTotalPages]);

  const activeFilterParams = {
    page: pPage || "",
    search: pSearch || "",
    category: pCategory || "",
    sort: pSort || "",
  };

  return (
    <section id="blogs" suppressHydrationWarning className="scroll-mt-24 pt-10 pb-20 border-t border-slate-100 bg-slate-50/30 text-slate-900">
      <div className="container mx-auto px-6">
        {/* HEADER SECTION */}
        <div className="mb-16 text-center max-w-6xl mx-auto px-6" suppressHydrationWarning>
          <span suppressHydrationWarning className="text-xs uppercase tracking-widest font-black text-brand-accent mb-3 block">
            Engineering Insights
          </span>
          <h2 suppressHydrationWarning className="text-3xl md:text-5xl font-black text-zinc-900 uppercase tracking-tight mb-4">
            Milanova Technologies Blog
          </h2>
          <p suppressHydrationWarning className="text-zinc-650 text-sm md:text-base font-medium max-w-lg mx-auto">
            Deep dives into software architecture, cloud engineering, AI, and technology strategy.
          </p>
        </div>

        {/* Dynamic Card Area */}
        <div className={`transition-opacity duration-300 ${isLoading ? "opacity-80" : "opacity-100"}`}>
          {isLoading ? (
            <BlogsSkeleton gridOnly />
          ) : blogs.length === 0 ? (
            <div className="flex min-h-[200px] items-center justify-center text-muted-foreground bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
              No blogs found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.isArray(blogs) && blogs.map((blog: any) => (
                <BlogCard key={blog.id} blog={blog} />
              ))}
            </div>
          )}
        </div>

        {/* PAGINATION SECTION - ALWAYS VISIBLE, but disabled during load */}
        <div className={`mt-12 transition-opacity duration-300 ${isLoading ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            buildPageUrl={(page) => buildBlogPageUrl(page, activeFilterParams)}
          />
        </div>
      </div>
    </section>
  );
}
