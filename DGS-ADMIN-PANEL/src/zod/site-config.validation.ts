import { z } from "zod";

export const siteConfigValidationSchema = z.object({
  company_name: z.string().min(1, "Company Name is required"),
  company_logo: z.string().optional(),
  company_logo_public_id: z.string().optional(),
  site_favicon: z.string().optional(),
  site_favicon_public_id: z.string().optional(),
  company_description: z.string().optional(),
  company_short_description: z.string().optional(),
  company_phone: z.string().min(5, "Valid Phone Number is required"),
  company_email: z.string().email("Invalid email format").or(z.literal("")),
  company_address: z.string().optional(),
  company_latitude: z.string().regex(/^-?\d*\.?\d*$/, "Invalid latitude").or(z.literal("")).optional(),
  company_longitude: z.string().regex(/^-?\d*\.?\d*$/, "Invalid longitude").or(z.literal("")).optional(),
  whatsapp_number: z.string().optional(),
  facebook_url: z.string().optional(),
  instagram_url: z.string().optional(),
  twitter_url: z.string().optional(),
  linkedin_url: z.string().optional(),
  youtube_url: z.string().optional(),
  copyright_year: z.string().regex(/^\d*$/, "Copyright year must contain only numbers").optional(),
  footer_text: z.string().optional(),
  site_meta_title: z.string().optional(),
  site_meta_description: z.string().optional(),
  site_meta_keywords: z.string().optional(),
  site_og_image: z.string().optional(),
  canonical_url: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  emi_enabled: z.string().optional(),
  emi_interest_rate: z.string().regex(/^\d*\.?\d*$/, "Interest rate must be a valid number").optional(),
  emi_min_amount: z.string().regex(/^\d*$/, "Minimum amount must be a number").optional(),
  emi_tenures: z.string().regex(/^[\d,]*$/, "Tenures must be comma-separated numbers (e.g. 3,6,12)").optional(),
  emi_tenure_rates: z.string().optional(),
}).refine((data) => {
  const lat = data.company_latitude?.trim();
  const lng = data.company_longitude?.trim();
  if ((lat && !lng) || (!lat && lng)) {
    return false;
  }
  return true;
}, {
  message: "Both latitude and longitude are required (e.g. 23.8103, 90.4125)",
  path: ["company_latitude"],
});
