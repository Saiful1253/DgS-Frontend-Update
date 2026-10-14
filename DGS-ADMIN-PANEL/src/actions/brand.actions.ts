/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { revalidatePath } from "next/cache";
import { fail, failWithStatus, ok, type ActionResult } from "./action-result";
import { serverFetch } from "@/lib/server-fetch";
import { extractApiErrorMessage, parseApiResponse } from "@/lib/api-error";
import {
  brandCreateSchema,
  brandUpdateSchema,
  type BrandCreateInput,
  type BrandUpdateInput,
} from "@/zod/brand.validation";
import type { Brand } from "@/types/product/brand";

/**
 * Brand actions — the transport boundary for the module.
 *
 * House chain: `page / component → service → action → HTTP`. This layer owns
 * every request, the Zod schema and the revalidation, so a
 * `"use client"` component never touches `serverFetch` directly — which is why
 * the brand-option read lives here too.
 *
 * NOTE: the backend has no `/products` controller, so every `/products/*` call
 * 404s. `MANAGE` is the seeded product-catalogue code; no `brands.*` code
 * exists, and an unseeded code is pruned from RBAC by the seed
 * helper, which would 403 this route for every role including Super Admin.
 */
/** 401/403 is an expired session, not an outage - the status is kept either way. */
const unauthorizedMessage = (what: string) =>
  `Your session is no longer authorized to read ${what}. Sign in again.`;

/** A read that arrived as an error envelope, reported with its upstream status. */
const readFailure = async (res: Response, what: string, fallback: string) =>
  failWithStatus(
    res.status === 401 || res.status === 403
      ? unauthorizedMessage(what)
      : await extractApiErrorMessage(res, fallback),
    res.status
  );

function revalidateBrandSurfaces() {
  revalidatePath("/products/brands");
  revalidatePath("/products/brands", "page");
  revalidatePath("/products");
  revalidatePath("/", "layout");
}

// An `export type` inside a `"use server"` module belongs in the server-action
// manifest, not in the exported surface. Kept local, like the category module.
type BrandFieldErrors = {
  name?: string;
  description?: string;
  logo_url?: string;
  website_url?: string;
  status?: string;
};

// ── Writes ───────────────────────────────────────────────────────────────────

export async function createBrandAction(
  input: BrandCreateInput
): Promise<ActionResult<BrandFieldErrors>> {
  try {

    const parsed = brandCreateSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors as BrandFieldErrors;
      const firstError = Object.values(fieldErrors)[0]?.[0] || "Validation failed";
      return { success: false, message: firstError, errors: fieldErrors };
    }

    const res = await serverFetch.post("/products/brands", {
      body: JSON.stringify(parsed.data),
    });
    if (!res.ok) {
      return failWithStatus(
        await extractApiErrorMessage(res, "Failed to create brand"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    if (json?.success === false) return fail(json?.message || "Failed to create brand");
    revalidateBrandSurfaces();
    return ok(json?.message || "Brand created", json?.data ?? json);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to create brand");
  }
}

export async function updateBrandAction(
  id: string | number,
  input: BrandUpdateInput
): Promise<ActionResult<BrandFieldErrors>> {
  try {

    const parsed = brandUpdateSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors as BrandFieldErrors;
      const firstError = Object.values(fieldErrors)[0]?.[0] || "Validation failed";
      return { success: false, message: firstError, errors: fieldErrors };
    }

    const res = await serverFetch.patch(`/products/brands/${id}`, {
      body: JSON.stringify(parsed.data),
    });
    if (!res.ok) {
      return failWithStatus(
        await extractApiErrorMessage(res, "Failed to update brand"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    if (json?.success === false) return fail(json?.message || "Failed to update brand");
    revalidateBrandSurfaces();
    return ok(json?.message || "Brand updated", json?.data ?? json);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to update brand");
  }
}

export async function deleteBrandAction(id: string | number): Promise<ActionResult> {
  try {

    const res = await serverFetch.delete(`/products/brands/${id}`);
    if (!res.ok) {
      return failWithStatus(
        await extractApiErrorMessage(res, "Failed to delete brand"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    if (json?.success === false) return fail(json?.message || "Failed to delete brand");
    revalidateBrandSurfaces();
    return ok(json?.message || "Brand deleted", json?.data ?? json);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to delete brand");
  }
}

export async function uploadBrandLogoAction(
  arg1: string | number | FormData,
  arg2?: FormData
): Promise<ActionResult<{ url?: string }>> {
  try {

    // Both call shapes are used by the modals: a bare `FormData` when the brand
    // does not exist yet, and `(id, FormData)` when replacing an existing logo.
    const id = typeof arg1 === "object" ? undefined : arg1;
    const formData = typeof arg1 === "object" ? arg1 : arg2;
    if (!formData) return fail("No file selected");

    const url = id ? `/products/brands/${id}/logo` : "/upload/single";
    const res = await serverFetch.post(url, { body: formData as any });
    if (!res.ok) {
      return failWithStatus(
        await extractApiErrorMessage(res, "Failed to upload brand logo"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    if (json?.success === false) return fail(json?.message || "Failed to upload brand logo");
    revalidateBrandSurfaces();
    return ok(
      json?.message || "Brand logo uploaded",
      json?.data ?? json
    );
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to upload brand logo");
  }
}

// ── Reads ────────────────────────────────────────────────────────────────────
//
// Read failures carry the upstream status so an expired session is never
// reported as a backend outage.

/** Read path for the product form's brand select — a client component cannot call the service. */
export async function getBrandsOptionsAction(): Promise<ActionResult> {
  try {
    const res = await serverFetch.get("/products/brands");
    if (!res.ok) return readFailure(res, "brands", "Failed to fetch brands");

    const body = await parseApiResponse(res);
    if (body?.success === false) {
      return failWithStatus(body?.message || "Failed to fetch brands", body?.statusCode);
    }
    const data = body?.data ?? body;
    return ok("Brands loaded", Array.isArray(data) ? (data as Brand[]) : []);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to fetch brands");
  }
}
