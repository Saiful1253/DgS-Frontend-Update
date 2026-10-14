/**
 * Compatibility shim.
 *
 * Product actions now live in `@/actions/product.actions`, following the admin
 * panel's layout. Re-exported rather than deleted so existing importers keep
 * resolving.
 */
export {
  getProductsAction,
  getProductAction,
  searchProductsAction,
  getCategoriesAction,
  getCategoryAttributesAction,
  getCategorySpecsAction,
  getBrandsAction,
} from "@/actions/product.actions";
