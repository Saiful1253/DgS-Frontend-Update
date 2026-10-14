/* eslint-disable @typescript-eslint/no-explicit-any */
import { cache } from "react";
import {
  createTechnologyAction,
  createTechnologyCategoryAction,
  deleteTechnologyAction,
  deleteTechnologyCategoryAction,
  listTechnologiesAction,
  listTechnologyCategoriesAction,
  reorderTechnologiesAction,
  toggleTechnologyActiveAction,
  updateTechnologyAction,
  updateTechnologyCategoryAction,
  uploadTechnologyIconAction,
} from "@/actions/technology.actions";
import type { ActionResult } from "@/actions/action-result";
import type { Technology, TechnologyInput, TechnologyCategoryItem } from "@/types/technology";

/**
 * Technology service — the domain layer for the module.
 *
 * House chain: `page / component → service → action`. The service holds no
 * transport: every request is a `"use server"` action, so a client component may
 * import this module and its calls arrive as an RPC on the server, where the
 * validation and the revalidation live.
 *
 * The `get*Result` readers are for server pages. A read that fails must not
 * render as an empty catalogue, so the failure is reported as data and the page
 * decides what to show; the `get*` wrappers are the throwing convenience form.
 */

export type { Technology, TechnologyCategoryItem } from "@/types/technology";

export type ReadResult<T> = { ok: true; data: T } | { ok: false; message: string };

const CATEGORY_FALLBACK_META = { total: 0, page: 1, limit: 100, totalPages: 0 };

const unwrap = <T,>(res: ActionResult, fallback: string): ReadResult<T> =>
  res.success && res.data !== undefined && res.data !== null
    ? { ok: true, data: res.data as T }
    : { ok: false, message: res.message || fallback };

// ── Reads for the page layer ─────────────────────────────────────────────────

export const getTechnologiesResult = cache(
  async (category?: string): Promise<ReadResult<Technology[]>> => {
    const res = await listTechnologiesAction(category);
    if (!res.success) return { ok: false, message: res.message || "Failed to load technologies" };
    const data = Array.isArray(res.data) ? (res.data as Technology[]) : [];
    return { ok: true, data };
  }
);

export const getTechnologyCategoriesResult = cache(
  async (params?: {
    page?: number;
    limit?: number;
  }): Promise<ReadResult<{ data: TechnologyCategoryItem[]; meta: any }>> => {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 100;
    const res = await listTechnologyCategoriesAction(page, limit);
    const result = unwrap<{ data: TechnologyCategoryItem[]; meta: any }>(res, "Failed to load categories");
    if (!result.ok) return result;
    const wrapped = result.data;
    const arrayData = Array.isArray(wrapped) ? wrapped : wrapped?.data;
    return {
      ok: true,
      data: {
        data: Array.isArray(arrayData) ? (arrayData as TechnologyCategoryItem[]) : [],
        meta: res.meta ?? wrapped?.meta ?? CATEGORY_FALLBACK_META,
      },
    };
  }
);

// ── Reads and writes for client components ───────────────────────────────────

export const listTechnologyCategories = (page = 1, limit = 100) =>
  listTechnologyCategoriesAction(page, limit);

export const createTechnology = (input: TechnologyInput) => createTechnologyAction(input);

export const updateTechnology = (id: string | number, input: Partial<TechnologyInput>) =>
  updateTechnologyAction(id, input);

export const deleteTechnology = (id: string | number) => deleteTechnologyAction(id);

export const toggleTechnologyActive = (id: string | number, isActive: boolean) =>
  toggleTechnologyActiveAction(id, isActive);

export const reorderTechnologies = (order: { id: number; display_order: number }[]) =>
  reorderTechnologiesAction(order);

export const uploadTechnologyIcon = (formData: FormData) => uploadTechnologyIconAction(formData);

export const createTechnologyCategory = (name: string) => createTechnologyCategoryAction(name);

export const updateTechnologyCategory = (id: number, name: string) =>
  updateTechnologyCategoryAction(id, name);

export const deleteTechnologyCategory = (id: number) => deleteTechnologyCategoryAction(id);
