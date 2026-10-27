import React from "react";
import { getBlog, getRelatedBlogs } from "@/services/blog/blog.service";
import { notFound } from "next/navigation";
import { ShareButton } from "@/components/ui/share-button";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock3,  User, Users, Sparkles, ArrowUpRight, Tag } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import dayjs from "dayjs";

import type { Metadata } from "next";
import { getSiteConfig } from "@/services/site-config/site-config.service";
import { normalizeBlogEmbedUrls } from "@/lib/blog-content";
import { BRAND } from "@/lib/brand";
import ArticleToc from "@/components/blog/ArticleToc";
import BlogCard from "@/components/sections/blogs/BlogCard";

export const revalidate = 3600;

interface BlogDetailsPageProps {
  params: Promise<{ slug: string }>;
}

function decodeEntities(str: string): string {
  if (!str) return "";
  return str
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&ldquo;/g, "“")
    .replace(/&rdquo;/g, "”")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function humanizeKey(key: string): string {
  return decodeEntities(key)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function addHeadingIds(html: string): { html: string; headings: { level: number; text: string; id: string }[] } {
  if (!html) return { html, headings: [] };
  const headings: { level: number; text: string; id: string }[] = [];
  let counter = 0;
  const next = html.replace(/<h([23])[^>]*>([\s\S]*?)<\/h\1>/gi, (_m, level, inner) => {
    counter += 1;
    const id = `article-sec-${counter}`;
    headings.push({ level: Number(level), text: decodeEntities(inner.replace(/<[^>]*>/g, "")).trim(), id });
    return `<h${level} id="${id}" class="article-section" style="scroll-margin-top:110px;">${inner}</h${level}>`;
  });
  return { html: next, headings };
}

export async function generateMetadata({ params }: BlogDetailsPageProps): Promise<Metadata> {
  const { slug } = await params;
  let blog = null;
  try {
    blog = await getBlog(slug);
  } catch (error) {
    console.error("SEO Metadata: Failed to fetch blog post:", error);
  }

  let brand: string = BRAND.name;
  try {
    const siteConfig = await getSiteConfig();
    if (siteConfig.company_name) brand = siteConfig.company_name;
  } catch {}

  if (!blog) {
    return {
      title: "Blog Post Not Found",
      description: "The requested article could not be found.",
    };
  }

  const seo = (blog as {
    seo_meta?: {
      meta_title?: string;
      meta_description?: string;
      og_image_url?: string;
      keywords?: string;
      indexable?: boolean;
    };
  }).seo_meta || {};
  const title = seo.meta_title || decodeEntities(blog.title);

  const cleanContent = blog.content ? blog.content.replace(/<[^>]*>/g, "") : "";
  const plainDescription = cleanContent
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&ldquo;/g, "“")
    .replace(/&rdquo;/g, "”")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

  const excerpt = plainDescription.slice(0, 155) + (plainDescription.length > 155 ? "..." : "");
  const description =
    seo.meta_description ||
    blog.excerpt ||
    excerpt ||
    `Read the latest engineering and technology article from ${brand}.`;
  const imageUrl = seo.og_image_url || blog.featured_image_url || "/images/og-image.webp";

  const absoluteImageUrl = imageUrl.startsWith("http")
    ? imageUrl
    : `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3002"}${imageUrl}`;

  const keywordsString = seo.keywords || `${blog.title}, technology blog, engineering`;
  const keywords = keywordsString.split(",").map((k: string) => k.trim());

  return {
    title,
    description,
    keywords,
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3002"),
    alternates: {
      canonical: `/blogs/${blog.slug}`,
    },
    robots: seo.indexable === false ? "noindex, nofollow" : "index, follow",
    openGraph: {
      title,
      description,
      type: "article",
      url: `/blogs/${blog.slug}`,
      siteName: brand,
      locale: "en_US",
      images: [
        {
          url: absoluteImageUrl,
          alt: blog.featured_image_alt || blog.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteImageUrl],
    },
  };
}

export default async function BlogDetailsPage({ params }: BlogDetailsPageProps) {
  const { slug } = await params;

  const blog = await getBlog(slug);

  if (!blog) {
    notFound();
    return null;
  }

  const { html: contentHtml, headings } = addHeadingIds(blog.content || "");

  let brand: string = BRAND.name;
  try {
    const siteConfig = await getSiteConfig();
    if (siteConfig.company_name) brand = siteConfig.company_name;
  } catch {}

  const related = blog.id ? await getRelatedBlogs(blog.id).catch(() => []) : [];
  const primaryAuthorName = blog.primary_author?.name || blog.primary_author_name || brand;
  const primaryAuthorAvatar = blog.primary_author?.avatar_url;
  const primaryAuthorDesignation =
    blog.primary_author?.designation ||
    (blog.primary_author_name || blog.primary_author
      ? `Author · ${brand}`
      : `${brand} Team`);

  return (
    <>
      <div className="w-full bg-white min-h-screen pb-20 pt-20 md:pt-28 overflow-x-hidden">
        <div className="container mx-auto px-4 md:px-6">
          <div className="py-4 border-b flex items-center justify-between gap-4">
            <Button variant="outline" asChild className="rounded-lg h-9 text-xs shrink-0">
              <Link href="/blogs">
                <ArrowLeft size={14} className="mr-1.5" /> All Articles
              </Link>
            </Button>
            <nav aria-label="Breadcrumb" className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 font-semibold truncate max-w-xl">
              <Link href="/" className="hover:text-brand-accent shrink-0">Home</Link>
              <span>/</span>
              <Link href="/blogs" className="hover:text-brand-accent shrink-0">Blogs</Link>
              {blog.category && (
                <>
                  <span>/</span>
                  <Link href={`/blogs?category=${encodeURIComponent(blog.category)}`} className="hover:text-brand-accent shrink-0">
                    {blog.category}
                  </Link>
                </>
              )}
              <span>/</span>
              <span className="text-slate-600 truncate">{decodeEntities(blog.title)}</span>
            </nav>
          </div>

          <div className="py-6 md:py-10">
            <article className="space-y-6">
              {/* Featured Image */}
              {blog.featured_image_url ? (
                <div className="relative aspect-[2/1] md:aspect-[30/9] w-full rounded-2xl overflow-hidden border bg-slate-100 shadow-xs">
                  <Image
                    src={blog.featured_image_url}
                    alt={blog.featured_image_alt || blog.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 90vw"
                    priority
                    className="object-cover"
                  />
                </div>
              ) : null}

              {/* Info Row */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-slate-400" />
                    <span className="font-semibold text-slate-700">
                      {dayjs(blog.published_at || blog.created_at).format("MMMM DD, YYYY")}
                    </span>
                  </div>
                  {blog.reading_time && (
                    <>
                      <div className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                      <div className="flex items-center gap-1.5">
                        <Clock3 size={14} className="text-slate-400" />
                        <span className="font-semibold text-slate-700">{blog.reading_time}</span>
                      </div>
                    </>
                  )}
                  {blog.category && (
                    <>
                      <div className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                      <Link
                        href={`/blogs?category=${encodeURIComponent(blog.category)}`}
                        className="inline-flex items-center rounded-full bg-sky-mist text-primary px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider ring-1 ring-inset ring-primary/20 hover:bg-primary hover:text-white transition-colors"
                      >
                        {blog.category}
                      </Link>
                    </>
                  )}
                </div>

                <ShareButton
                  url={`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3002"}/blogs/${blog.slug}`}
                  title={blog.title}
                  variant="button"
                  className="bg-slate-100 text-slate-700 hover:bg-slate-200 shadow-none border border-slate-200 shrink-0"
                />
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {decodeEntities(blog.title)}
              </h1>

              {/* Author & Co-Authors Card */}
              <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-r from-slate-50/80 via-white to-slate-50/80 p-5 md:p-6 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  {/* Primary Author */}
                  <div className="flex items-center gap-4">
                    <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-brand-accent/20 bg-brand-accent text-white flex items-center justify-center shrink-0 shadow-xs">
                      {primaryAuthorAvatar ? (
                        <Image
                          src={primaryAuthorAvatar}
                          alt={primaryAuthorName}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : (
                        <User size={26} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-base font-bold text-slate-900 leading-snug">{primaryAuthorName}</p>
                        <span className="inline-flex items-center rounded-full bg-brand-accent/10 text-brand-accent px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider">
                          Author
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {primaryAuthorDesignation}
                      </p>
                    </div>
                  </div>

                  {/* Co-Authors */}
                  {!!blog.co_authors?.length && (
                    <div className="border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <Users size={14} className="text-brand-accent" /> Co-Authors ({blog.co_authors.length})
                      </p>
                      <div className="flex flex-wrap items-center gap-3">
                        {blog.co_authors.map((ca, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-white rounded-xl border border-slate-200/80 px-3 py-1.5 shadow-2xs">
                            <div className="relative w-7 h-7 rounded-full overflow-hidden bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 text-xs font-bold">
                              {ca.avatar_url ? (
                                <Image src={ca.avatar_url} alt={ca.name} fill sizes="28px" className="object-cover" />
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

              {/* TOC */}
              {headings.length > 0 && (
                <div>
                  <ArticleToc headings={headings} />
                </div>
              )}

              {/* Content */}
              <div className="pt-6 md:pt-8 border-t border-slate-100 w-full min-w-0 max-w-full overflow-hidden">
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
                    dangerouslySetInnerHTML={{ __html: normalizeBlogEmbedUrls(contentHtml) }}
                  />
                </div>
                <style dangerouslySetInnerHTML={{ __html: `
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
              .blog-details-content .ql-editor iframe,
              .blog-details-content .ql-editor video {
                width: 100% !important;
                aspect-ratio: 16 / 9 !important;
                max-height: 480px;
                border: none !important;
                border-radius: 12px;
                margin: 1rem 0 !important;
                box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
                display: block;
                object-fit: cover;
                background: #000;
              }
              .blog-details-content .ql-editor blockquote {
                border-left: 4px solid var(--primary, #00668a) !important;
                background: #e6f6f4 !important;
                border-radius: 0 12px 12px 0 !important;
                padding: 14px 18px !important;
                font-size: 14px !important;
                color: #1e293b !important;
                font-style: italic !important;
                margin: 1.25rem 0 !important;
              }
              .blog-details-content .ql-editor table {
                width: 100% !important;
                border-collapse: collapse;
                margin: 1.25rem 0;
                font-size: 13px;
              }
              .blog-details-content .ql-editor table thead th {
                background: #f1f5f9;
                font-weight: 700;
              }
              .blog-details-content .ql-editor table th,
              .blog-details-content .ql-editor table td {
                border: 1px solid #e2e8f0;
                padding: 8px 10px;
                text-align: left;
              }
              .blog-details-content .ql-editor table tr:nth-child(even) td {
                background: #f8fafc;
              }
            `}} />
              </div>

              {/* Tags Section */}
              {blog.tags && blog.tags.length > 0 && (
                <div className="pt-6 pb-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mr-2">
                    <Tag size={14} className="text-brand-accent" />
                    <span>Tags:</span>
                  </div>
                  {blog.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/blogs?search=${encodeURIComponent(tag)}`}
                      className="inline-flex items-center gap-1 rounded-full bg-slate-100 hover:bg-brand-accent hover:text-white text-slate-700 px-3 py-1 text-xs font-semibold transition-colors duration-150"
                    >
                      <span>#{tag}</span>
                    </Link>
                  ))}
                </div>
              )}
            </article>

            {/* Related Articles */}
            {related.length > 0 && (
              <div className="pt-14">
                <div className="mb-8 text-center">
                  <span className="text-xs uppercase tracking-widest font-black text-brand-accent mb-2 block">
                    Keep Reading
                  </span>
                  <h2 className="text-2xl md:text-3xl font-black text-zinc-900 uppercase tracking-tight">
                    Related Articles
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {related.slice(0, 3).map((post) => (
                    <BlogCard key={post.id} blog={post} />
                  ))}
                </div>
              </div>
            )}

            {/* Related Services */}
            {blog.related_service_keys && blog.related_service_keys.length > 0 && (
              <div className="pt-12">
                <div className="p-6 md:p-8 rounded-2xl border border-slate-200 bg-gradient-to-br from-sky-mist/60 to-white">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-brand-accent text-white flex items-center justify-center shrink-0">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900">Explore Our Related Services</h3>
                      <p className="text-xs text-slate-500 font-medium">
                        Tagged alongside this article — see how we can help.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {blog.related_service_keys.map((key) => (
                      <Button key={key} variant="outline" asChild className="rounded-full h-9 px-4 text-xs font-bold border-slate-300 hover:border-brand-accent hover:text-brand-accent hover:bg-white">
                        <Link href={`/services?focus=${encodeURIComponent(key)}`}>
                          <ArrowUpRight size={13} className="mr-1.5" />
                          {humanizeKey(key)}
                        </Link>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}