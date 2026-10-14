/* eslint-disable @typescript-eslint/no-explicit-any */
import { QueryBuilder, CommonQueryParams } from "./base-query";

export interface ApiQueryParams extends CommonQueryParams {
  status?: string;
  tab?: "hero" | "blog";
}

export function parseApiSearchParams(raw: Record<string, any>): ApiQueryParams {
  const common = QueryBuilder.parseCommon(raw);
  return {
    ...common,
    status: QueryBuilder.clean(raw.status),
    tab: QueryBuilder.clean(raw.tab) as any,
  };
}

export function buildApiPath(q: ApiQueryParams): string {
  let subRoute = "/hero";
  const tab = q.tab || (typeof window !== "undefined" ? window.location.pathname.split("/").pop() : "hero");

  if (tab === "blog") {
    subRoute = "/blogs";
  }

  return QueryBuilder.buildPath(subRoute, q, { includeDefaults: false });
}

export function buildApiQueryString(q: ApiQueryParams): string {
  const apiQ = { ...q, tab: undefined };
  return QueryBuilder.buildApiQueryString(apiQ);
}
