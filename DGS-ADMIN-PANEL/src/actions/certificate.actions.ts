/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { revalidatePath } from "next/cache";
import {
  fail,
  failWithStatus,
  fromServiceResponse,
  ok,
  type ActionResult,
} from "./action-result";
import { serverFetch } from "@/lib/server-fetch";
import { extractApiErrorMessage, parseApiResponse } from "@/lib/api-error";
import type {
  Certificate,
  CertificateInput,
  CertificateListQuery,
  CertificateListResult,
  CertificateUploadResult,
} from "@/types/certificate";

/**
 * Certificate actions (spec §4) — the transport boundary for the CMS module.
 *
 * House chain as elsewhere: `page / component → service → action → HTTP`.
 *
 * A certificate write changes three surfaces: the admin table it is edited in,
 * the landing strip, and the certificates page. Both public routes are
 * revalidated so a published licence is not served from cache for an hour
 * after someone corrected its title.
 */
function revalidateCertificateSurfaces() {
  revalidatePath("/certificates");
  revalidatePath("/");
}

/** 401/403 is an expired session, not an outage — the page tells the two apart. */
const unauthorizedMessage = () =>
  "Your session is no longer authorized to manage certificates. Sign in again.";

// ── Reads ────────────────────────────────────────────────────────────────────

/**
 * One page of the admin table.
 *
 * Filtering, sorting and paging happen on the server: the manager writes the
 * state into the URL, the page parses it through `certificateListQuerySchema`
 * and forwards the result here. Only the current page crosses the wire, so the
 * table stays fast once the library grows past what fits on screen.
 */
export async function listCertificatesAction(
  query: CertificateListQuery = {}
): Promise<ActionResult> {
  try {
    const params = new URLSearchParams();
    params.set("page", String(query.page ?? 1));
    params.set("limit", String(query.limit ?? 10));
    if (query.search) params.set("search", query.search);
    if (query.sortBy) params.set("sortBy", query.sortBy);
    if (query.sortOrder) params.set("sortOrder", query.sortOrder);
    if (typeof query.is_active === "boolean") params.set("is_active", String(query.is_active));
    if (typeof query.is_featured === "boolean") {
      params.set("is_featured", String(query.is_featured));
    }
    if (query.file_type) params.set("file_type", query.file_type);

    const res = await serverFetch.get(`/settings/certificates?${params.toString()}`);
    if (!res.ok) {
      return failWithStatus(
        res.status === 401 || res.status === 403
          ? unauthorizedMessage()
          : await extractApiErrorMessage(res, "Failed to load certificates"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(json?.message || "Failed to load certificates", json?.statusCode);
    }

    const payload = json?.data ?? json;
    const data = Array.isArray(payload) ? (payload as Certificate[]) : (payload?.data ?? []);
    const meta = Array.isArray(payload)
      ? // A bare array means an older backend: one page, no further pages.
        { total: data.length, page: query.page ?? 1, limit: data.length || 1, totalPages: 1 }
      : (payload?.meta ?? payload);

    return ok("Certificates loaded", {
      data: Array.isArray(data) ? (data as Certificate[]) : [],
      meta: {
        total: Number(meta?.total ?? 0),
        page: Number(meta?.page ?? 1),
        limit: Number(meta?.limit ?? query.limit ?? 10),
        totalPages: Math.max(1, Number(meta?.totalPages ?? 1)),
      } satisfies CertificateListResult["meta"],
    });
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to load certificates");
  }
}

// ── Writes ───────────────────────────────────────────────────────────────────

/**
 * The backend validates with class-validator and answers 400 with a
 * `message` array; `fromServiceResponse` flattens it. Field errors are not
 * mapped back onto the form — the client-side zod schema already rejects a
 * malformed submission before it reaches here, so this branch is the guard
 * against the two schemas drifting apart.
 */
export async function createCertificateAction(
  payload: CertificateInput
): Promise<ActionResult> {
  try {
    const res = await serverFetch.post("/settings/certificates", {
      body: JSON.stringify(payload),
    });
    const result = fromServiceResponse(
      await parseApiResponse(res),
      "Failed to create certificate"
    );
    if (result.success) revalidateCertificateSurfaces();
    return result;
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to create certificate");
  }
}

export async function updateCertificateAction(
  id: number,
  payload: Partial<CertificateInput>
): Promise<ActionResult> {
  try {
    const res = await serverFetch.put(`/settings/certificates/${id}`, {
      body: JSON.stringify(payload),
    });
    const result = fromServiceResponse(
      await parseApiResponse(res),
      "Failed to update certificate"
    );
    if (result.success) revalidateCertificateSurfaces();
    return result;
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to update certificate");
  }
}

export async function deleteCertificateAction(id: number): Promise<ActionResult> {
  try {
    const res = await serverFetch.delete(`/settings/certificates/${id}`);
    const result = fromServiceResponse(
      await parseApiResponse(res),
      "Failed to delete certificate"
    );
    if (result.success) revalidateCertificateSurfaces();
    return result;
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to delete certificate");
  }
}

// ── Upload ───────────────────────────────────────────────────────────────────

const CERTIFICATE_FOLDER = "certificates";

/**
 * Uploads the certificate file — an image or a PDF.
 *
 * Goes to `/upload/document`, not `/upload/image`: the image route pins
 * `resource_type: 'image'` with a webp conversion, which would destroy a PDF
 * scan. The endpoint answers with the detected `file_type` and a page-1
 * thumbnail for PDFs, so the form never has to derive either.
 */
export async function uploadCertificateFileAction(
  formData: FormData
): Promise<ActionResult> {
  try {
    if (!formData.get("file")) return fail("No file selected");

    formData.append("folder", CERTIFICATE_FOLDER);
    const res = await serverFetch.post("/upload/document", { body: formData as any });
    const result = fromServiceResponse(
      await parseApiResponse(res),
      "Failed to upload certificate file"
    );
    if (!result.success) return result;

    const data = result.data as CertificateUploadResult | undefined;
    if (!data?.url) return fail("Upload succeeded without a file URL");

    return { ...result, data };
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to upload certificate file");
  }
}

export async function reorderCertificatesAction(
  order: { id: number; display_order: number }[]
): Promise<ActionResult> {
  try {
    const res = await serverFetch.post("/settings/certificates/reorder", {
      body: JSON.stringify({ order }),
    });
    if (!res.ok) {
      // Fallback: update each sequentially
      for (const item of order) {
        await serverFetch.put(`/settings/certificates/${item.id}`, {
          body: JSON.stringify({ display_order: item.display_order }),
        });
      }
      revalidateCertificateSurfaces();
      return ok("Certificates reordered successfully");
    }
    const result = fromServiceResponse(
      await parseApiResponse(res),
      "Failed to reorder certificates"
    );
    if (result.success) revalidateCertificateSurfaces();
    return result;
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to reorder certificates");
  }
}

export async function getCertificateStatsAction(): Promise<ActionResult> {
  try {
    const res = await serverFetch.get("/settings/certificates/stats");
    if (!res.ok) {
      return failWithStatus("Failed to load certificate stats", res.status);
    }
    const json = await parseApiResponse(res);
    const data = json?.data ?? json;
    return ok("Stats loaded", data);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to load certificate stats");
  }
}