import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";

export default function Loading() {
  return (
    <>
      <Navbar />
      <div className="w-full bg-white min-h-screen pb-20 pt-20 md:pt-28 overflow-x-hidden animate-pulse">
        <div className="container mx-auto px-4 md:px-6">
          {/* 1. Header Bar */}
          <div className="py-4 border-b flex items-center justify-between">
            {/* Back button mockup */}
            <Skeleton className="h-8 w-28 bg-slate-200/80 rounded-lg" />
          </div>

          <div className="py-6 md:py-10 space-y-6">
            {/* 2. Top Featured Image Mock */}
            <Skeleton className="relative aspect-[2/1] md:aspect-[30/9] w-full rounded-2xl bg-slate-200 border" />

            {/* 3. Info & Actions Row */}
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                {/* Metadata mockups */}
                <div className="flex items-center gap-3">
                  {/* Date mock */}
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="h-3.5 w-3.5 rounded-full bg-slate-300" />
                    <Skeleton className="h-3.5 w-24 bg-slate-200 rounded" />
                  </div>
                  {/* Separator Dot */}
                  <div className="w-1 h-1 bg-slate-300 rounded-full" />
                  {/* Status pill mock */}
                  <Skeleton className="h-4.5 w-16 bg-slate-200 rounded-full" />
                </div>

                {/* Actions Beside Metadata */}
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-12 rounded-lg bg-slate-200" />
                  <Skeleton className="h-8 w-12 rounded-lg bg-slate-200" />
                </div>
              </div>

              {/* Giant Title Lines Mock */}
              <div className="space-y-3">
                <Skeleton className="h-8 md:h-10 w-4/5 bg-slate-300/85 rounded-md" />
                <Skeleton className="h-8 md:h-10 w-3/5 bg-slate-300/85 rounded-md" />
              </div>
            </div>

            {/* 4. Content Area Mock */}
            <div className="pt-6 md:pt-8 border-t border-slate-100 space-y-6">
              {/* Paragraph 1 */}
              <div className="space-y-2.5">
                <Skeleton className="h-4 w-full bg-slate-200/70 rounded" />
                <Skeleton className="h-4 w-11/12 bg-slate-200/70 rounded" />
                <Skeleton className="h-4 w-4/5 bg-slate-200/70 rounded" />
                <Skeleton className="h-4 w-2/3 bg-slate-200/70 rounded" />
              </div>

              {/* Content Image Box Mock */}
              <Skeleton className="aspect-[2/1] md:aspect-[3/1] max-h-[300px] w-full rounded-xl bg-slate-200/50" />

              {/* Sub-heading Mock */}
              <Skeleton className="h-6 w-1/4 bg-slate-300/80 rounded" />

              {/* Paragraph 2 */}
              <div className="space-y-2.5">
                <Skeleton className="h-4 w-full bg-slate-200/70 rounded" />
                <Skeleton className="h-4 w-5/6 bg-slate-200/70 rounded" />
                <Skeleton className="h-4 w-3/4 bg-slate-200/70 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
