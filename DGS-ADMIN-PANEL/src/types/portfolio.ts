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

export type PortfolioMediaType = 'image' | 'youtube';
export type PortfolioProjectStatus = 'completed' | 'ongoing';
export type PortfolioProjectType = 'residential' | 'industrial' | 'commercial_restaurant';

export interface PortfolioItem {
  id: number;
  project_name: string;
  slug: string;
  client_name?: string;
  client_logo?: string;
  category: string;
  tags: string[];
  app_store_url?: string;
  play_store_url?: string;
  is_featured: boolean;
  media_type?: PortfolioMediaType;
  media_url?: string;
  project_status?: PortfolioProjectStatus;
  project_type?: string;
  district?: string;
  area?: string;
  address?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  description?: string;
  cover_image?: string;
  comparison_enabled?: boolean;
  comparison_title?: string;
  industry_standard_text?: string;
  our_approach_text?: string;
  pricing_enabled?: boolean;
  pricing_title?: string;
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

export interface PortfolioArea {
  id: number;
  name: string;
  slug?: string;
  created_at?: string;
  updated_at?: string;
}

