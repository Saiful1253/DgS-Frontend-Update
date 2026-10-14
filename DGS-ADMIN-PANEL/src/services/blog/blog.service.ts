/* eslint-disable @typescript-eslint/no-explicit-any */
import { cache } from "react";
import {
  createBlogAction,
  createBlogAuthorAction,
  createBlogCategoryAction,
  createBlogTagAction,
  deleteBlogAction,
  deleteBlogAuthorAction,
  deleteBlogAuthorAvatarAction,
  deleteBlogCategoryAction,
  deleteBlogTagAction,
  getBlogAction,
  listBlogAuthorsAction,
  listBlogCategoriesAction,
  listBlogsAction,
  listBlogTagsAction,
  toggleBlogFeaturedAction,
  updateBlogAction,
  updateBlogAuthorAction,
  updateBlogCategoryAction,
  updateBlogSeoAction,
  updateBlogStatusAction,
  updateBlogTagAction,
  uploadBlogAuthorAvatarAction,
} from "@/actions/blog.actions";
import type { BlogPost, BlogListResponse, BlogCategory, BlogAuthor, BlogTag } from "@/types/blog";

/**
 * Blog service — the domain layer for the module.
 *
 * House chain: `page / component → service → action`. The service holds no
 * transport: every request is a `"use server"` action, so a client component may
 * import this module and its calls arrive as an RPC on the server, where the
 * validation and the revalidation live.
 *
 * The `get*Result` readers are for server pages. A failed read must not render as
 * an empty editorial queue, so the failure is reported as data and the page
 * decides what to show; the `get*` wrappers are the throwing convenience form.
 */

export type { BlogPost, BlogListResponse, BlogCategory, BlogAuthor, BlogTag } from "@/types/blog";

export type ReadResult<T> = { ok: true; data: T } | { ok: false; message: string };

const listOf = <T,>(res: { success: boolean; data?: any; message?: string }, fallback: string) =>
  res.success && Array.isArray(res.data)
    ? ({ ok: true, data: res.data as T[] } as const)
    : ({ ok: false, message: res.message || fallback } as const);

// ── Reads for the page layer ─────────────────────────────────────────────────

export const getBlogsResult = cache(
  async (params: { page?: number; limit?: number; status?: string } = {}): Promise<
    ReadResult<BlogListResponse>
  > => {
    const { page = 1, limit = 10, status = "" } = params;
    const res = await listBlogsAction(page, limit, status);
    if (!res.success) return { ok: false, message: res.message || "Failed to load blogs" };
    return { ok: true, data: res.data as BlogListResponse };
  }
);

export const getBlogResult = cache(
  async (id: string | number): Promise<ReadResult<BlogPost | null>> => {
    const res = await getBlogAction(id);
    if (!res.success) return { ok: false, message: res.message || "Failed to load blog" };
    return { ok: true, data: (res.data ?? null) as BlogPost | null };
  }
);

export const getBlogCategoriesResult = cache(async (): Promise<ReadResult<BlogCategory[]>> => {
  const result = listOf<BlogCategory>(await listBlogCategoriesAction(), "Failed to load blog categories");
  return result.ok ? { ok: true, data: result.data } : { ok: false, message: result.message };
});

export const getBlogAuthorsResult = cache(async (): Promise<ReadResult<BlogAuthor[]>> => {
  const result = listOf<BlogAuthor>(await listBlogAuthorsAction(), "Failed to load blog authors");
  return result.ok ? { ok: true, data: result.data } : { ok: false, message: result.message };
});

export const getBlogTagsResult = cache(async (): Promise<ReadResult<BlogTag[]>> => {
  const result = listOf<BlogTag>(await listBlogTagsAction(), "Failed to load blog tags");
  return result.ok ? { ok: true, data: result.data } : { ok: false, message: result.message };
});

// ── Reads and writes for client components ───────────────────────────────────

export const listBlogs = (page = 1, limit = 10, status = "") => listBlogsAction(page, limit, status);

export const listBlogCategories = () => listBlogCategoriesAction();

export const listBlogAuthors = () => listBlogAuthorsAction();

export const listBlogTags = () => listBlogTagsAction();

export const createBlog = (formData: FormData) => createBlogAction(formData);

export const updateBlog = (id: string | number, formData: FormData) => updateBlogAction(id, formData);

export const deleteBlog = (id: string | number) => deleteBlogAction(id);

export const updateBlogStatus = (id: string | number, status: string, publishAt?: string) =>
  updateBlogStatusAction(id, status, publishAt);

export const toggleBlogFeatured = (id: string | number, featured?: boolean) =>
  toggleBlogFeaturedAction(id, featured);

export const updateBlogSeo = (id: string | number, seoData: any) => updateBlogSeoAction(id, seoData);

export const createBlogCategory = (name: string, description?: string) =>
  createBlogCategoryAction(name, description);

export const updateBlogCategory = (id: string | number, name: string, description?: string) =>
  updateBlogCategoryAction(id, name, description);

export const deleteBlogCategory = (id: string | number) => deleteBlogCategoryAction(id);

export const createBlogAuthor = (payload: any) => createBlogAuthorAction(payload);

export const updateBlogAuthor = (id: string | number, payload: any) =>
  updateBlogAuthorAction(id, payload);

export const deleteBlogAuthor = (id: string | number) => deleteBlogAuthorAction(id);

export const uploadBlogAuthorAvatar = (id: string | number, formData: FormData) =>
  uploadBlogAuthorAvatarAction(id, formData);

export const deleteBlogAuthorAvatar = (id: string | number) =>
  deleteBlogAuthorAvatarAction(id);

export const createBlogTag = (name: string) => createBlogTagAction(name);

export const updateBlogTag = (id: string | number, name: string) => updateBlogTagAction(id, name);

export const deleteBlogTag = (id: string | number) => deleteBlogTagAction(id);
