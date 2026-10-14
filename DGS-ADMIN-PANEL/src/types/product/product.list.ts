import type { Product } from "./product";

/** Inner payload under `data` in the products list API envelope. */
export interface ProductsListPayload {
  data: Product[];
  total: number;
  page: number;
  limit: number;
}

/** Top-level JSON from GET /products (matches backend envelope). */
export interface ProductsListApiEnvelope {
  success: boolean;
  data: ProductsListPayload;
  timestamp?: string;
}

/** Query params for GET /products (and the Next.js /products page URL). */
export interface ProductListQueryParams {
  search?: string;
  categoryId?: string;
  status?: string;
  stockLevel?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
  /** Active tab on the products page (products | categories | variants) */
  tab?: string;
}
