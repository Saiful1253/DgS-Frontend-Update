export type HeroMediaType = "image" | "youtube";
export type HeroStatus = "active" | "inactive" | "draft";

export interface HeroMedia {
  id: number | string;
  hero_section_id: number | string;
  media_type: HeroMediaType;
  media_url: string;
  cloudinary_public_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HeroSection {
  id: number | string;
  headline: string | null;
  sub_headline: string | null;
  primary_cta_label: string | null;
  primary_cta_link: string | null;
  secondary_cta_label: string | null;
  secondary_cta_link: string | null;
  badge_text?: string | null;
  highlight_text?: string | null;
  status: HeroStatus;
  is_deleted?: boolean;
  media: HeroMedia[];
}

/** Media the visitor actually sees, in carousel order. */
export function activeHeroMedia(hero: HeroSection | null): HeroMedia[] {
  if (!hero?.media?.length) return [];
  return hero.media
    .filter((item) => item.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export interface HeroListResponse {
  data: HeroSection[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}