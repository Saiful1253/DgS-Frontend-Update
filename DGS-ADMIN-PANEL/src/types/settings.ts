export interface LanguageOption {
  code: string;
  name: string;
  enabled: boolean;
  isDefault: boolean;
}

/**
 * Flat key-value shape returned by GET /client/config and GET /site-settings.
 * Used by SiteConfigContext to serve sidebar logo/name and invoice generator.
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
}
