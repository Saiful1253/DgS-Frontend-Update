import Link from "next/link";
import Image from "next/image";
import { Calendar, ChevronRight, Clock3, User } from "lucide-react";
import dayjs from "dayjs";
import type { Blog } from "@/types/cms/blog";
import { ShareButton } from "@/components/ui/share-button";

function stripHtmlAndNbsp(html: string): string {
  if (!html) return "";
  const cleanHtml = html.replace(/<[^>]*>/g, "");
  return cleanHtml
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&ldquo;/g, "“")
    .replace(/&rdquo;/g, "”")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

interface BlogCardProps {
  blog: Blog;
}

export default function BlogCard({ blog }: BlogCardProps) {
  const snippet =
    blog.excerpt || (blog.content ? stripHtmlAndNbsp(blog.content) : "");

  return (
    <Link
      href={`/blogs/${blog.slug}`}
      className="group block h-full focus:outline-none"
    >
      <div suppressHydrationWarning className="bg-card rounded-2xl overflow-hidden border border-slate-100 dark:border-zinc-800/80 flex flex-col h-full transition-all duration-300 hover:shadow-sm hover:border-brand-accent/20 hover:-translate-y-1 bg-white dark:bg-zinc-900/40">
        <div className="block overflow-hidden aspect-[16/10] bg-muted relative">
          {blog.featured_image_url ? (
            <Image
              src={blog.featured_image_url}
              alt={blog.featured_image_alt || blog.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground bg-slate-200">
              No image
            </div>
          )}

          {blog.category && (
            <span className="absolute top-3 left-3 z-20 inline-flex items-center rounded-full bg-brand-accent/90 text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1">
              {blog.category}
            </span>
          )}

          <div className="absolute top-3 right-3 z-20 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <ShareButton
              url={`${typeof window !== "undefined" ? window.location.origin : ""}/blogs/${blog.slug}`}
              title={blog.title}
            />
          </div>
        </div>

        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
              <Calendar size={12} className="text-brand-accent" />
              <span>{dayjs(blog.published_at || blog.created_at).format("MMM DD, YYYY")}</span>
              {blog.reading_time && (
                <>
                  <span className="w-1 h-1 bg-slate-300 dark:bg-zinc-700 rounded-full mx-1" />
                  <Clock3 size={12} className="text-brand-accent" />
                  <span>{blog.reading_time}</span>
                </>
              )}
            </div>

            <h3 className="font-bold text-base md:text-lg text-slate-900 dark:text-zinc-100 group-hover:text-brand-accent transition-colors duration-300 line-clamp-2 leading-snug">
              {blog.title}
            </h3>

            <p className="text-xs md:text-sm text-slate-500 dark:text-zinc-400 line-clamp-3 leading-relaxed">
              {snippet}
            </p>

            {blog.primary_author_name && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 pt-1">
                <User size={12} className="text-brand-accent" />
                <span className="font-semibold">{blog.primary_author_name}</span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between mt-auto">
            <span className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-brand-accent group-hover:text-brand-accent-hover gap-1 transition-colors duration-300">
              Read Article
              <ChevronRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}