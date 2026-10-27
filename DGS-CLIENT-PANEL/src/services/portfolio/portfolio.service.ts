import { cache } from "react";
import {
  getPublicPortfolioAction,
  getPublicPortfolioBySlugAction,
  getPublicPortfolioCategoriesAction,
} from "@/actions/portfolio.actions";
import type { ActionResult } from "@/actions/action-result";
import type { PortfolioItem, PublicPortfolioList } from "@/types/portfolio";

/**
 * Portfolio service - the domain layer for the module.
 *
 * House chain: `page / component -> service -> action -> HTTP`. The service holds
 * no transport: every request is a `"use server"` action, so a client component
 * may import this module and its calls arrive as an RPC on the server.
 *
 * The `get*Result` readers are for server pages. A read that fails must not
 * render as an empty grid, so the failure is reported as data and the page decides
 * what to show; the `get*` wrappers are the throwing convenience form.
 */

export type {
  PortfolioChallenge,
  PortfolioCategory,
  PortfolioItem,
  PortfolioPricingTier,
  PublicPortfolioList,
} from "@/types/portfolio";

export { ALL_PROJECTS, PORTFOLIO_CATEGORIES } from "@/types/portfolio";

export type ReadResult<T> = { ok: true; data: T } | { ok: false; message: string };

const EMPTY_LIST: PublicPortfolioList = { projects: [], categories: [] };

// ── Reads for the page layer ─────────────────────────────────────────────────

export const getPublicPortfolioResult = cache(async (params: {
  category?: string;
  search?: string;
  featured?: boolean;
  page?: number;
  limit?: number;
  status?: string;
  projectType?: string;
  district?: string;
  area?: string;
} = {}): Promise<ReadResult<PublicPortfolioList>> => {
  const res = await getPublicPortfolioAction(
    params.category,
    params.search,
    params.featured,
    params.page,
    params.limit,
    params.status,
    params.projectType,
    params.district,
    params.area,
  );
  if (!res.success) return { ok: false, message: res.message || "Failed to load portfolio" };
  return { ok: true, data: (res.data ?? EMPTY_LIST) as PublicPortfolioList };
});

export const getPublicPortfolioBySlugResult = cache(
  async (slug: string): Promise<ReadResult<PortfolioItem | null>> => {
    const res = await getPublicPortfolioBySlugAction(slug);
    if (!res.success) {
      return { ok: false, message: res.message || "Failed to load portfolio project" };
    }
    return { ok: true, data: (res.data ?? null) as PortfolioItem | null };
  }
);

export const getPublicPortfolioCategoriesResult = cache(
  async (): Promise<ReadResult<string[]>> => {
    const res = await getPublicPortfolioCategoriesAction();
    if (!res.success) {
      return { ok: false, message: res.message || "Failed to load portfolio categories" };
    }
    return { ok: true, data: Array.isArray(res.data) ? (res.data as string[]) : [] };
  }
);

// ── Reads for the page layer, degrading instead of throwing ──────────────────

/**
 * Never throws: this runs during static rendering of `/portfolio`, so a failed
 * fetch should degrade to an empty grid rather than a 500. The action layer
 * reports the failure in its result; the page renders what it can.
 */
export const getPublicPortfolio = cache(
  async (
    params: {
      category?: string;
      search?: string;
      featured?: boolean;
      page?: number;
      limit?: number;
      status?: string;
      projectType?: string;
      district?: string;
      area?: string;
    } = {},
  ): Promise<PublicPortfolioList> => {
    const result = await getPublicPortfolioResult(params);
    return result.ok ? result.data : EMPTY_LIST;
  },
);

/** Single case study for `/portfolio/[slug]`; `null` renders the not-found state. */
export const getPublicPortfolioBySlug = cache(
  async (slug: string): Promise<PortfolioItem | null> => {
    const result = await getPublicPortfolioBySlugResult(slug);
    return result.ok ? result.data : null;
  }
);

export const getPublicPortfolioCategories = cache(async (): Promise<string[]> => {
  const result = await getPublicPortfolioCategoriesResult();
  return result.ok ? result.data : [];
});

// ── Reads for client components ──────────────────────────────────────────────

export const listPublicPortfolios = (
  category?: string,
  search?: string,
  featured?: boolean,
  page?: number,
  limit?: number,
  status?: string,
  projectType?: string,
  district?: string,
  area?: string,
): Promise<ActionResult> =>
  getPublicPortfolioAction(
    category,
    search,
    featured,
    page,
    limit,
    status,
    projectType,
    district,
    area,
  );

export const listPublicPortfolioCategories = (): Promise<ActionResult> =>
  getPublicPortfolioCategoriesAction();