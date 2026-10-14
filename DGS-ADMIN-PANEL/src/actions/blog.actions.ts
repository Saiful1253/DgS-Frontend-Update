/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { revalidatePath } from "next/cache";
import { fail, failWithStatus, fromServiceResponse, ok, type ActionResult } from "./action-result";
import { serverFetch } from "@/lib/server-fetch";
import { extractApiErrorMessage, parseApiResponse } from "@/lib/api-error";
import { buildApiQueryString } from "@/lib/query/api-query";

/** 401/403 is an expired session, not an outage — the page tells the two apart. */
const unauthorizedMessage = (what: string) =>
  `Your session is no longer authorized to read ${what}. Sign in again.`;

/** One failing blog read must not blank the whole editorial surface. */
async function readFailure(res: Response, what: string, fallback: string): Promise<ActionResult> {
  return failWithStatus(
    res.status === 401 || res.status === 403 ? unauthorizedMessage(what) : await extractApiErrorMessage(res, fallback),
    res.status
  );
}

// ── Reads ────────────────────────────────────────────────────────────────────
//
// Read failures carry the upstream status so the service layer can hand the page
// a `ReadResult` instead of an empty list. Swallowing the status here would make
// a 401 indistinguishable from a 500, and a broken API would render as an empty
// editorial queue.

export async function listBlogsAction(
  page = 1,
  limit = 10,
  status = ""
): Promise<ActionResult> {
  try {
    const qs = buildApiQueryString({ page, limit, status });
    const res = await serverFetch.get(`/blogs${qs}`);
    if (!res.ok) return readFailure(res, "blogs", "Failed to load blogs");

    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(json?.message || "Failed to load blogs", json?.statusCode);
    }
    const data = json?.data ?? json;
    return ok("Blogs loaded", {
      data: data?.data || [],
      total: data?.total || 0,
      page: data?.page || page,
      limit: data?.limit || limit,
      pages: data?.pages || 0,
    });
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to load blogs");
  }
}

export async function getBlogAction(id: string | number): Promise<ActionResult> {
  try {
    const res = await serverFetch.get(`/blogs/${id}`);
    if (!res.ok) return readFailure(res, "this blog", "Failed to load blog");

    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(json?.message || "Failed to load blog", json?.statusCode);
    }
    return ok("Blog loaded", json?.data ?? json);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to load blog");
  }
}

export async function listBlogCategoriesAction(): Promise<ActionResult> {
  try {
    const res = await serverFetch.get("/blog-categories");
    if (!res.ok) return readFailure(res, "blog categories", "Failed to fetch blog categories");

    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(json?.message || "Failed to fetch blog categories", json?.statusCode);
    }
    const data = json?.data ?? json;
    return ok("Blog categories loaded", Array.isArray(data) ? data : []);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to fetch blog categories");
  }
}

export async function listBlogAuthorsAction(): Promise<ActionResult> {
  try {
    const res = await serverFetch.get("/blog-authors");
    if (!res.ok) return readFailure(res, "blog authors", "Failed to fetch blog authors");

    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(json?.message || "Failed to fetch blog authors", json?.statusCode);
    }
    const data = json?.data ?? json;
    return ok("Blog authors loaded", Array.isArray(data) ? data : []);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to fetch blog authors");
  }
}

export async function listBlogTagsAction(): Promise<ActionResult> {
  try {
    const res = await serverFetch.get("/blog-tags");
    if (!res.ok) return readFailure(res, "blog tags", "Failed to fetch blog tags");

    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(json?.message || "Failed to fetch blog tags", json?.statusCode);
    }
    const data = json?.data ?? json;
    return ok("Blog tags loaded", Array.isArray(data) ? data : []);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to fetch blog tags");
  }
}

// ── Writes ───────────────────────────────────────────────────────────────────

