 
import { QueryBuilder, CommonQueryParams, type RawParam } from "./base-query";
import type { ServicePillar } from "@/lib/service-pillars";

const SORTABLE = ["name", "pillar", "display_order", "created_at", "updated_at"] as const;
export type ServiceSortBy = (typeof SORTABLE)[number];

export interface ServiceQueryParams extends CommonQueryParams {
  pillar?: ServicePillar;
  group_id?: number;
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

  // Pillars are data-driven, so any known pillar name is accepted here.
  const pillarRaw = QueryBuilder.clean(raw["pillar"]);
  const pillar = pillarRaw && pillarRaw !== "all" ? (pillarRaw as ServicePillar) : undefined;

  const statusRaw = QueryBuilder.clean(raw["status"]);
  const status = statusRaw === "active" || statusRaw === "inactive" ? statusRaw : undefined;

  const sortByRaw = QueryBuilder.clean(raw["sortBy"]);
  const sortBy = (SORTABLE as readonly string[]).includes(sortByRaw ?? "")
    ? (sortByRaw as ServiceSortBy)
    : "display_order";

  return { ...common, limit, pillar, group_id: QueryBuilder.int(raw["group_id"], 0) || undefined, status, sortBy };
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
  return QueryBuilder.buildApiQueryString({ ...q, sortOrder: q.sortOrder ?? "asc" });
}

/** `true` when anything other than paging is active — drives the "Clear" button. */
export function hasActiveServiceFilters(q: ServiceQueryParams): boolean {
  return Boolean(q.search || q.pillar || q.group_id || q.status || (q.sortBy && q.sortBy !== "display_order"));
}
