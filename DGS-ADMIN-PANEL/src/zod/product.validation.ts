import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "product name is required").max(200),
  category_id: z.coerce.number({
    message: "category is required",
  }).min(1, "category is required"),
  brand_id: z.coerce.number({
    message: "brand is required",
  }).min(1, "brand is required"),
  description: z.string().min(1, "description is required"),
  base_price: z.coerce.number({
    message: "base price is required and must be a number",
  }).min(0, "base price must be positive or zero"),
  weight_grams: z.coerce.number({
    message: "weight must be a number",
  }).positive("weight must be greater than 0").nullable().optional(),
  discount_type: z.enum(["fixed", "percentage", "none"]).optional(),
  discount_value: z.coerce.number({
    message: "discount value must be a number",
  }).min(0, "discount value must be positive or zero").optional(),
  warranty_components: z.array(
    z.object({
      warranty_policy_id: z.coerce.number().min(1, "warranty policy is required"),
      warranty_months: z.coerce.number().min(0, "warranty months must be at least 0").optional(),
      service_coverage: z.boolean().optional(),
      parts_coverage: z.boolean().optional(),
      customer_policy_note: z.string().optional(),
    })
  ).min(1, "At least one warranty category is required"),
  country_of_origin: z.string().optional(),
  serial_number: z.string().optional().nullable(),
  emi_available: z.boolean().optional(),
  product_video_url: z.string().optional(),
  specifications_json: z.record(z.string(), z.any()).optional(),
  status: z.enum(["active", "inactive", "archived"], {
    message: "status is required",
  }),
  is_featured: z.boolean().optional(),
  low_stock_threshold: z.coerce.number({
    message: "low stock threshold must be a number",
  }).min(0, "low stock threshold must be positive or zero").default(10),
  lifecycle_months: z.coerce.number({
    message: "lifecycle months must be a number",
  }).min(1, "lifecycle months must be at least 1").default(6),
});

export type ProductInput = z.infer<typeof productSchema>;
