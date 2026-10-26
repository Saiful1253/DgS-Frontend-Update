export type ServiceCategory = string;
export type ServicePillar = ServiceCategory;

export interface ServiceCategoryEntity {
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

export type ServicePillarEntity = ServiceCategoryEntity;

export interface Service {
  id: number;
  category_id?: number | null;
  pillar_id?: number | null;
  name: string;
  slug: string;
  category?: string;
  pillar?: string;
  description: string | null;
  icon_url: string | null;
  badge_label?: string | null;
  badge_status?: string | null;
  sub_title?: string | null;
  category_tag?: string | null;
  tier_label?: string | null;
  image_url?: string | null;
  is_flagship?: boolean;
  features?: Array<{ title: string; description?: string; icon?: string }> | null;
  compliance_codes?: string | null;
  cta_label?: string | null;
  cta_url?: string | null;
  display_order?: number;
  is_active: boolean;
  is_deleted?: boolean;
  categoryEntity?: ServiceCategoryEntity | null;
  pillarEntity?: ServiceCategoryEntity | null;
  created_at?: string;
  updated_at?: string;
}

export type ServiceInput = Omit<Service, "id" | "created_at" | "updated_at"> & {
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
  totalCategories?: number;
  totalPillars?: number;
  byCategory?: Record<string, number>;
  byPillar?: Record<string, number>;
}

export interface ServiceListFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string | "all";
  pillar?: string | "all";
  status?: "all" | "active" | "inactive";
  sortBy?: "name" | "category" | "pillar" | "display_order" | "created_at" | "updated_at";
  sortOrder?: "asc" | "desc";
}
