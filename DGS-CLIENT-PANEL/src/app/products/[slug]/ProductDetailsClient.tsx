/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { Product } from "@/types/product/product";
import { Button } from "@/components/ui/button";
import {  ChevronLeft,   PlayCircle, Mail } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ShareButton } from "@/components/ui/share-button";
import { Suspense } from "react";

interface ProductDetailsClientProps {
  product: Product;
}

function parseSpecs(raw: Product["specifications_json"]): [string, string][] {
  if (!raw) return [];
  let obj: Record<string, unknown> | null = null;
  if (typeof raw === "string") {
    try {
      obj = JSON.parse(raw);
    } catch {
      return [];
    }
  } else if (typeof raw === "object") {
    obj = raw;
  }
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return [];
  return Object.entries(obj)
    .filter(([, v]) => v != null && String(v).trim() !== "")
    .map(([k, v]) => [k, String(v)]);
}

function getYouTubeEmbedUrl(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return `https://www.youtube.com/embed/${m[1]}`;
  }
  return null;
}

function ProductDetailsClientContent({ product }: ProductDetailsClientProps) {
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [selectedMedia, setSelectedMedia] = React.useState<
    { type: "image" | "video"; url: string }
  >({
    type: "image",
    url: product.images?.[0]?.image_url || (product.images?.[0] as any)?.url || (product as any).thumbnail || "/placeholder.svg",
  });

  const specs = parseSpecs(product.specifications_json);
  const videoEmbedUrl = product.product_video_url ? getYouTubeEmbedUrl(product.product_video_url) : null;

  return (
    <main className="min-h-screen bg-slate-50/50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 py-6 md:py-10">
      <div className="container mx-auto px-4 max-w-6xl space-y-6 md:space-y-8">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-500 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Tech Stack
          </Link>
          <ShareButton title={product.name} url="" />
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 bg-white dark:bg-zinc-900/50 rounded-3xl border border-slate-100 dark:border-zinc-800/80 p-6 md:p-10 shadow-sm">
          {/* Media Section */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800">
              {selectedMedia.type === "image" ? (
                <Image
                  src={selectedMedia.url}
                  alt={product.name}
                  fill
                  sizes="(min-width: 1024px) 55vw, 100vw"
                  className="object-cover"
                  priority
                />
              ) : (
                <iframe
                  src={selectedMedia.url}
                  title="Solution Video"
                  className="w-full h-full border-none"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>

            {/* Media Thumbnails */}
            {((product.images && product.images.length > 1) || videoEmbedUrl) && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                {product.images?.map((img, i) => {
                  const imgUrl = img.image_url || (img as any).url || "/placeholder.svg";
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedMedia({ type: "image", url: imgUrl })}
                      className={`relative w-20 aspect-video rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                        selectedMedia.type === "image" && selectedMedia.url === imgUrl
                          ? "border-primary shadow-md scale-105"
                          : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <Image src={imgUrl} alt="" fill sizes="80px" className="object-cover" />
                    </button>
                  );
                })}
                {videoEmbedUrl && (
                  <button
                    onClick={() => setSelectedMedia({ type: "video", url: videoEmbedUrl })}
                    className={`relative w-20 aspect-video rounded-xl overflow-hidden border-2 bg-slate-900 flex items-center justify-center transition-all shrink-0 ${
                      selectedMedia.type === "video"
                        ? "border-primary shadow-md scale-105"
                        : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <PlayCircle className="w-6 h-6 text-white" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              {product.category && (
                <span className="text-xs font-extrabold uppercase tracking-widest text-primary mb-2 block">
                  {product.category.name}
                </span>
              )}
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-zinc-100">
                {product.name}
              </h1>
              {product.brand && (
                <p className="text-sm font-medium text-slate-500 mt-1">
                  Technology Framework: <span className="font-bold text-slate-700 dark:text-zinc-300">{product.brand.name}</span>
                </p>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">
              {product.description || "Comprehensive enterprise technology solution tailored for performance, scalability, and security."}
            </p>

            {/* CTA Button */}
            <div className="pt-4 space-y-3">
              <Link href={`/contact?subject=${encodeURIComponent("Inquiry: " + product.name)}`}>
                <Button className="w-full h-12 bg-primary hover:bg-primary-hover text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-primary/20 cursor-pointer flex items-center justify-center gap-2">
                  <Mail className="w-4 h-4" />
                  Request Solution Consultation
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Specifications Table */}
        {specs.length > 0 && (
          <div className="mt-8 bg-white dark:bg-zinc-900/40 rounded-3xl border border-slate-100 dark:border-zinc-800/80 p-5 md:p-8 shadow-sm">
            <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-900 dark:text-zinc-100 mb-5">
              Technical Specifications & Features
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-10">
              {specs.map(([key, value], idx) => (
                <div
                  key={key}
                  className={`flex items-start justify-between gap-4 py-3 border-b border-slate-100 dark:border-zinc-800/60 ${
                    idx >= specs.length - (specs.length % 2 === 0 ? 2 : 1) ? "sm:border-b-0" : ""
                  }`}
                >
                  <dt className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 shrink-0">
                    {key}
                  </dt>
                  <dd className="text-sm font-medium text-slate-800 dark:text-zinc-200 text-right">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </main>
  );
}

export default function ProductDetailsClient({ product }: ProductDetailsClientProps) {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-slate-500">Loading details...</div>}>
      <ProductDetailsClientContent product={product} />
    </Suspense>
  );
}
