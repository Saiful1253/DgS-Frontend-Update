import { z } from "zod";

export const portfolioChallengeSchema = z.object({
  id: z.number().optional(),
  title: z.string().trim().min(1, "Challenge title is required"),
  challenge_description: z.string().trim().min(1, "Challenge description is required"),
  solution_provided: z.string().trim().min(1, "Delivered solution is required"),
  supporting_image: z.string().trim().min(1, "Challenge diagram / visual is required"),
  sort_order: z.number().optional().default(1),
});

const youtubeUrlRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/)|youtu\.be\/)[\w-]+(\S+)?$/i;

export const portfolioSchema = z
  .object({
    id: z.number().optional(),
    project_name: z.string().trim().min(2, "Project name is required (at least 2 characters)"),
    slug: z.string().trim().min(2, "SEO slug is required"),
    client_name: z.string().optional().default(""),
    client_logo: z.string().optional(),
    category: z
      .string()
      .trim()
      .min(1, "Please select a category")
      .refine((val) => val.toLowerCase() !== "select category", "Please select a category"),
    tags: z.array(z.string()).default([]),
    live_url: z.string().optional().default(""),
    app_store_url: z.string().optional().default(""),
    play_store_url: z.string().optional().default(""),
    is_featured: z.boolean().default(false),
    media_type: z.enum(["image", "youtube"]).optional().default("image"),
    media_url: z.string().trim().optional().default(""),
    project_status: z.enum(["completed", "ongoing"]).optional().default("completed"),
    project_type: z.enum(["residential", "industrial", "commercial_restaurant"]).optional().default("residential"),
    address: z.string().trim().optional().default(""),
    latitude: z.coerce.number().optional().nullable(),
    longitude: z.coerce.number().optional().nullable(),
    description: z.string().optional().default(""),
    cover_image: z.string().trim().min(1, "Main portfolio cover image is required"),
    primary_challenge: z.string().trim().min(1, "Primary challenge overview is required"),
    primary_solution: z.string().trim().min(1, "Primary solution description is required"),
    comparison_enabled: z.boolean().optional().default(true),
    comparison_title: z.string().optional().default("Industry Standard vs. Our Approach"),
    industry_standard_text: z.string().optional().default(""),
    our_approach_text: z.string().optional().default(""),
    pricing_enabled: z.boolean().optional().default(true),
    pricing_title: z.string().optional().default("Transparent Pricing & Engagement Models"),
    challenges: z.array(portfolioChallengeSchema).optional().default([]),
  })
  .superRefine((data, ctx) => {
    if (data.media_type === "youtube") {
      if (!data.media_url || data.media_url.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["media_url"],
          message: "YouTube URL is required for YouTube media type",
        });
        return;
      }
      if (!youtubeUrlRegex.test(data.media_url)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["media_url"],
          message: "Please provide a valid YouTube URL",
        });
      }
    }
  });

export type PortfolioSchemaType = z.infer<typeof portfolioSchema>;
export type PortfolioChallengeSchemaType = z.infer<typeof portfolioChallengeSchema>;
