"use server";

import { fail, failWithStatus, ok, type ActionResult } from "./action-result";
import { publicFetch } from "@/lib/server-fetch";
import { extractApiErrorMessage, parseApiResponse } from "@/lib/api-error";
import { sortCategories, type Technology, type TechnologyCategoryItem } from "@/types/technology";

/**
 * Server actions for the public Technologies module.
 *
 * Same house chain as the admin panel (`page / component -> service -> action`),
 * but the transport is `publicFetch` against the `@Public()` catalogue: the
 * storefront holds no CMS session, so there is no write
 * surface here. Writes belong to the admin panel.
 *
 * Read failures carry the upstream status so the service layer can hand the page
 * a `ReadResult` instead of an empty catalogue. Swallowing the status would make
 * a 502 indistinguishable from a 200-with-no-rows.
 */

/** How long a successful catalogue read stays in the Next data cache. */
const REVALIDATE_SECONDS = 3600;

/**
 * The whole active catalogue in one call.
 *
 * `GET /client/technologies` takes no filter and returns a bare array, so both
 * the filtered list and the category chips are derived here rather than by the
 * server. One request also means the chips can never disagree with the rows.
 *
 * Reports its own failures as data - a thrown error would lose the status, and
 * the page cannot distinguish an outage from an empty catalogue without it.
 */
async function readTechnologyCatalogue(): Promise<ActionResult> {
  try {
    const res = await publicFetch.get("/client/technologies", {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) {
      return failWithStatus(
        await extractApiErrorMessage(res, "Failed to load technologies"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(json?.message || "Failed to load technologies", json?.statusCode);
    }
    const payload = json?.data ?? json;
    return ok(undefined, Array.isArray(payload) ? (payload as Technology[]) : []);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to load technologies");
  }
}

// ── Reads ────────────────────────────────────────────────────────────────────

export async function listTechnologiesAction(category?: string): Promise<ActionResult> {
  const res = await readTechnologyCatalogue();
  if (!res.success) return res;
  if (!category || category === "All") return ok("Technologies loaded", res.data);

  // Mirrors the admin endpoint's `ILIKE %category%` so the storefront filter
  // selects the same rows an admin would see for the same term.
  const needle = category.toLowerCase();
  const filtered = (res.data as Technology[]).filter((tech) =>
    tech.category?.toLowerCase().includes(needle)
  );
  return ok("Technologies loaded", filtered);
}

/**
 * Category chips for the services page filter.
 *
 * Derived from the catalogue itself: the public surface exposes technologies but
 * no category endpoint, and the page previously hardcoded the chips - so
 * anything an admin added was invisible and anything they renamed left a dead
 * chip.
 */
export async function listTechnologyCategoriesAction(
  page = 1,
  limit = 100
): Promise<ActionResult> {
  const res = await readTechnologyCatalogue();
  if (!res.success) return res;

  const names = sortCategories(
    (res.data as Technology[])
      .map((tech) => tech.category)
      .filter((c): c is string => Boolean(c))
  );

  const data: TechnologyCategoryItem[] = names.map((name, index) => ({
    id: index + 1,
    name,
    display_order: index + 1,
  }));

  return {
    success: true,
    message: "Categories loaded",
    data,
    meta: { total: data.length, page, limit, totalPages: 1 },
  } as ActionResult;
}