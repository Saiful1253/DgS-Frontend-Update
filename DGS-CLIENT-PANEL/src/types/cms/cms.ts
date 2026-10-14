/**
 * Public hero contracts.
 *
 * `HeroSection` / `HeroMedia` are aliases of `@/types/hero`; the canonical
 * contract lives there. `CmsApiEnvelope` stays local because it describes the
 * backend's response wrapper rather than a resource.
 */

export type { HeroMedia, HeroSection, HeroStatus } from "@/types/hero";

export interface CmsApiEnvelope<T> {
  success: boolean;
  data: T;
  timestamp?: string;
}