import { cache } from "react";
import {
  getBlogAction,
  getRelatedBlogsAction,
  listBlogCategoriesAction,
  listBlogsAction,
} from "@/actions/blog.actions";
import type { BlogCategory, BlogListResponse, BlogPost } from "@/types/blog";

/**
 * Blog service - the domain layer for the module.
 *
 * House chain: `page / component -> service -> action`. The service holds no
 * transport: every request is a `"use server"` action, so a client component may
 * import this module and its calls arrive as an RPC on the server, where the
 * revalidation policy lives.
 *
 * The `get*Result` readers are for server pages. A failed read must not render as
 * an empty editorial queue, so the failure is reported as data and the page
 * decides what to show; the `get*` wrappers are the throwing convenience form.
 */

export type { BlogCategory, BlogListResponse, BlogPost } from "@/types/blog";

export type ReadResult<T> = { ok: true; data: T } | { ok: false; message: string };

// ── Reads for the page layer ─────────────────────────────────────────────────

export const getBlogsResult = cache(async (params: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
} = {}): Promise<ReadResult<BlogListResponse>> => {
  const page = params.page ?? 1;
  const limit = params.limit ?? 6;
  const res = await listBlogsAction(page, limit, params.search, params.category);
  if (!res.success) return { ok: false, message: res.message || "Failed to load blogs" };
  return { ok: true, data: res.data as BlogListResponse };
});

export const getBlogResult = cache(
  async (slugOrId: string | number): Promise<ReadResult<BlogPost | null>> => {
    const res = await getBlogAction(slugOrId);
    if (!res.success) return { ok: false, message: res.message || "Failed to load blog" };
    return { ok: true, data: (res.data ?? null) as BlogPost | null };
  }
);

export const getRelatedBlogsResult = cache(
  async (id: string | number, limit = 3): Promise<ReadResult<BlogPost[]>> => {
    const res = await getRelatedBlogsAction(id, limit);
    if (!res.success) return { ok: false, message: res.message || "Failed to load related blogs" };
    return { ok: true, data: Array.isArray(res.data) ? (res.data as BlogPost[]) : [] };
  }
);

export const getBlogCategoriesResult = cache(async (): Promise<ReadResult<BlogCategory[]>> => {
  const res = await listBlogCategoriesAction();
  if (!res.success) return { ok: false, message: res.message || "Failed to load blog categories" };
  return { ok: true, data: Array.isArray(res.data) ? (res.data as BlogCategory[]) : [] };
});

// ── Reads for the page layer, degrading instead of throwing ──────────────────

/**
 * Never throws: this runs during static rendering of `/blogs`, and a failed fetch
 * should degrade to an empty listing rather than a 500. The action layer reports
 * the failure in its result; the page renders what it can.
 */
export const getBlogs = cache(async (params: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
} = {}): Promise<BlogListResponse> => {
  const page = params.page ?? 1;
  const limit = params.limit ?? 6;
  const result = await getBlogsResult({ ...params, page, limit });
  return (
    result.ok
      ? result.data
      : { data: [], total: 0, page, limit, pages: 1, totalPages: 1 }
  );
});

/** `null` for a missing post, which the page turns into a not-found state. */
export const getBlog = cache(async (slugOrId: string | number): Promise<BlogPost | null> => {
  const result = await getBlogResult(slugOrId);
  return result.ok ? result.data : null;
});

export const getRelatedBlogs = cache(
  async (id: string | number, limit = 3): Promise<BlogPost[]> => {
    const result = await getRelatedBlogsResult(id, limit);
    return result.ok ? result.data : [];
  }
);

export const getBlogCategories = cache(async (): Promise<BlogCategory[]> => {
  const result = await getBlogCategoriesResult();
  return result.ok ? result.data : [];
});

// ── Reads for client components ──────────────────────────────────────────────

export const listBlogs = (page = 1, limit = 10, search?: string, category?: string) =>
  listBlogsAction(page, limit, search, category);

export const listBlogCategories = () => listBlogCategoriesAction();

export const listRelatedBlogs = (id: string | number, limit = 3) =>
  getRelatedBlogsAction(id, limit);