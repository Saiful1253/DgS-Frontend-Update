/* eslint-disable @typescript-eslint/no-explicit-any */
import { cache } from "react";
import {
  createProductAction,
  deleteProductAction,
  deleteProductImageAction,
  listProductsAction,
  setPrimaryImageAction,
  toggleProductFeaturedAction,
  updateProductAction,
  updateProductSeoAction,
  uploadProductImagesAction,
} from "@/actions/product.actions";
import type { Product } from "@/types/product/product";

/**
 * Product service — the domain layer for the module.
 *
 * House chain: `page / component → service → action → HTTP`. The service holds no
 * transport: every request is a `"use server"` action, so a client component may
 * import this module and its calls arrive as an RPC on the server, where the
 * validation and the revalidation live.
 *
 * The `get*Result` readers are for server pages. A failed read must not render as
 * an empty catalogue, so the failure is reported as data and the page decides
 * what to show.
 *
 * Backed by the catalogue `products` module (products, product_images,
 * product_brands, product_categories, product_category_attributes) — not
 * `/products-saas`, which stores public landing pages for proprietary platforms.
 */

export type { Product } from "@/types/product/product";

export type ProductReadResult =
  | { ok: true; data: { products: Product[]; total: number; page: number; limit: number; pages: number } }
  | { ok: false; message: string };

// ── Reads for the page layer ─────────────────────────────────────────────────

export const getProductsResult = cache(
  async (
    params: {
      page?: number;
      limit?: number;
      search?: string;
      categoryId?: string;
      status?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    } = {}
  ): Promise<ProductReadResult> => {
    const res = await listProductsAction(params);
    if (!res.success) {
      return { ok: false, message: res.message || "Failed to load products" };
    }
    const payload = (res.data ?? {}) as {
      data?: Product[];
      total?: number;
      page?: number;
      limit?: number;
      pages?: number;
    };
    return {
      ok: true,
      data: {
        products: payload.data ?? [],
        total: payload.total ?? 0,
        page: payload.page ?? 1,
        limit: payload.limit ?? 20,
        pages: payload.pages ?? 0,
      },
    };
  }
);

// ── Writes for client components ─────────────────────────────────────────────

export const createProduct = (input: any) => createProductAction(input);

export const updateProduct = (id: string | number, input: any) => updateProductAction(id, input);

export const deleteProduct = (id: string | number) => deleteProductAction(id);

export const uploadProductImages = (productId: number | string, formData: FormData) =>
  uploadProductImagesAction(productId, formData);

export const deleteProductImage = (productId: number | string, imageId: number | string) =>
  deleteProductImageAction(productId, imageId);

export const setPrimaryImage = (productId: number | string, imageId: number | string) =>
  setPrimaryImageAction(productId, imageId);

export const toggleProductFeatured = (id: string | number, is_featured: boolean) =>
  toggleProductFeaturedAction(id, is_featured);

export const updateProductSeo = (id: string | number, seoData: any) =>
  updateProductSeoAction(id, seoData);
