import { z } from "zod";

export const heroSectionSchema = z.object({
  headline: z.string().trim().min(1, "Headline is required").max(200, "Headline too long"),
  sub_headline: z.string().trim().min(1, "Sub-headline is required").max(1000, "Sub-headline too long"),
  primary_cta_label: z.string().trim().min(1, "Primary CTA label is required").max(100, "Primary CTA label too long"),
  primary_cta_link: z.string().trim().min(1, "Primary CTA link is required").max(500, "Primary CTA link too long"),
  secondary_cta_label: z.string().trim().max(100, "Secondary CTA label too long").optional().or(z.literal("")),
  secondary_cta_link: z.string().trim().max(500, "Secondary CTA link too long").optional().or(z.literal("")),
  badge_text: z.string().trim().max(255, "Badge text too long").optional().or(z.literal("")),
  highlight_text: z.string().trim().max(150, "Highlight text too long").optional().or(z.literal("")),
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