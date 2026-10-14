import { z } from "zod";

export const servicePillarSchema = z.object({
  id: z.number().optional(),
  name: z.string().trim().min(2, "Pillar name is required (at least 2 characters)").max(100),
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

export const serviceGroupSchema = z.object({
  id: z.number().optional(),
  pillar: z.string().trim().min(2, "Pillar name is required"),
  name: z.string().trim().min(2, "Group name is required (at least 2 characters)").max(120),
  slug: z
    .string()
    .trim()
    .min(2, "SEO slug is required")
    .max(140)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug may only contain lowercase letters, numbers, and hyphens"),
  display_order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

export const serviceSchema = z.object({
  id: z.number().optional(),
  group_id: z.number().int().positive("Please select a service group").nullable().optional(),
  name: z.string().trim().min(2, "Service name is required (at least 2 characters)").max(160),
  slug: z
    .string()
    .trim()
    .min(2, "SEO slug is required")
    .max(180)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug may only contain lowercase letters, numbers, and hyphens"),
  pillar: z.string().trim().min(2, "Pillar selection is required"),
  description: z
    .string()
    .trim()
    .min(10, "Description is required (at least 10 characters)")
    .max(600, "Description is too long (max 600 characters)"),
  icon_url: z.string().trim().max(500).optional().or(z.literal("")),
  display_order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

export type ServicePillarSchemaType = z.infer<typeof servicePillarSchema>;
export type ServiceSchemaType = z.infer<typeof serviceSchema>;
export type ServiceGroupSchemaType = z.infer<typeof serviceGroupSchema>;
