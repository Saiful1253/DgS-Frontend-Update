import { z } from "zod";

export const technologySchema = z.object({
  id: z.union([z.number(), z.string()]).optional(),
  name: z.string().trim().min(2, "Technology name is required (at least 2 characters)").max(255),
  category: z.string().trim().min(2, "Category is required").max(100),
  icon_url: z.string().trim().max(500).nullable().optional().or(z.literal("")),
  proficiency_tagline: z
    .string()
    .trim()
    .max(255, "Tagline too long (max 255 chars)")
    .nullable()
    .optional()
    .or(z.literal("")),
  display_order: z.number().int().min(0, "Display order must be non-negative").default(0),
  is_active: z.boolean().default(true),
});

export type TechnologySchemaType = z.infer<typeof technologySchema>;
