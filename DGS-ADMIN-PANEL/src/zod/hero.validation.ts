import { z } from "zod";

export const heroSectionSchema = z.object({
  headline: z.string().min(1, "headline is required").max(200, "headline too long"),
  sub_headline: z.string().min(1, "sub-headline is required").max(1000, "sub-headline too long"),
  primary_cta_label: z.string().min(1, "primary CTA label is required").max(100, "primary CTA label too long"),
  primary_cta_link: z.string().min(1, "primary CTA link is required").max(500, "primary CTA link too long"),
  secondary_cta_label: z.string().max(100, "secondary CTA label too long").optional().or(z.literal("")),
  secondary_cta_link: z.string().max(500, "secondary CTA link too long").optional().or(z.literal("")),
  status: z.enum(["active", "inactive", "draft"]).default("draft"),
});

export const heroMediaSchema = z.object({
  media_type: z.enum(["image", "youtube"]),
  media_url: z.string().url("invalid url").min(1, "url is required"),
  sort_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
});

export type HeroSectionInput = z.infer<typeof heroSectionSchema>;
export type HeroMediaInput = z.infer<typeof heroMediaSchema>;