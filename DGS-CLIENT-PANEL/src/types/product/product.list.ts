import type { Product } from "./product";

/** Inner payload under `data` in the products list API envelope. */
export interface ProductsListPayload {
  data: Product[];
  total: number;
  page: number;
  limit: number;
  /** Total page count, so the pager does not have to recompute from `limit`. */
  pages: number;
}

/** Top-level JSON from GET /client/products (matches backend envelope). */
export interface ProductsListApiEnvelope {
  success: boolean;
  data: ProductsListPayload;
  timestamp?: string;
}

/** The three sort options the catalogue UI offers. */
export type ProductSort = "newest" | "price_asc" | "price_desc";

/**
 * Query params for `GET /client/products`.
 *
 * The names are the API's own (camelCase, matching the backend DTO), not the
 * browser URL's (`min_price`) — `parseProductsSearchParams` maps one to the
 * other.
 */
export interface ProductListQueryParams {
  search?: string;
  category?: string;
  brand?: string;
  sort?: ProductSort;
  minPrice?: number;
  maxPrice?: number;
  isFeatured?: boolean;
  specifications?: string;
  page?: number;
  limit?: number;
}