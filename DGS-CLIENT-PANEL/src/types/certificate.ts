/**
 * Public read model for the Certificate module (spec §4).
 *
 * Content is authored in English only. The storefront's `<AutoTranslate>` layer
 * renders it into Bangla at runtime when the visitor switches language, so a
 * Bangla column in the API would be a second source of truth with nothing to
 * keep it in step.
 */
export type CertificateFileType = "image" | "pdf";

/** Icon keys the certifications section can render. Mirrors the admin picker. */
export type CertificateIcon = "award" | "medal" | "flame" | "shield" | "scale" | "file";

export interface Certificate {
  id: number;
  title: string;
  /** Rich text (HTML). */
  description: string | null;
  file_type: CertificateFileType;
  file_url: string;
  thumb_url: string | null;
  /** Registration / licence number drawn as a pill, e.g. `REG #TGS-1C-4402`. */
  reg_no: string | null;
  category_icon: string | null;
  /** Footer note, e.g. "Verified & Active License". */
  sub_label: string | null;
  issuing_authority: string | null;
  year: number | null;
  verification_link: string | null;
  is_featured: boolean;
  display_order: number;
}

/** One loaded batch. `hasMore` comes from the server — the client never guesses. */
export interface CertificatePage {
  items: Certificate[];
  total: number;
  hasMore: boolean;
  offset: number;
  limit: number;
}

/** Spec §4: 20 per load on the certificates page. */
export const CERTIFICATE_PAGE_SIZE = 20;

/** Spec §4: the landing strip renders at most 8 featured certificates. */
export const LANDING_CERTIFICATE_LIMIT = 8;