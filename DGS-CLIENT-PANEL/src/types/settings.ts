/**
 * Flat key-value shape the app shell and the legal pages read.
 *
 * Identical to the admin panel's `SiteConfig`: both panels describe the same
 * entity, and two divergent copies meant a field added for SEO defaults in one
 * panel silently failed to typecheck in the other.
 *
 * The client panel reads `/client/config`, which returns the `company_settings`
 * row rather than this flat shape. `normalizeSiteConfig` in
 * `@/lib/normalize-site-config` bridges the two.
 */
export interface SiteConfig {
  company_name?: string;
  company_logo?: string;
  company_logo_public_id?: string;
  company_description?: string;
  company_short_description?: string;
  company_phone?: string;
  company_email?: string;
  company_address?: string;
  whatsapp_number?: string;
  facebook_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  footer_text?: string;
  copyright_year?: string;
  meta_description?: string;
  whatsapp_popup?: string;
  terms_and_conditions?: string;
  privacy_policy?: string;
  site_meta_title?: string;
  site_meta_description?: string;
  site_meta_keywords?: string;
  site_og_image?: string;
  canonical_url?: string;
  emi_enabled?: string;
  emi_interest_rate?: string;
  emi_min_amount?: string;
  emi_tenures?: string;
  emi_tenure_rates?: string;
  /** "true" hides CMS Hero, Reviews, Sales, and advanced settings routes globally. */
  hide_advanced_routes?: string;
  /** Map pin from `company_settings`; used to build the contact-section embed. */
  company_latitude?: string;
  company_longitude?: string;
}

/**
 * The raw `/client/config` payload.
 *
 * This is the `company_settings` row exposed by the backend `settings` module -
 * the fields here must stay in sync with `CompanySetting` in
 * MALINOVA-ITALY-BACKEND/src/settings/entities/company-setting.entity.ts.
 */
export interface CompanySettings {
  id?: number;
  legal_company_name?: string;
  brand_name?: string;
  mission_purpose?: string;
  incorporation_details?: string;
  eu_standards_badge_info?: string;
  primary_headquarters_address?: string;
  branch_addresses?: Array<{ city?: string; country?: string; address?: string; phone?: string }>;
  official_emails?: { general?: string; support?: string; sales?: string; careers?: string };
  official_phones?: { phone?: string; whatsapp?: string; country_code?: string };
  social_links?: { linkedin?: string; facebook?: string; twitter?: string; github?: string; youtube?: string };
  calendly_url?: string;
  core_cta_objective?: string;
  /** Decimal columns arrive as number or string depending on the serializer. */
  company_latitude?: number | string | null;
  company_longitude?: number | string | null;
  updated_at?: string;
}