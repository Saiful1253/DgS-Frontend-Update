import type { WhatWeDoQuery } from "@/types/what-we-do";

const DEFAULT_LIMIT = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

function getSingle(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseWhatWeDoQuery(
  searchParams: Record<string, string | string[] | undefined>,
): WhatWeDoQuery {
  const parsedPage = Number.parseInt(getSingle(searchParams.page) ?? "", 10);
  const parsedLimit = Number.parseInt(getSingle(searchParams.limit) ?? "", 10);
  const limit = PAGE_SIZE_OPTIONS.includes(parsedLimit)
    ? parsedLimit
    : DEFAULT_LIMIT;

  return {
    page: Number.isFinite(parsedPage) ? Math.max(1, parsedPage) : 1,
    limit,
    search: getSingle(searchParams.search)?.trim() || undefined,
    category: getSingle(searchParams.category)?.trim() || undefined,
  };
}

export function buildWhatWeDoPath(
  query: WhatWeDoQuery,
  page = query.page,
): string {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (query.limit !== DEFAULT_LIMIT) params.set("limit", String(query.limit));
  if (query.search) params.set("search", query.search);
  if (query.category) params.set("category", query.category);
  const search = params.toString();
  return `/services/what-we-do${search ? `?${search}` : ""}`;
}

export function buildWhatWeDoApiQuery(query: WhatWeDoQuery): string {
  const params = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
  });
  if (query.search) params.set("search", query.search);
  if (query.category) params.set("category", query.category);
  return params.toString();
}

export const WHAT_WE_DO_PAGE_SIZE_OPTIONS = PAGE_SIZE_OPTIONS;