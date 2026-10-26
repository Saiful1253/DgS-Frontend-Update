import { cache } from "react";
import {
  createCertificateAction,
  deleteCertificateAction,
  listCertificatesAction,
  updateCertificateAction,
  uploadCertificateFileAction,
  reorderCertificatesAction,
  getCertificateStatsAction,
} from "@/actions/certificate.actions";
import type { ActionResult } from "@/actions/action-result";
import type {
  CertificateInput,
  CertificateListQuery,
  CertificateListResult,
  CertificateStats,
} from "@/types/certificate";

/**
 * Certificate service — the domain layer for the module.
 *
 * House chain: `page / component → service → action`. The service holds no
 * transport: every call is a `"use server"` action, so a client component may
 * import this module and its calls arrive as an RPC on the server.
 *
 * `getCertificatesResult` is for the server page. A read that fails must not
 * render as an empty table, so the failure is returned as data and the page
 * decides what to show.
 */
export type { CertificateInput } from "@/types/certificate";
export type { CertificateListQuery, CertificateListResult } from "@/types/certificate";

export type ReadResult<T> = { ok: true; data: T } | { ok: false; message: string };

const EMPTY_LIST: CertificateListResult = {
  data: [],
  meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
};

export const getCertificatesResult = cache(
  async (query: CertificateListQuery = {}): Promise<ReadResult<CertificateListResult>> => {
    const res = await listCertificatesAction(query);
    if (!res.success || res.data === undefined || res.data === null) {
      return { ok: false, message: res.message || "Failed to load certificates" };
    }
    const payload = res.data as CertificateListResult;
    return {
      ok: true,
      data: {
        data: Array.isArray(payload.data) ? payload.data : [],
        meta: payload.meta ?? EMPTY_LIST.meta,
      },
    };
  }
);

export const createCertificate = (payload: CertificateInput): Promise<ActionResult> =>
  createCertificateAction(payload);

export const updateCertificate = (
  id: number,
  payload: Partial<CertificateInput>
): Promise<ActionResult> => updateCertificateAction(id, payload);

export const deleteCertificate = (id: number): Promise<ActionResult> =>
  deleteCertificateAction(id);

export const uploadCertificateFile = (formData: FormData): Promise<ActionResult> =>
  uploadCertificateFileAction(formData);

export const reorderCertificates = (order: { id: number; display_order: number }[]): Promise<ActionResult> =>
  reorderCertificatesAction(order);

export const getCertificateStatsResult = cache(
  async (): Promise<ReadResult<CertificateStats>> => {
    const res = await getCertificateStatsAction();
    if (!res.success || !res.data) {
      return { ok: false, message: res.message || "Failed to load certificate stats" };
    }
    return { ok: true, data: res.data as CertificateStats };
  }
);