import { cache } from "react";
import {
  getSiteConfigAction,
  saveSiteConfigAction,
  uploadCompanyLogoAction,
} from "@/actions/settings.actions";
import type { SiteConfig } from "@/types/settings";

/**
 * Settings service — the domain layer for the module.
 *
 * House chain: `page / component → service → action → HTTP`. The service holds no
 * transport: every request is a `"use server"` action, so a client component may
 * import this module and its calls arrive as an RPC on the server, where the
 * validation and the revalidation live.
 *
 * `getSiteConfigResult` is for content pages. A read that fails must not render
 * as a blank settings form, so the failure is reported as data and the page
 * decides what to show; `getSiteConfig` is the never-throw form the app shell
 * uses for the sidebar branding, which has to render either way.
 */

export type { SiteConfig } from "@/types/settings";

export type ReadResult<T> = { ok: true; data: T } | { ok: false; message: string };

// ── Reads for the page layer ─────────────────────────────────────────────────

export const getSiteConfigResult = cache(async (): Promise<ReadResult<SiteConfig>> => {
  const res = await getSiteConfigAction();
  if (!res.success) return { ok: false, message: res.message || "Failed to load site config" };
  return { ok: true, data: (res.data ?? {}) as SiteConfig };
});

/** Never throws: the shell degrades to an unbranded header rather than a 500. */
export const getSiteConfig = cache(async (): Promise<SiteConfig> => {
  const result = await getSiteConfigResult();
  return result.ok ? result.data : {};
});

// ── Writes for client components ─────────────────────────────────────────────

export const saveSiteConfig = (settings: Record<string, string>) =>
  saveSiteConfigAction(settings);

export const uploadCompanyLogo = (formData: FormData) => uploadCompanyLogoAction(formData);
