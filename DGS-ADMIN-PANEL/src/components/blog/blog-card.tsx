"use client";

import React, { useState, useEffect } from "react";
import { BlogPost } from "@/types/blog";
import { Button } from "@/components/ui/button";
import { Pencil, Calendar, Star, Clock3, Hash, Trash2 } from "lucide-react";
import { toast } from "sonner";
import EditBlogModal from "./modals/article/edit-blog-modal";
import DeleteBlogDialog from "./modals/article/delete-blog-dialog";
import BlogStatusMenu from "./blog-status-menu";
import { AuthorAvatar } from "./author-search";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Link from "next/link";

interface BlogCardProps {
  blog: BlogPost;
  hasManageAccess: boolean;
  onUpdate: (id: string | number, formData: FormData) => Promise<boolean>;
  onDeleted?: () => void | Promise<void>;
  canPublish?: boolean;
  onStatusChange?: (id: string | number, status: string, publishAt?: string) => Promise<boolean>;
  onToggleFeatured?: (id: string | number, nextFeatured: boolean) => Promise<boolean>;
}

export default function BlogCard({
  blog,
  hasManageAccess,
  onUpdate,
  onDeleted,
  canPublish = false,
  onStatusChange,
  onToggleFeatured,
}: BlogCardProps) {
  const [isFeatured, setIsFeatured] = useState(Boolean(blog.featured_status));
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    setIsFeatured(Boolean(blog.featured_status));
  }, [blog.featured_status]);

  const handleToggleFeatured = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (toggling) return;
    const next = !isFeatured;
    setIsFeatured(next);
    setToggling(true);
    try {
      if (onToggleFeatured) {
        const ok = await onToggleFeatured(blog.id, next);
        if (!ok) setIsFeatured(!next);
      } else {
        const { toggleBlogFeatured } = await import("@/services/blog/blog.service");
        const res = await toggleBlogFeatured(blog.id, next);
        if (res.success) {
          toast.success(next ? "Article marked as featured" : "Article unfeatured");
          onUpdate(blog.id, new FormData());
        } else {
          setIsFeatured(!next);
          toast.error(res.message || "Failed to update featured status");
        }
      }
    } catch {
      setIsFeatured(!next);
    } finally {
      setToggling(false);
    }
  };

  const contentFallback = blog.content
    ?.replace(/<[^>]*>/g, "")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&[a-zA-Z0-9#]+;/g, " ")
    .trim();

  const authors = [
    blog.primary_author
      ? { name: blog.primary_author.name, avatar_url: blog.primary_author.avatar_url }
      : (blog.primary_author_name ? { name: blog.primary_author_name, avatar_url: null } : null),
    ...((blog.co_authors || []).map((c) => ({
      name: c.name,
      avatar_url: c.avatar_url || null,
      designation: c.designation,
    }))),
  ].filter((a): a is { name: string; avatar_url: string | null; designation?: string | undefined } => Boolean(a));

  const showScheduledChip = blog.status === "scheduled" && blog.scheduled_at;

  return (
    <div className="group relative bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-2xs hover:shadow-lg hover:border-slate-300 transition-all duration-300 flex flex-col h-full">
      {/* 1. Main Clickable Area for the card body */}
      <Link
        href={`/blogs/${blog.id}`}
        className="absolute inset-0 z-10"
        aria-label={`View details for ${blog.title}`}
      />

      {/* 2. Cover Image Section */}
      <div className="relative aspect-[16/10] w-full bg-slate-100 overflow-hidden shrink-0">
        {blog.featured_image_url ? (
          <Image
            src={blog.featured_image_url}
            alt={blog.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl font-black text-slate-300 bg-gradient-to-br from-slate-50 to-slate-200 select-none">
            {blog.title.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Top Vignette for Contrast */}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/40 via-black/10 to-transparent pointer-events-none" />

        {/* Status + Featured Badges */}
        <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5 flex-wrap">
          {hasManageAccess && onStatusChange ? (
            <BlogStatusMenu
              status={blog.status}
              canPublish={canPublish}
              onSelect={(s, at) => onStatusChange(blog.id, s, at)}
              triggerClassName="bg-white/95 backdrop-blur-md border-slate-200/90 shadow-sm"
              align="start"
            />
          ) : (
            <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border bg-white/95 backdrop-blur-md shadow-sm text-slate-700">
              {blog.status}
            </span>
          )}
          {hasManageAccess ? (
            <button
              type="button"
              onClick={handleToggleFeatured}
              disabled={toggling}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer",
                isFeatured
                  ? "bg-amber-500 hover:bg-amber-600 text-white ring-2 ring-amber-300/40"
                  : "bg-white/95 hover:bg-amber-50 text-slate-500 hover:text-amber-600 border border-slate-200/90"
              )}
              title={isFeatured ? "Article is featured (click to unfeature)" : "Click to mark as featured"}
            >
              <Star className={cn("w-2.5 h-2.5", isFeatured ? "fill-white text-white" : "text-amber-500")} />
              <span>{isFeatured ? "Featured" : "Feature"}</span>
            </button>
          ) : isFeatured ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 text-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm">
              <Star className="w-2.5 h-2.5 fill-white" /> Featured
            </span>
          ) : null}
          {showScheduledChip && (
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-600 text-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm">
              <Clock3 className="w-2.5 h-2.5" /> {format(new Date(blog.scheduled_at!), "MMM d, HH:mm")}
            </span>
          )}
        </div>

        {/* Action Buttons Top-Right */}
        {hasManageAccess && (
          <div
            className="absolute top-3 right-3 z-30 flex items-center gap-1 bg-white/95 backdrop-blur-md rounded-lg p-1 border border-slate-200/70 shadow-sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={toggling}
              onClick={handleToggleFeatured}
              className={cn(
                "h-7 w-7 rounded-md cursor-pointer transition-colors",
                isFeatured
                  ? "text-amber-600 bg-amber-50 hover:bg-amber-100 hover:text-amber-700"
                  : "text-slate-400 hover:text-amber-500 hover:bg-amber-50"
              )}
              title={isFeatured ? "Remove from featured articles" : "Mark as featured article"}
            >
              <Star className={cn("h-3.5 w-3.5", isFeatured ? "fill-amber-400 text-amber-500" : "text-slate-400")} />
            </Button>
            <EditBlogModal
              blog={blog}
              onUpdateBlog={onUpdate}
              disabled={!hasManageAccess}
              canPublish={canPublish}
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-slate-600 hover:text-primary hover:bg-primary/10 rounded-md cursor-pointer"
                  title="Edit blog post"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              }
            />
            <DeleteBlogDialog
              blog={blog}
              onDeleted={onDeleted}
              disabled={!hasManageAccess}
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-md cursor-pointer"
                  title="Delete blog post"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              }
            />
          </div>
        )}
      </div>

      {/* 3. Content Section */}
      <div className="p-4 flex flex-col flex-1">
        {/* Category & Metadata Row */}
        <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-400 mb-2 flex-wrap">
          {blog.category && (
            <span className="inline-flex items-center rounded-md bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              {blog.category}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            {format(new Date(blog.published_at || blog.created_at), "MMM dd, yyyy")}
          </span>
          {blog.reading_time && (
            <>
              <span className="w-1 h-1 bg-slate-300 rounded-full" />
              <span>{blog.reading_time}</span>
            </>
          )}
        </div>

        {/* Title */}
        <h3
          className="font-bold text-base text-slate-900 group-hover:text-primary transition-colors line-clamp-2 leading-snug"
          title={blog.title}
        >
          {blog.title}
        </h3>

        {/* Excerpt */}
        {blog.excerpt ? (
          <p className="text-slate-500 text-xs line-clamp-2 mt-1.5 leading-relaxed">{blog.excerpt}</p>
        ) : contentFallback ? (
          <p className="text-slate-500 text-xs line-clamp-2 mt-1.5 leading-relaxed">{contentFallback}</p>
        ) : null}

        {/* Tag pills */}
        {(blog.tags || []).length > 0 && (
          <div
            className="relative z-20 flex flex-wrap items-center gap-1.5 mt-3"
            onClick={(e) => e.stopPropagation()}
          >
            {(blog.tags || []).slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-slate-50 text-slate-600 border border-slate-200/80 px-2 py-0.5 text-[10px] font-semibold"
              >
                <Hash className="w-2.5 h-2.5 text-slate-400" /> {tag}
              </span>
            ))}
            {(blog.tags || []).length > 4 && (
              <span className="text-[10px] font-bold text-slate-400">
                +{(blog.tags || []).length - 4}
              </span>
            )}
          </div>
        )}

        {/* Author Footer */}
        {authors.length > 0 && (
          <div className="relative z-20 mt-auto pt-4 flex items-center justify-between border-t border-slate-100/80">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex -space-x-2">
                {authors.slice(0, 3).map((a) => (
                  <div key={a.name} title={a.name} className="ring-2 ring-white rounded-full">
                    <AuthorAvatar author={a} size={26} />
                  </div>
                ))}
                {authors.length > 3 && (
                  <div className="w-[26px] h-[26px] rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold ring-2 ring-white">
                    +{authors.length - 3}
                  </div>
                )}
              </div>
              <span className="text-[11px] font-semibold text-slate-700 truncate">
                {authors[0]?.name}
              </span>
            </div>
            {authors[0]?.designation && (
              <span className="text-[10px] text-slate-400 truncate max-w-[120px] text-right">
                {authors[0].designation}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}