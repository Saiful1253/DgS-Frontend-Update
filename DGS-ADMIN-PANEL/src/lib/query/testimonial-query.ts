import type { TestimonialQueryParams } from "@/types/testimonial";

export function buildTestimonialsApiQueryString(query: TestimonialQueryParams = {}): string {
  const sp = new URLSearchParams();

  if (query.page && query.page > 0) sp.set("page", String(query.page));
  if (query.limit && query.limit > 0) sp.set("limit", String(query.limit));

  if (query.status && query.status !== "all") {
    sp.set("status", query.status);
  }

  if (query.type && query.type !== "all") {
    sp.set("type", query.type);
  }

  if (query.is_featured !== undefined) {
    sp.set("is_featured", String(query.is_featured));
  }

  if (query.search && query.search.trim()) {
    sp.set("search", query.search.trim());
  }

  if (query.sortBy) {
    sp.set("sortBy", query.sortBy);
  }

  if (query.order) {
    sp.set("order", query.order);
  }

  return sp.toString();
}

export function buildTestimonialsPath(
  basePath: string,
  params: Record<string, unknown> = {}
): string {
  const sp = new URLSearchParams();

  Object.entries(params).forEach(([key, val]) => {
    if (val === undefined || val === null || val === "" || val === "all") return;
    sp.set(key, String(val));
  });

  const query = sp.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function parseTestimonialSearchParams(
  searchParams: Record<string, string | string[] | undefined> = {}
): TestimonialQueryParams {
  const pageStr = typeof searchParams.page === "string" ? searchParams.page : undefined;
  const limitStr = typeof searchParams.limit === "string" ? searchParams.limit : undefined;
  const status = typeof searchParams.status === "string" ? searchParams.status : undefined;
  const type = typeof searchParams.type === "string" ? searchParams.type : undefined;
  const search = typeof searchParams.search === "string" ? searchParams.search : undefined;
  const is_featured_str = typeof searchParams.is_featured === "string" ? searchParams.is_featured : undefined;
  const sortBy = typeof searchParams.sortBy === "string" ? searchParams.sortBy : "created_at";
  const order = typeof searchParams.order === "string" && searchParams.order.toLowerCase() === "asc" ? "asc" : "desc";

  return {
    page: pageStr ? Math.max(1, parseInt(pageStr, 10) || 1) : 1,
    limit: limitStr ? Math.max(1, parseInt(limitStr, 10) || 10) : 10,
    status: status || "all",
    type: type || "all",
    search: search || "",
    is_featured: is_featured_str !== undefined ? is_featured_str === "true" : undefined,
    sortBy,
    order,
  };
}
