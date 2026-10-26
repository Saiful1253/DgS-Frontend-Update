/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  X,
  
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppPagination } from "@/components/common/app-pagination";
import { BlogPost } from "@/types/blog";
import {
  createBlog,
  updateBlog,
  updateBlogSeo,
  updateBlogStatus,
} from "@/services/blog/blog.service";
import AddBlogModal from "./modals/article/create-blog-modal";
import BlogCard from "./blog-card";

interface BlogsManagerProps {
  initialBlogs: BlogPost[];
}

export default function BlogsManager({ initialBlogs }: BlogsManagerProps) {
  const router = useRouter();
  const [blogs, setBlogs] = useState<BlogPost[]>(initialBlogs);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setBlogs(initialBlogs);
  }, [initialBlogs]);

  // Search & Filter State
  const [searchDraft, setSearchDraft] = useState("");
  const [statusDraft, setStatusDraft] = useState("all");
  const [appliedFilters, setAppliedFilters] = useState({ search: "", status: "all" });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  const handleApplyFilters = () => {
    setAppliedFilters({ search: searchDraft.trim(), status: statusDraft });
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchDraft("");
    setStatusDraft("all");
    setAppliedFilters({ search: "", status: "all" });
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(
    appliedFilters.search ||
    appliedFilters.status !== "all" ||
    searchDraft.trim() ||
    statusDraft !== "all"
  );

  const isFilterPending =
    searchDraft.trim() !== appliedFilters.search ||
    statusDraft !== appliedFilters.status;

  const totalPosts = blogs.length;
  const publishedCount = blogs.filter((b) => b.status === "published").length;
  const draftCount = blogs.filter((b) => b.status === "draft").length;
  const scheduledCount = blogs.filter((b) => b.status === "scheduled").length;
  const reviewCount = blogs.filter((b) => b.status === "internal_review").length;

  const filteredBlogs = useMemo(() => {
    const q = appliedFilters.search.toLowerCase();
    return blogs.filter((b) => {
      const matchesStatus =
        appliedFilters.status === "all"
          ? true
          : appliedFilters.status === "featured"
          ? Boolean(b.featured_status)
          : b.status === appliedFilters.status;
      const matchesSearch =
        !q ||
        (b.title || "").toLowerCase().includes(q) ||
        (b.slug || "").toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [blogs, appliedFilters]);

  const totalItems = filteredBlogs.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIdx = (validCurrentPage - 1) * pageSize;
  const paginatedBlogs = filteredBlogs.slice(startIdx, startIdx + pageSize);

  const refreshBlogs = async () => {
    const { listBlogs } = await import("@/services/blog/blog.service");
    const res = await listBlogs(1, 100);
    if (res.success && res.data?.data) setBlogs(res.data.data);
  };

  const handleAddBlog = async (formData: FormData, seoData?: any): Promise<boolean> => {
    if (busy) return false;
    setBusy(true);
    const loading = toast.loading("Creating blog post...");
    try {
      const res = await createBlog(formData);
      if (res.success) {
        if (seoData && res.data?.id) {
          await updateBlogSeo(res.data.id, seoData);
        }
        toast.success(res.message || "Blog post created", { id: loading });
        await refreshBlogs();
        router.refresh();
        return true;
      }
      toast.error(res.message || "Failed to create blog", { id: loading });
      return false;
    } catch (err: any) {
      toast.error(err.message || "An error occurred", { id: loading });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateBlog = async (id: string | number, formData: FormData): Promise<boolean> => {
    if (busy) return false;
    setBusy(true);
    const loading = toast.loading("Updating blog post...");
    try {
      const res = await updateBlog(id, formData);
      if (res.success) {
        toast.success(res.message || "Blog post updated", { id: loading });
        const dataJson = formData.get("data");
        if (typeof dataJson === "string") {
          try {
            const parsed = JSON.parse(dataJson);
            setBlogs((prev) =>
              prev.map((b) => (String(b.id) === String(id) ? { ...b, ...parsed } : b))
            );
          } catch {
            /* ignore */
          }
        }
        await refreshBlogs();
        router.refresh();
        return true;
      }
      toast.error(res.message || "Failed to update blog", { id: loading });
      return false;
    } catch (err: any) {
      toast.error(err.message || "An error occurred", { id: loading });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleStatusChange = async (id: string | number, status: string, publishAt?: string): Promise<boolean> => {
    if (busy) return false;
    setBusy(true);
    const loading = toast.loading(`Moving blog to "${status}"...`);
    try {
      const res = await updateBlogStatus(String(id), status, publishAt);
      if (res.success) {
        toast.success(res.message || "Blog status updated", { id: loading });
        setBlogs((prev) =>
          prev.map((b) =>
            String(b.id) === String(id)
              ? {
                  ...b,
                  status: status as any,
                  scheduled_at: status === "scheduled" && publishAt ? publishAt : null,
                }
              : b
          )
        );
        await refreshBlogs();
        router.refresh();
        return true;
      }
      toast.error(res.message || "Failed to update blog status", { id: loading });
      return false;
    } catch (err: any) {
      toast.error(err.message || "An error occurred", { id: loading });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleToggleFeatured = async (id: string | number, nextFeatured: boolean): Promise<boolean> => {
    const loading = toast.loading(nextFeatured ? "Featuring article..." : "Unfeaturing article...");
    try {
      const { toggleBlogFeatured } = await import("@/services/blog/blog.service");
      const res = await toggleBlogFeatured(id, nextFeatured);
      if (res.success) {
        toast.success(nextFeatured ? "Article is now featured" : "Article unfeatured", { id: loading });
        setBlogs((prev) =>
          prev.map((b) => (String(b.id) === String(id) ? { ...b, featured_status: nextFeatured } : b))
        );
        router.refresh();
        return true;
      }
      toast.error(res.message || "Failed to update featured status", { id: loading });
      return false;
    } catch (err: any) {
      toast.error(err?.message || "An error occurred", { id: loading });
      return false;
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap text-[10px] sm:text-xs font-bold tracking-wider text-primary uppercase mb-1">
            <span>ADMIN CMS</span>
            <span>•</span>
            <span className="truncate">MODULE 4: BLOGS & ARTICLES MANAGER</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight break-words">
            Blogs & Articles Manager
          </h1>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
          <AddBlogModal onAddBlog={handleAddBlog} />
        </div>
      </div>

      {/* 2. Purpose Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h2 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">
          PURPOSE
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed max-w-5xl">
          Creates and manages editorial content, engineering news, technical publications,
          featured images, and rich-text article bodies served to the public blogs listing.
        </p>
      </div>

      {/* 3. Stat Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Articles
          </span>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{totalPosts}</div>
          <p className="text-xs text-slate-500 font-medium">Published in catalogue</p>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Published
          </span>
          <div className="text-3xl font-extrabold text-emerald-600 tracking-tight">{publishedCount}</div>
          <p className="text-xs text-slate-500 font-medium">Live on website</p>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Draft Posts
          </span>
          <div className="text-3xl font-extrabold text-amber-600 tracking-tight">{draftCount}</div>
          <p className="text-xs text-slate-500 font-medium">In preparation</p>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Scheduled / Review
          </span>
          <div className="text-3xl font-extrabold text-violet-600 tracking-tight">{scheduledCount + reviewCount}</div>
          <p className="text-xs text-slate-500 font-medium">{scheduledCount} scheduled · {reviewCount} in review</p>
        </div>
      </div>

      {/* 4. Filter & Search Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
          {/* Status Dropdown */}
          <div className="w-full sm:w-52 shrink-0 space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center h-4">
              Status Filter :
            </label>
            <div className="relative">
              <select
                value={statusDraft}
                onChange={(e) => setStatusDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleApplyFilters();
                  }
                }}
                className="w-full h-10 pl-3 pr-8 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 shadow-2xs appearance-none focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer truncate"
              >
                <option value="all">All Articles</option>
                <option value="featured">⭐ Featured Only</option>
                <option value="published">Published Only</option>
                <option value="scheduled">Scheduled Only</option>
                <option value="internal_review">Internal Review Only</option>
                <option value="draft">Draft Only</option>
                <option value="archived">Archived Only</option>
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </div>
          </div>

          {/* Search Input */}
          <div className="flex-1 min-w-[220px] space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 h-4">
              <Search className="w-3.5 h-3.5 text-primary" />
              <span>Search Articles :</span>
            </label>
            <div className="relative">
              <Input
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleApplyFilters();
                  }
                }}
                placeholder="Search by title or slug..."
                className="h-10 text-xs font-semibold pl-3.5 pr-8 border-slate-200 w-full bg-white shadow-2xs"
              />
              {searchDraft && (
                <button
                  type="button"
                  onClick={() => setSearchDraft("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                  title="Clear search input"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full lg:w-auto flex items-center gap-2 shrink-0">
            <div className="hidden lg:block h-4" />
            <div className="flex items-center gap-2 w-full">
              <Button
                type="button"
                onClick={handleApplyFilters}
                className={cn(
                  "h-10 px-4 bg-primary text-white hover:bg-primary/90 text-xs font-bold gap-1.5 shadow-xs transition-all w-full lg:w-auto justify-center flex-1 lg:flex-initial",
                  isFilterPending && "ring-2 ring-primary/40 ring-offset-1"
                )}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search</span>
              </Button>
              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClearFilters}
                  className="h-10 px-3 text-xs font-semibold bg-slate-100 hover:bg-slate-200 border-transparent text-slate-700 gap-1 transition-colors shrink-0 whitespace-nowrap"
                  title="Reset all filters"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Blogs Grid or Empty State */}
      {paginatedBlogs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-white space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No blog posts found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {hasActiveFilters
              ? "No articles match your current search and filter criteria. Try adjusting or clearing your filters."
              : "No articles have been created yet. Click below to publish your first blog post."}
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            {hasActiveFilters && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="border-slate-200 text-xs font-semibold"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                <span>Clear Filters</span>
              </Button>
            )}
            {(
              <AddBlogModal onAddBlog={handleAddBlog} />
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedBlogs.map((blog) => (
              <BlogCard
                key={blog.id}
                blog={blog}
                onUpdate={handleUpdateBlog}
                onStatusChange={handleStatusChange}
                onToggleFeatured={handleToggleFeatured}
                onDeleted={async () => {
                  await refreshBlogs();
                  router.refresh();
                }}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          <AppPagination
            page={validCurrentPage}
            totalPages={totalPages}
            total={totalItems}
            itemLabel="blog posts"
            appliedPath={() => "#"}
            onPageChange={(p) => setCurrentPage(p)}
            pageSize={pageSize}
            onPageSizeChange={(v) => {
              setPageSize(v);
              setCurrentPage(1);
            }}
            pageSizeOptions={[6, 9, 12, 24]}
          />
        </div>
      )}
    </div>
  );
}