/* eslint-disable @typescript-eslint/no-explicit-any */
import { cache } from "react";
import {
  createPortfolioCategoryAction,
  deletePortfolioAction,
  deletePortfolioCategoryAction,
  listPortfolioCategoriesAction,
  listPortfoliosAction,
  savePortfolioAction,
  togglePortfolioFeaturedAction,
  updatePortfolioCategoryAction,
  uploadPortfolioImageAction,
} from "@/actions/portfolio.actions";
import type { ActionResult } from "@/actions/action-result";
import type { PortfolioCategory, PortfolioItem } from "@/types/portfolio";

/**
 * Portfolio service — the domain layer for the module.
 *
 * House chain: `page / component → service → action → HTTP`. The service holds no
 * transport: every request is a `"use server"` action, so a client component may
 * import this module and its calls arrive as an RPC on the server, where the
 * validation and the revalidation live.
 *
 * The `get*Result` readers are for server pages. A read that fails must not
 * render as an empty grid, so the failure is reported as data and the page
 * decides what to show; the `get*` wrappers are the throwing convenience form.
 */

export type { PortfolioCategory, PortfolioChallenge, PortfolioInput, PortfolioItem, PortfolioPricingTier } from "@/types/portfolio";

export type ReadResult<T> = { ok: true; data: T } | { ok: false; message: string };

const CATEGORY_FALLBACK_META = { total: 0, page: 1, limit: 100, totalPages: 0 };

// ── Reads for the page layer ─────────────────────────────────────────────────

export const getPortfoliosResult = cache(async (params?: {
  category?: string;
  search?: string;
  featured?: boolean;
  page?: number;
  limit?: number;
}): Promise<ReadResult<PortfolioItem[]>> => {
  const res = await listPortfoliosAction(params);
  if (!res.success) return { ok: false, message: res.message || "Failed to load portfolio projects" };

  const wrapped = res.data ?? res;
  const rows = Array.isArray(wrapped) ? wrapped : wrapped?.data;
  return { ok: true, data: Array.isArray(rows) ? rows : [] };
});

export const getPortfolioCategoriesResult = cache(async (params?: {
  page?: number;
  limit?: number;
}): Promise<ReadResult<{ data: PortfolioCategory[]; meta: any }>> => {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 100;
  const res = await listPortfolioCategoriesAction(page, limit);
  if (!res.success) {
    return { ok: false, message: res.message || "Failed to load portfolio categories" };
  }

  const wrapped = res.data;
  const arrayData = Array.isArray(wrapped) ? wrapped : wrapped?.data;
  return {
    ok: true,
    data: {
      data: Array.isArray(arrayData) ? arrayData : [],
      meta: res.meta ?? CATEGORY_FALLBACK_META,
    },
  };
});

export const getPortfolioCategories = cache(async (params?: {
  page?: number;
  limit?: number;
}): Promise<{ data: PortfolioCategory[]; meta: any }> => {
  const result = await getPortfolioCategoriesResult(params);
  if (!result.ok) throw new Error(result.message);
  return result.data;
});

// ── Reads and writes for client components ───────────────────────────────────

export const listPortfolioCategories = (page = 1, limit = 6): Promise<ActionResult> =>
  listPortfolioCategoriesAction(page, limit);

export const savePortfolio = (input: any): Promise<ActionResult> => savePortfolioAction(input);

export const togglePortfolioFeatured = (
  id: number | string,
  isFeatured: boolean
): Promise<ActionResult> => togglePortfolioFeaturedAction(id, isFeatured);

export const deletePortfolio = (id: number | string): Promise<ActionResult> =>
  deletePortfolioAction(id);

export const createPortfolioCategory = (name: string): Promise<ActionResult> =>
  createPortfolioCategoryAction(name);

export const updatePortfolioCategory = (
  id: number | string,
  name: string
): Promise<ActionResult> => updatePortfolioCategoryAction(id, name);

export const deletePortfolioCategory = (id: number | string): Promise<ActionResult> =>
  deletePortfolioCategoryAction(id);

export const uploadPortfolioImage = (
  formData: FormData
): Promise<ActionResult<{ url?: string }>> => uploadPortfolioImageAction(formData);
