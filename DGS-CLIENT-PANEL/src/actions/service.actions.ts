"use server";

import { fail, failWithStatus, ok, type ActionResult } from "./action-result";
import { publicFetch } from "@/lib/server-fetch";
import { extractApiErrorMessage, parseApiResponse } from "@/lib/api-error";
import type { PublicServicesPayload } from "@/types/service";

/**
 * Server actions for the public Services module.
 *
 * House chain as in the admin panel (`page / component -> service -> action`),
 * but the transport is `publicFetch` against the `@Public()` endpoint: the
 * storefront holds no CMS session, so there is no write
 * surface here. Writes belong to the admin panel.
 *
 * `/services/public` is the only `@Public()` route in the services controller -
 * `/services/groups`, `/services/pillars` and `/services/stats` all sit behind
 * `JwtAuthGuard`, so they are unreachable from here. The
 * groups and pillars the page needs arrive inside the public payload.
 *
 * These endpoints take no caller-supplied input, so there is nothing to validate
 * with Zod on the way in - they are read models whose shape is the backend's
 * contract.
 */

/** How long a successful catalogue read stays in the Next data cache. */
const REVALIDATE_SECONDS = 3600;

// ── Reads ────────────────────────────────────────────────────────────────────

export async function getPublicServicesAction(): Promise<ActionResult> {
  try {
    const res = await publicFetch.get("/services/public", {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) {
      return failWithStatus(
        await extractApiErrorMessage(res, "Failed to load services"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(json?.message || "Failed to load services", json?.statusCode);
    }

    const root = (json?.data ?? json) as Partial<PublicServicesPayload> | null;
    return ok("Services loaded", {
      // Authoritative lists, not derived from the services payload. A pillar
      // whose services are all inactive would otherwise vanish from the page
      // entirely, leaving no way to see that it is unpublished.
      pillars: root?.pillars ?? [],
      groups: root?.groups ?? [],
      services: root?.services ?? [],
    });
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to load services");
  }
}

/** Convenience reader for the group tabs, taken from the same public payload. */
export async function getPublicServiceGroupsAction(): Promise<ActionResult> {
  const res = await getPublicServicesAction();
  if (!res.success) return res;
  return ok("Service groups loaded", res.data?.groups ?? []);
}

// NOTE: no type re-exports here. A `"use server"` module may only export async
// functions - the SWC server-actions transform hoists every export into the
// action manifest, so `export type { ... }` is looked up as a runtime export and
// fails the build. The contracts live in `src/types/service.ts`.