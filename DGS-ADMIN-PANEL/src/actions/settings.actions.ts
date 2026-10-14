 
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
import { siteConfigValidationSchema } from "@/zod/site-config.validation";
import type { SiteConfig } from "@/types/settings";

/**
 * Settings actions — the transport boundary for the module.
 *
 * House chain: `page / component → service → action → HTTP`. Every request the
 * module makes is declared here, so the validation and the
 * revalidation sit in one place and a `"use client"` component can reach them
 * through the service forwarders.
 *
 * `updateCompanySettingsAction` (PUT /settings/company) and its paired
 * `getCompanySettings` reader were deleted: both had zero references in `src`,
 * so they were an unwritten endpoint with no caller behind it.
 */

/** 401/403 is an expired session, not an outage — the page tells the two apart. */
const unauthorizedMessage = (what: string) =>
  `Your session is no longer authorized to read ${what}. Sign in again.`;

/** A settings write changes the shell, the SEO defaults and the legal pages. */
function revalidateSettingsSurfaces() {
  revalidatePath("/settings");
  revalidatePath("/settings/site-config");
  revalidatePath("/settings/notifications");
  revalidatePath("/settings/pages/privacy-policy");
  revalidatePath("/settings/pages/terms-and-condition");
  revalidatePath("/", "layout");
}

// ── Reads ────────────────────────────────────────────────────────────────────

/**
 * The one ungated read in the module.
 *
 * Site config is not a settings-only resource: the app shell reads the company
 * name and logo for every route, and the legal pages read their own content.
 * Gating this on `settings.site.view` would lock an admin who holds only
 * `settings.pages.view` out of the terms page, and gating it on either code
 * would let a user holding the other one render the shell without its branding.
 * The pages that expose it check their own `*.view` grant before rendering, and
 * the transport still reports a 401 rather than an empty object.
 */
export async function getSiteConfigAction(): Promise<ActionResult> {
  try {
    const res = await serverFetch.get("/site-settings");
    if (!res.ok) {
      return failWithStatus(
        res.status === 401 || res.status === 403
          ? unauthorizedMessage("site settings")
          : await extractApiErrorMessage(res, "Failed to load site config"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(json?.message || "Failed to load site config", json?.statusCode);
    }

    const payload = json?.data ?? json;
    return ok("Site config loaded", (payload ?? {}) as SiteConfig);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to load site config");
  }
}

// ── Writes ───────────────────────────────────────────────────────────────────

/**
 * The Zod schema is applied here, not only in the form, because the
 * `settings.site.manage` gate and the validation have to hold for every caller.
 * The ORIGINAL payload is forwarded, not the parsed one: Zod strips keys the
 * schema does not declare, and the settings form is the authority on which keys
 * exist.
 */
export async function saveSiteConfigAction(
  settings: Record<string, string>
): Promise<ActionResult> {
  try {

    const parsed = siteConfigValidationSchema.safeParse(settings);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return fail(
        first ? `${first.path.join(".") || "settings"}: ${first.message}` : "Invalid site config"
      );
    }

    const res = await serverFetch.post("/site-settings", { body: JSON.stringify(settings) });
    const result = fromServiceResponse(await parseApiResponse(res), "Failed to save site config");
    if (!result.success) return result;

    revalidateSettingsSurfaces();
    return { ...result, message: result.message || "Site config saved successfully" };
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to save site config");
  }
}

export async function uploadCompanyLogoAction(formData: FormData): Promise<ActionResult> {
  try {
    if (!formData.get("file")) return fail("No file selected");

    const res = await serverFetch.post("/site-settings/logo", { body: formData });
    const result = fromServiceResponse(await parseApiResponse(res), "Failed to upload logo");
    if (!result.success) return result;

    revalidateSettingsSurfaces();
    return { ...result, message: result.message || "Company logo uploaded successfully" };
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to upload logo");
  }
}
