import { cache } from "react";
import { listOfficeHubsAction } from "@/actions/office-hub.actions";
import type { OfficeHub } from "@/types/office-hub";

/**
 * Office-hub service - the domain layer for the module.
 *
 * House chain: `page -> service -> action -> HTTP`. The homepage passes the
 * result to the contact-inquiry section as props, so the section itself stays a
 * pure render of whatever the backend says (with the historical DGS contact
 * block as the fallback when the table is empty).
 */

export type { OfficeHub } from "@/types/office-hub";

export type ReadResult<T> = { ok: true; data: T } | { ok: false; message: string };

export const DGS_DEFAULT_HUB: OfficeHub = {
  id: 1,
  hub_name: "Head Office & Engineering Center",
  address: "House #73, Madhya Basabo, Sabujbagh, Dhaka-1214, Bangladesh.",
  phone: "01778-277178",
  email: "digitalgasservice@gmail.com",
  is_headquarters: true,
  map_embed_url:
    "https://maps.google.com/maps?q=23.7383000,90.4300000&hl=en&z=16&output=embed",
  display_order: 1,
  is_active: true,
};

function isLegacyHub(h: OfficeHub): boolean {
  const a = (h.address || "").toLowerCase();
  const n = (h.hub_name || "").toLowerCase();
  return a.includes("milan") || a.includes("montenapoleone") || n.includes("milan");
}

// ── Reads for the page layer ─────────────────────────────────────────────────

export const getOfficeHubsResult = cache(async (): Promise<ReadResult<OfficeHub[]>> => {
  const res = await listOfficeHubsAction();
  if (!res.success) return { ok: false, message: res.message || "Failed to load office hubs" };
  const raw = Array.isArray(res.data) ? (res.data as OfficeHub[]) : [];
  const valid = raw.filter((h) => !isLegacyHub(h));
  return { ok: true, data: valid.length > 0 ? valid : [DGS_DEFAULT_HUB] };
});

/**
 * Never throws: a settings outage must not take down the homepage - the
 * section falls back to its built-in contact details instead.
 */
export const getOfficeHubs = cache(async (): Promise<OfficeHub[]> => {
  const result = await getOfficeHubsResult();
  return result.ok ? result.data : [DGS_DEFAULT_HUB];
});

/** The headquarters hub, or the first active hub when none is flagged. */
export const getHeadquarterHub = cache(async (): Promise<OfficeHub | null> => {
  const hubs = await getOfficeHubs();
  return hubs.find((h) => h.is_headquarters) ?? hubs[0] ?? DGS_DEFAULT_HUB;
});

