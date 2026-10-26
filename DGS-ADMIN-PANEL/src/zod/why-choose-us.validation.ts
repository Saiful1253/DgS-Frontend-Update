import { z } from "zod";

export const whyChooseUsSchema = z.object({
  id: z.number().optional(),
  title: z
    .string()
    .trim()
    .min(2, "Title is required (at least 2 characters)")
    .max(255, "Title must be at most 255 characters"),
  description: z
    .string()
    .trim()
    .min(5, "Description is required (at least 5 characters)")
    .max(2000, "Description is too long"),
  image_url: z.string().trim().nullable().optional(),
  icon_url: z.string().trim().nullable().optional(),
  icon_color: z.string().trim().nullable().optional(),
  badge_color: z.string().trim().nullable().optional(),
  icon_name: z.string().trim().nullable().optional(),
  is_active: z.boolean().default(false),
});

export type WhyChooseUsSchemaType = z.infer<typeof whyChooseUsSchema>;
