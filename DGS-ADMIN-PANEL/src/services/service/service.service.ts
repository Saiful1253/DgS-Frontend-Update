import { cache } from "react";
import {
  deleteServiceAction,
  deleteServiceGroupAction,
  deleteServicePillarAction,
  getServiceGroupsAction,
  getServicePillarsAction,
  getServicesAction,
  getServiceStatsAction,
  listPublicServicesAction,
  reorderServiceGroupsAction,
  reorderServicePillarsAction,
  reorderServicesAction,
  saveServiceAction,
  saveServiceGroupAction,
  saveServicePillarAction,
  toggleServiceActiveAction,
  uploadServiceIconAction,
} from "@/actions/service.actions";
import type { ActionResult } from "@/actions/action-result";
import type {
  PaginatedServices,
  ServiceGroup,
  ServicePillarEntity,
  ServiceStats,
} from "@/types/service";

/**
 * Services service — the domain layer for the module.
 *
 * House chain: `page / component → service → action`. The service holds no
 * transport: every request is a `"use server"` action, so a client component may
 * import this module and its calls arrive as an RPC on the server, where the
 * validation and the revalidation live.
 *
 * The `get*Result` readers are for server pages. A read that fails must not
 * render as an empty catalogue, so the failure is reported as data and the page
 * decides what to show; the `get*` wrappers are the throwing convenience form.
 */

export type {
  PaginatedServices,
  Service,
  ServiceGroup,
  ServicePillarEntity,
  ServiceStats,
} from "@/types/service";
export type { ServiceQueryParams } from "@/lib/query/service-query";

export type ReadResult<T> = { ok: true; data: T } | { ok: false; message: string };

const EMPTY: PaginatedServices = { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
const EMPTY_STATS: ServiceStats = {
  total: 0,
  active: 0,
  inactive: 0,
  totalGroups: 0,
  totalPillars: 0,
  byPillar: {},
  byGroup: {},
};

// ── Reads for the page layer ─────────────────────────────────────────────────

export const getServicesResult = cache(
  async (query: Parameters<typeof getServicesAction>[0] = {}): Promise<ReadResult<PaginatedServices>> => {
    const res = await getServicesAction(query);
    if (!res.success) return { ok: false, message: res.message || "Failed to fetch services" };
    const data = res.data as PaginatedServices | undefined;
    return { ok: true, data: data ?? EMPTY };
  }
);

export const getServiceGroupsResult = cache(
  async (pillar?: string): Promise<ReadResult<ServiceGroup[]>> => {
    const res = await getServiceGroupsAction(pillar);
    if (!res.success) return { ok: false, message: res.message || "Failed to fetch service groups" };
    return { ok: true, data: Array.isArray(res.data) ? (res.data as ServiceGroup[]) : [] };
  }
);

export const getServicePillarsResult = cache(
  async (): Promise<ReadResult<ServicePillarEntity[]>> => {
    const res = await getServicePillarsAction();
    if (!res.success) return { ok: false, message: res.message || "Failed to fetch service pillars" };
    return { ok: true, data: Array.isArray(res.data) ? (res.data as ServicePillarEntity[]) : [] };
  }
);

export const getServiceStatsResult = cache(async (): Promise<ReadResult<ServiceStats>> => {
  const res = await getServiceStatsAction();
  if (!res.success) return { ok: false, message: res.message || "Failed to fetch service stats" };
  return { ok: true, data: (res.data as ServiceStats | undefined) ?? EMPTY_STATS };
});

// ── Reads and writes for client components ───────────────────────────────────

export const listServices = (query: Parameters<typeof getServicesAction>[0] = {}) =>
  getServicesAction(query);

export const listServiceGroups = (pillar?: string) => getServiceGroupsAction(pillar);

export const listServicePillars = () => getServicePillarsAction();

export const listPublicServices = () => listPublicServicesAction();

export const uploadServiceIcon = (formData: FormData) => uploadServiceIconAction(formData);

export const saveService = (input: unknown) => saveServiceAction(input);

export const toggleServiceActive = (id: number, isActive: boolean) =>
  toggleServiceActiveAction(id, isActive);

export const deleteService = (id: number) => deleteServiceAction(id);

export const saveServiceGroup = (input: unknown) => saveServiceGroupAction(input);

export const deleteServiceGroup = (id: number) => deleteServiceGroupAction(id);

export const saveServicePillar = (input: unknown) => saveServicePillarAction(input);

export const deleteServicePillar = (id: number) => deleteServicePillarAction(id);

export const reorderServices = (order: { id: number; display_order: number }[]) =>
  reorderServicesAction(order);

export const reorderServiceGroups = (order: { id: number; display_order: number }[]) =>
  reorderServiceGroupsAction(order);

export const reorderServicePillars = (order: { id: number; display_order: number }[]) =>
  reorderServicePillarsAction(order);

export type { ActionResult };
