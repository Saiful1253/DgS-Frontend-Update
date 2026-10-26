/**
 * The `office_hubs` row exposed by the backend `@Public()` route
 * `GET /client/office-hubs` - the contact block's source of truth for the
 * head-office address, phone, email and the admin-managed map embed.
 *
 * Fields mirror `OfficeHub` in
 * MALINOVA-ITALY-BACKEND/src/settings/entities/office-hub.entity.ts; the
 * client panel only ever reads them, so there is no write-side DTO here.
 */
export interface OfficeHub {
  id: number;
  hub_name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  is_headquarters: boolean;
  /** Admin-supplied Google Maps embed URL; empty means "derive from lat/lng". */
  map_embed_url?: string | null;
  display_order: number;
  is_active: boolean;
}
