import { cache } from "react";
import {
  getPublicWhyChooseUsAction,
  getPublicWhyChooseUsMetricsAction,
} from "@/actions/why-choose-us.actions";
import type { WhyChooseUs, WhyChooseUsMetrics } from "@/types/why-choose-us";
import { DEFAULT_WHY_CHOOSE_US_METRICS } from "@/types/why-choose-us";

export type { WhyChooseUs, WhyChooseUsMetrics } from "@/types/why-choose-us";

export type ReadResult<T> = { ok: true; data: T } | { ok: false; message: string };

export const getPublicWhyChooseUsResult = cache(
  async (): Promise<ReadResult<WhyChooseUs[]>> => {
    const res = await getPublicWhyChooseUsAction();
    if (!res.success) return { ok: false, message: res.message || "Failed to load Why Choose Us items" };
    return { ok: true, data: Array.isArray(res.data) ? (res.data as WhyChooseUs[]) : [] };
  }
);

export const getPublicWhyChooseUs = cache(async (): Promise<WhyChooseUs[]> => {
  const result = await getPublicWhyChooseUsResult();
  return result.ok ? result.data : [];
});

export const getPublicWhyChooseUsMetricsResult = cache(
  async (): Promise<ReadResult<WhyChooseUsMetrics>> => {
    const res = await getPublicWhyChooseUsMetricsAction();
    if (!res.success) return { ok: false, message: res.message || "Failed to load metrics" };
    return { ok: true, data: (res.data as WhyChooseUsMetrics) ?? DEFAULT_WHY_CHOOSE_US_METRICS };
  }
);

export const getPublicWhyChooseUsMetrics = cache(async (): Promise<WhyChooseUsMetrics> => {
  const result = await getPublicWhyChooseUsMetricsResult();
  return result.ok ? result.data : DEFAULT_WHY_CHOOSE_US_METRICS;
});

