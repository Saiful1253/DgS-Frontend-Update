export const SERVICE_PILLARS = [
  "Software Development",
  "Creative Services",
  "Digital Marketing",
  "Managed Services & Support",
  "Data & Analytics",
  "Growth & Conversion",
  "Strategy & Consulting",
] as const;

export type ServicePillar = (typeof SERVICE_PILLARS)[number];

/**
 * SRS §2 tab labels. Presentation only — never persisted.
 *
 * The `service_pillars` table is the source of truth for names, ordering and
 * blurbs; this map only supplies short labels for admin filters and dropdowns
 * that render before pillar data has loaded.
 */
export const SERVICE_PILLAR_LABELS: Record<
  ServicePillar,
  { tab: string; blurb: string }
> = {
  "Software Development": {
    tab: "Software & Cloud",
    blurb: "Engineering, AI, and cloud infrastructure for scalable operations.",
  },
  "Creative Services": {
    tab: "Creative & Post-Production",
    blurb: "Retouching, motion, 3D, and brand systems for commercial output.",
  },
  "Digital Marketing": {
    tab: "Marketing & Growth",
    blurb: "Paid acquisition, search positioning, and content architecture.",
  },
  "Managed Services & Support": {
    tab: "Managed Services & Support",
    blurb: "SLA-backed maintenance, monitoring, and dedicated delivery teams that keep systems healthy.",
  },
  "Data & Analytics": {
    tab: "Data & Analytics",
    blurb: "Measurement, attribution, and dashboards that turn raw events into confident decisions.",
  },
  "Growth & Conversion": {
    tab: "Growth & Conversion",
    blurb: "Landing pages, experimentation, and lifecycle automation that turn traffic into revenue.",
  },
  "Strategy & Consulting": {
    tab: "Strategy & Advisory",
    blurb: "Discovery, audits, and roadmaps that de-risk investment before a line of code is written.",
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
