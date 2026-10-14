import type { MetadataRoute } from "next";
import { getBackendUrl } from "@/lib/backend-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  // Shared resolver: this previously fell back to port 5000 without the
  // /api/v1 prefix, which differs from every other backend call site.
  const backendUrl = getBackendUrl();

  let products: { slug: string; updated_at?: string }[] = [];
  let blogs: { slug: string; updated_at?: string }[] = [];
  let portfolio: { slug: string; updated_at?: string }[] = [];

  try {
    const res = await fetch(`${backendUrl}/client/sitemap-catalog`, {
      next: { revalidate: 3600 },
    }).then((r) => r.json());
    // TransformInterceptor wraps successful responses, so unwrap `data` when
    // present. A bare payload is still accepted so this keeps working if the
    // interceptor is ever scoped differently.
    const payload = res?.success && res?.data ? res.data : res;
    if (payload) {
      products = payload.products || [];
      blogs = payload.blogs || [];
      portfolio = payload.portfolio || [];
    }
  } catch (error) {
    // A sitemap failure must not break the build — static routes below are
    // still returned so the site never goes without a sitemap.
    console.error("Failed to generate sitemap items:", error);
  }

  // Every top-level route the app actually renders. The previous sitemap listed
  // only `/`, so the entire marketing surface — services, products, blogs,
  // company, legal, contact — was invisible to crawlers while still being
  // linked from the navbar.
  //
  // `/technologies` and `/testimonials` are deliberately absent: no page and no
  // inbound link exist for either. Listing them would advertise 404s, and an
  // empty page just to satisfy the sitemap would be thin content.
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: new Date(), changeFrequency: "hourly", priority: 1.0 },
    { url: `${base}/services`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/products`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/portfolio`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/blogs`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/company`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/contact`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.8 },
    { url: `${base}/privacy-policy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    {
      url: `${base}/terms-and-conditions`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${base}/products/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const blogRoutes: MetadataRoute.Sitemap = blogs.map((b) => ({
    url: `${base}/blogs/${b.slug}`,
    lastModified: b.updated_at ? new Date(b.updated_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // Portfolio slugs now come from the same catalog request, so this no longer
  // makes a second round trip for data the catalog already carries.
  const portfolioRoutes: MetadataRoute.Sitemap = portfolio.map((p) => ({
    url: `${base}/portfolio/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...productRoutes, ...blogRoutes, ...portfolioRoutes];
}
