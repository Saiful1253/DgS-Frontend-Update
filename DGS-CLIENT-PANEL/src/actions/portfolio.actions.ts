/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { fail, failWithStatus, ok, type ActionResult } from "./action-result";
import { publicFetch } from "@/lib/server-fetch";
import { extractApiErrorMessage, parseApiResponse } from "@/lib/api-error";

import type { PortfolioItem, PublicPortfolioList } from "@/types/portfolio";

/**
 * Server actions for the public Portfolio module (SRS 4).
 *
 * House chain as in the admin panel (`page / component -> service -> action`),
 * but the transport is `publicFetch` against the `@Public()` routes: the
 * storefront holds no CMS session, so there is no write
 * surface here. Writes belong to the admin panel.
 *
 * `/portfolio/public` and `/portfolio/public/:slug` are the only `@Public()`
 * routes in the portfolio controller - `/portfolio/categories`, `/portfolio` and
 * `/portfolio/:slug` all sit behind `JwtAuthGuard`. The
 * category tab list arrives inside the public payload, so no second call is
 * needed.
 *
 * Query input is validated with Zod before it reaches the API, so a placeholder
 * category or an over-long search term is rejected here rather than forwarded.
 */

/** Published projects change on the order of days. */
const REVALIDATE_SECONDS = 3600;

const EMPTY_LIST: PublicPortfolioList = { projects: [], categories: [] };

/**
 * Accept the `{ projects, categories }` envelope and a bare array alike, so a
 * future backend shape change degrades to an empty tab bar rather than a 500 on
 * the page.
 */
function toPublicList(payload: any): PublicPortfolioList {
  if (Array.isArray(payload)) {
    return { projects: payload as PortfolioItem[], categories: [] };
  }
  return {
    projects: Array.isArray(payload?.projects) ? (payload.projects as PortfolioItem[]) : [],
    categories: Array.isArray(payload?.categories) ? (payload.categories as string[]) : [],
  };
}

// ── Reads ────────────────────────────────────────────────────────────────────

export async function getPublicPortfolioAction(
  category?: string,
  search?: string,
  featured?: boolean,
  page?: number,
  limit?: number,
  status?: string,
  projectType?: string,
  district?: string,
  area?: string,
): Promise<ActionResult> {
  const query = {
    category: category?.trim() || undefined,
    search: search?.trim() || undefined,
    featured: featured === true || (typeof featured === "string" && featured === "true"),
    status: status?.trim() || undefined,
    projectType: projectType?.trim() || undefined,
    district: district?.trim() || undefined,
    area: area?.trim() || undefined,
  };

  try {
    const params = new URLSearchParams();
    if (query.category) params.set("category", query.category);
    if (query.search) params.set("search", query.search);
    if (query.featured) params.set("featured", "true");
    if (query.status) params.set("status", query.status);
    if (query.projectType) params.set("projectType", query.projectType);
    if (query.district) params.set("district", query.district);
    if (query.area) params.set("area", query.area);
    if (page) params.set("page", String(page));
    if (limit) params.set("limit", String(limit));
    const qs = params.toString();

    const res = await publicFetch.get(`/portfolio/public${qs ? `?${qs}` : ""}`, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) {
      return failWithStatus(
        await extractApiErrorMessage(res, "Failed to load portfolio"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(json?.message || "Failed to load portfolio", json?.statusCode);
    }

    const payload = json?.data ?? json;
    const list = toPublicList(payload);
    if (!list.meta && payload?.meta) {
      list.meta = payload.meta;
    }
    if ((!list.projects || list.projects.length === 0) && Array.isArray(payload?.data)) {
      list.projects = payload.data as PortfolioItem[];
    }
    return ok("Portfolio loaded", list);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to load portfolio");
  }
}

export async function getPublicPortfolioLocationsAction(): Promise<ActionResult> {
  try {
    const res = await publicFetch.get("/portfolio/public/locations", {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) {
      return failWithStatus(
        await extractApiErrorMessage(res, "Failed to load portfolio locations"),
        res.status
      );
    }
    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(json?.message || "Failed to load portfolio locations", json?.statusCode);
    }
    const data = json?.data ?? json;
    return ok("Portfolio locations loaded", Array.isArray(data) ? data : []);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to load portfolio locations");
  }
}

export async function getPublicPortfolioBySlugAction(
  slug: string
): Promise<ActionResult> {
  try {
    // `encodeURIComponent` keeps a slug containing a slash or space from
    // altering the path structure.
    const res = await publicFetch.get(
      `/portfolio/public/${encodeURIComponent(slug)}`,
      { next: { revalidate: REVALIDATE_SECONDS } }
    );
    if (res.status === 404) {
      // A missing project is a routing outcome, not a failure: the page renders
      // a not-found state from `null`.
      return ok("Portfolio project not found", null);
    }
    if (!res.ok) {
      return failWithStatus(
        await extractApiErrorMessage(res, "Failed to load portfolio project"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(
        json?.message || "Failed to load portfolio project",
        json?.statusCode
      );
    }

    const data = json?.data ?? json;
    const project = data?.data ?? data;
    if (!project) return ok("Portfolio project not found", null);
    return ok("Portfolio project loaded", project as PortfolioItem);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to load portfolio project");
  }
}

/** Category tab list, taken from the same public payload as the grid. */
export async function getPublicPortfolioCategoriesAction(): Promise<ActionResult> {
  const res = await getPublicPortfolioAction();
  if (!res.success) return res;
  return ok("Portfolio categories loaded", res.data?.categories ?? EMPTY_LIST.categories);
}

// NOTE: no type re-exports here. A `"use server"` module may only export async
// functions - the SWC server-actions transform hoists every export into the
// action manifest, so `export type { ... }` is looked up as a runtime export and
// fails the build. The contracts live in `src/types/portfolio.ts`.