import { cache } from "react";
import { getDashboardStatsAction } from "@/actions/dashboard.actions";
import type { DashboardOverviewStats } from "@/types/dashboard";

/**
 * Dashboard service — the domain layer for the module.
 *
 * House chain: `page / component → service → action → HTTP`. The service holds no
 * transport: the request, the status handling live in
 * `actions/dashboard.actions.ts`.
 *
 * `getDashboardStatsResult` is for the page. A read that fails must not render
 * as a set of placeholder figures — the previous `.catch(() => null)` made an
 * API outage indistinguishable from "the counters are just not there", and the
 * page fell through to hard-coded sample numbers.
 */

export type { DashboardOverviewStats } from "@/types/dashboard";

export type ReadResult<T> = { ok: true; data: T } | { ok: false; message: string };

export const getDashboardStatsResult = cache(
  async (): Promise<ReadResult<DashboardOverviewStats | null>> => {
    const res = await getDashboardStatsAction();
    if (!res.success) {
      return { ok: false, message: res.message || "Failed to load dashboard statistics" };
    }
    return { ok: true, data: (res.data ?? null) as DashboardOverviewStats | null };
  }
);
