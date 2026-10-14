import { z } from "zod";

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(1, "Category name is required"),
  description: z.string().trim().min(1, "Description is required"),
  parent_id: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? null : Number(v)),
    z.number().nullable().optional(),
  ),
  image_url: z.string().url("Invalid image URL").or(z.literal("")).nullable().optional(),
  status: z.preprocess(
    (v) => (typeof v === "string" ? v : ""),
    z
      .string()
      .min(1, "Status is required")
      .pipe(z.enum(["active", "inactive", "archived"], "Invalid status")),
  ),
});

export type CategoryCreateSchemaType = z.infer<typeof categoryCreateSchema>;

export const categoryUpdateSchema = z.object({
  name: z.string().trim().min(1, "Category name is required").optional(),
  description: z.string().trim().min(1, "Description is required").optional(),
  parent_id: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? null : Number(v)),
    z.number().nullable().optional(),
  ),
  image_url: z.string().url("Invalid image URL").or(z.literal("")).nullable().optional(),
  status: z.preprocess(
    (v) => (typeof v === "string" ? v : undefined),
    z
      .string()
      .min(1, "Status is required")
      .pipe(z.enum(["active", "inactive", "archived"], "Invalid status"))
      .optional(),
  ),
});

export type CategoryUpdateSchemaType = z.infer<typeof categoryUpdateSchema>;

