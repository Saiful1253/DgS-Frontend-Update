export interface CategoryOption {
  value: string;
  label: string;
}

export interface CategoryOptionSource {
  name: string;
  display_label: string;
  display_order: number;
  is_active?: boolean;
  is_deleted?: boolean;
}

export function toCategoryOptions(
  categories?: readonly CategoryOptionSource[] | null,
): CategoryOption[] {
  return (categories ?? [])
    .filter((p) => !p.is_deleted && p.is_active !== false)
    .slice()
    .sort((a, b) => a.display_order - b.display_order)
    .map((p) => ({ value: p.name, label: p.display_label || p.name }));
}
