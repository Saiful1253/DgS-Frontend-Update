/**
 * Brand defaults for the storefront.
 *
 * These are *fallbacks*: `/client/config` supplies the live values from
 * `company_settings`, and the admin panel is where an editor changes them. They
 * exist for the paths where the fetch fails or has not resolved yet — a blank
 * navbar or a page titled "undefined" is worse than a correct default.
 *
 * A brand string appearing anywhere else in the codebase is a bug: it will
 * disagree with the CMS the first time someone edits the company name.
 */
export const BRAND = {
  name: "Digital Gas Service",
  nameBn: "ডিজিটাল গ্যাস সার্ভিস",

  /** `<title>` suffix used when the CMS has no meta title of its own. */
  defaultTitleSuffix: "LPG Reticulation & Industrial Piping Bangladesh",

  /** One-line description used by the home metadata and structured data. */
  description:
    "Centralised LPG reticulation systems, autogas plants, industrial utility pipelines and fire hydrant installations for residential, commercial and industrial projects.",

  /** Default keyword list; the CMS value replaces it when set. */
  keywords: [
    "LPG reticulation system",
    "autogas plant Bangladesh",
    "industrial pipeline contractor",
    "fire hydrant system",
    "Titas Gas contractor",
    "BERC registered contractor",
    "Digital Gas Service",
  ].join(", "),

  contact: {
    addressBn: "হাউজ #৭৩, মধ্য বাসাবো, সবুজবাগ, ঢাকা",
    phone: "01778-277178",
    whatsapp: "01778277178",
    email: "digitalgasservice@gmail.com",
  },

  leadership: {
    managingDirectorBn: "মোঃ আসাদুজ্জামান (আসাদ)",
    role: "Managing Director",
  },

  /** Highlight strip on the home page (spec §11). */
  highlights: [
    "100% Safety Guarantee",
    "Experienced Engineering Team",
    "First Class Contractor of Titas Gas",
    "15+ Years of Experience",
  ],
} as const;