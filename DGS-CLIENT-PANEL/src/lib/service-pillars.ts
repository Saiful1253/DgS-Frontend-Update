export const SERVICE_CATEGORIES = [
  "Central LPG Reticulation",
  "AutoGas Plant & Pipeline",
  "Industrial Gas Networks",
  "Utility Gas (RMS & TBS)",
  "Fire Hydrant & Safety Grids",
  "Engineering & Reticulation Systems",
] as const;

export const SERVICE_PILLARS = SERVICE_CATEGORIES;

export type ServicePillar = (typeof SERVICE_PILLARS)[number];

export const SERVICE_PILLAR_LABELS: Record<
  string,
  { tab: string; blurb: string }
> = {
  "Central LPG Reticulation": {
    tab: "LPG Reticulation",
    blurb: "Turnkey pipeline infrastructure for apartments, gated communities, and commercial kitchens.",
  },
  "AutoGas Plant & Pipeline": {
    tab: "AutoGas Plants",
    blurb: "Refueling station engineering and bulk storage with Dept. of Explosives compliance.",
  },
  "Industrial Gas Networks": {
    tab: "Industrial Piping",
    blurb: "Heavy industrial gas pipelines for textile, ceramics, boilers, and captive energy.",
  },
  "Utility Gas (RMS & TBS)": {
    tab: "Utility Gas (RMS)",
    blurb: "Titas Gas 1st Class protocol stations, governor calibration, and custody transfer.",
  },
  "Fire Hydrant & Safety Grids": {
    tab: "Fire Hydrant Grids",
    blurb: "Statutory NFPA 20 deluge pump houses and fire service NOC clearance networks.",
  },
  "Engineering & Reticulation Systems": {
    tab: "All Engineering Services",
    blurb: "Complete turnkey gas engineering, industrial piping, and safety grid solutions.",
  },
};

export interface PillarOption {
  value: string;
  label: string;
}

/** Minimal structural shape so this module stays free of import cycles. */
export interface PillarOptionSource {
  name: string;
  display_label: string;
  display_order: number;
  is_active?: boolean;
  is_deleted?: boolean;
}

/**
 * Build filter/dropdown options from the `service_pillars` table.
 * Falls back to the static registry above only when pillar data is unavailable,
 * so a pillar created in the admin immediately appears everywhere.
 */
export function toPillarOptions(
  pillars?: readonly PillarOptionSource[] | null,
): PillarOption[] {
  const fromDb = (pillars ?? [])
    .filter((p) => !p.is_deleted && p.is_active !== false)
    .slice()
    .sort((a, b) => a.display_order - b.display_order)
    .map((p) => ({ value: p.name, label: p.display_label || p.name }));

  if (fromDb.length) return fromDb;
  return SERVICE_PILLARS.map((p) => ({ value: p, label: SERVICE_PILLAR_LABELS[p].tab }));
}