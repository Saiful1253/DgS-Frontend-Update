/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { BlogPost } from "@/types/blog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Trash2, Pencil, Star, Clock3, Tag, User, Users, Sparkles, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import EditBlogModal from "./modals/article/edit-blog-modal";
import DeleteBlogDialog from "./modals/article/delete-blog-dialog";
import BlogStatusMenu from "./blog-status-menu";
import { updateBlog, updateBlogStatus, toggleBlogFeatured } from "@/services/blog/blog.service";
import { toast } from "sonner";
import "react-quill-new/dist/quill.snow.css";
import { normalizeBlogEmbedUrls } from "@/lib/blog-content";
import { cn } from "@/lib/utils";

interface BlogDetailsViewProps {
  blog: BlogPost;
}

export default function BlogDetailsView({
  blog,
}: BlogDetailsViewProps) {
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [currentStatus, setCurrentStatus] = React.useState<BlogPost["status"]>(blog?.status || "draft");
  const [isFeatured, setIsFeatured] = useState(Boolean(blog?.featured_status));

  useEffect(() => {
    setIsFeatured(Boolean(blog?.featured_status));
  }, [blog?.featured_status]);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const hasRichContent = React.useMemo(() => {
    const text = (blog?.content || "")
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();
    return text.length > 0;
  }, [blog?.content]);

  const handleUpdate = async (id: string | number, formData: FormData): Promise<boolean> => {
    if (busy) return false;
    setBusy(true);
    const loading = toast.loading("Updating blog post...");
    try {
      const res = await updateBlog(id, formData);
      if (res.success) {
        toast.success(res.message || "Blog post updated", { id: loading });
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

  const handleStatusChange = async (newStatus: string, publishAt?: string) => {
    const loading = toast.loading("Updating blog status...");
    try {
      const res = await updateBlogStatus(blog.id, newStatus, publishAt);
      if (res.success) {
        setCurrentStatus(newStatus as BlogPost["status"]);
        toast.success(`Status updated to ${newStatus}`, { id: loading });
        router.refresh();
        return true;
      }
      toast.error(res.message || "Failed to update status", { id: loading });
      return false;
    } catch (err: any) {
      toast.error(err.message || "An error occurred", { id: loading });
      return false;
    }
  };

  const handleToggleFeatured = async () => {
    if (busy) return;
    const next = !isFeatured;
    setIsFeatured(next);
    setBusy(true);
    const loading = toast.loading(next ? "Featuring article..." : "Unfeaturing article...");
    try {
      const res = await toggleBlogFeatured(blog.id, next);
      if (res.success) {
        toast.success(next ? "Article is now featured" : "Article unfeatured", { id: loading });
        router.refresh();
      } else {
        setIsFeatured(!next);
        toast.error(res.message || "Failed to update featured status", { id: loading });
      }
    } catch (err: any) {
      setIsFeatured(!next);
      toast.error(err?.message || "An error occurred", { id: loading });
    } finally {
      setBusy(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="w-full bg-white min-h-screen pb-20 overflow-x-hidden grid grid-cols-1">
      <div className="min-w-0 w-full max-w-full flex flex-col">
        {/* 1. Header Bar */}
        <div className="px-4 md:px-8 py-4 border-b flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild className="h-8 px-0 hover:text-slate-900 gap-2">
            <Link href="/blogs">
              <ArrowLeft size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Back to Blogs</span>
            </Link>
          </Button>
        </div>

        <div className="p-4 md:p-8 space-y-4 md:space-y-8 min-w-0 max-w-full overflow-x-hidden">

          {/* 2. Top Image - Full Width */}
          {blog.featured_image_url && (
            <div className="relative aspect-[2/1] md:aspect-30/9 w-full rounded-2xl overflow-hidden border bg-slate-50">
              <Image
                src={blog.featured_image_url}
                alt={blog.title}
                fill
                sizes="(max-width: 768px) 100vw, 60vw"
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* 3. Info & Actions Row */}
          <div className="space-y-6">
            <div className="flex sm:items-center justify-between gap-4 flex-wrap">
              {/* Metadata Section with Quick Status Menu & Feature Action */}
              <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Calendar size={12} className="text-green-500" />
                  {blog?.published_at ? format(new Date(blog.published_at), "MMMM dd, yyyy") : blog?.created_at ? format(new Date(blog.created_at), "MMMM dd, yyyy") : "Unknown Date"}
                </div>
                {blog?.reading_time && (
                  <>
                    <div className="w-1 h-1 bg-slate-300 rounded-full" />
                    <div className="flex items-center gap-1">
                      <Clock3 size={12} className="text-slate-400" />
                      <span>{blog.reading_time}</span>
                    </div>
                  </>
                )}
                {blog?.category && (
                  <>
                    <div className="w-1 h-1 bg-slate-300 rounded-full" />
                    <span className="inline-flex items-center rounded-full bg-sky-100 text-sky-800 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                      {blog.category}
                    </span>
                  </>
                )}
                <div className="w-1 h-1 bg-slate-300 rounded-full" />
                {(
                  <BlogStatusMenu
                    status={currentStatus}
                    onSelect={handleStatusChange}
                    align="start"
                  />
                )}
                {(
                  <button
                    type="button"
                    onClick={handleToggleFeatured}
                    disabled={busy}
                    title={isFeatured ? "Article is featured (click to unfeature)" : "Click to mark as featured"}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border",
                      isFeatured
                        ? "bg-amber-500 text-white border-amber-600 shadow-xs hover:bg-amber-600 ring-2 ring-amber-300/40"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-amber-600"
                    )}
                  >
                    <Star className={cn("w-3 h-3", isFeatured ? "fill-white text-white" : "text-amber-500")} />
                    <span>{isFeatured ? "Featured" : "Feature"}</span>
                  </button>
                )}
              </div>

              {/* Actions Beside Metadata */}
              <div className="flex items-center gap-2">
                <EditBlogModal
                  blog={blog}
                  onUpdateBlog={handleUpdate}
                  trigger={
                    <Button variant="outline" size="sm" className="gap-1 font-semibold">
                      <Pencil size={12} />
                      <span className="text-xs">Edit Article</span>
                    </Button>
                  }
                />
                <DeleteBlogDialog
                  blog={blog}
                  redirectPath="/blogs"
                  trigger={
                    <Button variant="destructive" size="sm">
                      <Trash2 size={12} />
                    </Button>
                  }
                />
              </div>
            </div>

            <h1 className="text-xl md:text-3xl lg:text-5xl font-black text-slate-900 tracking-tighter leading-[1.1] break-words max-w-full">
              {blog?.title || "Untitled Blog"}
            </h1>

            {/* Author & Co-Authors Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-r from-slate-50/80 via-white to-slate-50/80 p-4 md:p-5 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Primary Author */}
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-brand-accent/20 bg-cyan-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                    {blog.primary_author?.avatar_url ? (
                      <Image
                        src={blog.primary_author.avatar_url}
                        alt={blog.primary_author?.name || blog.primary_author_name || "Author"}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <User size={22} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900 leading-snug">
                        {blog.primary_author?.name || blog.primary_author_name || "Milanova Team"}
                      </p>
                      <span className="inline-flex items-center rounded-full bg-cyan-100 text-cyan-800 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider">
                        Author
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {blog.primary_author?.designation || (blog.primary_author_name ? "Author · Milanova Technologies" : "Milanova Technologies Team")}
                    </p>
                  </div>
                </div>

                {/* Co-Authors */}
                {!!blog.co_authors?.length && (
                  <div className="border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Users size={12} className="text-cyan-700" /> Co-Authors ({blog.co_authors.length})
                    </p>
                    <div className="flex flex-wrap items-center gap-2.5">
                      {blog.co_authors.map((ca, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-white rounded-xl border border-slate-200/80 px-2.5 py-1 shadow-2xs">
                          <div className="relative w-6 h-6 rounded-full overflow-hidden bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 text-[10px] font-bold">
                            {ca.avatar_url ? (
                              <Image src={ca.avatar_url} alt={ca.name} fill sizes="24px" className="object-cover" />
                            ) : (
                              ca.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-bold text-slate-800 leading-tight">{ca.name}</p>
                            {ca.designation && (
                              <p className="text-[10px] text-slate-400 font-medium leading-none">{ca.designation}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4. Content Area - Strictly Boundary Constrained */}
          {hasRichContent && (
          <div className="pt-0 md:pt-8 border-t border-slate-100 w-full min-w-0 max-w-full overflow-hidden">
            <div className="blog-details-content ql-snow w-full min-w-0 max-w-full">
              <div
                className="ql-editor !w-full !max-w-full min-w-0 px-4 md:px-8 !py-0 !h-auto block
              [&_img]:w-full [&_img]:aspect-[2/1] md:[&_img]:aspect-[3/1] [&_img]:max-h-[400px] [&_img]:object-cover [&_img]:rounded-xl [&_img]:shadow-lg [&_img]:my-4
              [&_p]:text-slate-600 [&_p]:leading-relaxed [&_p]:m-0 [&_p]:min-h-[1.5em] [&_p]:w-full [&_p]:max-w-full
              [&_h1]:text-3xl md:[&_h1]:text-4xl [&_h1]:m-0 [&_h1]:font-black [&_h1]:text-slate-900 [&_h1]:tracking-tight [&_h1]:max-w-full
              [&_h2]:text-2xl md:[&_h2]:text-3xl [&_h2]:m-0 [&_h2]:font-black [&_h2]:text-slate-900 [&_h2]:tracking-tight [&_h2]:max-w-full
              [&_h3]:text-xl md:[&_h3]:text-2xl [&_h3]:m-0 [&_h3]:font-black [&_h3]:text-slate-900 [&_h3]:tracking-tight [&_h3]:max-w-full
              [&_a]:text-blue-600 [&_a]:underline [&_a]:break-all
              [&_strong]:text-slate-900 [&_strong]:font-bold
              [&_.ql-align-center]:text-center
              [&_.ql-align-right]:text-right
              [&_.ql-align-justify]:text-justify
              [&_.ql-size-small]:text-xs
              [&_.ql-size-large]:text-2xl
              [&_.ql-size-huge]:text-4xl"
                dangerouslySetInnerHTML={{ __html: normalizeBlogEmbedUrls(blog?.content || "") }}
              />
            </div>
            <style dangerouslySetInnerHTML={{
              __html: `
            /* SCOPED FIX FOR BLOG DETAILS ONLY */
            .blog-details-content .ql-editor ul {
              list-style-type: disc !important;
              padding-left: 1.5rem !important;
              margin-top: 0 !important;
              margin-bottom: 0 !important;
              display: block !important;
            }
            .blog-details-content .ql-editor ol {
              list-style-type: decimal !important;
              padding-left: 1.5rem !important;
              margin-top: 0 !important;
              margin-bottom: 0 !important;
              display: block !important;
            }
            .blog-details-content .ql-editor li {
              display: list-item !important;
              list-style: inherit !important;
              margin-top: 0 !important;
              margin-bottom: 0 !important;
              padding-left: 0.25em !important;
            }
            .blog-details-content .ql-editor iframe {
              width: 100% !important;
              aspect-ratio: 16 / 9 !important;
              max-height: 480px;
              border: none !important;
              border-radius: 12px;
              margin: 1rem 0 !important;
              box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
              display: block;
            }
            .blog-details-content .ql-editor li::before {
              content: none !important;
            }
            .blog-details-content .ql-editor p,
            .blog-details-content .ql-editor h1,
            .blog-details-content .ql-editor h2,
            .blog-details-content .ql-editor h3,
            .blog-details-content .ql-editor li {
              white-space: pre-wrap !important;
              word-wrap: break-word !important;
              overflow-wrap: break-word !important;
              word-break: break-word !important;
              max-width: 100% !important;
            }
            .blog-details-content .ql-editor p {
              min-height: 1.2em;
              width: 100% !important;
              display: block !important;
            }
            .blog-details-content .ql-editor * {
              max-width: 100% !important;
              margin-left: 0 !important;
              margin-right: 0 !important;
            }
            .blog-details-content .ql-editor a {
              word-break: break-all !important;
            }
          `}} />
          </div>
          )}

          {/* 5. Tags Section */}
          {blog?.tags && blog.tags.length > 0 && (
            <div className="pt-6 pb-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mr-2">
                <Tag size={14} className="text-cyan-700" />
                <span>Tags:</span>
              </div>
              {blog.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-700 px-3 py-1 text-xs font-semibold"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* 6. Related Services */}
          {blog?.related_service_keys && blog.related_service_keys.length > 0 && (
            <div className="pt-6">
              <div className="p-5 md:p-6 rounded-2xl border border-slate-200 bg-gradient-to-br from-sky-50 via-white to-sky-50/50 shadow-xs">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-cyan-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Related Services</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Tagged services associated with this article.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {blog.related_service_keys.map((key) => (
                    <span
                      key={key}
                      className="inline-flex items-center rounded-full bg-white border border-slate-300 text-slate-800 px-3 py-1 text-xs font-bold shadow-2xs gap-1.5"
                    >
                      <ArrowUpRight size={12} className="text-cyan-700" />
                      {key.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
