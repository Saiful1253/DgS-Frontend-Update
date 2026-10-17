"use server";

import { publicFetch } from "@/lib/server-fetch";
import { consultationSchema, type ConsultationFormValues } from "@/zod/consultation.validation";

export type ConsultationActionResult = {
  success: boolean;
  message: string;
  data?: unknown;
};

export async function submitConsultationAction(
  values: ConsultationFormValues
): Promise<ConsultationActionResult> {
  const parsed = consultationSchema.safeParse(values);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || "Invalid form input";
    return { success: false, message: errorMsg };
  }

  const { full_name, mobile_number, service_scope, project_details } = parsed.data;

  const payload = {
    type: "Consultation",
    source_channel: "website_hero_consultation",
    full_name,
    mobile_number,
    service_requirements: [service_scope],
    message: project_details || undefined,
  };

  try {
    const res = await publicFetch.post("/leads/inquiry", {
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      return {
        success: false,
        message: errData?.message || "Failed to submit consultation request",
      };
    }

    const data = await res.json().catch(() => null);
    return {
      success: true,
      message: "Consultation request submitted successfully! Our engineer will contact you shortly.",
      data,
    };
  } catch (error) {
    console.error("submitConsultationAction error:", error);
    return {
      success: false,
      message: "Network error submitting consultation request. Please try again.",
    };
  }
}