export async function createBlogAction(formData: FormData): Promise<ActionResult> {
  try {

    const res = await serverFetch.post("/blogs", { body: formData });
    const result = fromServiceResponse(await parseApiResponse(res), "Failed to create blog");
    if (!result.success) return result;

    revalidatePath("/blogs");
    revalidatePath("/");
    return ok("Blog created successfully", result.data);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to create blog");
  }
}

export async function updateBlogAction(id: string | number, formData: FormData): Promise<ActionResult> {
  try {

    const res = await serverFetch.patch(`/blogs/${id}`, { body: formData });
    const result = fromServiceResponse(await parseApiResponse(res), "Failed to update blog");
    if (!result.success) return result;

    revalidatePath("/blogs");
    revalidatePath(`/blogs/${id}`);
    revalidatePath("/");
    return ok("Blog updated successfully", result.data);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to update blog");
  }
}

export async function deleteBlogAction(id: string | number): Promise<ActionResult> {
  try {

    const res = await serverFetch.delete(`/blogs/${id}`);
    const result = fromServiceResponse(await parseApiResponse(res), "Failed to delete blog");
    if (!result.success) return result;

    revalidatePath("/blogs");
    revalidatePath("/");
    return ok("Blog deleted successfully");
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to delete blog");
  }
}

export async function updateBlogStatusAction(
  id: string | number,
  status: string,
  publishAt?: string,
): Promise<ActionResult> {
  try {

    const res = await serverFetch.post(`/blogs/${id}/status`, {
      body: JSON.stringify({ status, publish_at: publishAt || undefined }),
    });
    const result = fromServiceResponse(await parseApiResponse(res), "Failed to update blog status");
    if (!result.success) return result;

    revalidatePath("/blogs");
    revalidatePath(`/blogs/${id}`);
    revalidatePath("/");
    return ok("Blog status updated successfully", result.data);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to update blog status");
  }
}

export async function toggleBlogFeaturedAction(
  id: string | number,
  featured?: boolean,
): Promise<ActionResult> {
  try {

    const res = await serverFetch.post(`/blogs/${id}/featured`, {
      body: JSON.stringify({ featured }),
    });
    const result = fromServiceResponse(await parseApiResponse(res), "Failed to toggle featured status");
    if (!result.success) return result;

    revalidatePath("/blogs");
    revalidatePath(`/blogs/${id}`);
    revalidatePath("/");
    return ok("Featured status updated", result.data);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to toggle featured status");
  }
}

export async function updateBlogSeoAction(
  id: string | number,
  seoData: any,
): Promise<ActionResult> {
  try {

    const res = await serverFetch.post(`/blogs/${id}/seo`, { body: JSON.stringify(seoData) });
    const result = fromServiceResponse(await parseApiResponse(res), "Failed to update blog SEO");
    if (!result.success) return result;

    revalidatePath("/blogs");
    revalidatePath("/");
    return ok("Blog SEO updated successfully", result.data);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to update blog SEO");
  }
}

// ── Categories ───────────────────────────────────────────────────────────────

export async function createBlogCategoryAction(name: string, description?: string): Promise<ActionResult> {
  try {

    const res = await serverFetch.post("/blog-categories", {
      body: JSON.stringify({ name, description }),
    });
    const result = fromServiceResponse(await parseApiResponse(res), "Failed to create blog category");
    if (!result.success) return result;

    revalidatePath("/blogs");
    return ok("Blog category created successfully", result.data);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to create blog category");
  }
}

export async function updateBlogCategoryAction(id: string | number, name: string, description?: string): Promise<ActionResult> {
  try {

    const res = await serverFetch.patch(`/blog-categories/${id}`, {
      body: JSON.stringify({ name, description }),
    });
    const result = fromServiceResponse(await parseApiResponse(res), "Failed to update blog category");
    if (!result.success) return result;

    revalidatePath("/blogs");
    return ok("Blog category updated successfully", result.data);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to update blog category");
  }
}

