import type { ProductListQueryParams, ProductSort } from "@/types/product/product.list";
import { QueryBuilder, type RawParam } from "./base-query";

const SORTS: ProductSort[] = ["newest", "price_asc", "price_desc"];

/**
 * Non-negative money value, or undefined.
 *
 * `Number("")` is 0 and `Number("abc")` is NaN, so a blank or junk
 * `?min_price=` would otherwise become a real 0 lower bound and filter the
 * catalogue down to free products.
 */
function price(raw: RawParam): number | undefined {
  const s = QueryBuilder.clean(raw);
  if (s === undefined) return undefined;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

function sort(raw: RawParam): ProductSort | undefined {
  const s = QueryBuilder.clean(raw);
  return SORTS.includes(s as ProductSort) ? (s as ProductSort) : undefined;
}

/**
 * Maps the browser URL onto the catalogue API's query.
 *
 * The URL keeps snake_case (`min_price`) because it is the public, already
 * indexed shape; the API takes the backend DTO's camelCase (`minPrice`). This is
 * the one place the two are translated.
 *
 * `specifications` is a JSON object the spec filter form builds, passed through
 * as a string. `product.validation.ts` bounds its length and the backend parses
 * it into a jsonb containment probe.
 */
export function parseProductsSearchParams(
  raw: Record<string, RawParam>,
): ProductListQueryParams {
  return {
    page: QueryBuilder.int(raw["page"], 1),
    limit: Math.min(60, QueryBuilder.int(raw["limit"], 12)),
    search: QueryBuilder.clean(raw["search"]),
    category: QueryBuilder.clean(raw["category"]),
    brand: QueryBuilder.clean(raw["brand"]),
    sort: sort(raw["sort"]),
    minPrice: price(raw["min_price"]),
    maxPrice: price(raw["max_price"]),
    specifications: QueryBuilder.clean(raw["specifications"]),
  };
}

/** Builds `/products?...` for client navigation. */
export function buildProductsPath(
  q: Partial<ProductListQueryParams>,
  options: { includeDefaults?: boolean } = {},
): string {
  return QueryBuilder.buildPath("/products", q, options);
}

/** Builds `?page=1&limit=12&...` for `GET /client/products`. */
export function buildProductApiQueryString(q: ProductListQueryParams): string {
  return QueryBuilder.buildApiQueryString({ ...q });
}
