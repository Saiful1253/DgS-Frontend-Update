/* eslint-disable @typescript-eslint/no-explicit-any */
export type BlogStatus = "draft" | "internal_review" | "scheduled" | "published" | "archived";

export interface BlogCoAuthor {
  name: string;
  designation?: string | null;
  avatar_url?: string | null;
}

export interface BlogPrimaryAuthor {
  id: number;
  name: string;
  designation: string | null;
  avatar_url: string | null;
}

export interface BlogPost {
  id: number | string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  content_delta: any | null;
  featured_image_url: string | null;
  featured_image_public_id: string | null;
  featured_image_alt: string | null;
  reading_time: string | null;
  category: string | null;
  tags: string[] | null;
  primary_author_name: string | null;
  primary_author?: BlogPrimaryAuthor | null;
  co_authors: BlogCoAuthor[] | null;
  related_article_ids: number[] | null;
  related_service_keys: string[] | null;
  canonical_url: string | null;
  custom_og_image: string | null;
  no_index: boolean;
  no_follow: boolean;
  featured_status: boolean;
  status: BlogStatus;
  published_at: string | null;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
  meta_title?: string | null;
  meta_description?: string | null;
  keywords?: string[] | null;
  seo_meta?: any;
}

/**
 * Normalised list envelope.
 *
 * The backend has returned both `pages` and `totalPages` for this payload at
 * different times, so both are declared and readers should treat them as one
 * field rather than assume either spelling.
 */
export interface BlogListResponse {
  data: BlogPost[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  totalPages?: number;
}

export interface BlogCategory {
  id: number | string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  posts_count?: number;
}

export interface BlogAuthor {
  id: number | string;
  name: string;
  designation: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  posts_count?: number;
}

export interface BlogTag {
  id: number | string;
  name: string;
  slug: string;
  created_at: string;
  usages?: number;
  posts_count?: number;
  scope?: string;
}

export interface ServiceOption {
  id: number;
  name: string;
  slug?: string;
  pillar: string;
  icon_url?: string | null;
}