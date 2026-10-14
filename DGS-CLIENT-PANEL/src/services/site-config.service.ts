/**
 * Compatibility shim.
 *
 * The site-config module now lives in
 * `@/services/site-config/site-config.service`, following the admin panel's
 * layout. This file is re-exported rather than deleted so the ~16 existing
 * importers under `app/` keep resolving; new code should import the canonical
 * path directly.
 */
export { getSiteConfig } from "@/services/site-config/site-config.service";

export type { SiteConfig } from "@/types/settings";