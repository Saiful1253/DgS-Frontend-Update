/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { Suspense } from "react";
import { getProductBySlug } from "@/services/product/product.service";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PackageX } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import type { Metadata } from "next";
import { getSiteConfig } from "@/services/site-config/site-config.service";
import ProductDetailsSkeleton from "@/components/skeletons/ProductDetailsSkeleton";
import ProductDetailsClient from "./ProductDetailsClient";

export const revalidate = 60; // Cache and revalidate page every 60 seconds

interface ProductDetailsPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductDetailsPageProps): Promise<Metadata> {
  const { slug } = await params;
  let product = null;
  try {
    product = await getProductBySlug(slug);
  } catch (error) {
    console.error("SEO Metadata: Failed to fetch product details:", error);
  }

  let brand = "Electronics Store";
  try {
    const siteConfig = await getSiteConfig();
    if (siteConfig.company_name) brand = siteConfig.company_name;
  } catch {}

  if (!product) {
    return {
      title: "Product Not Found",
      description: "The requested product could not be found.",
    };
  }

  const seo = (product as any).seo_meta || {};
  const title = seo.meta_title || product.name;
  
  const cleanDesc = product.description ? product.description.replace(/<[^>]*>/g, "").trim() : "";
  const defaultDesc = cleanDesc.slice(0, 155) + (cleanDesc.length > 155 ? "..." : "");
  const description = seo.meta_description || defaultDesc || "Quality electronics and appliances from verified brands.";
  
  const productImages = (product.images || []).filter((img: any) => !img.variant_id);
  const imageUrl = seo.og_image_url ?? 
                   productImages.find((img: any) => img.is_primary)?.image_url ?? 
                   productImages[0]?.image_url ?? 
                   "/images/og-image.webp";

  const absoluteImageUrl = imageUrl.startsWith("http")
    ? imageUrl
    : `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}${imageUrl}`;

  const keywordsString = seo.keywords || `${product.name}, ${product.category?.name}, electronics`;
  const keywords = keywordsString.split(",").map((k: string) => k.trim());

  return {
    title,
    description,
    keywords,
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
    alternates: {
      canonical: `/products/${product.slug}`,
    },
    robots: seo.indexable === false ? "noindex, nofollow" : "index, follow",
    openGraph: {
      title,
      description,
      type: "website",
      url: `/products/${product.slug}`,
      siteName: brand,
      locale: "en_US",
      images: [
        {
          url: absoluteImageUrl,
          alt: product.name,
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

export default async function ProductDetailsPage({ params }: ProductDetailsPageProps) {
  const { slug } = await params;

  let product = null;
  try {
    product = await getProductBySlug(slug).catch(() => null);
  } catch (error) {
    console.error("Failed to load product details:", error);
  }

  if (!product) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen pt-20 flex flex-col items-center justify-center p-4 bg-slate-50/50">
          <div className="w-20 h-20 bg-white rounded-3xl border shadow-sm flex items-center justify-center mb-6">
            <PackageX className="w-10 h-10 text-slate-300" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">No Product Found</h1>
          <p className="text-slate-500 text-sm mt-2 mb-8 text-center max-w-md">
            The product you are looking for does not exist or has been removed from the database.
          </p>
          <Button variant="outline" asChild className="rounded-xl font-bold uppercase text-xs tracking-widest px-8 h-11">
            <Link href="/">
              <ArrowLeft size={16} className="mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>
        <Footer />
      </>
    );
  }

  const productPrimaryImg = (product.images || []).find((img: any) => img.is_primary)?.image_url || product.images?.[0]?.image_url || "";
  const absProductImg = productPrimaryImg.startsWith("http")
    ? productPrimaryImg
    : `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}${productPrimaryImg}`;

  return (
    <>
      <Navbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": product.name,
            "description": product.description ? product.description.replace(/<[^>]*>/g, "").trim() : "",
            "image": absProductImg,
            "sku": product.id.toString(),
          })
        }}
      />
      <main className="min-h-screen bg-slate-50/20 pt-20 md:pt-28 pb-16">
        <Suspense fallback={<ProductDetailsSkeleton />}>
          <ProductDetailsClient product={product} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
