/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { revalidatePath } from "next/cache";
import { fail, failWithStatus, ok, type ActionResult } from "./action-result";
import { serverFetch } from "@/lib/server-fetch";
import { extractApiErrorMessage, parseApiResponse } from "@/lib/api-error";
import { QueryBuilder } from "@/lib/query/base-query";
import { productSchema } from "@/zod/product.validation";

/**
 * Product actions — the read and write path.
 *
 * This layer owns the transport, the `products.saas.*` gates, the Zod schema and
 * the revalidation. A `"use client"` component cannot reach `serverFetch`
 * directly, which is why every request is an action.
 *
 * Backed by the catalogue `products` module (products, product_images,
 * product_brands, product_categories, product_category_attributes). This is not
 * `/products-saas`, which stores public landing pages for proprietary platforms.
 */

/** 401/403 is an expired session, not an outage — the page tells the two apart. */
const unauthorizedMessage = (what: string) =>
  `Your session is no longer authorized to read ${what}. Sign in again.`;

/** One failing product read must not blank the whole catalogue surface. */
async function readFailure(res: Response, what: string, fallback: string): Promise<ActionResult> {
  return failWithStatus(
    res.status === 401 || res.status === 403 ? unauthorizedMessage(what) : await extractApiErrorMessage(res, fallback),
    res.status
  );
}

/**
 * Run one request and normalise it into an `ActionResult`.
 *
 * `parseApiResponse` stamps the real status into the body — so both a
 * `success: false` envelope and a `statusCode >= 400` have to be treated as
 * failures. Missing the second check is what previously rendered a 403 as a
 * green success toast with the write silently dropped.
 */
const call = async (
  run: () => Promise<Response>,
  successMessage: string,
  fallback: string
): Promise<ActionResult> => {
  try {
    const json = await parseApiResponse(await run());
    if (json?.success === false || (json?.statusCode && json.statusCode >= 400)) {
      return fail(json?.message || fallback);
    }
    return ok(json?.message || successMessage, json?.data ?? json);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : fallback);
  }
};

function revalidateProductSurfaces(productId?: string | number) {
  revalidatePath("/products");
  revalidatePath("/products", "page");
  if (productId) {
    revalidatePath(`/products/${productId}`);
    revalidatePath(`/products/${productId}`, "page");
  }
  revalidatePath("/", "layout");
}

// ── Reads ────────────────────────────────────────────────────────────────────
//
// Read failures carry the upstream status so the service layer can hand the page
// a `ReadResult` instead of an empty table. Without the status a 401 would be
// indistinguishable from a 500, and a dead API would render as "No products
// found."

export interface ProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export async function listProductsAction(
  params: ProductListParams = {}
): Promise<ActionResult> {
  try {

    // `buildApiQueryString` is typed to the blog/hero params; the products list
    // adds `categoryId`, so the base builder is used directly — the same way the
    // admin list actions build their own filters.
    const qs = QueryBuilder.buildApiQueryString({
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      search: params.search,
      categoryId: params.categoryId,
      status: params.status,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    });
    const res = await serverFetch.get(`/products${qs}`);
    if (!res.ok) return readFailure(res, "products", "Failed to load products");

    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(json?.message || "Failed to load products", json?.statusCode);
    }
    const payload = (json?.data ?? json) as {
      data?: any[];
      total?: number;
      page?: number;
      limit?: number;
      pages?: number;
    };
    return ok("Products loaded", {
      data: payload?.data ?? [],
      total: payload?.total ?? 0,
      page: payload?.page ?? params.page ?? 1,
      limit: payload?.limit ?? params.limit ?? 20,
      pages: payload?.pages ?? 0,
    });
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to load products");
  }
}

export async function createProductAction(
  input: any,
): Promise<ActionResult> {
  try {

	const parsed = productSchema.safeParse(input);
	if (!parsed.success) {
		const first = parsed.error.issues[0];
		return fail(first ? `${first.path.join(".")}: ${first.message}` : "Invalid product");
	}
	const result = await call(
		() => serverFetch.post("/products", { body: JSON.stringify(parsed.data) }),
		"Product created",
		"Failed to create product"
	);
	if (!result.success) return result;
	revalidateProductSurfaces(result.data?.id);
	return result;
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to create product");
  }
}

export async function deleteProductAction(
  id: string | number,
): Promise<ActionResult> {
  try {

	const result = await call(
		() => serverFetch.delete(`/products/${id}`),
		"Product deleted",
		"Failed to delete product"
	);
	if (!result.success) return result;
	revalidateProductSurfaces(id);
	return result;
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to delete product");
  }
}

export async function updateProductAction(
  id: string | number,
  input: any,
): Promise<ActionResult> {
  try {

	const parsed = productSchema.partial().safeParse(input);
	if (!parsed.success) {
		const first = parsed.error.issues[0];
		return fail(first ? `${first.path.join(".")}: ${first.message}` : "Invalid product");
	}
	const result = await call(
		() => serverFetch.patch(`/products/${id}`, { body: JSON.stringify(parsed.data) }),
		"Product updated",
		"Failed to update product"
	);
	if (!result.success) return result;
	revalidateProductSurfaces(id);
	return result;
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to update product");
  }
}

export async function uploadProductImagesAction(
  productId: number | string,
  formData: FormData,
): Promise<ActionResult> {
  try {

	const result = await call(
		() => serverFetch.post(`/products/${productId}/images`, { body: formData as any }),
		"Images uploaded",
		"Failed to upload images"
	);
	if (!result.success) return result;
	revalidateProductSurfaces(productId);
	return result;
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to upload images");
  }
}

export async function deleteProductImageAction(
  productId: number | string,
  imageId: number | string,
): Promise<ActionResult> {
  try {

	const result = await call(
		() => serverFetch.delete(`/products/${productId}/images/${imageId}`),
		"Image deleted",
		"Failed to delete image"
	);
	if (!result.success) return result;
	revalidateProductSurfaces(productId);
	return result;
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to delete image");
  }
}

export async function setPrimaryImageAction(
  productId: number | string,
  imageId: number | string,
): Promise<ActionResult> {
  try {

	const result = await call(
		() =>
			serverFetch.patch(`/products/${productId}/images/${imageId}/primary`),
		"Primary image updated",
		"Failed to set primary image"
	);
	if (!result.success) return result;
	revalidateProductSurfaces(productId);
	return result;
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to set primary image");
  }
}

export async function toggleProductFeaturedAction(
  id: string | number,
  is_featured: boolean,
): Promise<ActionResult> {
  try {

	const result = await call(
		() =>
			serverFetch.patch(`/products/${id}/toggle-featured`, {
				body: JSON.stringify({ is_featured }),
			}),
		is_featured ? "Marked as featured" : "Removed from featured",
		"Failed to update featured status"
	);
	if (!result.success) return result;
	revalidateProductSurfaces(id);
	return result;
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to update featured status");
  }
}

export async function updateProductSeoAction(
  id: string | number,
  seoData: any,
): Promise<ActionResult> {
  try {

	const result = await call(
		() => serverFetch.patch(`/products/${id}/seo`, { body: JSON.stringify(seoData) }),
		"Product SEO updated",
		"Failed to update product SEO"
	);
	if (!result.success) return result;
    revalidateProductSurfaces(id);
    return result;
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to update product SEO");
  }
}
