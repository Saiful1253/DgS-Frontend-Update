export interface WhyChooseUs {
  id: number;
  title: string;
  description: string;
  image_url?: string | null;
  icon_url?: string | null;
  icon_color?: string | null;
  badge_color?: string | null;
  icon_name?: string | null;
  display_order?: number;
  is_active: boolean;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
}

export type WhyChooseUsInput = Omit<WhyChooseUs, "id" | "created_at" | "updated_at"> & {
  id?: number;
};

export interface PaginatedWhyChooseUs {
  data: WhyChooseUs[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface WhyChooseUsStats {
  total: number;
  active: number;
  inactive: number;
  requiredActiveCount: number;
}

export interface WhyChooseUsMetricItem {
  value: string;
  label: string;
  subtitle: string;
}

export interface WhyChooseUsMetrics {
  metric1: WhyChooseUsMetricItem;
  metric2: WhyChooseUsMetricItem;
  metric3: WhyChooseUsMetricItem;
  metric4: WhyChooseUsMetricItem;
}

export type WhyChooseUsMetricsInput = Partial<{
  metric1: Partial<WhyChooseUsMetricItem>;
  metric2: Partial<WhyChooseUsMetricItem>;
  metric3: Partial<WhyChooseUsMetricItem>;
  metric4: Partial<WhyChooseUsMetricItem>;
}>;

