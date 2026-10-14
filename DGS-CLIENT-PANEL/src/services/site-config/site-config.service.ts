import { cache } from "react";
import { getSiteConfigAction } from "@/actions/site-config.actions";
import { normalizeSiteConfig } from "@/lib/normalize-site-config";
import type { CompanySettings, SiteConfig } from "@/types/settings";

/**
 * Site-config service - the domain layer for the module.
 *
 * House chain: `page / component -> service -> action -> HTTP`. The service holds
 * no transport: every request is a `"use server"` action, so a client component
 * may import this module and its calls arrive as an RPC on the server, where the
 * cache policy lives.
 *
 * `getSiteConfigResult` is for pages that need to know whether the config loaded.
 * A failed read is reported as data and the page decides what to show;
 * `getSiteConfig` is the never-throw form the app shell uses for branding, which
 * has to render either way.
 */

export type { CompanySettings, SiteConfig } from "@/types/settings";

export type ReadResult<T> = { ok: true; data: T } | { ok: false; message: string };

// ── Reads for the page layer ─────────────────────────────────────────────────

export const getSiteConfigResult = cache(async (): Promise<ReadResult<SiteConfig>> => {
  const res = await getSiteConfigAction();
  if (!res.success) return { ok: false, message: res.message || "Failed to load site config" };
  return { ok: true, data: normalizeSiteConfig(res.data as CompanySettings) };
});

/**
 * Never throws: the shell must render even when the config is unavailable, or a
 * backend blip takes down every route at once. The failure is still reported by
 * `getSiteConfigResult` for callers that care.
 */
export const getSiteConfig = cache(async (): Promise<SiteConfig> => {
  const result = await getSiteConfigResult();
  return result.ok ? result.data : {};
});

// ── Reads for client components ──────────────────────────────────────────────

export const listSiteConfig = () => getSiteConfigAction();