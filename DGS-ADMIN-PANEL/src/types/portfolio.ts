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

