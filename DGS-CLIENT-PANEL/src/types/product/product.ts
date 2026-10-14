import { Category } from "./product.category";
import { ProductImage } from "./product.image";

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
}

export interface Product {
  id: string;
  category_id: string;
  brand_id?: string | null;
  name: string;
  slug: string;
  description: string;
  default_shelf_life_days: number;
  status: "active" | "inactive" | "archived";
  is_featured?: boolean;
  created_at: string;
  updated_at: string;

  base_price?: string;
  discount_type?: string | null;
  discount_value?: string | null;
  final_price?: string;

  weight_grams?: number | null;
  warranty_components?: {
    id?: string | number;
    warranty_policy_id: number;
    warranty_months?: number;
    warranty_duration_days?: number;
    service_coverage?: boolean;
    parts_coverage?: boolean;
    customer_policy_note?: string;
  }[];
  country_of_origin?: string | null;
  serial_number?: string | null;
  emi_available?: boolean;
  product_video_url?: string | null;
  specifications_json?: Record<string, string> | string | null;
  low_stock_threshold?: number | null;

  category: Category;
  brand?: Brand | null;
  images: ProductImage[];
  in_stock?: boolean;
  stock_count?: number;
  total_sold?: number;
}

export interface ProductImageOps {
  imagesToDelete: (string | number)[];
  imagesToReplace: { id: string | number; file: File }[];
  imagesToAdd: File[];
  newPrimaryImageId?: string | number;
}
