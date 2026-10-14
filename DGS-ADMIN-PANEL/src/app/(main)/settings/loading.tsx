import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      {/* Title */}
      <Skeleton className="h-7 w-48 rounded-md" />

      {/* Form Fields Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="col-span-full space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>

        <div className="col-span-full space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-24 w-full rounded-md" />
        </div>
      </div>

      {/* Bottom section with cards */}
      <div className="space-y-4 pt-4">
        <Skeleton className="h-6 w-32 rounded-md" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end border-t pt-6 mt-6">
        <Skeleton className="h-10 w-44 rounded-md" />
      </div>
    </div>
  );
}
