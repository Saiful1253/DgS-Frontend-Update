import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().min(1, "Email or phone number is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Full Name is required"),
  mobile_number: z.string().min(1, "Mobile Number is required"),
  address: z.string().min(1, "Street Address is required"),
  area: z.string().min(1, "Area is required"),
  city: z.string().min(1, "City is required"),
  image: z.any().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

export const profileImageSchema = z.any()
  .refine((file) => !file || (typeof File !== "undefined" && file instanceof File), "Expected a File object")
  .refine(
    (file) => !file || file.size <= 2 * 1024 * 1024,
    "Max image size is 2MB"
  )
  .refine(
    (file) => !file || ["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file?.type),
    "Only .jpg, .jpeg, .png and .webp formats are supported"
  );

export const updateProfileSchema = z.object({
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  name: z.string().min(1, "Full Name is required"),
  mobile_number: z.string().min(1, "Mobile Number is required"),
  address: z.string().min(1, "Street Address is required"),
  area: z.string().min(1, "Area is required"),
  city: z.string().min(1, "City is required"),
  image: profileImageSchema.optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
