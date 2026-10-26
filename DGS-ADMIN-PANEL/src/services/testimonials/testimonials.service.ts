import { cache } from "react";
import {
  getTestimonialsAction,
  getTestimonialsStatsAction,
  createTestimonialAction,
  updateTestimonialAction,
  setTestimonialStatusAction,
  setTestimonialFeaturedAction,
  deleteTestimonialAction,
} from "@/actions/testimonial.actions";
import type {
  PaginatedTestimonials,
  Testimonial,
  TestimonialsStats,
  TestimonialQueryParams,
} from "@/types/testimonial";

export type {
  PaginatedTestimonials,
  Testimonial,
  TestimonialsStats,
  TestimonialQueryParams,
} from "@/types/testimonial";

export type ReadResult<T> = { ok: true; data: T } | { ok: false; message: string };

const EMPTY_PAGE: PaginatedTestimonials = {
  data: [],
  total: 0,
  page: 1,
  limit: 10,
  pages: 1,
};

const EMPTY_STATS: TestimonialsStats = {
  total: 0,
  approved: 0,
  pending: 0,
  rejected: 0,
  featured: 0,
  averageRating: 5.0,
};

// ── Cached Page Data Fetchers ────────────────────────────────────────────────

export const getTestimonialsResult = cache(
  async (query: TestimonialQueryParams = {}): Promise<ReadResult<PaginatedTestimonials>> => {
    const res = await getTestimonialsAction(query);
    if (!res.success) {
      return { ok: false, message: res.message || "Failed to fetch testimonials" };
    }
    const data = res.data as PaginatedTestimonials | undefined;
    return { ok: true, data: data ?? EMPTY_PAGE };
  }
);

export const getTestimonialsStatsResult = cache(
  async (): Promise<ReadResult<TestimonialsStats>> => {
    const res = await getTestimonialsStatsAction();
    if (!res.success) {
      return { ok: false, message: res.message || "Failed to fetch testimonials stats" };
    }
    const data = res.data as TestimonialsStats | undefined;
    return { ok: true, data: data ?? EMPTY_STATS };
  }
);

// ── Client Component Helpers ─────────────────────────────────────────────────

export const listTestimonials = (query: TestimonialQueryParams = {}) =>
  getTestimonialsAction(query);

export const createTestimonial = (formData: FormData) =>
  createTestimonialAction(formData);

export const updateTestimonial = (id: string | number, formData: FormData) =>
  updateTestimonialAction(id, formData);

export const setTestimonialStatus = (
  id: string | number,
  status: "pending" | "approved" | "rejected"
) => setTestimonialStatusAction(id, status);

export const setTestimonialFeatured = (
  id: string | number,
  isFeatured: boolean
) => setTestimonialFeaturedAction(id, isFeatured);

export const deleteTestimonial = (id: string | number) =>
  deleteTestimonialAction(id);
