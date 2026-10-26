export interface Testimonial {
  id: number;
  author_name: string;
  customer_name?: string;
  author_role?: string | null;
  author_company?: string | null;
  avatar_url?: string | null;
  client_logo_url?: string | null;
  type: "text" | "image";
  image_url?: string | null;
  image_public_id?: string | null;
  rating: number;
  content: string | null;
  status: "pending" | "approved" | "rejected";
  source: string;
  source_platform?: string | null;
  is_featured: boolean;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaginatedTestimonials {
  data: Testimonial[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface TestimonialsStats {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  featured: number;
  averageRating: number;
}

export interface TestimonialQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  is_featured?: boolean;
  search?: string;
  sortBy?: string;
  order?: "asc" | "desc";
}
