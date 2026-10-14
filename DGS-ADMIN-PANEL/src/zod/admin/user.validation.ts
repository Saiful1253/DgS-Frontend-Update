import { z } from "zod";

export const adminUserCreateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  mobile_number: z.string().min(10, "Invalid mobile number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role_id: z.coerce.number().min(1, "Please select a role"),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const adminUserUpdateSchema = adminUserCreateSchema.partial().extend({
  password: z.string().min(6).optional().or(z.literal("")),
});

export type AdminUserCreateInput = z.infer<typeof adminUserCreateSchema>;
export type AdminUserUpdateInput = z.infer<typeof adminUserUpdateSchema>;
