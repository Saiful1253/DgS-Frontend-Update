/**
 * Compatibility shim.
 *
 * The product module now lives in `@/services/product/product.service`,
 * following the admin panel's layout. Re-exported rather than deleted so the
 * existing importers under `app/` keep resolving; new code should import the
 * canonical path directly.
 *
 * `getProductBySlug` is kept as an alias of `getProductBySlug`: the route segment
 * is `[slug]` and the backend resolves by slug, so the old name was misleading.
 */
export {
  getProducts,
  getProductsResult,
  getFeaturedProducts,
  getProductBySlug,
  getCategories,
  getCategoryAttributes,
  getCategorySpecDefinitions,
  getBrands,
  searchProducts,
  listProducts,
  listCategories,
  listBrands,
} from "@/services/product/product.service";

export type { ReadResult } from "@/services/product/product.service";
export type {
  ProductListQueryParams,
  ProductSort,
  ProductsListPayload,
} from "@/types/product/product.list";
export type { Brand, Product } from "@/types/product/product";
export type {
  Category,
  ProductCategoryAttribute,
  ProductSpecValue,
  SpecDefinition,
} from "@/types/product/product.category";
