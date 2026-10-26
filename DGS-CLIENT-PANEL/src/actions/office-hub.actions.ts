"use server";

import { fail, failWithStatus, ok, type ActionResult } from "./action-result";
import { publicFetch } from "@/lib/server-fetch";
import { extractApiErrorMessage, parseApiResponse } from "@/lib/api-error";
import type { OfficeHub } from "@/types/office-hub";

/**
 * Office-hub actions - the transport boundary for the module.
 *
 * House chain: `page / component -> service -> action -> HTTP`. The only route
 * involved is `GET /client/office-hubs` (`@Public()`, `ClientController`), so
 * the storefront never touches the admin `settings/office-hubs` writers, which
 * sit behind `JwtAuthGuard`.
 *
 * The contact block renders from this list, so the cache window is short: an
 * address or phone change made in the admin panel should reach the homepage
 * within a minute rather than within an hour.
 */

/** Office details change rarely, but they are what a visitor calls - keep it fresh. */
const REVALIDATE_SECONDS = 60;

/** Accept a bare array or the `{ success, data }` envelope. */
function toHubList(payload: unknown): OfficeHub[] {
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { data?: unknown[] })?.data)
      ? ((payload as { data: unknown[] }).data)
      : [];
  return rows as OfficeHub[];
}

// ── Reads ────────────────────────────────────────────────────────────────────

export async function listOfficeHubsAction(): Promise<ActionResult> {
  try {
    const res = await publicFetch.get("/client/office-hubs", {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) {
      return failWithStatus(
        await extractApiErrorMessage(res, "Failed to load office hubs"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(json?.message || "Failed to load office hubs", json?.statusCode);
    }

    return ok("Office hubs loaded", toHubList(json?.data ?? json));
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to load office hubs");
  }
}
