"use server";

import { fail, failWithStatus, ok, type ActionResult } from "./action-result";
import { publicFetch } from "@/lib/server-fetch";
import { extractApiErrorMessage, parseApiResponse } from "@/lib/api-error";
import type { CompanySettings } from "@/types/settings";

/**
 * Site-config actions - the transport boundary for the module.
 *
 * House chain: `page / component -> service -> action -> HTTP`. Every request the
 * module makes is declared here, so the cache policy and the error handling sit
 * in one place and a `"use client"` component can reach them through the service
 * forwarders.
 *
 * Unlike the admin panel this module has no write surface: `/client/config` is
 * `@Public()` and the company-settings writer needs an admin JWT, so
 * `saveSiteConfigAction` and `uploadCompanyLogoAction` have no counterpart here.
 * There is consequently no `siteConfigValidationSchema` either - a schema with no
 * writer to validate would only drift from the admin copy.
 */

/**
 * Site-wide company configuration.
 *
 * Uncached callers get a short revalidate window rather than none: the config
 * backs the shell on every route, and the previous version passed no cache
 * option at all, so each of the ~16 consumer pages refetched it on every render.
 */
const REVALIDATE_SECONDS = 60;

// ── Reads ────────────────────────────────────────────────────────────────────

export async function getSiteConfigAction(): Promise<ActionResult> {
  try {
    const res = await publicFetch.get("/client/config", {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) {
      return failWithStatus(
        await extractApiErrorMessage(res, "Failed to load site config"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(json?.message || "Failed to load site config", json?.statusCode);
    }

    const payload = json?.data ?? json;
    return ok("Site config loaded", (payload ?? {}) as CompanySettings);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to load site config");
  }
}

// NOTE: no type re-exports here. A `"use server"` module may only export async
// functions - the SWC server-actions transform hoists every export into the
// action manifest, so `export type { ... }` is looked up as a runtime export and
// fails the build. The contracts live in `src/types/settings.ts`.