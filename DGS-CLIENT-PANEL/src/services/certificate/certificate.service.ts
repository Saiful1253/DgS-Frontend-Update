import { cache } from "react";
import { getCertificatesAction } from "@/actions/certificate.actions";
import type { ActionResult } from "@/actions/action-result";
import type { CertificatePage } from "@/types/certificate";

/**
 * Certificate service — the domain layer for the module.
 *
 * House chain: `page / component → service → action`. The service holds no
 * transport: every call is a `"use server"` action, so a client component may
 * import this module and its calls arrive as an RPC on the server.
 *
 * `getCertificatesResult` is for server pages. A failed read must not render as
 * an empty library, so the failure is returned as data and the page decides
 * what to show; `getCertificates` is the throwing convenience form.
 */
export type { Certificate, CertificatePage } from "@/types/certificate";

export type ReadResult<T> = { ok: true; data: T } | { ok: false; message: string };

const EMPTY_PAGE: CertificatePage = {
  items: [],
  total: 0,
  hasMore: false,
  offset: 0,
  limit: 20,
};

function unwrap(res: ActionResult, fallback: string): ReadResult<CertificatePage> {
  if (!res.success || res.data === undefined || res.data === null) {
    return { ok: false, message: res.message || fallback };
  }
  return { ok: true, data: res.data as CertificatePage };
}

export const getCertificatesResult = cache(
  async (params?: {
    limit?: number;
    offset?: number;
    featured?: boolean;
    search?: string;
  }): Promise<ReadResult<CertificatePage>> => {
    const res = await getCertificatesAction(params);
    return res.success ? unwrap(res, "Failed to load certificates") : {
      ok: false,
      message: res.message || "Failed to load certificates",
    };
  }
);

/** Throwing form for callers that already handle an empty result. */
export async function getCertificates(params?: {
  limit?: number;
  offset?: number;
  featured?: boolean;
  search?: string;
}): Promise<CertificatePage> {
  const res = await getCertificatesResult(params);
  return res.ok ? res.data : EMPTY_PAGE;
}