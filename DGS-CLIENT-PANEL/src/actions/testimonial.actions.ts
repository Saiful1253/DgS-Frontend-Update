"use server";

import {
  getTestimonials,
  getFeaturedTestimonials,
  submitTestimonial,
} from "@/services/testimonial/testimonial.service";
import { fail, fromServiceResponse, type ActionResult } from "./action-result";
import { TestimonialSubmitSchema } from "@/zod/testimonial.validation";
import type { TestimonialsListQueryParams } from "@/types/testimonial";

export async function getTestimonialsAction(
  params: TestimonialsListQueryParams = {}
): Promise<ActionResult> {
  try {
    const data = await getTestimonials(params);
    return fromServiceResponse({ success: true, data }, "Failed to fetch testimonials");
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to fetch testimonials");
  }
}

export async function getFeaturedTestimonialsAction(): Promise<ActionResult> {
  try {
    const data = await getFeaturedTestimonials();
    return fromServiceResponse({ success: true, data }, "Failed to fetch featured testimonials");
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to fetch featured testimonials");
  }
}

export async function submitTestimonialAction(
  formData: FormData
): Promise<ActionResult<Record<string, string>>> {
  try {
    const dataStr = formData.get("data");
    if (!dataStr || typeof dataStr !== "string") {
      return fail("Invalid feedback data");
    }

    let parsedData: unknown;
    try {
      parsedData = JSON.parse(dataStr);
    } catch {
      return fail("Invalid JSON payload in testimonial data");
    }

    const validation = TestimonialSubmitSchema.safeParse(parsedData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      return fail("Validation failed", fieldErrors);
    }

    const cleanFormData = new FormData();
    cleanFormData.append("data", JSON.stringify(validation.data));
    const file = formData.get("file");
    if (file instanceof File && file.size > 0) {
      cleanFormData.append("file", file);
    }

    const res = await submitTestimonial(cleanFormData);
    return fromServiceResponse({ success: true, data: res }, "Failed to submit testimonial");
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to submit testimonial");
  }
}
