import Image from "next/image";
import {
  ArrowRight,
  Asterisk,
  BadgeCheck,
  CircleCheck,
  Cylinder,
  Fan,
  FireExtinguisher,
  Flame,
  Gauge,
  PhoneCall,
  Radio,
  ShieldCheck,
  SlidersHorizontal,
  Star,
} from "lucide-react";

/* Figma — file TDkBTr4SAL7t8BDLAqNjvG, node 8:142
   "SECTION 2: SPECIALIZED ENGINEERING SERVICES" (1280 × 1460).
   Every colour / radius / gap / type step below is lifted 1:1 from the node
   tree; photography was exported straight out of Figma into
   /public/images/services so the crops match the design exactly. */

const BRAND = "#005F9D"; // primary blue - badges, links, check marks
const ACCENT = "#FF5400"; // safety orange - CTAs, hazard call-outs
const HEADING = "#0B1C30"; // headings
const TINT = "#E5EEFF"; // pill / border blue

/* Space Grotesk carries every micro-label (badges, tags, CTAs);
   Hanken Grotesk (--font-sans) carries headings and body. */
const CAP = "font-space font-semibold uppercase leading-[14px] tracking-[0.55px] text-[11px]";
const CAP_BOLD = "font-space font-bold uppercase leading-[14px] tracking-[0.55px] text-[11px]";
/* Card "meta" pills (Govt. Certified, Sch 40/80, 1st Class License, NFPA 20)
   carry no textCase in Figma — they stay sentence case. */
const CAP_BOLD_META =
  "font-space font-bold leading-[14px] tracking-[0.55px] text-[11px]";

/* 0 1px 2px rgb(0 0 0 / .05) — Figma "Overlay+Shadow" pill elevation */
const PILL_SHADOW = "shadow-[0_1px_2px_rgba(0,0,0,0.05)]";
/* 0 8px 10px -6px + 0 20px 25px -5px — flagship card elevation */
const CARD_SHADOW =
  "shadow-[0_8px_10px_-6px_rgba(0,0,0,0.1),0_20px_25px_-5px_rgba(0,0,0,0.1)]";
/* 0 2px 4px -2px + 0 4px 6px -1px — card elevation */
const TILE_SHADOW =
  "shadow-[0_2px_4px_-2px_rgba(0,0,0,0.1),0_4px_6px_-1px_rgba(0,0,0,0.1)]";

const FEATURES = [
  {
    icon: SlidersHorizontal,
    title: "Auto-Regulated Manifold",
    desc: "Dual stage regulators & automated multi-cylinder vaporizers for seamless constant pressure.",
  },
  {
    icon: Radio,
    title: "Prepaid Smart LoRa Meters",
    desc: "Individual prepaid telemetry digital meters per apartment with remote top-up and billing.",
  },
  {
    icon: Asterisk,
    title: "Automated Safety Shut-Off",
    desc: "Optical sniffer sensors with fast solenoid shut-off valves at apartment and bank intake.",
    accent: true,
  },
  {
    icon: ShieldCheck,
    title: "100% Hydro-Tested & Certified",
    desc: "Full nitrogen purging, hydrostatic testing up to 1.5x operating limit, and Titas Gas licensing liaison.",
  },
];

