import { z } from "zod";
import { CERTIFICATE_PAGE_SIZE, LANDING_CERTIFICATE_LIMIT } from "@/types/certificate";

/**
 * Query contract for the public certification feed.
 *
 * The storefront is a client component calling a server action, so this is the
 * boundary where a bad value is caught: the action parses with this schema
 * before the request leaves the server, which means an over-long search term or
 * a negative offset never reaches the API.
 *
 * `featured` is the landing-section switch — the home page asks only for rows
 * an editor has chosen to feature, the library page asks for all active rows.
 */
export const certificateListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(60).default(CERTIFICATE_PAGE_SIZE),
  offset: z.coerce.number().int().min(0).default(0),
  featured: z.coerce.boolean().optional(),
  search: z.string().trim().max(120).optional(),
});

/** Landing page size — a second row of cards below the first. */
export const HOME_CERTIFICATION_PAGE_SIZE = LANDING_CERTIFICATE_LIMIT;

export type CertificateListQueryInput = z.input<typeof certificateListQuerySchema>;
export type CertificateListQueryParsed = z.infer<typeof certificateListQuerySchema>;