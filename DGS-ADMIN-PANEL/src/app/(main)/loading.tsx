import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function MainLayoutLoading() {
  return (
    <div className="space-y-6 p-4 animate-pulse">
      {/* Page Header Skeleton */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2 w-1/3">
          <Skeleton className="h-7 w-32 bg-slate-200" />
          <Skeleton className="h-4 w-64 bg-slate-200" />
        </div>
        <Skeleton className="h-10 w-28 rounded-lg bg-slate-200" />
      </div>

      {/* Main Content Area Skeleton */}
      <div className="rounded-xl border border-slate-100 bg-white p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-4 border-slate-50">
          <Skeleton className="h-5 w-40 bg-slate-200" />
          <Skeleton className="h-5 w-24 bg-slate-200" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-full bg-slate-200" />
          <Skeleton className="h-4 w-[95%] bg-slate-200" />
          <Skeleton className="h-4 w-[90%] bg-slate-200" />
          <Skeleton className="h-4 w-[85%] bg-slate-200" />
        </div>
      </div>
    </div>
  );
}
