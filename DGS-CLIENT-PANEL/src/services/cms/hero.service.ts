/**
 * Compatibility shim.
 *
 * The hero module now lives in `@/services/hero/hero.service`, following the
 * admin panel's layout. This file is re-exported rather than deleted so the
 * existing importers under `app/` keep resolving.
 */
export { getHero } from "@/services/hero/hero.service";