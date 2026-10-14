import { z } from "zod";

export const loginSchema = z.object({
  Email: z.string().min(1, "Email is required").email("Enter a valid email"),
  Password: z.string().min(1, "Password is required"),
});

export type LoginSchemaType = z.infer<typeof loginSchema>;
