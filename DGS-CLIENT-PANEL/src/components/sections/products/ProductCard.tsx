/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/types/product/product";
import { ShareButton } from "@/components/ui/share-button";

export default function ProductCard({ product }: { product: Product }) {
  const primaryImage =
    product.images?.find((img) => img.is_primary === true)?.image_url ??
    product.images?.[0]?.image_url ??
    (product as any).thumbnail ??
    "/placeholder-product.svg";

  return (
    <div className="group relative aspect-[4/5] overflow-hidden rounded-2xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-md transition-all duration-500 ease-out hover:-translate-y-1.5 hover:shadow-2xl">
      {/* Full width image Link */}
      <Link href={`/products/${product.slug}`} className="absolute inset-0 block overflow-hidden bg-slate-100 dark:bg-zinc-950">
        <Image
          src={primaryImage}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        
        {/* Share Button */}
        <div className="absolute top-3 left-3 z-20 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <ShareButton 
            url={`${typeof window !== 'undefined' ? window.location.origin : ''}/products/${product.slug}`} 
            title={product.name} 
          />
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent transition-opacity duration-300" />

        {/* Info overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white z-10 space-y-1.5">
          {product.category && (
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary-hover bg-white/90 dark:bg-zinc-900/90 px-2 py-0.5 rounded">
              {product.category.name}
            </span>
          )}

          <h3 className="text-base font-bold leading-tight line-clamp-1 group-hover:text-primary-hover transition-colors">
            {product.name}
          </h3>

          {product.brand && (
            <p className="text-xs text-slate-300 line-clamp-1 font-medium">
              Framework: {product.brand.name}
            </p>
          )}

          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="shrink-0 rounded-md bg-primary hover:bg-primary-hover px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-white transition-all duration-300 ease-out">
              Explore Tech →
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
