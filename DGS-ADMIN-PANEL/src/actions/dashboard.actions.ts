 
"use server";

import {
  fail,
  failWithStatus,
  ok,
  type ActionResult,
} from "./action-result";
import { serverFetch } from "@/lib/server-fetch";
import { extractApiErrorMessage, parseApiResponse } from "@/lib/api-error";

/**
 * Dashboard actions — the transport boundary for the module.
 *
 * House chain: `page / component → service → action → HTTP`. The dashboard is
 * read-only, so this is the one action in the file; the service that used to
 * call `/dashboard/stats` directly now forwards to it, which is what lets the
 * validation sit on the request rather than only in the page.
 *
 * `getDashboardData` (`GET /dashboard`) had zero references in `src` and was
 * deleted with its reader.
 */

/** 401/403 is an expired session, not an outage — the page tells the two apart. */
const unauthorizedMessage = (what: string) =>
  `Your session is no longer authorized to read ${what}. Sign in again.`;

/**
 * OR-logic, matching the page: either dashboard code is enough to see the
 * overview. A single gate would lock out an analytics-only viewer.
 */

export async function getDashboardStatsAction(): Promise<ActionResult> {
  try {

    const res = await serverFetch.get("/dashboard/stats");
    if (!res.ok) {
      return failWithStatus(
        res.status === 401 || res.status === 403
          ? unauthorizedMessage("dashboard statistics")
          : await extractApiErrorMessage(res, "Failed to load dashboard statistics"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(
        json?.message || "Failed to load dashboard statistics",
        json?.statusCode
      );
    }
    const payload = json?.data ?? json;
    return ok("Dashboard statistics loaded", payload ?? null);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to load dashboard statistics");
  }
}
