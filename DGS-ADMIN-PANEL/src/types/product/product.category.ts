export type CategoryStatus = "active" | "inactive" | "archived";

export interface Category {
  id: string;
  name: string;
  description: string;
  slug: string;
  status: CategoryStatus;
  parent_id?: string | number | null;
  image_url?: string | null;
  parent?: Category | null;
  children?: Category[];
  created_at: string;
  updated_at: string;
}