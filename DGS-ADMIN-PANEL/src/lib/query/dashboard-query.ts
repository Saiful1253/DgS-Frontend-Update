import { QueryBuilder, type RawParam } from "./base-query";

export interface DashboardQueryParams {
  days?: number;
  from?: string;
  to?: string;
  limit?: number;
  page?: number;
  expiringDays?: number;
  tab?: string;
}

/** Result of parsing, where defaults are applied */
export interface ParsedDashboardParams {
  days: number;
  from?: string;
  to?: string;
  limit: number;
  page: number;
  expiringDays: number;
  tab?: string;
}

export function parseDashboardSearchParams(
  raw: Record<string, RawParam>,
): ParsedDashboardParams {
  return {
    days: QueryBuilder.int(raw["days"], 30),
    from: QueryBuilder.clean(raw["from"]),
    to: QueryBuilder.clean(raw["to"]),
    limit: QueryBuilder.int(raw["limit"], 10),
    page: QueryBuilder.int(raw["page"], 1),
    expiringDays: QueryBuilder.int(raw["expiringDays"], 30),
    tab: QueryBuilder.clean(raw["tab"]),
  };
}

export function buildDashboardPath(
  q: DashboardQueryParams,
  options: { includeDefaults?: boolean } = {},
): string {
  let subRoute = "/dashboard/analytics";
  const tab = q.tab || (typeof window !== "undefined" ? window.location.pathname.split("/").pop() : "analytics");

  if (tab === "low-stock" || tab === "lowStock") {
    subRoute = "/dashboard/low-stock";
  } else if (tab === "top-products" || tab === "topProducts") {
    subRoute = "/dashboard/top-products";
  } else if (tab === "expiring-batches" || tab === "expiringBatches") {
    subRoute = "/dashboard/expiring-batches";
  } else if (tab === "recent-orders" || tab === "recentOrders") {
    subRoute = "/dashboard/recent-orders";
  }

  return QueryBuilder.buildPath(subRoute, q, options);
}
