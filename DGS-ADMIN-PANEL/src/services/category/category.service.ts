/* eslint-disable @typescript-eslint/no-explicit-any */
import { cache } from "react";
import {
  createCategoryAction,
  createCategoryAttributeAction,
  deleteCategoryAction,
  deleteCategoryAttributeAction,
  getCategoriesOptionsAction,
  getCategoryAttributesAction,
  getCategoryProductSpecsAction,
  listCategoriesAction,
  updateCategoryAction,
  uploadCategoryImageAction,
} from "@/actions/category.actions";
import type { Category } from "@/types/product/product.category";

/**
 * Category service — the domain layer for the module.
 *
 * House chain: `page / component → service → action → HTTP`. The service holds no
 * transport: every request is a `"use server"` action, so a client component may
 * import this module and its calls arrive as an RPC on the server, where the
 * validation and the revalidation live.
 *
 * The `getCategoriesResult` reader is for the `/products` page, which renders the
 * category table and the category filter from one read. A failed read must not
 * render as an empty category list.
 */

export type { Category, CategoryStatus } from "@/types/product/product.category";

export type CategoryReadResult =
  | { ok: true; data: Category[] }
  | { ok: false; message: string };

// ── Reads for the page layer ─────────────────────────────────────────────────

export const getCategoriesResult = cache(async (): Promise<CategoryReadResult> => {
  const res = await listCategoriesAction();
  if (!res.success) return { ok: false, message: res.message || "Failed to load categories" };
  return { ok: true, data: Array.isArray(res.data) ? (res.data as Category[]) : [] };
});

// ── Reads and writes for client components ───────────────────────────────────

export const listCategoriesOptions = () => getCategoriesOptionsAction();

export const listCategoryAttributes = (categoryId: number | string) =>
  getCategoryAttributesAction(categoryId);

export const listCategoryProductSpecs = (categoryId: number | string) =>
  getCategoryProductSpecsAction(categoryId);

export const createCategory = (input: {
  name: string;
  description: string;
  status: string;
  parent_id?: number | null;
  image_url?: string | null;
}) => createCategoryAction(input as any);

export const updateCategory = (
  id: string | number,
  input: {
    name?: string;
    description?: string;
    status?: string;
    parent_id?: number | null;
    image_url?: string | null;
  }
) => updateCategoryAction(id, input as any);

export const deleteCategory = (id: string | number) => deleteCategoryAction(id);

export const uploadCategoryImage = (formData: FormData) => uploadCategoryImageAction(formData);

export const createCategoryAttribute = (
  categoryId: number | string,
  input: Record<string, any>
) => createCategoryAttributeAction(categoryId, input as any);

export const deleteCategoryAttribute = (attributeId: number | string) =>
  deleteCategoryAttributeAction(attributeId);