export async function deleteBlogCategoryAction(id: string | number): Promise<ActionResult> {
  try {

    const res = await serverFetch.delete(`/blog-categories/${id}`);
    const result = fromServiceResponse(await parseApiResponse(res), "Failed to delete blog category");
    if (!result.success) return result;

    revalidatePath("/blogs");
    return ok("Blog category deleted successfully");
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to delete blog category");
  }
}

// ── Authors ──────────────────────────────────────────────────────────────────

export async function createBlogAuthorAction(payload: any): Promise<ActionResult> {
  try {

    const res = await serverFetch.post("/blog-authors", { body: JSON.stringify(payload) });
    const result = fromServiceResponse(await parseApiResponse(res), "Failed to create blog author");
    if (!result.success) return result;

    revalidatePath("/blogs");
    return ok("Blog author created successfully", result.data);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to create blog author");
  }
}

export async function updateBlogAuthorAction(id: string | number, payload: any): Promise<ActionResult> {
  try {

    const res = await serverFetch.patch(`/blog-authors/${id}`, { body: JSON.stringify(payload) });
    const result = fromServiceResponse(await parseApiResponse(res), "Failed to update blog author");
    if (!result.success) return result;

    revalidatePath("/blogs");
    return ok("Blog author updated successfully", result.data);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to update blog author");
  }
}

export async function deleteBlogAuthorAction(id: string | number): Promise<ActionResult> {
  try {

    const res = await serverFetch.delete(`/blog-authors/${id}`);
    const result = fromServiceResponse(await parseApiResponse(res), "Failed to delete blog author");
    if (!result.success) return result;

    revalidatePath("/blogs");
    return ok("Blog author deleted successfully");
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to delete blog author");
  }
}

export async function uploadBlogAuthorAvatarAction(
  id: string | number,
  formData: FormData,
): Promise<ActionResult> {
  try {

    const res = await serverFetch.post(`/blog-authors/${id}/avatar`, { body: formData });
    const result = fromServiceResponse(await parseApiResponse(res), "Failed to upload author avatar");
    if (!result.success) return result;

    revalidatePath("/blogs");
    return result;
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to upload author avatar");
  }
}

export async function deleteBlogAuthorAvatarAction(id: string | number): Promise<ActionResult> {
  try {

    const res = await serverFetch.delete(`/blog-authors/${id}/avatar`);
    const result = fromServiceResponse(await parseApiResponse(res), "Failed to delete author avatar");
    if (!result.success) return result;

    revalidatePath("/blogs");
    return result;
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to delete author avatar");
  }
}

// ── Tags ─────────────────────────────────────────────────────────────────────

export async function createBlogTagAction(name: string): Promise<ActionResult> {
  try {

    const res = await serverFetch.post("/blog-tags", { body: JSON.stringify({ name }) });
    const result = fromServiceResponse(await parseApiResponse(res), "Failed to create blog tag");
    if (!result.success) return result;

    revalidatePath("/blogs");
    return ok("Blog tag created successfully", result.data);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to create blog tag");
  }
}

export async function updateBlogTagAction(id: string | number, name: string): Promise<ActionResult> {
  try {

    const res = await serverFetch.patch(`/blog-tags/${id}`, { body: JSON.stringify({ name }) });
    const result = fromServiceResponse(await parseApiResponse(res), "Failed to update blog tag");
    if (!result.success) return result;

    revalidatePath("/blogs");
    return ok("Blog tag updated successfully", result.data);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to update blog tag");
  }
}

export async function deleteBlogTagAction(id: string | number): Promise<ActionResult> {
  try {

    const res = await serverFetch.delete(`/blog-tags/${id}`);
    const result = fromServiceResponse(await parseApiResponse(res), "Failed to delete blog tag");
    if (!result.success) return result;

    revalidatePath("/blogs");
    return ok("Blog tag deleted successfully");
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to delete blog tag");
  }
}
