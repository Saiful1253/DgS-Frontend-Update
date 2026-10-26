import { cache } from "react";
import {
  deleteServiceAction,
  deleteServiceCategoryAction,
  deleteServicePillarAction,
  getServiceCategoriesAction,
  getServicePillarsAction,
  getServicesAction,
  getServiceStatsAction,
  listPublicServicesAction,
  reorderServiceCategoriesAction,
  reorderServicePillarsAction,
  reorderServicesAction,
  saveServiceAction,
  saveServiceCategoryAction,
  saveServicePillarAction,
  toggleServiceActiveAction,
  toggleServiceFlagshipAction,
  uploadServiceIconAction,
} from "@/actions/service.actions";
import type { ActionResult } from "@/actions/action-result";
import type {
  PaginatedServices,
  ServiceCategoryEntity,
  ServiceStats,
} from "@/types/service";

export type {
  PaginatedServices,
  Service,
  ServiceCategoryEntity,
  ServiceCategoryEntity as ServicePillarEntity,
  ServiceStats,
} from "@/types/service";
export type { ServiceQueryParams } from "@/lib/query/service-query";

export type ReadResult<T> = { ok: true; data: T } | { ok: false; message: string };

const EMPTY: PaginatedServices = { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
const EMPTY_STATS: ServiceStats = {
  total: 0,
  active: 0,
  inactive: 0,
  totalCategories: 0,
  byCategory: {},
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

export const getServiceCategoriesResult = cache(
  async (): Promise<ReadResult<ServiceCategoryEntity[]>> => {
    const res = await getServiceCategoriesAction();
    if (!res.success) return { ok: false, message: res.message || "Failed to fetch service categories" };
    return { ok: true, data: Array.isArray(res.data) ? (res.data as ServiceCategoryEntity[]) : [] };
  }
);

export const getServicePillarsResult = getServiceCategoriesResult;

export const getServiceStatsResult = cache(async (): Promise<ReadResult<ServiceStats>> => {
  const res = await getServiceStatsAction();
  if (!res.success) return { ok: false, message: res.message || "Failed to fetch service stats" };
  return { ok: true, data: (res.data as ServiceStats | undefined) ?? EMPTY_STATS };
});

// ── Reads and writes for client components ───────────────────────────────────

export const listServices = (query: Parameters<typeof getServicesAction>[0] = {}) =>
  getServicesAction(query);

export const listServiceCategories = () => getServiceCategoriesAction();
export const listServicePillars = listServiceCategories;

export const listPublicServices = () => listPublicServicesAction();

export const uploadServiceIcon = (formData: FormData) => uploadServiceIconAction(formData);

export const saveService = (input: unknown) => saveServiceAction(input);

export const toggleServiceActive = (id: number, isActive: boolean) =>
  toggleServiceActiveAction(id, isActive);

export const toggleServiceFlagship = (id: number, isFlagship: boolean) =>
  toggleServiceFlagshipAction(id, isFlagship);

export const deleteService = (id: number) => deleteServiceAction(id);

export const saveServiceCategory = (input: unknown) => saveServiceCategoryAction(input);
export const saveServicePillar = saveServiceCategory;

export const deleteServiceCategory = (id: number) => deleteServiceCategoryAction(id);
export const deleteServicePillar = deleteServiceCategory;

export const reorderServices = (order: { id: number; display_order: number }[]) =>
  reorderServicesAction(order);

export const reorderServiceCategories = (order: { id: number; display_order: number }[]) =>
  reorderServiceCategoriesAction(order);
export const reorderServicePillars = reorderServiceCategories;

export type { ActionResult };
