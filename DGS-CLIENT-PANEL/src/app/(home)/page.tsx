import { getBlogs } from "@/services/blog/blog.service";
import { getHero } from "@/services/hero/hero.service";
import type { Metadata } from "next";
import { Suspense } from "react";
import { getSiteConfig } from "@/services/site-config/site-config.service";
import Hero from "@/components/sections/hero/Hero";
import BlogsSection from "@/components/sections/blogs/BlogsSection";
import EngineeringServices from "@/components/sections/services/EngineeringServices";
import WhyChooseSection from "@/components/sections/why-choose/WhyChooseSection";
import type { HeroSection } from "@/types/cms/cms";
import type { SiteConfig } from "@/types/settings";

type HomeBlogs = { data: unknown[]; total: number; page: number; limit: number };

export async function generateMetadata(): Promise<Metadata> {
  const siteConfig = (await getSiteConfig().catch(() => ({} as SiteConfig)));
  const companyName = siteConfig.company_name ?? "Milanova Technologies";
  const tagline = siteConfig.company_short_description ?? "Software engineering and technology consulting";
  const activeHero = await getHero().catch(() => null);
  const ogImage = siteConfig.company_logo ?? "";

  return {
    title: companyName,
    description: tagline,
    openGraph: {
      title: activeHero?.headline ?? companyName,
      description: activeHero?.sub_headline ?? tagline,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: companyName,
      description: tagline,
      images: ogImage ? [ogImage] : [],
    },
  };
}

export default async function Page() {
  const [activeHero, siteConfig, blogs] = await Promise.all([
    getHero().catch(() => null as HeroSection | null),
    getSiteConfig().catch(() => ({} as SiteConfig)),
    getBlogs({ page: 1, limit: 6 }).catch(() => ({
      data: [],
      total: 0,
      page: 1,
      limit: 6,
    }) as HomeBlogs),
  ]);

  const anyConfig = siteConfig as SiteConfig & { official_emails?: { general?: string } };
  const anyBlogs = blogs as HomeBlogs;
  const currentBlogPage = anyBlogs?.page ?? 1;
  const totalBlogPages =
    anyBlogs && anyBlogs.total > 0
      ? Math.max(1, Math.ceil(anyBlogs.total / (anyBlogs.limit || 6)))
      : 1;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: anyConfig.company_name ?? "Milanova Technologies",
    description: anyConfig.company_short_description ?? undefined,
    ...(anyConfig.company_logo
      ? { logo: { "@type": "ImageObject", url: anyConfig.company_logo } }
      : {}),
    ...(anyConfig.official_emails?.general
      ? { email: anyConfig.official_emails.general }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero activeHero={activeHero} />
      <EngineeringServices />
      {/* Figma 8:400 — SECTION 3, sits directly above the blog block. */}
      <WhyChooseSection />
      <Suspense fallback={<div className="h-40 animate-pulse bg-slate-100" />}>
        <BlogsSection
          blogData={blogs}
          currentPage={currentBlogPage}
          totalPages={totalBlogPages}
          filterParams={{ page: String(currentBlogPage) }}
        />
      </Suspense>
    </>
  );
}