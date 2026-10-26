/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { revalidatePath } from "next/cache";
import {
  fail,
  failWithStatus,
  ok,
  type ActionResult,
} from "./action-result";
import { serverFetch } from "@/lib/server-fetch";
import { extractApiErrorMessage, parseApiResponse } from "@/lib/api-error";
import {
  buildTestimonialsApiQueryString,
} from "@/lib/query/testimonial-query";
import type { TestimonialQueryParams } from "@/types/testimonial";
import {
  testimonialCreateSchema,
  testimonialUpdateSchema,
} from "@/zod/testimonial.validation";

function revalidateTestimonials() {
  revalidatePath("/testimonials");
  revalidatePath("/");
}

const unauthorizedMessage = (what: string) =>
  `Your session is no longer authorized to access ${what}. Sign in again.`;

// ── Reads ────────────────────────────────────────────────────────────────────

export async function getTestimonialsAction(
  query: TestimonialQueryParams = {}
): Promise<ActionResult> {
  try {
    const qs = buildTestimonialsApiQueryString(query);
    const res = await serverFetch.get(`/testimonials?${qs}`);
    if (!res.ok) {
      return failWithStatus(
        res.status === 401 || res.status === 403
          ? unauthorizedMessage("Testimonials")
          : await extractApiErrorMessage(res, "Failed to fetch testimonials"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(json?.message || "Failed to fetch testimonials", json?.statusCode);
    }
    const raw = json?.data ?? json;
    return ok("Testimonials loaded", raw);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to fetch testimonials");
  }
}

export async function getTestimonialsStatsAction(): Promise<ActionResult> {
  try {
    const res = await serverFetch.get("/testimonials/stats");
    if (!res.ok) {
      return failWithStatus(
        res.status === 401 || res.status === 403
          ? unauthorizedMessage("Testimonials stats")
          : await extractApiErrorMessage(res, "Failed to fetch stats"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    const data = json?.data ?? json;
    return ok("Stats loaded", data);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to fetch stats");
  }
}

// ── Writes ───────────────────────────────────────────────────────────────────

export async function createTestimonialAction(formData: FormData): Promise<ActionResult> {
  try {
    const rawData = formData.get("data");
    if (!rawData || typeof rawData !== "string") {
      return fail("Invalid request: missing testimonial data");
    }

    let parsedJson: any;
    try {
      parsedJson = JSON.parse(rawData);
    } catch {
      return fail("Invalid JSON payload in review data");
    }

    const parsed = testimonialCreateSchema.safeParse(parsedJson);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Validation failed";
      return fail(firstError);
    }

    const cleanFormData = new FormData();
    cleanFormData.append("data", JSON.stringify(parsed.data));
    const file = formData.get("file");
    if (file instanceof File && file.size > 0) {
      cleanFormData.append("file", file);
    }

    const res = await serverFetch.post("/testimonials", {
      body: cleanFormData,
    });

    if (!res.ok) {
      return failWithStatus(
        await extractApiErrorMessage(res, "Failed to create testimonial"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    revalidateTestimonials();
    return ok("Testimonial created successfully", json?.data ?? json);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to create testimonial");
  }
}

export async function updateTestimonialAction(
  id: string | number,
  formData: FormData
): Promise<ActionResult> {
  try {
    const rawData = formData.get("data");
    if (!rawData || typeof rawData !== "string") {
      return fail("Invalid request: missing testimonial data");
    }

    let parsedJson: any;
    try {
      parsedJson = JSON.parse(rawData);
    } catch {
      return fail("Invalid JSON payload in testimonial data");
    }

    const parsed = testimonialUpdateSchema.safeParse(parsedJson);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Validation failed";
      return fail(firstError);
    }

    const cleanFormData = new FormData();
    cleanFormData.append("data", JSON.stringify(parsed.data));
    const file = formData.get("file");
    if (file instanceof File && file.size > 0) {
      cleanFormData.append("file", file);
    }

    const res = await serverFetch.put(`/testimonials/${id}`, {
      body: cleanFormData,
    });

    if (!res.ok) {
      return failWithStatus(
        await extractApiErrorMessage(res, "Failed to update testimonial"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    revalidateTestimonials();
    return ok("Testimonial updated successfully", json?.data ?? json);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to update testimonial");
  }
}

export async function setTestimonialStatusAction(
  id: string | number,
  status: "pending" | "approved" | "rejected"
): Promise<ActionResult> {
  try {
    const res = await serverFetch.patch(`/testimonials/${id}/status`, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      return failWithStatus(
        await extractApiErrorMessage(res, "Failed to update testimonial status"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    revalidateTestimonials();
    return ok(`Testimonial marked as ${status}`, json?.data ?? json);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to update testimonial status");
  }
}

export async function setTestimonialFeaturedAction(
  id: string | number,
  is_featured: boolean
): Promise<ActionResult> {
  try {
    const res = await serverFetch.patch(`/testimonials/${id}/featured`, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_featured }),
    });

    if (!res.ok) {
      return failWithStatus(
        await extractApiErrorMessage(res, "Failed to update featured status"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    revalidateTestimonials();
    return ok(
      is_featured ? "Testimonial featured on storefront" : "Testimonial unfeatured",
      json?.data ?? json
    );
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to update featured status");
  }
}

export async function deleteTestimonialAction(id: string | number): Promise<ActionResult> {
  try {
    const res = await serverFetch.delete(`/testimonials/${id}`);
    if (!res.ok) {
      return failWithStatus(
        await extractApiErrorMessage(res, "Failed to delete testimonial"),
        res.status
      );
    }

    revalidateTestimonials();
    return ok("Testimonial deleted successfully");
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to delete testimonial");
  }
}
