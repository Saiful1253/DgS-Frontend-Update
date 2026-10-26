import * as React from "react";

export function TestimonialsListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="border border-slate-200 rounded-2xl p-5 bg-white flex flex-col md:flex-row md:items-start justify-between gap-6 animate-pulse"
        >
          <div className="space-y-4 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-2">
                <div className="h-4 w-40 bg-slate-200 rounded"></div>
                <div className="h-3 w-28 bg-slate-200 rounded"></div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-5 w-16 bg-slate-200 rounded-full"></div>
                <div className="h-5 w-14 bg-slate-200 rounded-full"></div>
              </div>
            </div>
            <div className="h-14 w-full bg-slate-100 rounded-xl"></div>
          </div>
          <div className="flex md:flex-col gap-2 shrink-0 w-full md:w-32">
            <div className="h-8 bg-slate-200 rounded-lg w-full"></div>
            <div className="h-8 bg-slate-200 rounded-lg w-full"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TestimonialsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-32 bg-slate-100 rounded-2xl border border-slate-200"></div>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-slate-100 rounded-xl border border-slate-200"></div>
        ))}
      </div>
      <TestimonialsListSkeleton />
    </div>
  );
}
