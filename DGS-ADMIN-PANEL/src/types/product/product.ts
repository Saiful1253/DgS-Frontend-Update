/* eslint-disable @typescript-eslint/no-explicit-any */
// export interface Product {
//   id: number;
//   name: string;
//   category: string;
//   sku?: string;
//   price: number;
//   stock: number;
//   status: "Active" | "Hidden" | "Archived";
// }

import { Category } from "./product.category";
import { ProductImage } from "./product.image";


export interface Product {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string;
  default_shelf_life_days: number;
  status: "active" | "inactive" | "archived";
  is_featured?: boolean;
  low_stock_threshold?: number;
  lifecycle_months?: number;
  created_at: string;
  updated_at: string;

  base_price?: string;
  weight_grams?: number | string;
  discount_type?: string;
  discount_value?: string;
  final_price?: string;

  brand_id?: string;
  brand?: { id: string | number; name: string };
  warranty_components?: {
    id?: string | number;
    warranty_policy_id: number;
    warranty_months?: number;
    warranty_duration_days?: number;
    service_coverage?: boolean;
    parts_coverage?: boolean;
    customer_policy_note?: string;
  }[];
  country_of_origin?: string;
  serial_number?: string;
  emi_available?: boolean;
  product_video_url?: string;
  specifications_json?: Record<string, any>;

  category: Category;
  images: ProductImage[];
}

export interface ProductImageOps {
  imagesToDelete: (string | number)[];
  imagesToReplace: { id: string | number; file: File }[];
  imagesToAdd: File[];
  newPrimaryImageId?: string | number;
}
