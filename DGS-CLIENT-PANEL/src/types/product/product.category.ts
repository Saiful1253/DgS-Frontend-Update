export interface Category {
  id: string;
  name: string;
  description: string;
  slug: string;
  parent_id?: string | number | null;
  image_url?: string | null;
  status: "active" | "inactive" | "archived";
  created_at: string;
  updated_at: string;
}

/**
 * A specification slot defined per category, e.g. "Capacity" with unit "GB".
 *
 * The storefront uses these to build the specification filter form; the values
 * are submitted as `specifications` and matched against
 * `products.specifications_json`.
 */
export interface ProductCategoryAttribute {
  id: number;
  category_id: number;
  name: string;
  unit?: string | null;
  is_filterable: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** One distinct specification value in use, as aggregated by the backend. */
export interface ProductSpecValue {
  /** The `Group__Label` key as written into `products.specifications_json`. */
  key: string;
  value: string;
  count: number;
}

/**
 * A specification filter row: the slot's display label plus the values a shopper
 * can actually pick.
 *
 * Assembled by the service from `attributes` (the slots) and `specs` (the
 * values); neither endpoint returns this shape on its own.
 */
export interface SpecDefinition {
  key: string;
  label: string;
  options: string[];
}
