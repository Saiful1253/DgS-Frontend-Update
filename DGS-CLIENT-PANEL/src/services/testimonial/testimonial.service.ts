import { publicFetch } from "@/lib/server-fetch";
import type {
  Testimonial,
  TestimonialsListQueryParams,
  TestimonialsListResponse,
} from "@/types/testimonial";

export async function getTestimonials(
  params: TestimonialsListQueryParams = {}
): Promise<TestimonialsListResponse> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;
  const typeParam = params.type ? `&type=${params.type}` : "";

  const res = await publicFetch.get(
    `/client/testimonials?page=${page}&limit=${limit}${typeParam}`
  );
  if (!res.ok) {
    const errorBody = await res.text().catch(() => "No error body");
    throw new Error(
      `Failed to fetch testimonials: ${res.status} ${res.statusText} - ${errorBody}`
    );
  }
  const body = await res.json();
  if (body?.data && Array.isArray(body.data)) {
    return {
      data: body.data,
      total: body.total ?? body.data.length,
      page: body.page ?? 1,
      limit: body.limit ?? 10,
      pages: body.pages ?? 1,
    };
  }
  if (Array.isArray(body)) {
    return {
      data: body,
      total: body.length,
      page: 1,
      limit: body.length,
      pages: 1,
    };
  }
  return { data: [], total: 0, page: 1, limit: 10, pages: 1 };
}

export async function getFeaturedTestimonials(): Promise<Testimonial[]> {
  const res = await publicFetch.get("/client/testimonials/featured");
  if (!res.ok) {
    const errorBody = await res.text().catch(() => "No error body");
    throw new Error(
      `Failed to fetch featured testimonials: ${res.status} ${res.statusText} - ${errorBody}`
    );
  }
  const body = await res.json();
  if (body?.data && Array.isArray(body.data)) {
    return body.data;
  }
  if (Array.isArray(body)) {
    return body;
  }
  return [];
}

export async function submitTestimonial(formData: FormData): Promise<Testimonial> {
  const res = await publicFetch.post("/client/testimonials", {
    body: formData,
  });
  if (!res.ok) {
    const errorBody = await res.text().catch(() => "No error body");
    throw new Error(
      `Failed to submit testimonial: ${res.status} ${res.statusText} - ${errorBody}`
    );
  }
  const body = await res.json();
  return body?.data ?? body;
}
