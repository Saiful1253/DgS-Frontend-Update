export interface Brand {
  id: string | number;
  name: string;
  slug: string;
  logo_url?: string | null;
  description?: string | null;
  website_url?: string | null;
  status: "active" | "inactive";
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}
