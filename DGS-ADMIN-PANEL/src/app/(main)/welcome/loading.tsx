import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function WelcomeLoading() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4 bg-gray-50/30">
      <Card className="w-full max-w-md shadow-sm rounded-2xl border bg-white overflow-hidden animate-pulse">
        <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
          
          {/* Top Status Indicators Skeleton */}
          <div className="w-full flex items-center justify-between border-b pb-4 border-slate-100">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded-full bg-slate-200" />
              <Skeleton className="h-3 w-28 bg-slate-200" />
            </div>
            <Skeleton className="h-2 w-2 rounded-full bg-slate-200" />
          </div>

          {/* Central Welcoming Layout Skeleton */}
          <div className="space-y-4 py-2 flex flex-col items-center w-full">
            <Skeleton className="h-12 w-12 rounded-xl bg-slate-200" />
            
            <div className="space-y-2 w-full flex flex-col items-center">
              <Skeleton className="h-6 w-36 bg-slate-200" />
              <div className="space-y-1.5 w-full max-w-xs flex flex-col items-center">
                <Skeleton className="h-3 w-full bg-slate-200" />
                <Skeleton className="h-3 w-[90%] bg-slate-200" />
                <Skeleton className="h-3 w-[80%] bg-slate-200" />
              </div>
            </div>
          </div>

          {/* Bottom active details Skeleton */}
          <div className="w-full flex items-center justify-center pt-4 border-t border-slate-50">
            <Skeleton className="h-3 w-20 bg-slate-200" />
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
