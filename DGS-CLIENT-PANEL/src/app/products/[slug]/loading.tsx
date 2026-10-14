import React from "react";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductDetailsLoading() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50/20 pt-20 md:pt-28 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          {/* Back Button Skeleton */}
          <div className="mb-6">
            <Skeleton className="h-6 w-32 rounded-lg" />
          </div>

          {/* Main Two-Column Panel Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start bg-white dark:bg-zinc-900/40 rounded-3xl border border-slate-100 dark:border-zinc-800/80 p-5 md:p-8 shadow-sm">
            {/* Left Column: Image Gallery Skeleton */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <Skeleton className="w-full aspect-3/4 max-h-[650px] rounded-2xl" />
              <div className="flex items-center gap-3 py-1">
                <Skeleton className="w-16 h-16 rounded-xl" />
                <Skeleton className="w-16 h-16 rounded-xl" />
                <Skeleton className="w-16 h-16 rounded-xl" />
              </div>
            </div>

            {/* Right Column: Info & Config Skeleton */}
            <div className="lg:col-span-7 flex flex-col gap-6 w-full">
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-24 rounded-md" />
                  <Skeleton className="h-5 w-20 rounded-md" />
                </div>
                <Skeleton className="h-10 w-3/4 rounded-xl" />
                {/* Description Skeleton */}
                <div className="space-y-1.5 pt-1">
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-5/6 rounded" />
                </div>
              </div>

              {/* Pricing Box Skeleton */}
              <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-zinc-900/30 border border-slate-100 dark:border-zinc-800/80 space-y-2">
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="h-8 w-36 rounded-md" />
              </div>

              {/* Variant Switcher Skeleton */}
              <div className="space-y-3">
                <Skeleton className="h-4 w-28 rounded" />
                <div className="flex gap-2.5">
                  <Skeleton className="h-10 w-24 rounded-xl" />
                  <Skeleton className="h-10 w-24 rounded-xl" />
                </div>
              </div>

              {/* Quantity Selector Skeleton */}
              <div className="space-y-3">
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="h-16 w-full rounded-2xl" />
              </div>

              {/* Specifications Skeleton */}
              <div className="space-y-3">
                <Skeleton className="h-4 w-28 rounded" />
                <div className="rounded-2xl border border-slate-100 dark:border-zinc-800/80 p-3 bg-white dark:bg-zinc-900/10 space-y-3">
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-full rounded" />
                </div>
              </div>

              {/* Actions Skeleton */}
              <div className="pt-4 space-y-3">
                <Skeleton className="h-12 w-full rounded-xl" />
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <Skeleton className="h-12 rounded-xl" />
                  <Skeleton className="h-12 rounded-xl" />
                  <Skeleton className="h-12 rounded-xl" />
                </div>
              </div>
            </div>


          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
