/**
 * Certificate module types (admin).
 *
 * Content is authored in English only — the storefront renders it into Bangla
 * at runtime through `<AutoTranslate>`. A second Bangla column was a second
 * source of truth that drifted out of sync.
 *
 * A certificate carries exactly one file: an image renders inline and opens in
 * the lightbox, a PDF opens in the embedded viewer, and `file_type` decides
 * which.
 */
export type CertificateFileType = "image" | "pdf";

/**
 * Icon keys the storefront knows how to render.
 *
 * The admin offers exactly these and the backend validates against the same
 * list, so a typo cannot reach the storefront as a blank square.
 */
export const CERTIFICATE_ICONS = [
  "award",
  "medal",
  "flame",
  "shield",
  "scale",
  "file",
] as const;

export type CertificateIcon = (typeof CERTIFICATE_ICONS)[number];

export interface Certificate {
  id: number;
  title: string;
  /** Rich text (HTML). */
  description: string | null;
  file_type: CertificateFileType;
  file_url: string;
  thumb_url: string | null;
  /** Registration / licence number shown as a pill, e.g. `REG #TGS-1C-4402`. */
  reg_no: string | null;
  category_icon: string | null;
  sub_label: string | null;
  issuing_authority: string | null;
  year: number | null;
  verification_link: string | null;
  is_featured: boolean;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export type CertificateInput = Omit<
  Certificate,
  "id" | "created_at" | "updated_at"
>;

/** Pagination envelope returned by `GET /settings/certificates`. */
export interface CertificateListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CertificateStats {
  total: number;
  active: number;
  featured: number;
  inactive: number;
}

/** One page of the admin table. */
export interface CertificateListResult {
  data: Certificate[];
  meta: CertificateListMeta;
}

/**
 * Columns the admin table can sort by.
 *
 * Kept in step with the backend's `AdminCertificateQueryDto` allow-list — the
 * value is interpolated into `ORDER BY` there, so it must never come from an
 * unvalidated string.
 */
export const CERTIFICATE_SORT_COLUMNS = [
  "display_order",
  "year",
  "title",
  "reg_no",
  "issuing_authority",
  "created_at",
] as const;

export type CertificateSortColumn = (typeof CERTIFICATE_SORT_COLUMNS)[number];

/**
 * The list state the page reads from the URL and the manager writes back to it.
 *
 * Filters are query-string driven so a filtered table is shareable and survives
 * a refresh — the alternative, component state, silently loses the view on
 * every reload.
 */
export interface CertificateListQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: CertificateSortColumn;
  sortOrder?: "asc" | "desc";
  /** Omitted = both active and inactive. */
  is_active?: boolean;
  /** Omitted = featured and non-featured alike. */
  is_featured?: boolean;
  file_type?: CertificateFileType;
}

/** What the document-upload endpoint answers with. */
export interface CertificateUploadResult {
  url: string;
  file_type: CertificateFileType;
  thumb_url: string;
  public_id?: string;
  bytes?: number;
  format?: string;
  pages?: number;
}

export const CERTIFICATE_PAGE_SIZE = 10;