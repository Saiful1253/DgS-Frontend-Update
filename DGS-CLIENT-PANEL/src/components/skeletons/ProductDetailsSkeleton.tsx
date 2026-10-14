import React from "react";

export default function ProductDetailsSkeleton() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      {/* Back button skeleton */}
      <div className="h-4 w-28 bg-slate-200 rounded mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Left column: Image gallery skeleton */}
        <div className="space-y-4">
          <div className="aspect-square bg-slate-200 rounded-3xl w-full" />
          <div className="flex gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-20 h-20 bg-slate-200 rounded-xl" />
            ))}
          </div>
        </div>

        {/* Right column: Details skeleton */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="h-8 w-3/4 bg-slate-200 rounded-lg" />
            <div className="h-4 w-1/3 bg-slate-200 rounded" />
          </div>

          <div className="h-8 w-1/4 bg-slate-200 rounded-lg" />

          <div className="space-y-2 pt-4 border-t border-slate-100">
            <div className="h-4 w-full bg-slate-200 rounded" />
            <div className="h-4 w-5/6 bg-slate-200 rounded" />
            <div className="h-4 w-4/6 bg-slate-200 rounded" />
          </div>

          {/* Variant selector skeleton */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="h-4 w-24 bg-slate-200 rounded" />
            <div className="flex gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 w-24 bg-slate-200 rounded-xl" />
              ))}
            </div>
          </div>

          {/* Action buttons skeleton */}
          <div className="flex gap-4 pt-6">
            <div className="h-12 w-32 bg-slate-200 rounded-2xl" />
            <div className="h-12 flex-1 bg-slate-200 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
