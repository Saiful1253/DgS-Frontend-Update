import { Skeleton } from "@/components/ui/skeleton";

export default function UsersSettingsLoading() {
  return (
    <div className="space-y-6">
      {/* Title */}
      <Skeleton className="h-7 w-60 rounded-md" />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-px">
        <Skeleton className="h-9 w-28 rounded-t-lg" />
        <Skeleton className="h-9 w-28 rounded-t-lg" />
        <Skeleton className="h-9 w-28 rounded-t-lg" />
      </div>

      {/* Search Bar / Add Button Action Row */}
      <div className="flex items-center justify-between gap-4 mt-6">
        <Skeleton className="h-10 w-72 rounded-md" />
        <Skeleton className="h-10 w-36 rounded-md" />
      </div>

      {/* Table Skeleton */}
      <div className="rounded-lg border mt-4">
        <div className="space-y-3 p-4">
          <Skeleton className="h-10 w-full rounded-md" />
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      </div>
    </div>
  );
}
