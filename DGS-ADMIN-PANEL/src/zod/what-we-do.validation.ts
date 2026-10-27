import { z } from "zod";

export const whatWeDoSchema = z.object({
  id: z.number().int().positive().optional(),
  category: z
    .string()
    .trim()
    .min(1, "Category is required")
    .max(100, "Category must be at most 100 characters"),
  is_available: z.boolean(),
  problem: z
    .string()
    .trim()
    .min(1, "Challenge title is required")
    .max(255, "Challenge title must be at most 255 characters"),
  problem_desc: z.string().trim().min(1, "Challenge description is required"),
  solution: z
    .string()
    .trim()
    .min(1, "Solution title is required")
    .max(255, "Solution title must be at most 255 characters"),
  solution_desc: z.string().trim().min(1, "Solution description is required"),
  sort_order: z.number().int().min(0, "Order must be zero or greater"),
});

export type WhatWeDoSchemaType = z.infer<typeof whatWeDoSchema>;
