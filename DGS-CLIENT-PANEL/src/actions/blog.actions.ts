/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { fail, failWithStatus, ok, type ActionResult } from "./action-result";
import { publicFetch } from "@/lib/server-fetch";
import { extractApiErrorMessage, parseApiResponse } from "@/lib/api-error";

import type { BlogListResponse, BlogPost } from "@/types/blog";

/**
 * Server actions for the public Blog module.
 *
 * House chain as in the admin panel (`page / component -> service -> action`),
 * but the transport is `publicFetch` against the `@Public()` routes: the
 * storefront holds no CMS session, so there is no write
 * surface here. Writes - create, update, publish, schedule, SEO, categories,
 * authors, tags - belong to the admin panel.
 *
 * The public surface is three routes only: `/client/blogs`,
 * `/client/blogs/:id` and `/client/blogs/:id/related`. There is deliberately no
 * reader for blog categories, authors or tags: `/client/blog-categories`,
 * `/client/blog-authors` and `/client/blog-tags` do not exist on the backend (the
 * real controllers sit behind `JwtAuthGuard`), so an earlier
 * version of this file requested three endpoints that 404'd on every page load
 * and then swallowed the 404 as an empty list. Categories are derived from the
 * published posts instead, which cannot drift from what is actually listed.
 *
 * Query input is validated with the same Zod schema the rest of the app uses, so
 * `page=abc` or `limit=9999` is rejected here rather than forwarded to the API.
 */

/** Published posts change on the order of days; an hour of staleness is invisible. */
const REVALIDATE_SECONDS = 3600;

/** Accept a bare array, a `{ data, total }` envelope, or a doubly-wrapped one. */
function toListEnvelope(
  payload: any,
  fallback: { page: number; limit: number },
): BlogListResponse {
  const source = payload?.data !== undefined && !Array.isArray(payload) ? payload : { data: payload };
  const rows = Array.isArray(source?.data) ? source.data : Array.isArray(payload) ? payload : [];
  const total = Number(source?.total ?? rows.length) || 0;
  const limit = Number(source?.limit ?? fallback.limit) || fallback.limit;
  const pages = Number(source?.pages ?? source?.totalPages) || Math.max(1, Math.ceil(total / limit));

  return {
    data: rows as BlogPost[],
    total,
    page: Number(source?.page ?? fallback.page) || fallback.page,
    limit,
    pages,
    totalPages: pages,
  };
}

// ── Reads ────────────────────────────────────────────────────────────────────

export async function listBlogsAction(
  page = 1,
  limit = 10,
  search?: string,
  category?: string
): Promise<ActionResult> {
  const p = { page: Number(page), limit: Number(limit), search, category };
  if (!Number.isInteger(p.page) || p.page < 1 || !Number.isInteger(p.limit) || p.limit < 1 || p.limit > 50) {
    return fail("Invalid blog query parameters");
  }
  const query = { page: p.page, limit: p.limit, search: p.search?.trim() || undefined, category: p.category?.trim() || undefined };

  try {
    const params = new URLSearchParams({
      page: String(query.page),
      limit: String(query.limit),
    });
    if (query.search) params.set("search", query.search);
    if (query.category) params.set("category", query.category);

    const res = await publicFetch.get(`/client/blogs?${params.toString()}`, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) {
      return failWithStatus(await extractApiErrorMessage(res, "Failed to load blogs"), res.status);
    }

    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(json?.message || "Failed to load blogs", json?.statusCode);
    }

    return ok(
      "Blogs loaded",
      toListEnvelope(json?.data ?? json, { page: query.page, limit: query.limit })
    );
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to load blogs");
  }
}

export async function getBlogAction(slugOrId: string | number): Promise<ActionResult> {
  try {
    // `encodeURIComponent` keeps a slug containing a slash or space from
    // altering the path structure.
    const res = await publicFetch.get(`/client/blogs/${encodeURIComponent(String(slugOrId))}`, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (res.status === 404) {
      // A missing post is a routing outcome, not a failure: the page renders a
      // not-found state from `null`.
      return ok("Blog not found", null);
    }
    if (!res.ok) {
      return failWithStatus(await extractApiErrorMessage(res, "Failed to load blog"), res.status);
    }

    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(json?.message || "Failed to load blog", json?.statusCode);
    }

    const data = json?.data ?? json;
    return ok("Blog loaded", (data?.data ?? data ?? null) as BlogPost | null);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to load blog");
  }
}

export async function getRelatedBlogsAction(
  id: string | number,
  limit = 3
): Promise<ActionResult> {
  try {
    const res = await publicFetch.get(
      `/client/blogs/${encodeURIComponent(String(id))}/related?limit=${limit}`,
      { next: { revalidate: REVALIDATE_SECONDS } }
    );
    if (!res.ok) {
      return failWithStatus(
        await extractApiErrorMessage(res, "Failed to load related blogs"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(json?.message || "Failed to load related blogs", json?.statusCode);
    }

    const data = json?.data ?? json;
    const rows = Array.isArray(data) ? data : data?.data;
    return ok("Related blogs loaded", Array.isArray(rows) ? (rows as BlogPost[]) : []);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to load related blogs");
  }
}

/**
 * Category chips for the blog listing filter.
 *
 * Derived from the published posts, because the public surface exposes no
 * category endpoint. A category an admin has assigned to nothing published never
 * appears - which is correct for a filter, and impossible to get out of sync
 * with the rows it filters.
 */
export async function listBlogCategoriesAction(limit = 100): Promise<ActionResult> {
  const res = await listBlogsAction(1, limit);
  if (!res.success) return res;

  const seen = new Map<string, { name: string; count: number }>();
  for (const post of (res.data as BlogListResponse).data) {
    const name = post.category?.trim();
    if (!name) continue;
    const entry = seen.get(name);
    if (entry) entry.count += 1;
    else seen.set(name, { name, count: 1 });
  }

  const data = [...seen.values()]
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .map((entry, index) => ({
      id: index + 1,
      name: entry.name,
      slug: entry.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      description: null,
      created_at: "",
      posts_count: entry.count,
    }));

  return ok("Blog categories loaded", data);
}

// NOTE: no type re-exports here. A `"use server"` module may only export async
// functions - the SWC server-actions transform hoists every export into the
// action manifest, so `export type { ... }` is looked up as a runtime export and
// fails the build. The contracts live in `src/types/blog.ts`.