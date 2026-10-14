export interface Technology {
  id: number;
  name: string;
  icon_url?: string | null;
  category: string;
  proficiency_tagline?: string | null;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TechnologyCategoryItem {
  id: number;
  name: string;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
}

export const TECHNOLOGY_CATEGORIES = [
  "Frontend",
  "Backend",
  "Mobile",
  "Database",
  "Cloud",
  "DevOps",
  "AI & Automation",
  "Low-Code",
  "Image Tune",
  "Video Tune",
  "Analytics",
  "Digital Marketing",
] as const;

export type TechnologyCategory = (typeof TECHNOLOGY_CATEGORIES)[number];

export function sortCategories(categories: string[]): string[] {
  const rank = new Map<string, number>(
    TECHNOLOGY_CATEGORIES.map((c, i) => [c, i] as [string, number])
  );
  return [...new Set(categories)].sort(
    (a, b) => (rank.get(a) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b) ?? Number.MAX_SAFE_INTEGER) || a.localeCompare(b)
  );
}

export type TechnologyInput = {
  name: string;
  icon_url?: string | null;
  category: string;
  proficiency_tagline?: string | null;
  display_order?: number;
  is_active?: boolean;
};
