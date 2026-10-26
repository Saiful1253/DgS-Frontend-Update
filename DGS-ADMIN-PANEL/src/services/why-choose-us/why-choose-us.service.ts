import { cache } from "react";
import {
  getWhyChooseUsAction,
  getWhyChooseUsStatsAction,
  saveWhyChooseUsAction,
  toggleWhyChooseUsStatusAction,
  deleteWhyChooseUsAction,
  uploadWhyChooseUsImageAction,
  getWhyChooseUsMetricsAction,
  saveWhyChooseUsMetricsAction,
} from "@/actions/why-choose-us.actions";
import type { ActionResult } from "@/actions/action-result";
import type {
  PaginatedWhyChooseUs,
  WhyChooseUs,
  WhyChooseUsStats,
  WhyChooseUsMetrics,
  WhyChooseUsMetricsInput,
} from "@/types/why-choose-us";
import type { WhyChooseUsQueryParams } from "@/lib/query/why-choose-us-query";

export type {
  PaginatedWhyChooseUs,
  WhyChooseUs,
  WhyChooseUsStats,
  WhyChooseUsMetrics,
  WhyChooseUsMetricsInput,
} from "@/types/why-choose-us";
export type { WhyChooseUsQueryParams } from "@/lib/query/why-choose-us-query";

export type ReadResult<T> = { ok: true; data: T } | { ok: false; message: string };

const EMPTY: PaginatedWhyChooseUs = { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
const EMPTY_STATS: WhyChooseUsStats = { total: 0, active: 0, inactive: 0, requiredActiveCount: 3 };

export const DEFAULT_WHY_CHOOSE_US_METRICS: WhyChooseUsMetrics = {
  metric1: {
    value: "0",
    label: "Completed Projects",
    subtitle: "Residential, Commercial & Industrial",
  },
  metric2: {
    value: "0",
    label: "Years Experience",
    subtitle: "Excellence Since 2009",
  },
  metric3: {
    value: "0%",
    label: "Safety Record",
    subtitle: "Zero Critical Accident Incident",
  },
  metric4: {
    value: "0",
    label: "Restaurants & Food Courts",
    subtitle: "Commercial Kitchen Networks",
  },
};

// ── Page Data Fetchers ────────────────────────────────────────────────────────

export const getWhyChooseUsResult = cache(
  async (query: WhyChooseUsQueryParams = {}): Promise<ReadResult<PaginatedWhyChooseUs>> => {
    const res = await getWhyChooseUsAction(query);
    if (!res.success) return { ok: false, message: res.message || "Failed to fetch items" };
    const data = res.data as PaginatedWhyChooseUs | undefined;
    return { ok: true, data: data ?? EMPTY };
  }
);

export const getWhyChooseUsStatsResult = cache(
  async (): Promise<ReadResult<WhyChooseUsStats>> => {
    const res = await getWhyChooseUsStatsAction();
    if (!res.success) return { ok: false, message: res.message || "Failed to fetch stats" };
    const data = res.data as WhyChooseUsStats | undefined;
    return { ok: true, data: data ?? EMPTY_STATS };
  }
);

export const getWhyChooseUsMetricsResult = cache(
  async (): Promise<ReadResult<WhyChooseUsMetrics>> => {
    const res = await getWhyChooseUsMetricsAction();
    if (!res.success) return { ok: false, message: res.message || "Failed to fetch metrics" };
    const data = res.data as WhyChooseUsMetrics | undefined;
    return { ok: true, data: data ?? DEFAULT_WHY_CHOOSE_US_METRICS };
  }
);

// ── Client Actions ───────────────────────────────────────────────────────────

export const listWhyChooseUs = (query: WhyChooseUsQueryParams = {}) => getWhyChooseUsAction(query);
export const saveWhyChooseUs = (raw: unknown) => saveWhyChooseUsAction(raw);
export const toggleWhyChooseUsStatus = (id: number, isActive: boolean) =>
  toggleWhyChooseUsStatusAction(id, isActive);
export const deleteWhyChooseUs = (id: number) => deleteWhyChooseUsAction(id);

export const uploadWhyChooseUsImage = (formData: FormData): Promise<ActionResult> =>
  uploadWhyChooseUsImageAction(formData);

export const getWhyChooseUsMetrics = () => getWhyChooseUsMetricsAction();
export const saveWhyChooseUsMetrics = (dto: WhyChooseUsMetricsInput) =>
  saveWhyChooseUsMetricsAction(dto);
