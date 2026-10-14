export interface PortfolioChallenge {
  id?: number;
  portfolio_id?: number;
  title: string;
  challenge_description?: string;
  solution_provided?: string;
  supporting_image?: string;
  sort_order?: number;
}

export interface PortfolioPricingTier {
  id?: number;
  portfolio_id?: number;
  title: string;
  currencies?: string[];
  primary_price?: string;
  regional_prices?: Record<string, string>;
  price_subtitle?: string;
  deliverables?: string[];
  is_most_popular?: boolean;
  sort_order?: number;
}

export interface PortfolioItem {
  id: number;
  project_name: string;
  slug: string;
  client_name?: string;
  client_logo?: string;
  category: string;
  tags: string[];
  live_url?: string;
  app_store_url?: string;
  play_store_url?: string;
  is_featured: boolean;
  cover_image?: string;
  primary_challenge?: string;
  primary_solution?: string;
  comparison_enabled?: boolean;
  comparison_title?: string;
  industry_standard_text?: string;
  our_approach_text?: string;
  pricing_enabled?: boolean;
  pricing_title?: string;
  challenges?: PortfolioChallenge[];
  pricing_tiers?: PortfolioPricingTier[];
  created_at?: string;
  updated_at?: string;
}

export type PortfolioInput = Omit<PortfolioItem, "id" | "created_at" | "updated_at"> & {
  id?: number;
};

export interface PortfolioCategory {
  id: number;
  name: string;
  slug?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Payload of `GET /portfolio/public`.
 *
 * The endpoint does not paginate: it returns the full published set plus the
 * category tab list, because the public grid filters and searches client-side.
 * Truncating server-side would make an empty-looking tab indistinguishable from
 * an exhausted one.
 */
export interface PublicPortfolioList {
  projects: PortfolioItem[];
  categories: string[];
}

/** SRS 4.1 - default tab; "All Projects" shows everything. */
export const ALL_PROJECTS = "All Projects";

/**
 * Seed tab list, used only when the backend has no categories yet.
 *
 * The backend falls back to the same list, so this mirrors it rather than
 * inventing a second one.
 */
export const PORTFOLIO_CATEGORIES = [
  "Software & Cloud",
  "Software Engineering",
  "Creative & Post-Production",
  "Marketing & Growth",
  "Mobile Apps & Platforms",
  "AI & Automation",
  "FinTech & Web3",
] as const;