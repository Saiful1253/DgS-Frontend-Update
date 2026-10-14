import type { CompanySettings, SiteConfig } from "@/types/settings";

/**
 * Bridge from the backend `company_settings` row to the flat `SiteConfig` the UI
 * consumes.
 *
 * Why this exists: `/client/config` returns the `company_settings` row, but the
 * UI reads a flat legacy contract (`company_name`, `whatsapp_number`, ...).
 * Without the bridge every field resolved to `undefined`, so the site rendered
 * with empty brand/contact/footer data. Doing the mapping here keeps all ~16
 * consumer sites working without touching a single component.
 */

function str(v: unknown): string | undefined {
  if (typeof v === "string" && v.trim() !== "") return v;
  return undefined;
}

export function normalizeSiteConfig(raw: CompanySettings | null | undefined): SiteConfig {
  if (!raw) return {};

  const emails = raw.official_emails ?? {};
  const phones = raw.official_phones ?? {};
  const social = raw.social_links ?? {};

  const brand = str(raw.brand_name) ?? str(raw.legal_company_name);

  return {
    company_name: brand,
    company_description: str(raw.mission_purpose),
    company_short_description: str(raw.eu_standards_badge_info) ?? str(raw.mission_purpose),
    company_phone: str(phones.phone),
    company_email: str(emails.general) ?? str(emails.sales),
    company_address: str(raw.primary_headquarters_address),
    whatsapp_number: str(phones.whatsapp),
    facebook_url: str(social.facebook),
    twitter_url: str(social.twitter),
    meta_description: str(raw.mission_purpose),
    site_meta_description: str(raw.mission_purpose),
    // Keep this populated so the WhatsApp popup opt-in stays on when a
    // WhatsApp number is configured, matching the previous behaviour.
    whatsapp_popup: str(phones.whatsapp) ? "true" : undefined,
    copyright_year: String(new Date().getFullYear()),
  };
}