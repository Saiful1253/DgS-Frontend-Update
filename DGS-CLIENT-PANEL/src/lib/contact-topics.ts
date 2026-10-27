/**
 * Landing-page topics that pre-fill the contact form.
 *
 * The certifications CTA links to `/contact?topic=regulatory-approvals`. The
 * point of the link is that the visitor should not have to re-explain what they
 * came for, so the topic maps to a sentence that already states it.
 *
 * Keys are URL slugs: they appear in analytics and in shared links, so they
 * stay stable even if the label below is reworded.
 */
export interface ContactTopic {
  label: string;
  message: string;
  /**
   * Matches a published service name, so the relevant capability is ticked on
   * arrival. Optional — a topic may exist before the services catalogue does.
   */
  serviceMatch?: RegExp;
}

export const CONTACT_TOPICS: Record<string, ContactTopic> = {
  "regulatory-approvals": {
    label: "Regulatory approvals",
    message:
      "I need help with regulatory approvals and licences for a gas infrastructure project. Please tell me which approvals are required and what documents you need from me.",
    serviceMatch: /(approval|licen[cs]e|regulatory|compliance)/i,
  },
  "lpg-reticulation": {
    label: "LPG reticulation system",
    message:
      "I would like a quotation for a centralised LPG reticulation system for my building. Please share the scope, timeline and pricing.",
    serviceMatch: /lpg|reticulation/i,
  },
  "industrial-pipeline": {
    label: "Industrial pipeline network",
    message:
      "I need a utility pipeline network for our industrial plant (chiller, compressor, boiler or central AC). Please share a quotation.",
    serviceMatch: /pipeline|industrial|utility/i,
  },
  "fire-hydrant": {
    label: "Fire hydrant / sprinkler system",
    message:
      "I need a fire hydrant, sprinkler or emergency water pipeline system installed. Please share a quotation and the required approvals.",
    serviceMatch: /fire|hydrant|sprinkler/i,
  },
  "autogas-station": {
    label: "AutoGas plant & pipeline",
    message:
      "I would like a quotation for an AutoGas refueling station setup and bulk LPG storage pipeline installation.",
    serviceMatch: /autogas/i,
  },
  "titas-gas": {
    label: "Utility Gas (RMS & TBS)",
    message:
      "I need official Titas Gas 1st Class protocol connection, high-volume intake, governor calibration or custody transfer regulation.",
    serviceMatch: /titas|rms|tbs|utility gas/i,
  },
};

/** Resolve a `?topic=` value; unknown slugs are ignored rather than guessed at. */
export function resolveContactTopic(topic: string | null | undefined): ContactTopic | null {
  if (!topic) return null;
  return CONTACT_TOPICS[topic.trim().toLowerCase()] ?? null;
}