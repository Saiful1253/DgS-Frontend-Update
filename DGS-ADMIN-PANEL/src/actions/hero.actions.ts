/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { revalidatePath } from "next/cache";
import {
  fail,
  failWithStatus,
  fromServiceResponse,
  ok,
  type ActionResult,
} from "./action-result";
import { serverFetch } from "@/lib/server-fetch";
import { extractApiErrorMessage, parseApiResponse } from "@/lib/api-error";
import { buildApiQueryString } from "@/lib/query/api-query";

/**
 * Hero actions — the transport boundary for the module.
 *
 * House chain: `page / component → service → action → HTTP`. This layer owns
 * every request, the validation and the revalidation; the service holds no
 * I/O. A client component may therefore import the service and reach these
 * actions as an RPC on the server.
 */

function revalidateHeroSurfaces() {
  revalidatePath("/hero");
  revalidatePath("/hero", "page");
  revalidatePath("/", "layout");
  revalidatePath("/");
}

/** 401/403 is an expired session, not an outage — the page tells the two apart. */
const unauthorizedMessage = (what: string) =>
  `Your session is no longer authorized to read ${what}. Sign in again.`;

// ── Reads ────────────────────────────────────────────────────────────────────
//
// Read failures carry the upstream status so the service layer can hand the page
// a `ReadResult` instead of an empty carousel. Swallowing the status here would
// make a 401 indistinguishable from a 500, and the page could not tell the user
// to sign in again.

export async function listHeroesAction(page = 1, limit = 10): Promise<ActionResult> {
  try {
    const qs = buildApiQueryString({ page, limit });
    const res = await serverFetch.get(`/hero${qs}`);
    if (!res.ok) {
      return failWithStatus(
        res.status === 401 || res.status === 403
          ? unauthorizedMessage("hero sections")
          : await extractApiErrorMessage(res, "Failed to load hero sections"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(json?.message || "Failed to load hero sections", json?.statusCode);
    }
    return ok("Hero sections loaded", json?.data ?? json);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to load hero sections");
  }
}

// ── Writes ───────────────────────────────────────────────────────────────────

export async function createHeroAction(input: any): Promise<ActionResult> {
  try {

    const res = await serverFetch.post("/hero", { body: JSON.stringify(input) });
    const result = fromServiceResponse(await parseApiResponse(res), "Failed to create hero section");
    if (!result.success) return result;

    revalidateHeroSurfaces();
    return ok("Hero section created successfully", result.data);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to create hero section");
  }
}

export async function updateHeroAction(id: string | number, input: any): Promise<ActionResult> {
  try {

    const res = await serverFetch.patch(`/hero/${id}`, { body: JSON.stringify(input) });
    const result = fromServiceResponse(await parseApiResponse(res), "Failed to update hero section");
    if (!result.success) return result;

    revalidateHeroSurfaces();
    return ok("Hero section updated successfully", result.data);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to update hero section");
  }
}

export async function deleteHeroAction(id: string | number): Promise<ActionResult> {
  try {

    const res = await serverFetch.delete(`/hero/${id}`);
    const result = fromServiceResponse(await parseApiResponse(res), "Failed to delete hero section");
    if (!result.success) return result;

    revalidateHeroSurfaces();
    return ok("Hero section deleted successfully");
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to delete hero section");
  }
}

export async function uploadHeroMediaAction(
  heroId: string | number,
  formData: FormData
): Promise<ActionResult> {
  try {

    const res = await serverFetch.post(`/hero/${heroId}/media/upload-multiple`, { body: formData });
    const result = fromServiceResponse(await parseApiResponse(res), "Failed to upload images");
    if (!result.success) return result;

    revalidateHeroSurfaces();
    return ok("Hero media uploaded successfully", result.data);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to upload media");
  }
}

export async function addHeroMediaUrlAction(
  heroId: string | number,
  data: {
    media_url: string;
    media_type?: string;
    sort_order?: number;
    is_active?: boolean;
  }
): Promise<ActionResult> {
  try {

    const res = await serverFetch.post(`/hero/${heroId}/media/url`, {
      body: JSON.stringify(data),
    });
    const result = fromServiceResponse(await parseApiResponse(res), "Failed to add media by URL");
    if (!result.success) return result;

    revalidateHeroSurfaces();
    return ok("Hero media URL added successfully", result.data);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to add media by URL");
  }
}

export async function replaceHeroMediaAction(
  heroId: string | number,
  mediaId: string | number,
  formData: FormData
): Promise<ActionResult> {
  try {

    const res = await serverFetch.patch(`/hero/${heroId}/media/${mediaId}/replace`, {
      body: formData,
    });
    const result = fromServiceResponse(await parseApiResponse(res), "Failed to replace image");
    if (!result.success) return result;

    revalidateHeroSurfaces();
    return ok("Hero media replaced successfully", result.data);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to replace media");
  }
}

export async function updateMediaMetadataAction(
  mediaId: string | number,
  input: any
): Promise<ActionResult> {
  try {

    const res = await serverFetch.patch(`/hero/media/${mediaId}`, {
      body: JSON.stringify(input),
    });
    const result = fromServiceResponse(await parseApiResponse(res), "Failed to update media");
    if (!result.success) return result;

    revalidateHeroSurfaces();
    return ok("Hero media metadata updated successfully", result.data);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to update media");
  }
}

export async function reorderHeroMediaAction(
  heroId: string | number,
  order: { id: number | string; sort_order: number }[]
): Promise<ActionResult> {
  try {

    const res = await serverFetch.patch(`/hero/${heroId}/media/reorder`, {
      body: JSON.stringify({ order }),
    });
    const result = fromServiceResponse(await parseApiResponse(res), "Failed to reorder media");
    if (!result.success) return result;

    revalidateHeroSurfaces();
    return ok("Hero media reordered successfully");
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to reorder media");
  }
}

export async function deleteHeroMediaAction(mediaId: string | number): Promise<ActionResult> {
  try {

    const res = await serverFetch.delete(`/hero/media/${mediaId}`);
    const result = fromServiceResponse(await parseApiResponse(res), "Failed to delete media");
    if (!result.success) return result;

    revalidateHeroSurfaces();
    return ok("Hero media deleted successfully");
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to delete media");
  }
}
