import { z } from "zod";

const testimonialBaseSchema = z.object({
  author_name: z
    .string()
    .trim()
    .min(1, "Author or customer name is required")
    .max(255, "Name must be at most 255 characters"),
  customer_name: z.string().trim().optional(),
  author_role: z.string().trim().max(255).optional().nullable(),
  author_company: z.string().trim().max(255).optional().nullable(),
  rating: z.coerce
    .number()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating cannot exceed 5"),
  type: z.enum(["text", "image"]).default("text"),
  status: z.enum(["pending", "approved", "rejected"]).default("approved"),
  is_featured: z.preprocess((val) => {
    if (typeof val === "string") return val === "true";
    return Boolean(val);
  }, z.boolean()).default(false),
  content: z
    .string()
    .trim()
    .min(1, "Review or testimonial content is required"),
  source: z.string().optional(),
  source_platform: z.string().optional().nullable(),
});

export const testimonialCreateSchema = testimonialBaseSchema.extend({
  rating: z.coerce
    .number()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating cannot exceed 5")
    .default(5),
  type: z.enum(["text", "image"]).default("text"),
  status: z.enum(["pending", "approved", "rejected"]).default("approved"),
  is_featured: z.preprocess((val) => {
    if (typeof val === "string") return val === "true";
    return Boolean(val);
  }, z.boolean()).default(false),
});

export const testimonialUpdateSchema = testimonialBaseSchema.partial();

export type TestimonialCreateInput = z.infer<typeof testimonialCreateSchema>;
export type TestimonialUpdateInput = z.infer<typeof testimonialUpdateSchema>;
