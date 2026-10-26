export type WhyChooseUsSortBy = "created_at" | "title" | "display_order";
export type WhyChooseUsStatus = "all" | "active" | "inactive";

export interface WhyChooseUsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: WhyChooseUsStatus;
  sortBy?: WhyChooseUsSortBy;
  sortOrder?: "asc" | "desc";
}

export function parseWhyChooseUsSearchParams(
  sp: Record<string, string | string[] | undefined>
): WhyChooseUsQueryParams {
  const getSingle = (val: string | string[] | undefined): string | undefined =>
    Array.isArray(val) ? val[0] : val;

  const page = Math.max(1, parseInt(getSingle(sp.page) || "1", 10) || 1);
  const limit = Math.max(1, parseInt(getSingle(sp.limit) || "20", 10) || 20);
  const search = getSingle(sp.search)?.trim() || undefined;

  const rawStatus = getSingle(sp.status)?.toLowerCase();
  const status: WhyChooseUsStatus =
    rawStatus === "active" || rawStatus === "inactive" ? rawStatus : "all";

  const rawSort = getSingle(sp.sortBy)?.toLowerCase();
  const sortBy: WhyChooseUsSortBy =
    rawSort === "title"
      ? "title"
      : rawSort === "display_order"
      ? "display_order"
      : "created_at";

  const rawOrder = getSingle(sp.sortOrder)?.toLowerCase();
  const sortOrder = rawOrder === "asc" ? "asc" : "desc";

  return { page, limit, search, status, sortBy, sortOrder };
}

export function buildWhyChooseUsApiQueryString(params: WhyChooseUsQueryParams): string {
  const sp = new URLSearchParams();
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  if (params.limit && params.limit !== 20) sp.set("limit", String(params.limit));
  if (params.search) sp.set("search", params.search);
  if (params.status && params.status !== "all") sp.set("status", params.status);
  if (params.sortBy && params.sortBy !== "created_at") sp.set("sortBy", params.sortBy);
  if (params.sortOrder && params.sortOrder !== "desc") sp.set("sortOrder", params.sortOrder);
  return sp.toString();
}

export function buildWhyChooseUsPath(
  page: number,
  params: WhyChooseUsQueryParams
): string {
  const query = buildWhyChooseUsApiQueryString({ ...params, page });
  return `/services/why-coose-us${query ? `?${query}` : ""}`;
}

export function hasActiveWhyChooseUsFilters(params: WhyChooseUsQueryParams): boolean {
  return Boolean(
    params.search ||
    (params.status && params.status !== "all") ||
    (params.sortBy && params.sortBy !== "created_at") ||
    (params.sortOrder && params.sortOrder !== "desc")
  );
}
