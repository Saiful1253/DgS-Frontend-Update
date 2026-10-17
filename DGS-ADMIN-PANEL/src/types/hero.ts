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

export interface HeroImageOps {
  imagesToDelete: (string | number)[];
  imagesToReplace: { id: string | number; file: File; is_active: boolean }[];
  imagesToAdd: { tempId: string; file: File; is_active: boolean }[];
  videosToAdd: { tempId: string; media_url: string; is_active: boolean }[];
  newOrder?: { id: string | number; is_active: boolean }[];
}

export interface HeroListResponse {
  data: HeroSection[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}