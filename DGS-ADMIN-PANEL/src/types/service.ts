import type { SERVICE_PILLARS } from "@/lib/service-pillars";

export type ServicePillar = (typeof SERVICE_PILLARS)[number] | string;

export interface ServicePillarEntity {
  id: number;
  name: string;
  slug: string;
  display_label: string;
  blurb?: string | null;
  icon?: string | null;
  display_order: number;
  is_active: boolean;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ServiceGroup {
  id: number;
  pillar_id?: number | null;
  pillar: ServicePillar;
  name: string;
  slug: string;
  display_order: number;
  is_active: boolean;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
  pillarEntity?: ServicePillarEntity | null;
}

export interface Service {
  id: number;
  group_id: number | null;
  pillar_id?: number | null;
  name: string;
  slug: string;
  pillar: ServicePillar;
  description: string | null;
  icon_url: string | null;
  display_order: number;
  is_active: boolean;
  is_deleted?: boolean;
  group?: ServiceGroup | null;
  pillarEntity?: ServicePillarEntity | null;
  created_at?: string;
  updated_at?: string;
}

export type ServiceInput = Omit<Service, "id" | "created_at" | "updated_at" | "group"> & {
  id?: number;
};

/** Envelope returned by every paginated services list endpoint. */
export interface PaginatedServices {
  data: Service[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Aggregate counters the services pages render as stat cards. */
export interface ServiceStats {
  total: number;
  active: number;
  inactive: number;
  totalGroups: number;
  totalPillars?: number;
  byPillar: Record<string, number>;
  byGroup: Record<string, number>;
}

export interface ServiceListFilters {
  page?: number;
  limit?: number;
  search?: string;
  pillar?: ServicePillar | "all";
  group_id?: number;
  status?: "all" | "active" | "inactive";
  sortBy?: "name" | "pillar" | "display_order" | "created_at" | "updated_at";
  sortOrder?: "asc" | "desc";
}
