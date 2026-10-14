import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";// Pure high-fidelity, text-free table matching the Manage Products screenshot layout exactly
export const ProductTableSkeleton = () => {
  return (
    <div className="space-y-6 w-full animate-pulse">
      {/* 1. FILTER CARD MOCK - Matches ProductFilters exactly */}
      <div className="rounded-xl border p-4 space-y-4">
        <div className="flex flex-wrap gap-3 items-start">
          {/* Search Products Input Mock */}
          <div className="w-full md:w-1/2 md:flex-1 space-y-2">
            <Skeleton className="h-5 w-28 bg-slate-200/80 rounded" />
            <Skeleton className="h-10 w-full bg-slate-100 rounded-lg border border-slate-200/40" />
          </div>

          {/* Dropdowns Mock Grid */}
          <div className="w-full md:w-auto space-y-2">
            <Skeleton className="h-5 w-16 bg-slate-200/80 rounded" />
            <Skeleton className="h-10 w-36 bg-slate-100 rounded-lg border border-slate-200/40" />
          </div>
          <div className="w-full md:w-auto space-y-2">
            <Skeleton className="h-5 w-20 bg-slate-200/80 rounded" />
            <Skeleton className="h-10 w-36 bg-slate-100 rounded-lg border border-slate-200/40" />
          </div>
          <div className="w-full md:w-auto space-y-2">
            <Skeleton className="h-5 w-14 bg-slate-200/80 rounded" />
            <Skeleton className="h-10 w-36 bg-slate-100 rounded-lg border border-slate-200/40" />
          </div>
          <div className="w-full md:w-auto space-y-2">
            <Skeleton className="h-5 w-10 bg-slate-200/80 rounded" />
            <Skeleton className="h-10 w-28 bg-slate-100 rounded-lg border border-slate-200/40" />
          </div>
        </div>

        {/* Action Buttons Mock */}
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-9 w-20 bg-slate-300/80 rounded-lg" />
        </div>
      </div>

      {/* 2. HEADING AND ADD ACTION BLOCK */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
        <div className="space-y-2">
          {/* Main Title Block */}
          <Skeleton className="h-7 w-44 bg-slate-300/90 rounded-md" />
          {/* Subtitle Line Block */}
          <Skeleton className="h-4 w-72 bg-slate-200/70 rounded-md" />
        </div>
        {/* Add Product Button Mock */}
        <Skeleton className="h-10 w-28 bg-slate-300/80 rounded-lg shrink-0" />
      </div>

      {/* 3. LIST VIEW TOGGLE MOCK */}
      <div className="flex items-center gap-2 py-1">
        <Skeleton className="h-5 w-9 rounded-full bg-slate-200" />
        <Skeleton className="h-4 w-16 bg-slate-200/70 rounded" />
      </div>

      {/* 4. HIGH FIDELITY TABLE MOCK - Matches ProductTable exactly */}
      <div className="rounded-lg border p-4 bg-card w-full overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="py-3 px-4 text-left"><Skeleton className="h-4 w-20 bg-slate-300/80" /></th>
                <th className="py-3 px-4 text-left"><Skeleton className="h-4 w-24 bg-slate-300/80" /></th>
                <th className="py-3 px-4 text-left"><Skeleton className="h-4 w-16 bg-slate-300/80" /></th>
                <th className="py-3 px-4 text-left"><Skeleton className="h-4 w-14 bg-slate-300/80" /></th>
                <th className="py-3 px-4 text-left"><Skeleton className="h-4 w-24 bg-slate-300/80" /></th>
                <th className="py-3 px-4 text-right"><Skeleton className="h-4 w-12 bg-slate-300/80 ml-auto" /></th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }).map((_, row) => (
                <tr key={row} className="border-b border-slate-100">
                  {/* PRODUCT Column Mock */}
                  <td className="py-4 px-4">
                    <Skeleton className="h-4 w-40 bg-slate-200/70 rounded" />
                  </td>
                  {/* CATEGORY Column Mock */}
                  <td className="py-4 px-4">
                    <Skeleton className="h-4 w-28 bg-slate-200/60 rounded" />
                  </td>
                  {/* SHELF LIFE Column Mock */}
                  <td className="py-4 px-4">
                    <Skeleton className="h-4 w-20 bg-slate-200/60 rounded" />
                  </td>
                  {/* STATUS Column Mock */}
                  <td className="py-4 px-4">
                    <Skeleton className="h-6 w-16 rounded-full bg-green-100/50" />
                  </td>
                  {/* UPDATE STATUS Column Mock */}
                  <td className="py-4 px-4">
                    <Skeleton className="h-8 w-24 rounded-md border border-slate-200/60 bg-slate-50/50" />
                  </td>
                  {/* ACTIONS Column Mock */}
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Skeleton className="h-8 w-8 rounded-lg border border-slate-200/50 bg-slate-50/80" />
                      <Skeleton className="h-8 w-8 rounded-lg border border-slate-200/50 bg-slate-50/80" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Full page loader containing the top horizontal routing tab strip skeleton
export const ProductPageSkeleton = () => {
  return <ProductTableSkeleton />;
};

// Pure high-fidelity mockup for the Manage Variants tab layout matching VariantsClient
export const VariantTableSkeleton = () => {
  return (
    <div className="space-y-6 w-full animate-pulse">
      {/* Loop of 3 product groups */}
      {Array.from({ length: 3 }).map((_, gIdx) => {
        const borderColors = ["border-l-blue-500", "border-l-purple-500", "border-l-emerald-500"];
        const borderCol = borderColors[gIdx % borderColors.length];
        return (
          <div
            key={gIdx}
            className={`rounded-xl border border-l-4 shadow-sm bg-white overflow-hidden ${borderCol}`}
          >
            {/* Group Header */}
            <div className="px-4 py-2 border-b bg-gray-50/50 flex items-center gap-2">
              <Skeleton className="h-4 w-4 bg-slate-200 rounded" />
              <Skeleton className="h-4 w-48 bg-slate-300 rounded" />
              <Skeleton className="h-5 w-20 bg-slate-200 rounded-full ml-auto" />
            </div>

            <div className="overflow-x-auto scrollbar-hide">
              <Table className="min-w-[1200px]">
                <TableHeader>
                  <TableRow className="bg-gray-100 hover:bg-gray-100">
                    <TableHead className="w-[110px]"><Skeleton className="h-4 w-12 bg-slate-300/80" /></TableHead>
                    <TableHead className="w-[200px]"><Skeleton className="h-4 w-20 bg-slate-300/80" /></TableHead>
                    <TableHead className="w-[180px]"><Skeleton className="h-4 w-16 bg-slate-300/80" /></TableHead>
                    <TableHead className="w-[100px]"><Skeleton className="h-4 w-16 bg-slate-300/80" /></TableHead>
                    <TableHead className="w-[100px]"><Skeleton className="h-4 w-12 bg-slate-300/80" /></TableHead>
                    <TableHead className="w-[110px]"><Skeleton className="h-4 w-24 bg-slate-300/80" /></TableHead>
                    <TableHead className="w-[80px]"><Skeleton className="h-4 w-12 bg-slate-300/80" /></TableHead>
                    <TableHead className="w-[100px]"><Skeleton className="h-4 w-12 bg-slate-300/80" /></TableHead>
                    <TableHead className="w-[130px]"><Skeleton className="h-4 w-20 bg-slate-300/80" /></TableHead>
                    <TableHead className="w-[120px] text-right"><Skeleton className="h-4 w-14 bg-slate-300/80 ml-auto" /></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 2 }).map((_, rIdx) => (
                    <TableRow key={rIdx} className="hover:bg-gray-50/50">
                      <TableCell><Skeleton className="h-4 w-20 bg-slate-200/70" /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Skeleton className="h-4 w-32 bg-slate-200/70" />
                          {rIdx === 0 && <Skeleton className="h-4 w-12 bg-blue-100/50 rounded-full" />}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Skeleton className="h-4 w-14 bg-slate-100 rounded" />
                          <Skeleton className="h-4 w-10 bg-slate-100 rounded" />
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-4 w-12 bg-slate-200/70" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-10 bg-slate-200/70" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16 bg-slate-300/80 font-bold" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12 bg-slate-200/70" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16 rounded bg-green-100/50" /></TableCell>
                      <TableCell><Skeleton className="h-7 w-24 rounded border bg-slate-50/50" /></TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Skeleton className="h-7 w-7 rounded bg-slate-200/70" />
                          <Skeleton className="h-7 w-7 rounded bg-slate-200/70" />
                          <Skeleton className="h-7 w-7 rounded bg-slate-200/70" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Full page loader for the Variants tab matching ManageVariantsTab layout exactly
export const VariantPageSkeleton = () => {
  return (
    <div className="space-y-6 w-full">
      {/* Tab header row mockup */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between animate-pulse">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32 bg-slate-300/90 rounded-md" />
          <Skeleton className="h-4 w-72 bg-slate-200/70 rounded-md" />
        </div>
        <Skeleton className="h-10 w-28 bg-slate-300/80 rounded-lg shrink-0" />
      </div>

      {/* Product table skeleton */}
      <VariantTableSkeleton />
    </div>
  );
};

// Pure high-fidelity mockup for the Manage Categories tab layout matching CategoriesClient
// Brands page skeleton — search bar + card grid + pagination
export const BrandPageSkeleton = () => {
  return (
    <div className="space-y-6 w-full animate-pulse">
      {/* Search Filter Box */}
      <div className="rounded-xl border p-4 bg-card/30">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2 flex-1 max-w-md">
            <Skeleton className="h-3 w-28 bg-slate-300/80 rounded" />
            <div className="flex gap-2">
              <Skeleton className="h-10 flex-1 rounded-md bg-slate-200/70" />
              <Skeleton className="h-10 w-20 rounded-md bg-slate-300/80" />
            </div>
          </div>
          <Skeleton className="h-10 w-28 rounded-lg bg-slate-300/80 shrink-0" />
        </div>
      </div>

      {/* Main Content Card */}
      <div className="rounded-xl border p-4 sm:p-6 bg-card/30 space-y-6">
        {/* Header Row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between border-b pb-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-24 bg-slate-300/90 rounded-md" />
            <Skeleton className="h-4 w-72 bg-slate-200/70 rounded-md" />
          </div>
        </div>

        {/* Card Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card shadow-sm overflow-hidden">
              {/* Image Header */}
              <Skeleton className="h-40 w-full bg-slate-200/60" />
              {/* Body */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Skeleton className="h-5 w-28 bg-slate-200/70 rounded" />
                  <Skeleton className="h-5 w-14 rounded-full bg-green-100/50" />
                </div>
                <Skeleton className="h-3 w-full bg-slate-200/50 rounded" />
                <Skeleton className="h-3 w-3/4 bg-slate-200/50 rounded" />
                <div className="flex items-center justify-between border-t pt-3 mt-2">
                  <Skeleton className="h-3 w-16 bg-slate-200/50 rounded" />
                  <Skeleton className="h-3 w-20 bg-slate-200/50 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="border-t pt-4 flex justify-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-8 rounded-md bg-slate-200/60" />
          ))}
        </div>
      </div>
    </div>
  );
};

// Category page skeleton — heading + table + pagination (matches ManageCategoriesTab)
export const CategoryTableSkeleton = () => {
  return (
    <div className="space-y-6 w-full animate-pulse">
      {/* 1. HEADING AND ADD ACTION BLOCK */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          {/* Main Title Block */}
          <Skeleton className="h-7 w-36 bg-slate-300/90 rounded-md" />
          {/* Subtitle Line Block */}
          <Skeleton className="h-4 w-64 bg-slate-200/70 rounded-md" />
        </div>
        {/* Add Category Button Mock */}
        <Skeleton className="h-10 w-28 bg-slate-300/80 rounded-lg shrink-0" />
      </div>

      {/* 2. HIGH FIDELITY TABLE MOCK - Matches CategoriesClient exactly */}
      <div className="rounded-xl border bg-card shadow-sm w-full overflow-hidden p-4">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="py-3 px-4 text-left"><Skeleton className="h-4 w-16 bg-slate-300/80" /></th>
                <th className="py-3 px-4 text-left"><Skeleton className="h-4 w-32 bg-slate-300/80" /></th>
                <th className="py-3 px-4 text-left"><Skeleton className="h-4 w-14 bg-slate-300/80" /></th>
                <th className="py-3 px-4 text-left"><Skeleton className="h-4 w-24 bg-slate-300/80" /></th>
                <th className="py-3 px-4 text-right"><Skeleton className="h-4 w-12 bg-slate-300/80 ml-auto" /></th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, row) => (
                <tr key={row} className="border-b border-slate-100">
                  {/* Name Column Mock */}
                  <td className="py-4 px-4">
                    <Skeleton className="h-4 w-32 bg-slate-200/70 rounded" />
                  </td>
                  {/* Description Column Mock */}
                  <td className="py-4 px-4">
                    <Skeleton className="h-4 w-48 bg-slate-200/60 rounded" />
                  </td>
                  {/* Status Column Mock */}
                  <td className="py-4 px-4">
                    <Skeleton className="h-6 w-16 rounded-full bg-green-100/50" />
                  </td>
                  {/* Update Status Column Mock */}
                  <td className="py-4 px-4">
                    <Skeleton className="h-8 w-24 rounded-md border border-slate-200/60 bg-slate-50/50" />
                  </td>
                  {/* Actions Column Mock */}
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Skeleton className="h-8 w-8 rounded-lg border border-slate-200/50 bg-slate-50/80" />
                      <Skeleton className="h-8 w-8 rounded-lg border border-slate-200/50 bg-slate-50/80" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="border-t pt-4 flex justify-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-8 rounded-md bg-slate-200/60" />
        ))}
      </div>
    </div>
  );
};

export const CategoryTableOnlySkeleton = () => {
  return (
    <div className="rounded-xl border bg-card shadow-sm w-full overflow-hidden p-4 animate-pulse">
      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="py-3 px-4 text-left"><Skeleton className="h-4 w-16 bg-slate-300/80" /></th>
              <th className="py-3 px-4 text-left"><Skeleton className="h-4 w-32 bg-slate-300/80" /></th>
              <th className="py-3 px-4 text-left"><Skeleton className="h-4 w-14 bg-slate-300/80" /></th>
              <th className="py-3 px-4 text-left"><Skeleton className="h-4 w-24 bg-slate-300/80" /></th>
              <th className="py-3 px-4 text-right"><Skeleton className="h-4 w-12 bg-slate-300/80 ml-auto" /></th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }).map((_, row) => (
              <tr key={row} className="border-b border-slate-100">
                <td className="py-4 px-4">
                  <Skeleton className="h-4 w-32 bg-slate-200/70 rounded" />
                </td>
                <td className="py-4 px-4">
                  <Skeleton className="h-4 w-48 bg-slate-200/60 rounded" />
                </td>
                <td className="py-4 px-4">
                  <Skeleton className="h-6 w-16 rounded-full bg-green-100/50" />
                </td>
                <td className="py-4 px-4">
                  <Skeleton className="h-8 w-24 rounded-md border border-slate-200/60 bg-slate-50/50" />
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <Skeleton className="h-8 w-8 rounded-lg border border-slate-200/50 bg-slate-50/80" />
                    <Skeleton className="h-8 w-8 rounded-lg border border-slate-200/50 bg-slate-50/80" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// EMI Settings page skeleton — banner + two-column form + toggle/save (matches EmiSettingsClient)
export const EmiSettingsSkeleton = () => {
  return (
    <div className="space-y-6 w-full animate-pulse">
      {/* Top Banner */}
      <div className="rounded-xl border bg-card p-4 sm:p-6 shadow-sm flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-lg bg-amber-100/60" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-64 bg-slate-300/90 rounded-md" />
          <Skeleton className="h-3 w-96 bg-slate-200/70 rounded-md" />
        </div>
      </div>

      {/* Two-column form grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Form fields card */}
        <div className="rounded-xl border bg-card p-4 sm:p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 border-b pb-3">
            <Skeleton className="h-5 w-5 rounded bg-slate-200/70" />
            <Skeleton className="h-5 w-36 bg-slate-300/80 rounded" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-40 bg-slate-200/60 rounded" />
                <Skeleton className="h-10 w-full rounded-md bg-slate-200/60" />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Info card */}
        <div className="rounded-xl border bg-card p-4 sm:p-6 space-y-4 shadow-sm bg-slate-50/50">
          <div className="flex items-center gap-2 border-b pb-3">
            <Skeleton className="h-5 w-5 rounded bg-slate-200/70" />
            <Skeleton className="h-5 w-48 bg-slate-300/80 rounded" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-3 w-full bg-slate-200/50 rounded" />
            <Skeleton className="h-3 w-full bg-slate-200/50 rounded" />
            <Skeleton className="h-3 w-3/4 bg-slate-200/50 rounded" />
          </div>
        </div>
      </div>

      {/* Bottom: Toggle + Save button */}
      <div className="flex justify-between items-center border-t pt-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-28 bg-slate-200/60 rounded" />
          <Skeleton className="h-6 w-11 rounded-full bg-slate-200/70" />
        </div>
        <Skeleton className="h-10 w-40 rounded-md bg-slate-300/80" />
      </div>
    </div>
  );
};

