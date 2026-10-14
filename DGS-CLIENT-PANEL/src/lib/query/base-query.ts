/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Base types and utilities for query string builders.
 */

export type RawParam = string | string[] | undefined;

export interface QueryOptions {
  includeDefaults?: boolean;
}

export interface CommonQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const QueryBuilder = {
  /**
   * Safe access to the first value of a multi-value parameter.
   */
  first(v: RawParam): string | undefined {
    if (v == null) return undefined;
    return Array.isArray(v) ? v[0] : v;
  },

  /**
   * Cleans a parameter: trims, removes empty strings, and handles "all" as undefined.
   */
  clean(v: RawParam): string | undefined {
    const s = this.first(v);
    if (!s || s === "all") return undefined;
    const t = s.trim();
    return t ? t : undefined;
  },

  /**
   * Parses an integer parameter with a fallback.
   */
  int(v: RawParam, fallback: number): number {
    const parsed = Number.parseInt(this.first(v) ?? "", 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  },

  /**
   * Parses common fields: page, limit, search, sortBy, sortOrder.
   */
  parseCommon(raw: Record<string, RawParam>): CommonQueryParams {
    const sortOrderRaw = this.clean(raw["sortOrder"]);
    const sortOrder =
      sortOrderRaw === "asc" || sortOrderRaw === "desc"
        ? (sortOrderRaw as "asc" | "desc")
        : undefined;

    return {
      page: this.int(raw["page"], 1),
      limit: Math.min(100, this.int(raw["limit"], 20)),
      search: this.clean(raw["search"]),
      sortBy: this.clean(raw["sortBy"]),
      sortOrder,
    };
  },

  /**
   * Builds URLSearchParams from an object, filtering out empty values.
   */
  buildParams(q: Record<string, any>, options: QueryOptions = {}): URLSearchParams {
    const sp = new URLSearchParams();
    const includeDefaults = options.includeDefaults ?? true;

    // Standard pagination handling
    if (includeDefaults || q.page != null) sp.set("page", String(q.page ?? 1));
    if (includeDefaults || q.limit != null) sp.set("limit", String(q.limit ?? 20));

    // Dynamic handling for other keys
    Object.entries(q).forEach(([key, value]) => {
      if (key === "page" || key === "limit") return;
      if (
        value === null ||
        value === undefined ||
        value === "" ||
        value === "all"
      )
        return;

      const s = String(value).trim();
      if (s) sp.set(key, s);
    });

    return sp;
  },

  /**
   * Builds a full path string with query parameters.
   */
  buildPath(
    basePath: string,
    q: Record<string, any>,
    options: QueryOptions = {}
  ): string {
    const sp = this.buildParams(q, options);
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  },

  /**
   * Builds just the query string for API calls.
   */
  buildApiQueryString(q: Record<string, any>): string {
    const sp = this.buildParams(q, { includeDefaults: true });
    const qs = sp.toString();
    return qs ? `?${qs}` : "";
  }
};