const NETWORKS = [
  {
    image: "/images/services/autogas-plant-pipeline.jpg",
    alt: "AutoGas plant and bullet tank refuelling station",
    badgeIcon: Cylinder,
    code: "PLANT-AG-02",
    meta: "Govt. Certified",
    metaBg: TINT,
    metaFg: HEADING,
    title: "AutoGas Plant & Pipeline",
    desc: "Turnkey engineering, civil shielding, and installation for automotive refueling stations with strict Dept. of Explosives compliance.",
    points: [
      "Explosives approved bullet tanks",
      "ATEX certified wiring & barriers",
    ],
    tag: "Turnkey Blueprint",
    cta: "Station Specs",
    tint: BRAND,
  },
  {
    image: "/images/services/industrial-pipe-network.jpg",
    alt: "High-pressure industrial pipe network facility",
    badgeIcon: Fan,
    code: "IND-PIPE-03",
    meta: "Sch 40/80",
    metaBg: TINT,
    metaFg: HEADING,
    title: "Industrial Pipe Network",
    desc: "Heavy industrial gas networks engineered for textile spinning mills, ceramic kilns, boilers, and captive energy setups.",
    points: ["Seamless Sch 40/80 carbon steel", "100% X-ray certified weld tests"],
    tag: "Industrial Grade",
    cta: "Explore Piping",
    tint: BRAND,
  },
  {
    image: "/images/services/utility-gas-rms-tbs.jpg",
    alt: "Regulating and metering station — RMS and TBS installation",
    badgeIcon: Gauge,
    code: "TITAS-GAS-04",
    meta: "1st Class License",
    metaBg: TINT,
    metaFg: HEADING,
    title: "Utility Gas (RMS & TBS)",
    desc: "Official Titas Gas 1st Class protocol implementations for high-volume intake, governor calibration, and custody transfer regulation.",
    points: [
      "RMS station assembly & testing",
      "Direct utility load approval liaison",
    ],
    tag: "Titas Enlisted",
    cta: "RMS Licensing",
    tint: BRAND,
  },
  {
    image: "/images/services/fire-hydrant-safety.jpg",
    alt: "Fire hydrant pump house and sprinkler network",
    badgeIcon: FireExtinguisher,
    code: "SAFETY-HYD-05",
    meta: "NFPA 20",
    metaBg: "rgba(255,84,0,0.1)",
    metaFg: ACCENT,
    title: "Fire Hydrant & Safety Grids",
    desc: "Statutory fire protection networks and deluge pump houses built strictly to NFPA 20 and Bangladesh Fire Service regulations.",
    points: ["NFPA 20 industrial pump houses", "Fire Service NOC clearance"],
    tag: "Certified Safety",
    cta: "Inspect Hydrants",
    tint: ACCENT,
  },
];

