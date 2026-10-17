import { z } from "zod";

export const consultationSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(255, "Full name must be under 255 characters"),
  mobile_number: z
    .string()
    .trim()
    .regex(
      /^(?:\+8801|8801|01)[3-9]\d{8}$/,
      "Please enter a valid Bangladeshi mobile number (e.g. 017XXXXXXXX)"
    ),
  service_scope: z
    .string()
    .min(1, "Please select a service scope"),
  project_details: z
    .string()
    .trim()
    .max(2000, "Project details must be under 2000 characters")
    .optional()
    .or(z.literal("")),
});

export type ConsultationFormValues = z.infer<typeof consultationSchema>;
