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

const DGS_DEFAULT_ADDRESS = "House #73, Madhya Basabo, Sabujbagh, Dhaka-1214, Bangladesh";
const DGS_DEFAULT_PHONE = "01778-277178";
const DGS_DEFAULT_EMAIL = "digitalgasservice@gmail.com";
const DGS_DEFAULT_WHATSAPP = "01778277178";
const DGS_DEFAULT_LAT = "23.7383000";
const DGS_DEFAULT_LNG = "90.4300000";

function str(v: unknown): string | undefined {
  if (typeof v === "string" && v.trim() !== "") return v;
  return undefined;
}

function cleanAddress(v: unknown): string {
  const s = str(v);
  if (!s || s.toLowerCase().includes("milan") || s.toLowerCase().includes("montenapoleone")) {
    return DGS_DEFAULT_ADDRESS;
  }
  return s;
}

function cleanPhone(v: unknown): string {
  const s = str(v);
  if (!s || s.startsWith("+39") || s.includes("1234 5678")) {
    return DGS_DEFAULT_PHONE;
  }
  return s;
}

function cleanEmail(v: unknown): string {
  const s = str(v);
  if (!s || s.includes("milanovatech.com")) {
    return DGS_DEFAULT_EMAIL;
  }
  return s;
}

function cleanWhatsApp(v: unknown): string {
  const s = str(v);
  if (!s || s.startsWith("+39") || s.includes("340 000")) {
    return DGS_DEFAULT_WHATSAPP;
  }
  return s;
}

function coord(v: unknown, fallback: string): string {
  if (v === null || v === undefined) return fallback;
  const s = String(v).trim();
  return s !== "" && !Number.isNaN(Number(s)) ? s : fallback;
}

export function normalizeSiteConfig(raw: CompanySettings | null | undefined): SiteConfig {
  const emails = raw?.official_emails ?? {};
  const phones = raw?.official_phones ?? {};
  const social = raw?.social_links ?? {};

  const brand = str(raw?.brand_name) || "Digital Gas Service";

  return {
    company_name: brand,
    company_description: str(raw?.mission_purpose) || "Centralised LPG reticulation, industrial utility pipelines and fire protection systems for residential, commercial and industrial projects across Bangladesh.",
    company_short_description: str(raw?.eu_standards_badge_info) || "First class Titas Gas contractor, Department of Explosives approved, BERC registered.",
    company_phone: cleanPhone(phones.phone),
    company_email: cleanEmail(emails.general ?? emails.sales),
    company_address: cleanAddress(raw?.primary_headquarters_address),
    whatsapp_number: cleanWhatsApp(phones.whatsapp),
    facebook_url: str(social.facebook),
    twitter_url: str(social.twitter),
    meta_description: str(raw?.mission_purpose),
    site_meta_description: str(raw?.mission_purpose),
    whatsapp_popup: "true",
    copyright_year: String(new Date().getFullYear()),
    company_latitude: coord(raw?.company_latitude, DGS_DEFAULT_LAT),
    company_longitude: coord(raw?.company_longitude, DGS_DEFAULT_LNG),
  };
}