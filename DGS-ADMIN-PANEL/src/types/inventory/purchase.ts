import type { Material } from "./material";
import type { Supplier } from "./supplier";

export interface Purchase {
  id: string;
  material_id: number;
  supplier_id: number;
  purchase_reference: string;
  quantity: number;
  quantity_remaining?: number;
  unit_price: number;
  effective_unit_cost?: number;
  additional_charges: number;
  total_price?: number;
  purchase_date: string;
  note: string;
  created_at?: string;
  updated_at?: string;
  material?: Material;
  supplier?: Supplier;
}
