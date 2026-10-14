"use server";

import { fail, failWithStatus, ok, type ActionResult } from "./action-result";
import { publicFetch } from "@/lib/server-fetch";
import { extractApiErrorMessage, parseApiResponse } from "@/lib/api-error";

import { buildProductApiQueryString } from "@/lib/query/product-query";
import type {
  ProductListQueryParams,
  ProductsListPayload,
} from "@/types/product/product.list";
import type { Brand, Product } from "@/types/product/product";
import type {
  Category,
  ProductCategoryAttribute,
  ProductSpecValue,
} from "@/types/product/product.category";

/**
 * Product actions - the transport boundary for the module.
 *
 * House chain: `page / component -> service -> action -> HTTP`. Every request the
 * module makes is declared here, so the cache policy and the error handling sit
 * in one place and a `"use client"` component can reach them through the service
 * forwarders.
 *
 * Unlike the admin panel this module has no write surface: the catalogue routes
 * are `@Public()` and every writer needs an admin JWT, so `createProductAction`,
 * `updateProductAction`, `deleteProductAction` and the upload actions have no
 * counterpart here.
 *
 * Every route below was previously wrong and failed on every request:
 *   - `/client/products/featured` collided with `/client/products/:slug`, so the
 *     backend looked up a product whose slug was literally "featured" and 404'd.
 *     `is_featured` is a boolean column, so it is a query flag instead.
 *   - `/client/categories`, `/client/categories/:id/attributes` and
 *     `/client/brands` did not exist anywhere; the real routes sit behind
 *     `JwtAuthGuard`. Those endpoints now exist.
 *   - `page` / `limit` / `search` / `category` / `brand` / `sort` were sent to a
 *     handler that took no arguments, so they were discarded.
 */

// Facets change on a content publish, not per request.
const FACET_REVALIDATE_SECONDS = 300;
const LIST_REVALIDATE_SECONDS = 60;

// ── Reads ────────────────────────────────────────────────────────────────────

/**
 * Paged, filtered catalogue.
 *
 * `isFeatured` is merged in rather than exposed as its own route so a featured
 * listing is paginated and filtered by exactly the same code path as the full
 * catalogue.
 */
