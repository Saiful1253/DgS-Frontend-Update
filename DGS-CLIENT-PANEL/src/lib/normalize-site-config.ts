import type { CompanySettings, SiteConfig } from "@/types/settings";

/**
 * Bridge from the backend company_settings row to the flat SiteConfig the UI
 * consumes.
 */

function str(v: unknown): string | undefined {
  if (typeof v === "string" && v.trim() !== "") return v;
  return undefined;
}

export function normalizeSiteConfig(raw: CompanySettings | null | undefined): SiteConfig {
  if (!raw) return {};

  const emails = (raw as any).official_emails ?? {};
  const phones = (raw as any).official_phones ?? {};
  const social = (raw as any).social_links ?? {};

  const brand = str((raw as any).brand_name) ?? str((raw as any).legal_company_name);

  const lat = str((raw as any).company_latitude) ?? str((raw as any).latitude);
  const lng = str((raw as any).company_longitude) ?? str((raw as any).longitude);
  let addr = str((raw as any).primary_headquarters_address) ?? str((raw as any).company_address);
  if (lat && lng && addr && addr.indexOf(lat + ',') === -1) {
    addr = addr + ', ' + lat + ',' + lng;
  }

  return {
    company_name: brand,
    company_logo: str((raw as any).company_logo),
    company_logo_public_id: str((raw as any).company_logo_public_id),
    site_favicon: str((raw as any).site_favicon) ?? str((raw as any).company_logo),
    site_favicon_public_id: str((raw as any).site_favicon_public_id),
    company_description: str((raw as any).mission_purpose) ?? str((raw as any).company_description),
    company_short_description: str((raw as any).eu_standards_badge_info) ?? str((raw as any).mission_purpose) ?? str((raw as any).company_short_description),
    company_phone: str(phones.phone) ?? str((raw as any).company_phone),
    company_email: str(emails.general) ?? str(emails.sales) ?? str((raw as any).company_email),
    company_address: addr,
    whatsapp_number: str(phones.whatsapp) ?? str((raw as any).whatsapp_number),
    facebook_url: str(social.facebook) ?? str((raw as any).facebook_url),
    instagram_url: str(social.instagram) ?? str((raw as any).instagram_url),
    twitter_url: str(social.twitter) ?? str((raw as any).twitter_url),
    footer_text: str((raw as any).footer_text),
    copyright_year: str((raw as any).copyright_year) ?? String(new Date().getFullYear()),
    meta_description: str((raw as any).mission_purpose) ?? str((raw as any).meta_description),
    site_meta_title: str((raw as any).site_meta_title),
    site_meta_description: str((raw as any).site_meta_description) ?? str((raw as any).mission_purpose),
    site_meta_keywords: str((raw as any).site_meta_keywords),
    site_og_image: str((raw as any).site_og_image),
    canonical_url: str((raw as any).canonical_url),
    whatsapp_popup: str(phones.whatsapp) ? "true" : str((raw as any).whatsapp_popup),
    terms_and_conditions: str((raw as any).terms_and_conditions),
    privacy_policy: str((raw as any).privacy_policy),
    emi_enabled: str((raw as any).emi_enabled),
    emi_interest_rate: str((raw as any).emi_interest_rate),
    emi_min_amount: str((raw as any).emi_min_amount),
    emi_tenures: str((raw as any).emi_tenures),
    emi_tenure_rates: str((raw as any).emi_tenure_rates),
    hide_advanced_routes: str((raw as any).hide_advanced_routes),
  };
}
