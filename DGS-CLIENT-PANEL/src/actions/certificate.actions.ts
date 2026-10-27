/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { fail, failWithStatus, ok, type ActionResult } from "./action-result";
import { publicFetch } from "@/lib/server-fetch";
import { extractApiErrorMessage, parseApiResponse } from "@/lib/api-error";

import type { Certificate, CertificatePage } from "@/types/certificate";
import { CERTIFICATE_PAGE_SIZE } from "@/types/certificate";
import { certificateListQuerySchema } from "@/zod/certificate.validation";

/**
 * Server actions for the public Certificate module (spec §4).
 *
 * House chain as in the admin panel (`component -> service -> action`), but the
 * transport is `publicFetch` against the `@Public()` route: the storefront holds
 * no CMS session, so there is no write surface here.
 *
 * Paging is offset-based because the page appends one batch per "Load more"
 * press — it already knows the offset and never has to derive it from a page
 * number.
 */

/** Published certificates change on the order of days. */
const REVALIDATE_SECONDS = 3600;

/**
 * Accept the paginated envelope and a bare array alike, so a future backend
 * shape change degrades to an empty grid rather than a 500 on the page.
 */
function toPage(payload: any, offset: number, limit: number): CertificatePage {
  if (Array.isArray(payload)) {
    const items = payload as Certificate[];
    return { items, total: items.length, hasMore: false, offset: 0, limit };
  }
  const items: Certificate[] = Array.isArray(payload?.data) ? payload.data : [];
  const total = typeof payload?.total === "number" ? payload.total : items.length;
  const nextOffset = typeof payload?.offset === "number" ? payload.offset : offset;
  return {
    items,
    total,
    // Trust the server's flag when present; otherwise fall back to a full batch.
    hasMore:
      typeof payload?.hasMore === "boolean"
        ? payload.hasMore
        : items.length >= (payload?.limit ?? limit),
    offset: nextOffset,
    limit: typeof payload?.limit === "number" ? payload.limit : limit,
  };
}

// ── Reads ────────────────────────────────────────────────────────────────────

export async function getCertificatesAction(params?: {
  limit?: number;
  offset?: number;
  featured?: boolean;
  search?: string;
}): Promise<ActionResult> {
  // Validated before the request: the storefront is a client component, so this
  // is the only place a malformed offset or an over-long search can be caught.
  const parsed = certificateListQuerySchema.safeParse({
    limit: params?.limit ?? CERTIFICATE_PAGE_SIZE,
    offset: params?.offset ?? 0,
    featured: params?.featured,
    search: params?.search,
  });

  if (!parsed.success) {
    return fail("Invalid certificate query");
  }

  const { limit, offset, featured, search } = parsed.data;

  try {
    const query = new URLSearchParams();
    query.set("limit", String(limit));
    query.set("offset", String(offset));
    if (featured) query.set("featured", "true");
    if (search) query.set("search", search);

    const res = await publicFetch.get(`/client/certificates?${query.toString()}`, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) {
      return failWithStatus(
        await extractApiErrorMessage(res, "Failed to load certificates"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(json?.message || "Failed to load certificates", json?.statusCode);
    }

    return ok("Certificates loaded", toPage(json?.data ?? json, offset, limit));
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to load certificates");
  }
}