"use server";

import { fail, failWithStatus, ok, type ActionResult } from "./action-result";
import { publicFetch } from "@/lib/server-fetch";
import { extractApiErrorMessage, parseApiResponse } from "@/lib/api-error";
import type { HeroSection } from "@/types/hero";

/**
 * Server actions for the public Hero module.
 *
 * House chain as in the admin panel (`page / component -> service -> action`),
 * but the transport is `publicFetch` against the `@Public()` route: the
 * storefront holds no CMS session, so there is no write
 * surface here. Writes - media upload, reorder, status - belong to the admin
 * panel.
 *
 * `GET /client/hero` returns the single active hero section (the service layer's
 * `findActiveHero`), so there is no list or filter on the public side.
 */

/** The hero band changes rarely; a minute of staleness is invisible to a visitor. */
const REVALIDATE_SECONDS = 60;

// ── Reads ────────────────────────────────────────────────────────────────────

export async function getHeroAction(): Promise<ActionResult> {
  try {
    const res = await publicFetch.get("/client/hero", {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) {
      return failWithStatus(await extractApiErrorMessage(res, "Failed to load hero"), res.status);
    }

    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(json?.message || "Failed to load hero", json?.statusCode);
    }

    const data = json?.data ?? json;
    // Tolerate both shapes the endpoint has used: a bare row, and a one-element
    // list. A shape change should cost the hero band, not the home page.
    const hero = Array.isArray(data)
      ? ((data[0] as HeroSection | undefined) ?? null)
      : ((data as HeroSection | null) ?? null);

    return ok("Hero loaded", hero);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to load hero");
  }
}

// NOTE: no type re-exports here. A `"use server"` module may only export async
// functions - the SWC server-actions transform hoists every export into the
// action manifest, so `export type { ... }` is looked up as a runtime export and
// fails the build. The contracts live in `src/types/hero.ts`.