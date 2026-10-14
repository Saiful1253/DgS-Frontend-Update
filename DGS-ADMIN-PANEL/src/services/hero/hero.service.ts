/* eslint-disable @typescript-eslint/no-explicit-any */
import { cache } from "react";
import {
  addHeroMediaUrlAction,
  createHeroAction,
  deleteHeroAction,
  deleteHeroMediaAction,
  listHeroesAction,
  reorderHeroMediaAction,
  replaceHeroMediaAction,
  updateHeroAction,
  updateMediaMetadataAction,
  uploadHeroMediaAction,
} from "@/actions/hero.actions";
import type { ActionResult } from "@/actions/action-result";
import type { HeroListResponse } from "@/types/hero";

/**
 * Hero service — the domain layer for the module.
 *
 * House chain: `page / component → service → action → HTTP`. The service holds no
 * transport: every request is a `"use server"` action, so a client component may
 * import this module and its calls arrive as an RPC on the server, where the
 * validation and the revalidation live.
 *
 * The `get*Result` readers are for server pages. A read that fails must not
 * render as an empty carousel, so the failure is reported as data and the page
 * decides what to show; the `get*` wrappers are the throwing convenience form.
 */

export type { HeroMedia, HeroImageOps, HeroListResponse, HeroSection } from "@/types/hero";

export type ReadResult<T> = { ok: true; data: T } | { ok: false; message: string };

// ── Reads for the page layer ─────────────────────────────────────────────────

export const getHeroesResult = cache(async (params?: {
  page?: number;
  limit?: number;
}): Promise<ReadResult<HeroListResponse>> => {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 10;
  const res = await listHeroesAction(page, limit);
  if (!res.success) return { ok: false, message: res.message || "Failed to load hero sections" };

  const wrapped = res.data ?? res;
  const rows = Array.isArray(wrapped) ? wrapped : wrapped?.data;
  return {
    ok: true,
    data: {
      data: Array.isArray(rows) ? rows : [],
      total: Number(wrapped?.total) || 0,
      page: wrapped?.page ?? page,
      limit: wrapped?.limit ?? limit,
      pages: Number(wrapped?.pages) || 0,
    },
  };
});

// ── Reads and writes for client components ───────────────────────────────────

export const listHeroes = (page = 1, limit = 10): Promise<ActionResult> =>
  listHeroesAction(page, limit);

export const createHero = (input: any): Promise<ActionResult> => createHeroAction(input);

export const updateHero = (id: string | number, input: any): Promise<ActionResult> =>
  updateHeroAction(id, input);

export const deleteHero = (id: string | number): Promise<ActionResult> => deleteHeroAction(id);

export const uploadHeroMedia = (
  heroId: string | number,
  formData: FormData
): Promise<ActionResult> => uploadHeroMediaAction(heroId, formData);

export const addHeroMediaUrl = (
  heroId: string | number,
  data: {
    media_url: string;
    media_type?: string;
    sort_order?: number;
    is_active?: boolean;
  }
): Promise<ActionResult> => addHeroMediaUrlAction(heroId, data);

export const replaceHeroMedia = (
  heroId: string | number,
  mediaId: string | number,
  formData: FormData
): Promise<ActionResult> => replaceHeroMediaAction(heroId, mediaId, formData);

export const updateMediaMetadata = (mediaId: string | number, input: any): Promise<ActionResult> =>
  updateMediaMetadataAction(mediaId, input);

export const reorderHeroMedia = (
  heroId: string | number,
  order: { id: number | string; sort_order: number }[]
): Promise<ActionResult> => reorderHeroMediaAction(heroId, order);

export const deleteHeroMedia = (mediaId: string | number): Promise<ActionResult> =>
  deleteHeroMediaAction(mediaId);
