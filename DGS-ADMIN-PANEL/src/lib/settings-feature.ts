import { SiteConfig } from "@/types/settings";

/**
 * Route-visibility feature flag stored in the site-config key-value store.
 * When enabled ("true"), the following admin routes and actions are hidden
 * globally for all users: CMS Hero, Reviews (all + featured), the "Create
 * Online Sale" button on the Sales page, and the advanced Settings pages
 * (Delivery / Shipping and Client Delivery Charge). The Sales page itself
 * remains accessible.
 */
export function isAdvancedRoutesHidden(config?: Partial<SiteConfig> | null): boolean {
  return config?.hide_advanced_routes === "true";
}
