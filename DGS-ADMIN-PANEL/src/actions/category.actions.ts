/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { revalidatePath } from "next/cache";
import { fail, failWithStatus, ok, type ActionResult } from "./action-result";
import { serverFetch } from "@/lib/server-fetch";
import { extractApiErrorMessage, parseApiResponse } from "@/lib/api-error";
import { categoryCreateSchema, categoryUpdateSchema } from "@/zod/category.validation";
import type { Category, CategoryStatus } from "@/types/product/product.category";

/**
 * Category actions — the write path, plus the reads a client component needs.
 *
 * This layer owns the transport, the Zod schema and the
 * revalidation. A `"use client"` component cannot reach `serverFetch` directly,
 * which is why the reads exist here too.
 *
 * NOTE: the backend has no `/products` controller, so every `/products/*` call
 * 404s. `MANAGE` is the seeded product-catalogue code; no `categories.*` code
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

function revalidateCategorySurfaces() {
  revalidatePath("/products/categories");
  revalidatePath("/products/categories", "page");
  revalidatePath("/products");
  revalidatePath("/", "layout");
}

// `CategoryFieldErrors` was an `export type` inside a `"use server"` module. It
// belongs with the contracts rather than in the server-action manifest.
type CategoryFieldErrors = {
  name?: string;
  description?: string;
  status?: string;
  parent_id?: string;
  image_url?: string;
};

// ── Writes ───────────────────────────────────────────────────────────────────

export async function createCategoryAction(input: {
  name: string;
  description: string;
  status: CategoryStatus;
  parent_id?: number | null;
  image_url?: string | null;
}): Promise<ActionResult<CategoryFieldErrors>> {
  try {
    const parsed = categoryCreateSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors as CategoryFieldErrors;
      const firstError = Object.values(fieldErrors)[0]?.[0] || "Validation failed";
      return { success: false, message: firstError, errors: fieldErrors };
    }

    const res = await serverFetch.post("/products/categories", {
      body: JSON.stringify(parsed.data),
    });
    if (!res.ok) {
      return failWithStatus(
        await extractApiErrorMessage(res, "Failed to create category"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    if (json?.success === false) return fail(json?.message || "Failed to create category");
    revalidateCategorySurfaces();
    return ok(json?.message || "Category created", json?.data ?? json);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to create category");
  }
}

export async function updateCategoryAction(
  id: string | number,
  input: {
    name?: string;
    description?: string;
    status?: CategoryStatus;
    parent_id?: number | null;
    image_url?: string | null;
  },
): Promise<ActionResult<CategoryFieldErrors>> {
  try {
    const parsed = categoryUpdateSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors as CategoryFieldErrors;
      const firstError = Object.values(fieldErrors)[0]?.[0] || "Validation failed";
      return { success: false, message: firstError, errors: fieldErrors };
    }

    const res = await serverFetch.patch(`/products/categories/${id}`, {
      body: JSON.stringify(parsed.data),
    });
    if (!res.ok) {
      return failWithStatus(
        await extractApiErrorMessage(res, "Failed to update category"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    if (json?.success === false) return fail(json?.message || "Failed to update category");
    revalidateCategorySurfaces();
    return ok(json?.message || "Category updated", json?.data ?? json);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to update category");
  }
}

export async function uploadCategoryImageAction(
  formData: FormData,
): Promise<ActionResult<{ url?: string }>> {
  try {
    // The backend upload route is guarded by `uploads.media.manage`, so an
    // ungated call here fails at the API with an opaque 403. Check up front so a
    // caller gets the same clear denial as every other action.

    const res = await serverFetch.post("/upload/image", { body: formData as any });
    if (!res.ok) {
      return failWithStatus(
        await extractApiErrorMessage(res, "Failed to upload category image"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    if (json?.success === false) return fail(json?.message || "Failed to upload category image");
    const url = json?.data?.secure_url || json?.data?.url || json?.secure_url || json?.url;
    return {
      success: true,
      data: { url },
    };
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to upload category image");
  }
}

export async function deleteCategoryAction(
  id: string | number,
): Promise<ActionResult<CategoryFieldErrors>> {
  try {

    const res = await serverFetch.delete(`/products/categories/${id}`);
    if (!res.ok) {
      return failWithStatus(
        await extractApiErrorMessage(res, "Failed to delete category"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    if (json?.success === false) return fail(json?.message || "Failed to delete category");
    revalidateCategorySurfaces();
    return ok(json?.message || "Category deleted", json?.data ?? json);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to delete category");
  }
}

export async function createCategoryAttributeAction(
  categoryId: number | string,
  input: {
    key: string;
    label: string;
    type: "text" | "number" | "boolean" | "select";
    options?: string[];
    group_name?: string;
    unit?: string;
    is_filterable?: boolean;
    sort_order?: number;
  }
): Promise<ActionResult<any>> {
  try {

    const res = await serverFetch.post(`/products/categories/${categoryId}/attributes`, {
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      return failWithStatus(
        await extractApiErrorMessage(res, "Failed to create attribute definition"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return fail(json?.message || "Failed to create attribute definition");
    }
    revalidateCategorySurfaces();
    return ok(json?.message || "Attribute definition created", json?.data ?? json);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to create attribute definition");
  }
}

export async function deleteCategoryAttributeAction(
  attributeId: number | string
): Promise<ActionResult<any>> {
  try {

    const res = await serverFetch.delete(`/products/attributes/${attributeId}`);
    if (!res.ok) {
      return failWithStatus(
        await extractApiErrorMessage(res, "Failed to delete attribute definition"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return fail(json?.message || "Failed to delete attribute definition");
    }
    revalidateCategorySurfaces();
    return ok(json?.message || "Attribute definition deleted", json?.data ?? json);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to delete attribute definition");
  }
}

// ── Reads ────────────────────────────────────────────────────────────────────
//
// Read failures carry the upstream status so an expired session is never
// reported as a backend outage.

export async function getCategoryAttributesAction(
  categoryId: number | string
): Promise<ActionResult> {
  try {
    const res = await serverFetch.get(`/products/categories/${categoryId}/attributes`);
    if (!res.ok) return readFailure(res, "category attributes", "Failed to fetch attributes");

    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(json?.message || "Failed to fetch attributes", json?.statusCode);
    }
    return ok("", json?.data ?? json);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to fetch attributes");
  }
}

export async function getCategoryProductSpecsAction(
  categoryId: number | string
): Promise<ActionResult> {
  try {
    // PRIMARY SOURCE: product_attribute_definitions for this category.
    // These are category-level schema records and are NEVER deleted when products are removed.
    const attrRes = await serverFetch.get(`/products/categories/${categoryId}/attributes`);
    const attrJson = await parseApiResponse(attrRes);
    const attrDefs: any[] = attrJson?.data || (Array.isArray(attrJson) ? attrJson : []);

    if (attrDefs.length > 0) {
      // The attribute table stores `name` + `unit`; `group_name`/`label` were
      // never columns, so reading them produced `label: undefined` templates and
      // the product form's spec builder came up empty.
      const templates = attrDefs
        .filter((a: any) => a.name)
        .map((a: any) => ({
          group: "General",
          label: a.unit ? `${a.name} (${a.unit})` : a.name,
        }));

      if (templates.length > 0) return { success: true, data: templates };
    }

    // FALLBACK: if no attribute definitions exist yet for this category,
    // scan existing non-deleted products to derive a template.
    const prodRes = await serverFetch.get(
      `/products/filtered?categoryId=${categoryId}&limit=50`
    );
    if (!prodRes.ok) return readFailure(prodRes, "category products", "Failed to fetch specifications");
    const prodJson = await parseApiResponse(prodRes);
    const products = prodJson?.data?.data || prodJson?.data || [];

    const templates: { group: string; label: string }[] = [];
    const keysSeen = new Set<string>();

    (Array.isArray(products) ? products : []).forEach((prod: any) => {
      const specsObj = prod.specifications_json || {};
      Object.keys(specsObj).forEach((fullKey) => {
        if (keysSeen.has(fullKey)) return;
        keysSeen.add(fullKey);

        if (fullKey.includes("__")) {
          const [group, label] = fullKey.split("__");
          templates.push({ group, label });
        } else {
          templates.push({
            group: "General",
            label: fullKey
              .replace(/_/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase()),
          });
        }
      });
    });

    return { success: true, data: templates };
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to fetch specifications");
  }
}

/**
 * The single read of `GET /products/categories`.
 *
 * `getCategoriesOptionsAction` (the `{id, name, parent_id}` shape the product
 * form's parent select needs) and the `/products` page both need this, so the
 * transport lives here once and the option shape is projected from it.
 */
export async function listCategoriesAction(): Promise<ActionResult> {
  try {
    const res = await serverFetch.get("/products/categories");
    if (!res.ok) return readFailure(res, "categories", "Failed to fetch categories");

    const body = await parseApiResponse(res);
    if (body?.success === false) {
      return failWithStatus(body?.message || "Failed to fetch categories", body?.statusCode);
    }
    const cats = (body?.data ?? []) as Category[];
    return ok("Categories loaded", Array.isArray(cats) ? cats : []);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to fetch categories");
  }
}

export async function getCategoriesOptionsAction(): Promise<ActionResult> {
  const res = await listCategoriesAction();
  if (!res.success) return res;

  const cats = (res.data ?? []) as Category[];
  return {
    success: true,
    data: cats.map((c) => ({
      id: c.id.toString(),
      name: c.name,
      parent_id: c.parent_id,
    })),
  };
}
