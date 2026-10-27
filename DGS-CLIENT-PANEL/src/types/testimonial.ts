export interface Testimonial {
  id: number;
  customer_name?: string | null;
  author_name?: string;
  author_role?: string | null;
  author_company?: string | null;
  avatar_url?: string | null;
  client_logo_url?: string | null;
  type: "text" | "image";
  rating: number;
  content: string | null;
  image_url: string | null;
  image_public_id?: string | null;
  status: "pending" | "approved" | "rejected";
  is_featured: boolean;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface TestimonialsListQueryParams {
  page?: number;
  limit?: number;
  type?: "text" | "image";
}

export interface TestimonialSubmitInput {
  customer_name?: string;
  author_name?: string;
  author_role?: string;
  author_company?: string;
  rating?: number;
  content?: string;
}

export interface TestimonialsListResponse {
  data: Testimonial[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
