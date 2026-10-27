import { z } from "zod";

export const whyChooseUsSchema = z.object({
  id: z.number(),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  image_url: z.string().nullable().optional(),
  icon_url: z.string().nullable().optional(),
  icon_color: z.string().nullable().optional(),
  badge_color: z.string().nullable().optional(),
  icon_name: z.string().nullable().optional(),
  display_order: z.number().optional(),
  is_active: z.boolean(),
  is_deleted: z.boolean().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const whyChooseUsListSchema = z.array(whyChooseUsSchema);

export type WhyChooseUsSchemaType = z.infer<typeof whyChooseUsSchema>;
