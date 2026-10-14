/* eslint-disable @typescript-eslint/no-explicit-any */
export interface DashboardStats {
  today_orders: number;
  pending_orders: number;
  today_revenue: number;
  revenue_change_pct: number;
  new_customers_today: number;
  today_sale?: number;
  today_expense?: number;
  company_main_balance?: number;
}

export interface DashboardOrderStatus {
  status: string;
  count: string;
}

export interface DashboardCustomer {
  id: string;
  mobile_number: string;
  name: string;
  email: string | null;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DashboardOrder {
  id: string;
  order_number: string;
  customer_id: string;
  address_id: string | null;
  subtotal: string;
  discount_amount: string;
  delivery_charge: string;
  total_amount: string;
  coupon_id: string | null;
  status: string;
  order_type?: string;
  vat_rate: string;
  vat_amount: string;
  is_vat_inclusive: boolean;
  return_status: string;
  total_refunded: string;
  created_at: string;
  updated_at: string;
  customer: DashboardCustomer;
  items?: {
    id: string;
    product_id: string;
    quantity: number;
    price: string;
    total: string;
    product: {
      name: string;
      serial_number?: string;
    };
    serial_numbers?: string[];
  }[];
}

export interface DashboardBatch {
  id: string;
  product_id: string;
  batch_code: string;
  cost_price: string;
  selling_price?: string;
  quantity_received?: number;
  quantity_remaining: number;
  status: string;
  received_at: string;
  created_at: string;
  product: {
    id: string;
    name: string;
    slug?: string;
    serial_number?: string;
    price?: string;
    discount_type?: string;
    discount_value?: string;
    lifecycle_months?: number;
    images?: {
      image_url: string;
      is_primary: boolean;
    }[];
  };
}

export interface TopProduct {
  product_name: string;
  product_sku?: string | null;
  units_sold: string;
  revenue: string;
}

export interface LowStockItem {
  id: string;
  name: string;
  sku?: string | null;
  stock: number;
  low_stock_threshold: number;
  product: {
    name: string;
  };
  images?: {
    image_url: string;
    is_primary: boolean;
  }[];
}

export interface DashboardData {
  stats: DashboardStats;
  orderStatus: DashboardOrderStatus[];
  recentOrders: DashboardOrder[];
  topProducts: TopProduct[];
  revenueChart: any[];
  oldestStock: DashboardBatch[];
  lowStock?: LowStockItem[];
}

/** Aggregate counters rendered on `/dashboard`. */
export interface DashboardOverviewStats {
  totalLeads: number;
  newLeadsToday: number;
  openJobs: number;
  totalApplicants: number;
  publishedBlogs: number;
  portfolioProjects: number;
  solutionsCount: number;
  testimonialsCount: number;
  partnersCount: number;
  totalUsers: number;
  monthlyTraffic: string;
  trafficGrowth: string;
  leadsGrowth: string;
  portfolioBadge?: string;
  newLeadsUnread?: number;
  activities: Array<{
    type: string;
    typeColor: string;
    title: string;
    time: string;
    description: string;
  }>;
  systemStatus: string;
}
