import { z } from "zod";

export const TestimonialSubmitSchema = z.object({
  customer_name: z.string().trim().min(1, "Name is required"),
  author_role: z.string().trim().optional(),
  author_company: z.string().trim().optional(),
  rating: z.coerce.number().min(1, "Rating is required").max(5, "Maximum rating is 5"),
  content: z.string().trim().min(1, "Review or testimonial feedback is required"),
});

export type TestimonialSubmitInput = z.infer<typeof TestimonialSubmitSchema>;
