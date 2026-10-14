import { z } from "zod";

export const brandCreateSchema = z.object({
  name: z.string().min(1, "Brand/Framework name is required"),
  description: z.string().optional(),
  logo_url: z.string().optional(),
  website_url: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  is_active: z.boolean().optional(),
});

export const brandUpdateSchema = brandCreateSchema.partial();

export type BrandCreateInput = z.infer<typeof brandCreateSchema>;
export type BrandUpdateInput = z.infer<typeof brandUpdateSchema>;
