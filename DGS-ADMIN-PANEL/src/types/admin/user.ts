import { Role } from "./role";

export interface AdminUser {
  id: string | number;
  name: string;
  username: string;
  email: string;
  mobile_number?: string;
  phone?: string;
  role_id: string | number;
  role: Role;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}