export async function getProductsAction(
  params: ProductListQueryParams = {},
): Promise<ActionResult> {
  const allowedSorts = ["newest", "price_asc", "price_desc"] as const;
  type SortOption = (typeof allowedSorts)[number];
  const sort: SortOption =
    params.sort && (allowedSorts as readonly string[]).includes(params.sort)
      ? (params.sort as SortOption)
      : "newest";

  const parsed = {
    page: params.page ?? 1,
    limit: params.limit ?? 12,
    search: params.search?.trim() || undefined,
    category: params.category?.trim() || undefined,
    brand: params.brand?.trim() || undefined,
    sort,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    isFeatured: params.isFeatured,
    specifications: params.specifications?.trim() || undefined,
  };

  try {
    const res = await publicFetch.get(
      `/client/products${buildProductApiQueryString(parsed)}`,
      { next: { revalidate: LIST_REVALIDATE_SECONDS } }
    );
    if (!res.ok) {
      return failWithStatus(
        await extractApiErrorMessage(res, "Failed to load products"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(json?.message || "Failed to load products", json?.statusCode);
    }
    const payload = json?.data as ProductsListPayload | undefined;
    return ok(
      "Products loaded",
      payload ?? { data: [], total: 0, page: 1, limit: 12, pages: 0 }
    );
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to load products");
  }
}

export async function getProductAction(slug: string): Promise<ActionResult> {
  try {
    const res = await publicFetch.get(`/client/products/${encodeURIComponent(slug)}`, {
      next: { revalidate: LIST_REVALIDATE_SECONDS },
    });
    if (!res.ok) {
      return failWithStatus(
        await extractApiErrorMessage(res, "Product not found"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(json?.message || "Product not found", json?.statusCode);
    }
    return ok("Product loaded", (json?.data ?? null) as Product | null);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Product not found");
  }
}

/**
 * Quick-search suggestions for the header.
 *
 * `no-store` is deliberate: the field is driven by keystrokes, and a cached
 * response would show results for a prefix the user has already typed past.
 */
export async function searchProductsAction(query: string): Promise<ActionResult> {
  const search = query.trim();
  if (!search) return ok("", [] as Product[]);

    const searchTrim = query.trim();
  if (!searchTrim) return ok("", [] as Product[]);
  const parsed = { search: searchTrim, limit: 5, page: 1, sort: "newest" as const };

  try {
    const res = await publicFetch.get(
      `/client/products${buildProductApiQueryString(parsed)}`,
      { cache: "no-store" }
    );
    if (!res.ok) {
      return failWithStatus(
        await extractApiErrorMessage(res, "Failed to search products"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(json?.message || "Failed to search products", json?.statusCode);
    }
    const payload = json?.data as ProductsListPayload | undefined;
    return ok("", payload?.data ?? []);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to search products");
  }
}

/** Category facets for the filter rail. */
export async function getCategoriesAction(): Promise<ActionResult> {
  try {
    const res = await publicFetch.get("/client/categories", {
      next: { revalidate: FACET_REVALIDATE_SECONDS },
    });
    if (!res.ok) {
      return failWithStatus(
        await extractApiErrorMessage(res, "Failed to load categories"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(json?.message || "Failed to load categories", json?.statusCode);
    }
    return ok("Categories loaded", (json?.data ?? []) as Category[]);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to load categories");
  }
}

/** Specification attribute definitions, used to build the spec filter form. */
export async function getCategoryAttributesAction(categoryId: number): Promise<ActionResult> {
  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    return fail("Invalid category id");
  }

  try {
    const res = await publicFetch.get(
      `/client/categories/${categoryId}/attributes`,
      { next: { revalidate: FACET_REVALIDATE_SECONDS } }
    );
    if (!res.ok) {
      return failWithStatus(
        await extractApiErrorMessage(res, "Failed to load category attributes"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(
        json?.message || "Failed to load category attributes",
        json?.statusCode
      );
    }
    return ok("Category attributes loaded", (json?.data ?? []) as ProductCategoryAttribute[]);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to load category attributes");
  }
}

/**
 * Specification values in use within a category.
 *
 * Paired with `getCategoryAttributesAction`: that one returns the slots
 * ("Capacity", unit "GB"), this one the values. The spec filter needs both, and
 * neither endpoint returns a renderable row on its own.
 */
export async function getCategorySpecsAction(categoryId: number): Promise<ActionResult> {
  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    return fail("Invalid category id");
  }

  try {
    const res = await publicFetch.get(`/client/categories/${categoryId}/specs`, {
      next: { revalidate: FACET_REVALIDATE_SECONDS },
    });
    if (!res.ok) {
      return failWithStatus(
        await extractApiErrorMessage(res, "Failed to load category specs"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(json?.message || "Failed to load category specs", json?.statusCode);
    }
    return ok("Category specs loaded", (json?.data ?? []) as ProductSpecValue[]);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to load category specs");
  }
}

/** Brand facets for the filter rail. */
export async function getBrandsAction(): Promise<ActionResult> {  try {
    const res = await publicFetch.get("/client/brands", {
      next: { revalidate: FACET_REVALIDATE_SECONDS },
    });
    if (!res.ok) {
      return failWithStatus(
        await extractApiErrorMessage(res, "Failed to load brands"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(json?.message || "Failed to load brands", json?.statusCode);
    }
    return ok("Brands loaded", (json?.data ?? []) as Brand[]);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to load brands");
  }
}

// NOTE: no type re-exports here. A `"use server"` module may only export async
// functions - the SWC server-actions transform hoists every export into the
// action manifest, so `export type { ... }` is looked up as a runtime export and
// fails the build. The contracts live in `src/types/product/`.
