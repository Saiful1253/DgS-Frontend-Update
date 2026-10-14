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
import type { Technology, TechnologyInput } from "@/types/technology";

/** A technology write changes the public list, the products filter and the nav badge. */
function revalidateTechnologySurfaces() {
  revalidatePath("/technologies");
  revalidatePath("/products");
  revalidatePath("/");
}

/** 401/403 is an expired session, not an outage — the page tells the two apart. */
const unauthorizedMessage = (what: string) =>
  `Your session is no longer authorized to read ${what}. Sign in again.`;

// ── Reads ────────────────────────────────────────────────────────────────────
//
// Read failures carry the upstream status so the service layer can hand the page
// a `ReadResult` instead of an empty catalogue. Swallowing the status here would
// make a 401 indistinguishable from a 500, and the page could not tell the user
// to sign in again.

export async function listTechnologiesAction(category?: string): Promise<ActionResult> {
  try {

    const qs = category && category !== "All" ? `?category=${encodeURIComponent(category)}` : "";
    const res = await serverFetch.get(`/technologies${qs}`);
    if (!res.ok) {
      return failWithStatus(
        res.status === 401 || res.status === 403
          ? unauthorizedMessage("technologies")
          : await extractApiErrorMessage(res, "Failed to load technologies"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(json?.message || "Failed to load technologies", json?.statusCode);
    }
    const payload = json?.data ?? json;
    return ok("Technologies loaded", Array.isArray(payload) ? (payload as Technology[]) : []);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to load technologies");
  }
}

export async function listTechnologyCategoriesAction(
  page = 1,
  limit = 100
): Promise<ActionResult> {
  try {

    const res = await serverFetch.get(`/technologies/categories?page=${page}&limit=${limit}`);
    if (!res.ok) {
      return failWithStatus(
        res.status === 401 || res.status === 403
          ? unauthorizedMessage("technology categories")
          : await extractApiErrorMessage(res, "Failed to load categories"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(json?.message || "Failed to load categories", json?.statusCode);
    }
    const wrapped = json?.data;
    const arrayData = Array.isArray(wrapped) ? wrapped : wrapped?.data;
    const metaData = json?.meta ?? wrapped?.meta;
    return {
      success: true,
      message: "Categories loaded",
      data: Array.isArray(arrayData) ? arrayData : [],
      meta: metaData || {
        total: Array.isArray(arrayData) ? arrayData.length : 0,
        page,
        limit,
        totalPages: 1,
      },
    } as ActionResult;
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to load categories");
  }
}

// ── Writes ───────────────────────────────────────────────────────────────────

export async function createTechnologyAction(input: TechnologyInput): Promise<ActionResult> {
  try {

    const res = await serverFetch.post("/technologies", { body: JSON.stringify(input) });
    const result = fromServiceResponse(await parseApiResponse(res), "Failed to create technology");
    if (!result.success) return result;

    revalidateTechnologySurfaces();
    return { ...result, message: "Technology created successfully" };
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to create technology");
  }
}

export async function updateTechnologyAction(
  id: string | number,
  input: Partial<TechnologyInput>
): Promise<ActionResult> {
  try {

    const res = await serverFetch.put(`/technologies/${id}`, { body: JSON.stringify(input) });
    const result = fromServiceResponse(await parseApiResponse(res), "Failed to update technology");
    if (!result.success) return result;

    revalidateTechnologySurfaces();
    return { ...result, message: "Technology updated successfully" };
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to update technology");
  }
}

export async function deleteTechnologyAction(id: string | number): Promise<ActionResult> {
  try {

    const res = await serverFetch.delete(`/technologies/${id}`);
    const result = fromServiceResponse(await parseApiResponse(res), "Failed to delete technology");
    if (!result.success) return result;

    revalidateTechnologySurfaces();
    return ok("Technology deleted successfully");
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to delete technology");
  }
}

export async function toggleTechnologyActiveAction(
  id: string | number,
  isActive: boolean
): Promise<ActionResult> {
  try {

    const res = await serverFetch.put(`/technologies/${id}`, {
      body: JSON.stringify({ is_active: isActive }),
    });
    const result = fromServiceResponse(await parseApiResponse(res), "Failed to toggle status");
    if (!result.success) return result;

    revalidateTechnologySurfaces();
    return ok(`Technology ${isActive ? "activated" : "deactivated"} successfully`, result.data);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to toggle status");
  }
}

export async function reorderTechnologiesAction(
  order: { id: number; display_order: number }[]
): Promise<ActionResult> {
  try {

    const res = await serverFetch.patch("/technologies/reorder", {
      body: JSON.stringify({ order }),
    });

    if (res.ok) {
      const result = fromServiceResponse(await parseApiResponse(res), "Failed to reorder technologies");
      if (!result.success) return result;
      revalidateTechnologySurfaces();
      return ok("Technologies reordered successfully");
    }

    // Fallback: parallel PUT updates if the reorder endpoint is unavailable.
    //
    // `serverFetch` resolves with a Response for 4xx/5xx — it does not throw — so
    // awaiting the PUTs inside try/catch reported `{ success: true }` even when
    // every one of them was rejected. A 403 or a 500 therefore surfaced as a
    // green success toast and the order silently never changed. Each response
    // must be inspected explicitly, and a partial failure has to be reported as
    // a failure rather than swallowed.
    const results: { id: number; status: number; ok: boolean; error?: string }[] =
      await Promise.all(
        order.map((item) =>
          serverFetch
            .put(`/technologies/${item.id}`, {
              body: JSON.stringify({ display_order: item.display_order }),
            })
            .then((r) => ({ id: item.id, status: r.status, ok: r.ok }))
            .catch((e: unknown) => ({
              id: item.id,
              status: 0,
              ok: false,
              error: e instanceof Error ? e.message : String(e),
            }))
        )
      );

    const failed = results.filter((r) => !r.ok);
    if (failed.length > 0) {
      const detail = failed
        .map((f) => `#${f.id} (${f.error ?? `HTTP ${f.status}`})`)
        .join(", ");
      return failWithStatus(
        `Reorder failed for ${failed.length} of ${results.length} technologies: ${detail}. ` +
          "No changes were applied — reload and try again.",
        failed[0].status || 502
      );
    }

    revalidateTechnologySurfaces();
    return ok("Technologies reordered successfully");
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to reorder technologies");
  }
}

export async function uploadTechnologyIconAction(formData: FormData): Promise<ActionResult> {
  try {

    const res = await serverFetch.post("/upload/image", { body: formData as any });
    const result = fromServiceResponse(await parseApiResponse(res), "Failed to upload technology icon");
    if (!result.success) return result;

    // A new icon URL is served on the public catalogue, so the cached surfaces
    // have to drop. Without this the admin saw the new icon immediately while
    // visitors kept the old one until the cache expired on its own.
    revalidateTechnologySurfaces();
    return result;
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to upload technology icon");
  }
}

export async function createTechnologyCategoryAction(name: string): Promise<ActionResult> {
  try {

    const res = await serverFetch.post("/technologies/categories", {
      body: JSON.stringify({ name }),
    });
    const result = fromServiceResponse(await parseApiResponse(res), "Failed to create category");
    if (!result.success) return result;

    revalidateTechnologySurfaces();
    return ok("Category created successfully", result.data);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to create category");
  }
}

export async function updateTechnologyCategoryAction(
  id: number,
  name: string
): Promise<ActionResult> {
  try {

    const res = await serverFetch.put(`/technologies/categories/${id}`, {
      body: JSON.stringify({ name }),
    });
    const result = fromServiceResponse(await parseApiResponse(res), "Failed to update category");
    if (!result.success) return result;

    revalidateTechnologySurfaces();
    return ok("Category updated successfully", result.data);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to update category");
  }
}

export async function deleteTechnologyCategoryAction(id: number): Promise<ActionResult> {
  try {

    const res = await serverFetch.delete(`/technologies/categories/${id}`);
    const result = fromServiceResponse(await parseApiResponse(res), "Failed to delete category");
    if (!result.success) return result;

    revalidateTechnologySurfaces();
    return ok("Category deleted successfully");
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to delete category");
  }
}
