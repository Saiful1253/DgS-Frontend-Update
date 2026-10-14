import { cache } from "react";
import {
  getProductsAction,
  getProductAction,
  searchProductsAction,
  getCategoriesAction,
  getCategoryAttributesAction,
  getCategorySpecsAction,
  getBrandsAction,
} from "@/actions/product.actions";
import type {
  ProductListQueryParams,
  ProductsListPayload,
} from "@/types/product/product.list";
import type { Product, Brand } from "@/types/product/product";
import type {
  Category,
  ProductCategoryAttribute,
  ProductSpecValue,
  SpecDefinition,
} from "@/types/product/product.category";

/**
 * Product service - the domain layer for the module.
 *
 * House chain: `page / component -> service -> action -> HTTP`. The service holds
 * no transport: every request is a `"use server"` action, so a client component
 * may import this module and its calls arrive as an RPC on the server, where the
 * cache policy lives.
 *
 * `getProductsResult` is for pages that need to know whether the read failed.
 * `getProducts` is the never-throw form: a reader that rethrows turns a backend
 * outage into an error page for the whole catalogue, and the page layer has an
 * "empty catalogue" state it would otherwise have to spell `.catch(() => ...)`
 * at every call site.
 *
 * The facets deliberately do *not* get a never-throw twin. They used to, and it
 * is why four permanently-broken requests went unnoticed: every one of them 404'd
 * and the wrapper flattened that into an empty array, so the filter rail simply
 * rendered with no options and no error anywhere.
 */

export type { Product, Brand };
export type {
  Category,
  ProductCategoryAttribute,
  ProductSpecValue,
  SpecDefinition,
};
export type { ProductListQueryParams, ProductsListPayload } from "@/types/product/product.list";

export type ReadResult<T> = { ok: true; data: T } | { ok: false; message: string };

const EMPTY_LIST: ProductsListPayload = {
  data: [],
  total: 0,
  page: 1,
  limit: 12,
  pages: 0,
};

// ── Reads for the page layer ─────────────────────────────────────────────────

export const getProductsResult = cache(
  async (params: ProductListQueryParams = {}): Promise<ReadResult<ProductsListPayload>> => {
    const res = await getProductsAction(params);
    if (!res.success) {
      return { ok: false, message: res.message || "Failed to load products" };
    }
    return { ok: true, data: res.data as ProductsListPayload };
  }
);

export const getProducts = cache(
  async (params: ProductListQueryParams = {}): Promise<ProductsListPayload> => {
    const result = await getProductsResult(params);
    return result.ok ? result.data : { ...EMPTY_LIST, page: params.page ?? 1, limit: params.limit ?? 12 };
  }
);

/**
 * Featured products.
 *
 * `is_featured` is a boolean column, so this is the same query with a filter -
 * there is no `/client/products/featured` route, and requesting one collided with
 * `/client/products/:slug` and 404'd.
 */
export const getFeaturedProducts = cache(
  async (limit = 9): Promise<ProductsListPayload> => {
    const result = await getProductsResult({ isFeatured: true, limit });
    return result.ok ? result.data : { ...EMPTY_LIST, limit };
  }
);

export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  if (!slug) return null;
  const res = await getProductAction(slug);
  if (!res.success) return null;
  return (res.data as Product | null) ?? null;
});

export const getCategories = cache(async (): Promise<Category[]> => {
  const res = await getCategoriesAction();
  if (!res.success) {
    console.error("[products] categories unavailable:", res.message);
    return [];
  }
  return (res.data as Category[]) ?? [];
});

export const getCategoryAttributes = cache(
  async (categoryId: number): Promise<ProductCategoryAttribute[]> => {
    const res = await getCategoryAttributesAction(categoryId);
    if (!res.success) {
      console.error(`[products] category ${categoryId} attributes unavailable:`, res.message);
      return [];
    }
    return (res.data as ProductCategoryAttribute[]) ?? [];
  }
);

/** Display label for a `Group__Label` specification key. */
function specLabel(key: string): string {
  const label = key.includes("__") ? key.slice(key.indexOf("__") + 2) : key;
  return label.replace(/[_-]+/g, " ").trim() || key;
}

/**
 * The specification filter rows for a category: a display label plus the values
 * a shopper can pick.
 *
 * Assembled here rather than in the component because it needs two endpoints -
 * `attributes` for the slots, `specs` for the values in use - and the join is a
 * data concern.
 *
 * Only filterable slots are offered, and only values that at least one visible
 * product carries. Keys are the raw `Group__Label` form because that is what
 * `specifications_json` is matched against; splitting happens only for display.
 *
 * This replaces a call whose result was used as `{ key, options }` while the
 * endpoint returned `{ id, name, unit }`. Every `def.key` was therefore
 * `undefined`, so the whole merge collapsed onto a single unnamed row.
 */
export const getCategorySpecDefinitions = cache(
  async (categoryId: number): Promise<SpecDefinition[]> => {
    if (!Number.isInteger(categoryId) || categoryId <= 0) return [];

    const [attributes, specs] = await Promise.all([
      getCategoryAttributes(categoryId),
      getCategorySpecsAction(categoryId).then((res) =>
        res.success ? ((res.data as ProductSpecValue[]) ?? []) : []
      ),
    ]);

    const filterable = attributes.filter((a) => a.is_filterable);
    // No slot metadata (an uncategorised or sparsely configured category) still
    // yields a usable filter from the values alone.
    const slots = filterable.length ? filterable : [];

    const optionsByKey = new Map<string, string[]>();
    for (const spec of specs) {
      const list = optionsByKey.get(spec.key);
      if (list) {
        if (!list.includes(spec.value)) list.push(spec.value);
      } else {
        optionsByKey.set(spec.key, [spec.value]);
      }
    }

    if (slots.length === 0) {
      return Array.from(optionsByKey, ([key, options]) => ({
        key,
        label: specLabel(key),
        options,
      }));
    }

    const byLabel = new Map(slots.map((a) => [specLabel(a.name), a.name]));
    const definitions: SpecDefinition[] = [];
    for (const [key, options] of optionsByKey) {
      const name = byLabel.get(specLabel(key));
      definitions.push({ key: name ?? key, label: specLabel(key), options });
    }
    return definitions.sort((a, b) => a.label.localeCompare(b.label));
  }
);

export const getBrands = cache(async (): Promise<Brand[]> => {
  const res = await getBrandsAction();
  if (!res.success) {
    console.error("[products] brands unavailable:", res.message);
    return [];
  }
  return (res.data as Brand[]) ?? [];
});

export const searchProducts = cache(async (query: string): Promise<Product[]> => {
  const res = await searchProductsAction(query);
  if (!res.success) return [];
  return (res.data as Product[]) ?? [];
});

// ── Reads for client components ──────────────────────────────────────────────

export const listProducts = () => getProductsAction();
export const listCategories = () => getCategoriesAction();
export const listBrands = () => getBrandsAction();