export default function EngineeringServices() {
  return (
    <section id="services" className="w-full bg-[#F8F9FF] py-16 lg:py-24">
      <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-8">
        {/* ── Section header ──────────────────────────────── */}
        <div className="flex max-w-[672px] flex-col gap-0.5">
          <span
            className={`w-fit rounded-[2px] bg-[#E5EEFF] px-2 py-1 ${CAP} text-[#005F9D]`}
          >
            Specialized Engineering Services
          </span>
          <h2 className="text-[32px] font-semibold leading-10 tracking-[-0.48px] text-[#0B1C30]">
            Engineering &amp; Gas Pipeline Solutions
          </h2>
          <p className="text-sm leading-5 text-[#404751]">
            End-to-end design, procurement, welding, pressure testing, and
            regulatory sign-off for critical infrastructure.
          </p>
        </div>

        {/* ── Flagship: Central LPG Reticulation ─────────── */}
        <div
          className={`mt-10 w-full overflow-hidden rounded-2xl border-2 border-[#005F9D]/30 bg-white ${CARD_SHADOW}`}
        >
          {/* Gradient cap bar — 41px tall */}
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 bg-[linear-gradient(90deg,#005F9D_0%,#0079C4_100%)] px-6 py-2.5">
            <p
              className={`flex items-center gap-2 font-space text-[12px] font-bold uppercase leading-4 tracking-[0.6px] text-white`}
            >
              <BadgeCheck className="h-[21px] w-[22px] shrink-0 text-[#FCD34D]" />
              Flagship Engineering Specialty • #1 Turnkey Reticulation
              Contractor
            </p>
            <div className="flex flex-wrap items-center gap-1">
              <span
                className={`rounded-xl bg-white/20 px-2 py-0.5 ${CAP} text-white`}
              >
                BNBC 2020 &amp; NFPA 58 CERTIFIED
              </span>
              <span
                className={`rounded-xl bg-white/20 px-2 py-0.5 ${CAP} text-white`}
              >
                500+ RESIDENTIAL &amp; COMMERCIAL TOWERS
              </span>
            </div>
          </div>

          <div className="grid lg:min-h-[580px] lg:grid-cols-12">
            {/* Photo column — 5/12 */}
            <div className="relative order-first h-[320px] w-full overflow-hidden rounded-b-2xl lg:col-span-5 lg:h-auto lg:min-h-[580px] lg:rounded-b-none lg:rounded-bl-2xl">
              <Image
                src="/images/services/lpg-reticulation-manifold.jpg"
                alt="Central LPG reticulation system — manifold, cylinder bank and vaporizers"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 42vw"
                className="h-full w-full object-cover"
              />

              <div className="absolute left-4 top-4 flex flex-col items-start gap-1.5">
                <span
                  className={`flex items-center gap-1 rounded-xl bg-white/95 px-2 py-1 backdrop-blur-md ${PILL_SHADOW} ${CAP_BOLD} text-[#005F9D]`}
                >
                  <Cylinder className="h-5 w-4 shrink-0" />
                  SPEC-LPG-CORE-01
                </span>
                <span
                  className={`flex items-center gap-1 rounded-xl px-2 py-1 ${PILL_SHADOW} font-space text-[11px] font-bold uppercase leading-[14px] tracking-[0.55px] text-white`}
                  style={{ background: ACCENT }}
                >
                  <Flame className="h-[19px] w-4 shrink-0" />
                  HIGHEST DEMAND IN BD
                </span>
              </div>

              <div className="absolute inset-x-4 bottom-4 flex h-10 items-center justify-between gap-4 rounded border border-white bg-white/90 px-2 backdrop-blur-md">
                <span
                  className={`flex items-center gap-1 truncate ${CAP} text-[#0B1C30]`}
                >
                  <Cylinder className="h-[23px] w-4 shrink-0 text-[#005F9D]" />
                  Automated Digital Vaporizer &amp; Dual Regulator
                </span>
                <span className="shrink-0 whitespace-nowrap font-mono text-[12px] font-bold leading-4 text-[#005F9D]">
                  AUTO-FAILSAFE
                </span>
              </div>
            </div>

            {/* Copy column — 7/12 */}
            <div className="p-6 md:p-8 lg:col-span-7 lg:p-10">
              <div className="flex flex-col gap-1">
                <span
                  className={`flex w-fit items-center gap-1 rounded-md bg-[#005F9D]/10 px-2.5 py-1 ${CAP_BOLD} tracking-[0.28px] text-[#005F9D]`}
                >
                  <Star className="h-[19px] w-5 shrink-0" />
                  National Leader in Reticulation Systems
                </span>
                <h3 className="pt-1 text-[28px] font-bold leading-10 tracking-[-0.8px] text-[#0B1C30] md:text-[32px]">
                  Central LPG Reticulation System
                </h3>
                <p className="text-[15px] leading-[26px] text-[#404751] md:text-base">
                  Bangladesh&apos;s foremost turnkey pipeline infrastructure for
                  modern high-rise apartments, gated housing communities,
                  multi-stall food courts, and luxury hotel kitchens — replacing
                  cumbersome individual cylinders with safe, centralized bulk
                  storage and smart meters.
                </p>
              </div>

              <div className="mt-2 grid gap-2 pt-1 sm:grid-cols-2">
                {FEATURES.map((f) => {
                  const color = f.accent ? ACCENT : BRAND;
                  return (
                    <div
                      key={f.title}
                      className="flex gap-1 rounded border border-[#E5EEFF] bg-[#EFF4FF] p-2"
                    >
                      <span className="shrink-0 pt-0.5">
                        <f.icon
                          className="h-[18px] w-[18px]"
                          style={{ color }}
                          aria-hidden
                        />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold leading-5 text-[#0B1C30]">
                          {f.title}
                        </p>
                        <p className="mt-px text-xs leading-4 text-[#404751]">
                          {f.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-col items-stretch gap-4 border-t border-[#E5EEFF] pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p
                  className={`flex w-[217px] max-w-full items-center gap-2 font-space text-[11px] font-medium leading-[14px] tracking-[0.55px] text-[#404751]`}
                >
                  <BadgeCheck
                    className="h-[21px] w-[22px] shrink-0"
                    style={{ color: "#059669" }}
                    aria-hidden
                  />
                  NFPA 58 • BNBC Code 2020 • Dept. of Explosives Approved
                </p>

                <div className="flex flex-col items-stretch gap-2 sm:items-end">
                  <a
                    href="#contact"
                    className="inline-flex min-h-16 items-center justify-center gap-1 rounded bg-[#FF5400] px-10 py-3 font-space text-sm font-semibold leading-5 tracking-[0.28px] text-white shadow-[0_4px_12px_rgba(255,84,0,0.25)] transition-opacity hover:opacity-90"
                  >
                    Request Reticulation Design Blueprint &amp; Audit
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                  </a>
                  <a
                    href="#contact"
                    className="inline-flex min-h-11 items-center justify-center gap-1 rounded bg-[#DCE9FF] px-6 py-3 font-space text-sm font-semibold leading-5 tracking-[0.28px] text-[#005F9D] transition-colors hover:bg-[#cfe0ff]"
                  >
                    <PhoneCall className="h-[18px] w-[18px] shrink-0" aria-hidden />
                    Direct Expert Hotline
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Network cards ──────────────────────────────── */}
        <div className="mt-10">
          <div className="flex items-center justify-between gap-4 border-b border-[#E5EEFF] pb-1">
            <h3 className="text-base font-bold uppercase leading-6 tracking-[0.8px] text-[#0B1C30]">
              Additional Specialized Engineering &amp; Pipeline Networks
            </h3>
            <span
              className={`hidden shrink-0 font-space text-[11px] font-medium leading-[14px] tracking-[0.55px] text-[#404751] sm:block`}
            >
              Turnkey Industrial &amp; Regulatory Services
            </span>
          </div>

          <div className="mt-4 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {NETWORKS.map((c) => (
              <article
                key={c.title}
                className={`flex flex-col overflow-hidden rounded-lg border border-[#E5EEFF] bg-white ${TILE_SHADOW} transition-shadow hover:shadow-[0_6px_16px_-4px_rgba(0,0,0,0.12)]`}
              >
                <div className="relative h-44 overflow-hidden">
                  <Image
                    src={c.image}
                    alt={c.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
                    <span
                      className={`flex items-center gap-1 rounded-xl bg-white/90 px-2 py-1 backdrop-blur-md ${PILL_SHADOW} ${CAP_BOLD}`}
                      style={{ color: c.tint }}
                    >
                      <c.badgeIcon className="h-[18px] w-[18px] shrink-0" />
                      {c.code}
                    </span>
                    <span
                      className={`shrink-0 rounded-xl px-2 py-1 ${PILL_SHADOW} ${CAP_BOLD_META}`}
                      style={{ background: c.metaBg, color: c.metaFg }}
                    >
                      {c.meta}
                    </span>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <h4 className="text-base font-bold leading-6 text-[#0B1C30]">
                    {c.title}
                  </h4>
                  <p className="mt-[3px] text-xs leading-[19.5px] text-[#404751]">
                    {c.desc}
                  </p>

                  <ul className="mt-[3px] space-y-1">
                    {c.points.map((p) => (
                      <li
                        key={p}
                        className="flex items-center gap-1 text-xs leading-4 text-[#404751]"
                      >
                        <CircleCheck
                          className="h-5 w-5 shrink-0"
                          style={{ color: c.tint }}
                          aria-hidden
                        />
                        <span className="min-w-0">{p}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto flex items-center justify-between gap-2 border-t border-[#E5EEFF] pt-3">
                    <span
                      className={`truncate font-space text-[11px] font-medium leading-[14px] tracking-[0.55px] text-[#404751]`}
                    >
                      {c.tag}
                    </span>
                    <a
                      href="#contact"
                      className="flex shrink-0 items-center gap-1 font-space text-xs font-semibold leading-4 tracking-[0.48px] hover:underline"
                      style={{ color: c.tint }}
                    >
                      {c.cta}
                      <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}