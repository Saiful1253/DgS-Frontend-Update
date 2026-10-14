import { z } from "zod";

export const BLOG_STATUSES = [
  "draft",
  "internal_review",
  "scheduled",
  "published",
  "archived",
] as const;

export const blogSchema = z.object({
  title: z.string().trim().min(1, "title is required").max(200, "title too long"),
  slug: z.string().trim().min(1).max(220).optional(),
  excerpt: z.string().trim().max(400, "excerpt too long").optional(),
  content: z.string().refine((val) => {
    const hasMedia = /<(img|iframe|video|embed|blockquote)/i.test(val);
    const stripped = val.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    return stripped.length > 0 || hasMedia;
  }, "content is required"),
  content_delta: z.any().optional().nullable(),
  featured_image_alt: z.string().trim().max(255).optional(),
  reading_time: z.string().trim().max(50).optional(),
  category: z.string().trim().max(100).optional(),
  tags: z.array(z.string().trim().min(1).max(60)).max(25).optional(),
  primary_author_name: z.string().trim().max(255).optional(),
  co_authors: z
    .array(z.object({ name: z.string().trim().min(1, "co-author name required"), designation: z.string().trim().optional() }))
    .optional(),
  related_article_ids: z.array(z.number().int().positive()).optional(),
  related_service_keys: z.array(z.string().trim().min(1)).optional(),
  canonical_url: z.string().trim().url("canonical URL must be valid").or(z.literal("")).optional(),
  no_index: z.boolean().optional(),
  no_follow: z.boolean().optional(),
  featured_status: z.boolean().optional(),
  status: z.enum(BLOG_STATUSES).default("draft"),
  scheduled_at: z.string().optional(),
});

export const blogStatusSchema = z.object({
  status: z.enum(BLOG_STATUSES),
  publish_at: z.string().optional(),
});

export const blogCategorySchema = z.object({
  name: z.string().trim().min(1, "name is required").max(100, "name too long"),
  description: z.string().trim().max(300).optional(),
});

export const blogAuthorSchema = z.object({
  name: z.string().trim().min(1, "name is required").max(120, "name too long"),
  designation: z.string().trim().max(120).optional(),
  avatar_url: z.string().trim().max(500).optional(),
  bio: z.string().trim().max(500).optional(),
});

export const blogFileSchema = z.instanceof(File, { message: "featured image is required" });

/**
 * Relaxed schema for "Save as Draft" — every field is optional so a draft
 * only persists whatever the user has filled in. Status forced to draft.
 */
export const blogDraftSchema = blogSchema.extend({
  title: z.string().trim().max(200, "title too long").optional(),
  content: z.string().optional(),
  status: z.enum(BLOG_STATUSES).default("draft"),
});

export type BlogInput = z.infer<typeof blogSchema>;
export type BlogStatusInput = z.infer<typeof blogStatusSchema>;
export type BlogCategoryInput = z.infer<typeof blogCategorySchema>;
export type BlogAuthorInput = z.infer<typeof blogAuthorSchema>;
export type BlogDraftInput = z.infer<typeof blogDraftSchema>;