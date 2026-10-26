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
import { portfolioSchema } from "@/zod/portfolio.validation";
import { serverFetch } from "@/lib/server-fetch";
import { extractApiErrorMessage, parseApiResponse } from "@/lib/api-error";

/**
 * Portfolio actions — the transport boundary for the module.
 *
 * House chain: `page / component → service → action → HTTP`. This layer owns
 * every request, the zod validation and the revalidation;
 * the service holds no I/O.
 */

function revalidatePortfolioSurfaces() {
  revalidatePath("/portfolio");
  revalidatePath("/portfolio", "page");
  revalidatePath("/", "layout");
  revalidatePath("/dashboard");
  revalidatePath("/");
}

/** 401/403 is an expired session, not an outage — the page tells the two apart. */
const unauthorizedMessage = (what: string) =>
  `Your session is no longer authorized to read ${what}. Sign in again.`;

// ── Reads ────────────────────────────────────────────────────────────────────
//
// Read failures carry the upstream status so the service layer can hand the page
// a `ReadResult` instead of an empty grid. Swallowing the status here would make
// a 401 indistinguishable from a 500, and the page could not tell the user to
// sign in again.

export async function listPortfoliosAction(params?: {
  category?: string;
  search?: string;
  featured?: boolean;
  status?: string;
  projectType?: string;
  district?: string;
  area?: string;
  page?: number;
  limit?: number;
}): Promise<ActionResult> {
  try {
    const query = new URLSearchParams();
    if (params?.category) query.set("category", params.category);
    if (params?.search) query.set("search", params.search);
    if (params?.featured !== undefined) query.set("featured", String(params.featured));
    if (params?.status) query.set("status", params.status);
    if (params?.projectType) query.set("projectType", params.projectType);
    if (params?.district) query.set("district", params.district);
    if (params?.area) query.set("area", params.area);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    const qs = query.toString() ? `?${query.toString()}` : "";

    let res = await serverFetch.get(`/portfolio${qs}`);

    // Fall back to the public route: the admin list is a superset of what the
    // public route returns, so it is used whenever the admin list is unavailable.
    if (!res.ok) {
      res = await serverFetch.get(`/client/portfolio${qs}`);
    }

    if (!res.ok) {
      return failWithStatus(
        res.status === 401 || res.status === 403
          ? unauthorizedMessage("portfolio projects")
          : await extractApiErrorMessage(res, "Failed to load portfolio projects"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(json?.message || "Failed to load portfolio projects", json?.statusCode);
    }
    return ok("Portfolio projects loaded", json?.data ?? json);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to load portfolio projects");
  }
}

export async function listPortfolioCategoriesAction(
  page = 1,
  limit = 6
): Promise<ActionResult> {
  try {
    const res = await serverFetch.get(`/portfolio/categories?page=${page}&limit=${limit}`);
    if (!res.ok) {
      return failWithStatus(
        res.status === 401 || res.status === 403
          ? unauthorizedMessage("portfolio categories")
          : await extractApiErrorMessage(res, "Failed to load portfolio categories"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(
        json?.message || "Failed to load portfolio categories",
        json?.statusCode
      );
    }

    const wrapped = json?.data;
    const arrayData = Array.isArray(wrapped) ? wrapped : wrapped?.data;
    const rows = Array.isArray(arrayData) ? arrayData : [];
    const meta = json?.meta ?? wrapped?.meta ?? {
      total: rows.length,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(rows.length / limit)),
    };

    return {
      success: true,
      message: "Portfolio categories loaded",
      data: rows,
      meta,
    } as ActionResult;
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to load portfolio categories");
  }
}

// ── Writes ───────────────────────────────────────────────────────────────────

export async function savePortfolioAction(input: any): Promise<ActionResult> {
  try {

    const parsed = portfolioSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstError = Object.values(fieldErrors)[0]?.[0] || "Validation failed";
      return {
        success: false,
        message: firstError,
        errors: fieldErrors as any,
      };
    }

    const data = parsed.data;
    const res = data.id
      ? await serverFetch.put(`/portfolio/${data.id}`, { body: JSON.stringify(data) })
      : await serverFetch.post("/portfolio", { body: JSON.stringify(data) });

    const result = fromServiceResponse(
      await parseApiResponse(res),
      data.id ? "Failed to update portfolio project" : "Failed to create portfolio project"
    );
    if (!result.success) return result;

    revalidatePortfolioSurfaces();

    return {
      ...result,
      message: data.id
        ? "Portfolio case study updated successfully"
        : "Portfolio case study created successfully",
    };
  } catch (e: unknown) {
    console.error("savePortfolioAction error:", e);
    return fail(e instanceof Error ? e.message : "Failed to save portfolio project");
  }
}

export async function togglePortfolioFeaturedAction(
  id: number | string,
  isFeatured: boolean
): Promise<ActionResult> {
  try {

    const res = await serverFetch.put(`/portfolio/${id}`, {
      body: JSON.stringify({ is_featured: isFeatured }),
    });
    const result = fromServiceResponse(await parseApiResponse(res), "Failed to update featured status");
    if (!result.success) return result;

    revalidatePortfolioSurfaces();

    return {
      ...result,
      message: isFeatured ? "Marked as featured" : "Removed from featured showcase",
    };
  } catch (e: unknown) {
    console.error("togglePortfolioFeaturedAction error:", e);
    return fail(e instanceof Error ? e.message : "Failed to update featured status");
  }
}

export async function deletePortfolioAction(id: number | string): Promise<ActionResult> {
  try {

    const res = await serverFetch.delete(`/portfolio/${id}`);
    const result = fromServiceResponse(
      await parseApiResponse(res),
      "Failed to delete portfolio project"
    );
    if (!result.success) return result;

    revalidatePortfolioSurfaces();

    return ok("Portfolio case study deleted successfully");
  } catch (e: unknown) {
    console.error("deletePortfolioAction error:", e);
    return fail(e instanceof Error ? e.message : "Failed to delete portfolio project");
  }
}

export async function createPortfolioCategoryAction(name: string): Promise<ActionResult> {
  try {

    const trimmed = name?.trim();
    if (!trimmed) {
      return fail("Category name is required");
    }

    const res = await serverFetch.post("/portfolio/categories", {
      body: JSON.stringify({ name: trimmed }),
    });
    const result = fromServiceResponse(await parseApiResponse(res), "Failed to create category");
    if (!result.success) return result;

    revalidatePortfolioSurfaces();

    return {
      ...result,
      message: `Category "${trimmed}" created successfully`,
    };
  } catch (e: unknown) {
    console.error("createPortfolioCategoryAction error:", e);
    return fail(e instanceof Error ? e.message : "Failed to create category");
  }
}

export async function updatePortfolioCategoryAction(
  id: number | string,
  name: string
): Promise<ActionResult> {
  try {

    const trimmed = name?.trim();
    if (!trimmed) {
      return fail("Category name cannot be empty");
    }

    const res = await serverFetch.put(`/portfolio/categories/${id}`, {
      body: JSON.stringify({ name: trimmed }),
    });
    const result = fromServiceResponse(await parseApiResponse(res), "Failed to update category");
    if (!result.success) return result;

    revalidatePortfolioSurfaces();

    return {
      ...result,
      message: "Category updated successfully",
    };
  } catch (e: unknown) {
    console.error("updatePortfolioCategoryAction error:", e);
    return fail(e instanceof Error ? e.message : "Failed to update category");
  }
}

export async function deletePortfolioCategoryAction(id: number | string): Promise<ActionResult> {
  try {

    const res = await serverFetch.delete(`/portfolio/categories/${id}`);
    const result = fromServiceResponse(await parseApiResponse(res), "Failed to delete category");
    if (!result.success) return result;

    revalidatePortfolioSurfaces();

    return ok("Category deleted successfully");
  } catch (e: unknown) {
    console.error("deletePortfolioCategoryAction error:", e);
    return fail(e instanceof Error ? e.message : "Failed to delete category");
  }
}

export async function uploadPortfolioImageAction(
  formData: FormData
): Promise<ActionResult<{ url?: string }>> {
  try {

    if (!formData.has("folder")) {
      formData.append("folder", "portfolio");
    }

    const res = await serverFetch.post("/upload/image", { body: formData });
    const json = await parseApiResponse(res);
    const result = fromServiceResponse(json, "Failed to upload image");
    if (!result.success) return result;

    const url = json?.data?.secure_url || json?.data?.url || json?.secure_url || json?.url;

    if (!url) {
      return fail("No image URL returned from upload server");
    }

    return ok("Image uploaded successfully", { url });
  } catch (e: unknown) {
    console.error("uploadPortfolioImageAction error:", e);
    return fail(e instanceof Error ? e.message : "Failed to upload image");
  }
}
