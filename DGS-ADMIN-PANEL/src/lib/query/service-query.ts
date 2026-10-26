import { QueryBuilder, CommonQueryParams, type RawParam } from "./base-query";
import type { ServiceCategory } from "@/types/service";

const SORTABLE = ["name", "category", "display_order", "created_at", "updated_at"] as const;
export type ServiceSortBy = (typeof SORTABLE)[number];

export interface ServiceQueryParams extends CommonQueryParams {
  category?: ServiceCategory;
  pillar?: ServiceCategory;
  status?: "active" | "inactive";
  sortBy?: ServiceSortBy;
}

/**
 * Parse Next.js `searchParams` into a validated services query.
 * `all` collapses to `undefined` so the URL stays canonical.
 */
export function parseServiceSearchParams(raw: Record<string, RawParam>): ServiceQueryParams {
  const common = QueryBuilder.parseCommon(raw);
  const limit = raw["limit"] ? common.limit : 21;

  const categoryRaw = QueryBuilder.clean(raw["category"] ?? raw["pillar"]);
  const category = categoryRaw && categoryRaw !== "all" ? (categoryRaw as ServiceCategory) : undefined;

  const statusRaw = QueryBuilder.clean(raw["status"]);
  const status = statusRaw === "active" || statusRaw === "inactive" ? statusRaw : undefined;

  const sortByRaw = QueryBuilder.clean(raw["sortBy"]);
  const sortBy = (SORTABLE as readonly string[]).includes(sortByRaw ?? "")
    ? (sortByRaw as ServiceSortBy)
    : "display_order";

  return { ...common, limit, category, status, sortBy };
}

/** `/services?...` — hand this straight to `AppPagination appliedPath`. */
export function buildServicePath(page: number, q: ServiceQueryParams): string {
  return QueryBuilder.buildPath(
    "/services",
    { ...q, page, sortOrder: q.sortOrder ?? "asc" },
    { includeDefaults: false }
  );
}

/** `?pillar=…&page=…` — hand this straight to `serverFetch.get`. */
export function buildServiceApiQueryString(q: ServiceQueryParams): string {
  const apiParams: Record<string, any> = { ...q, sortOrder: q.sortOrder ?? "asc" };
  if (q.category && !q.pillar) {
    apiParams.pillar = q.category;
  }
  return QueryBuilder.buildApiQueryString(apiParams);
}

/** `true` when anything other than paging is active — drives the "Clear" button. */
export function hasActiveServiceFilters(q: ServiceQueryParams): boolean {
  return Boolean(q.search || q.category || q.status || (q.sortBy && q.sortBy !== "display_order"));
}
