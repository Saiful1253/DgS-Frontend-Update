import React from "react";

interface ProductsSkeletonProps {
  gridOnly?: boolean;
}

function Shimmer({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-lg ${className ?? ""}`} />;
}

function SidebarSkeleton() {
  return (
    <aside className="w-full lg:w-72 xl:w-80 shrink-0">
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <Shimmer className="h-5 w-24" />
          <Shimmer className="h-4 w-12" />
        </div>

        {/* Search */}
        <div className="space-y-2">
          <Shimmer className="h-3 w-16" />
          <Shimmer className="h-10 w-full rounded-xl" />
        </div>

        {/* Category section */}
        <div className="space-y-3 pb-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <Shimmer className="h-4 w-20" />
            <Shimmer className="h-4 w-4" />
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-2.5 px-2">
              <Shimmer className="size-4 rounded" />
              <Shimmer className={`h-3 ${i % 2 === 0 ? "w-28" : "w-20"}`} />
            </div>
          ))}
        </div>

        {/* Price section */}
        <div className="space-y-3 pb-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <Shimmer className="h-4 w-24" />
            <Shimmer className="h-4 w-4" />
          </div>
          <div className="flex gap-2">
            <Shimmer className="h-9 flex-1 rounded-xl" />
            <Shimmer className="h-9 flex-1 rounded-xl" />
          </div>
          <Shimmer className="h-9 w-full rounded-xl" />
        </div>

        {/* Brand section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Shimmer className="h-4 w-16" />
            <Shimmer className="h-4 w-4" />
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2.5 px-2">
              <Shimmer className="size-4 rounded" />
              <Shimmer className={`h-3 ${i % 3 === 0 ? "w-24" : "w-16"}`} />
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 flex flex-col shadow-sm">
      <div className="aspect-[4/3] bg-slate-200 animate-pulse" />
      <div className="p-4 flex-1 flex flex-col gap-3">
        <div className="space-y-2">
          <Shimmer className="h-4 w-3/4" />
          <Shimmer className="h-3 w-full" />
          <Shimmer className="h-3 w-2/3" />
        </div>
        <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
          <Shimmer className="h-5 w-20" />
          <Shimmer className="h-8 w-24 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function ProductsSkeleton({ gridOnly = false }: ProductsSkeletonProps) {
  if (gridOnly) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2">
        <Shimmer className="h-3 w-12" />
        <Shimmer className="h-3 w-3 rounded" />
        <Shimmer className="h-3 w-24" />
      </div>

      {/* Page title */}
      <div className="mb-10 space-y-2">
        <Shimmer className="h-10 w-64" />
        <Shimmer className="h-4 w-48" />
      </div>

      {/* Main layout */}
      <div className="flex flex-col lg:flex-row gap-8">
        <SidebarSkeleton />

        {/* Right content */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-6">
            <Shimmer className="h-4 w-32" />
            <Shimmer className="h-9 w-36 rounded-xl" />
          </div>

          {/* Product grid */}
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-10 flex justify-center gap-2">
            {[1, 2, 3].map((i) => (
              <Shimmer key={i} className="h-9 w-9 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
