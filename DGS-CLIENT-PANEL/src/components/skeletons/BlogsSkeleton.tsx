import React from "react";
import { Calendar, ChevronRight } from "lucide-react";

interface BlogsSkeletonProps {
  gridOnly?: boolean;
}

export default function BlogsSkeleton({ gridOnly = false }: BlogsSkeletonProps) {
  const grid = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white rounded-2xl overflow-hidden border border-slate-100 flex flex-col h-full shadow-sm"
        >
          {/* Image Box aspect-[16/10] */}
          <div className="aspect-[16/10] bg-slate-100 animate-pulse relative" />
          
          {/* Content Block */}
          <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              {/* Metadata Row */}
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <Calendar size={12} className="text-brand-accent animate-pulse opacity-40" />
                <div className="h-3.5 w-20 bg-slate-200 rounded animate-pulse" />
                <span className="w-1 h-1 bg-slate-300 rounded-full mx-1" />
                <span className="text-brand-accent font-extrabold uppercase animate-pulse opacity-40">Story</span>
              </div>
              
              {/* Title Placeholder */}
              <div className="h-5 w-4/5 bg-slate-200 rounded animate-pulse mt-2" />
              
              {/* Description Placeholder */}
              <div className="space-y-2 mt-3">
                <div className="h-3 w-full bg-slate-100 rounded animate-pulse" />
                <div className="h-3 w-11/12 bg-slate-100 rounded animate-pulse" />
                <div className="h-3 w-4/5 bg-slate-100 rounded animate-pulse" />
              </div>
            </div>

            {/* Footer Row */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
              <span className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-brand-accent opacity-50 gap-1">
                Read Story
                <ChevronRight size={14} />
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  if (gridOnly) {
    return grid;
  }

  return (
    <section className="scroll-mt-24 pt-10 pb-20 border-t border-slate-100 bg-slate-50/30 text-slate-900">
      <div className="container mx-auto px-6">
        {/* HEADER SECTION */}
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Our Cooking Stories & Tips</h2>
          <p className="mt-2 text-muted-foreground">Learn about our traditional process, ingredients, and recipes.</p>
        </div>

        {grid}
      </div>
    </section>
  );
}
