/**
 * Site-config contracts.
 *
 * These are aliases, not a second declaration. The canonical contracts live in
 * `@/types/settings`, matching the admin panel's layout; this module only keeps
 * the historical path resolving so `context/SiteConfigContext.tsx` and the
 * existing importers keep working.
 */
export type { CompanySettings, SiteConfig } from "@/types/settings";

export { normalizeSiteConfig } from "@/lib/normalize-site-config";