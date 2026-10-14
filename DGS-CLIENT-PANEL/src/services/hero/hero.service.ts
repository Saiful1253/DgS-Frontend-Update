import { cache } from "react";
import { getHeroAction } from "@/actions/hero.actions";
import type { ActionResult } from "@/actions/action-result";
import type { HeroSection } from "@/types/hero";

/**
 * Hero service - the domain layer for the module.
 *
 * House chain: `page / component -> service -> action -> HTTP`. The service holds
 * no transport: every request is a `"use server"` action, so a client component
 * may import this module and its calls arrive as an RPC on the server.
 *
 * The `get*Result` readers are for server pages. A read that fails must not
 * render as an empty carousel, so the failure is reported as data and the page
 * decides what to show; the `get*` wrappers are the throwing convenience form.
 */

export type { HeroMedia, HeroSection } from "@/types/hero";

export type ReadResult<T> = { ok: true; data: T } | { ok: false; message: string };

// ── Reads for the page layer ─────────────────────────────────────────────────

export const getHeroResult = cache(async (): Promise<ReadResult<HeroSection | null>> => {
  const res = await getHeroAction();
  if (!res.success) return { ok: false, message: res.message || "Failed to load hero" };
  return { ok: true, data: (res.data ?? null) as HeroSection | null };
});

// ── Reads for the page layer, degrading instead of throwing ──────────────────

/**
 * Never throws. This runs during the static render of `/`, so a rethrow on a
 * transient backend failure would fail the build. `null` lets the page render
 * without the hero band instead.
 */
export const getHero = cache(async (): Promise<HeroSection | null> => {
  const result = await getHeroResult();
  return result.ok ? result.data : null;
});

// ── Reads for client components ──────────────────────────────────────────────

export const listHeroes = (): Promise<ActionResult> => getHeroAction();