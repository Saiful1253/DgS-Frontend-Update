import { z } from "zod";
import { CERTIFICATE_ICONS, CERTIFICATE_SORT_COLUMNS } from "@/types/certificate";


const optionalBoolean = z
  .enum(["true", "false"])
  .transform((v) => v === "true");

export const certificateListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).catch(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).catch(10).default(10),
  search: z.string().trim().max(120).catch("").default(""),
  sortBy: z.enum(CERTIFICATE_SORT_COLUMNS).catch("display_order").default("display_order"),
  sortOrder: z.enum(["asc", "desc"]).catch("asc").default("asc"),
  is_active: optionalBoolean.optional(),
  is_featured: optionalBoolean.optional(),
  file_type: z.enum(["image", "pdf"]).optional(),
});

export type CertificateListQueryParsed = z.infer<typeof certificateListQuerySchema>;

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} too long (max ${max} chars)`)
    .nullable()
    .optional()
    .or(z.literal(""));

export const certificateSchema = z.object({
  // One English source of truth: the storefront's AutoTranslate layer produces
  // the Bangla rendering, so there is no Bangla field to fill in here.
  title: z
    .string()
    .trim()
    .min(2, "Title is required (at least 2 characters)")
    .max(255),
  description: optionalText(20000, "Description"),
  file_type: z.enum(["image", "pdf"]).default("image"),
  file_url: z
    .string({ error: "Certificate file (image or PDF) is required" })
    .trim()
    .min(1, "Certificate file (image or PDF) is required")
    .max(500),
  thumb_url: optionalText(500, "Thumbnail URL"),
  reg_no: optionalText(100, "Registration number"),
  category_icon: z
    .string({ error: "Certification icon is required" })
    .trim()
    .min(1, "Certification icon is required")
    .max(500),
  sub_label: optionalText(100, "Sub-label"),
  issuing_authority: optionalText(255, "Issuing authority"),
  year: z
    .union([z.number().int().min(1900).max(2200), z.literal(""), z.null()])
    .optional(),
  verification_link: z
    .string()
    .trim()
    .max(500)
    .refine(
      (v) => !v || z.string().url().safeParse(v).success,
      "Verification link must be a valid URL"
    )
    .nullable()
    .optional()
    .or(z.literal("")),
  is_featured: z.boolean().default(false),
  display_order: z.number().int().min(0, "Display order must be non-negative").default(0),
  is_active: z.boolean().default(true),
});

export type CertificateSchemaType = z.infer<typeof certificateSchema>;