import { z } from "zod";

export const serviceCategorySchema = z.object({
  id: z.number().optional(),
  name: z.string().trim().min(2, "Category name is required (at least 2 characters)").max(100),
  slug: z
    .string()
    .trim()
    .min(2, "SEO slug is required")
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug may only contain lowercase letters, numbers, and hyphens"),
  display_label: z.string().trim().min(2, "Display label is required").max(150),
  blurb: z.string().trim().max(500).optional().or(z.literal("")),
  icon: z.string().trim().max(500).optional().or(z.literal("")),
  display_order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

export const servicePillarSchema = serviceCategorySchema;

export const serviceSchema = z.object({
  id: z.number().optional(),
  name: z.string().trim().min(2, "Service name is required (at least 2 characters)").max(160),
  slug: z
    .string()
    .trim()
    .min(2, "SEO slug is required")
    .max(180)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug may only contain lowercase letters, numbers, and hyphens"),
  category: z.string().trim().min(2, "Service category is required"),
  pillar: z.string().trim().optional(),
  description: z
    .string()
    .trim()
    .refine((val) => {
      const stripped = val.replace(/<[^>]*>/g, "").trim();
      return stripped.length >= 2;
    }, "Description is required (at least 2 characters)"),
  icon_url: z.string().trim().max(500).optional().or(z.literal("")),
  badge_label: z.string().trim().max(100).optional().or(z.literal("")),
  badge_status: z.string().trim().max(100).optional().or(z.literal("")),
  sub_title: z.string().trim().max(255).optional().or(z.literal("")),
  category_tag: z.string().trim().max(100).optional().or(z.literal("")),
  tier_label: z.string().trim().max(100).optional().or(z.literal("")),
  image_url: z.string().trim().max(500).optional().or(z.literal("")),
  is_flagship: z.boolean().default(false),
  features: z
    .array(
      z.object({
        title: z.string().trim().optional().or(z.literal("")),
        description: z.string().trim().optional(),
        icon: z.string().optional(),
      })
    )
    .optional()
    .default([]),
  compliance_codes: z.string().trim().max(255).optional().or(z.literal("")),
  cta_label: z.string().trim().max(100).optional().or(z.literal("")),
  cta_url: z.string().trim().max(255).optional().or(z.literal("")),
  is_active: z.boolean().default(true),
});

export type ServiceCategorySchemaType = z.infer<typeof serviceCategorySchema>;
export type ServicePillarSchemaType = ServiceCategorySchemaType;
export type ServiceSchemaType = z.infer<typeof serviceSchema>;
