import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const DashboardAnalyticsSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* STATS GRID */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-none shadow-none bg-muted/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* REVENUE CHART SKELETON */}
      <Card className="border-none shadow-none bg-muted/10 animate-pulse">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-60" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-32 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-87.5 w-full rounded-xl" />
        </CardContent>
      </Card>

      {/* BOTTOM GRID SKELETON */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 animate-pulse">
        <Card className="lg:col-span-4 border-none shadow-none bg-muted/10">
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-none shadow-none bg-muted/10">
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-56" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <Skeleton className="h-62.5 w-62.5 rounded-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-2 sm:p-4 md:p-6 bg-gray-50/30 min-h-screen">
      {/* HEADER SKELETON */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 rounded-md" />
        <Skeleton className="h-4 w-64 rounded-md" />
      </div>

      <div className="rounded-xl border bg-card shadow-sm p-2 sm:p-4 space-y-6">
        {/* TABS SKELETON */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-9 w-32 rounded-md shrink-0" />
          ))}
        </div>

        {/* ANALYTICS CONTENT SKELETON */}
        <DashboardAnalyticsSkeleton />
      </div>
    </div>
  );
}

export const DashboardTableSkeleton = ({ cols = 5, rows = 5 }: { cols?: number; rows?: number }) => {
  return (
    <div className="rounded-xl border bg-white shadow-sm w-full overflow-hidden p-4">
      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100 hover:bg-gray-100 border-b animate-pulse">
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="px-4 py-3 text-left">
                  <Skeleton className="h-4 w-20 bg-gray-200" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, row) => (
              <tr key={row} className="border-b">
                {Array.from({ length: cols }).map((_, col) => (
                  <td key={col} className="px-4 py-4">
                    <Skeleton className="h-4 w-full" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
