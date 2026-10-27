import React, { Suspense } from "react";
import type { Metadata } from "next";
import { getBlogs } from "@/services/blog/blog.service";
import { getSiteConfig } from "@/services/site-config/site-config.service";
import { BRAND } from "@/lib/brand";
import BlogsListing from "@/components/sections/blogs/BlogsListing";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const siteConfig = (await getSiteConfig().catch(() => ({}))) as { company_name?: string };
  const companyName = siteConfig.company_name ?? BRAND.name;
  return {
    title: "Blogs",
    description: `Read the latest LPG, pipeline and safety engineering articles from ${companyName}.`,
    openGraph: {
      title: `${companyName} | Blog`,
      description: "Gas reticulation, industrial piping, fire safety and compliance insights.",
      type: "website",
    },
    alternates: { canonical: "/blogs" },
  };
}

interface BlogsPageProps {
  searchParams: Promise<{ page?: string; search?: string; category?: string }>;
}

export default async function BlogsPage({ searchParams }: BlogsPageProps) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);
  const limit = 9;

  const data = await getBlogs({
    page,
    limit,
    search: sp.search || undefined,
    category: sp.category || undefined,
  }).catch(() => null);

  const list = data || { data: [], total: 0, page, limit, totalPages: 1 };
  const currentPage = list.page || page;
  const totalPages =
    list.totalPages || Math.max(1, Math.ceil(list.total / (list.limit || limit)));

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50/50">
          <div className="h-72 animate-pulse bg-gradient-to-br from-primary to-[#003b52]" />
          <div className="container mx-auto px-6 py-12">
            <div className="h-8 w-48 animate-pulse rounded bg-slate-200 mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="h-72 animate-pulse rounded-2xl bg-white border border-slate-100" />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <BlogsListing
        initialBlogs={list.data}
        currentPage={currentPage}
        totalPages={totalPages}
        initialSearch={sp.search || ""}
      />
    </Suspense>
  );
}