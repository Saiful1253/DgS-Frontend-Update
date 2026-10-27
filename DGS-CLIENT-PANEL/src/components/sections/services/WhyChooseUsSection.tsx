import type { WhyChooseUs, WhyChooseUsMetrics } from "@/types/why-choose-us";
import {
  ShieldCheck,
  BadgeCheck,
  Users,
  Asterisk,
  Flame,
  Wrench,
  Award,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";

interface Props {
  items: WhyChooseUs[];
  metrics?: WhyChooseUsMetrics;
}

const ICON_MAP: Record<string, LucideIcon> = {
  "shield-check": ShieldCheck,
  shield: ShieldCheck,
  "badge-check": BadgeCheck,
  badge: BadgeCheck,
  users: Users,
  team: Users,
  asterisk: Asterisk,
  emergency: Asterisk,
  flame: Flame,
  wrench: Wrench,
  award: Award,
  check: CheckCircle2,
};

function getPropositionStyle(item: WhyChooseUs, index: number = 0) {
  // 1. Explicitly configured from DB
  if (item.badge_color || item.icon_color || item.icon_name) {
    const IconComponent =
      (item.icon_name && ICON_MAP[item.icon_name.toLowerCase()]) || ShieldCheck;
    return {
      bgStyle: item.badge_color ? { backgroundColor: item.badge_color } : undefined,
      bgClass: !item.badge_color ? "bg-[#043e2d]" : "",
      iconStyle: item.icon_color ? { color: item.icon_color } : undefined,
      iconClass: !item.icon_color ? "text-[#10b981]" : "",
      icon: IconComponent,
    };
  }

  // 2. Fallback to title detection matching target design
  const lower = (item.title || "").toLowerCase();
  if (lower.includes("safety") || lower.includes("guarantee")) {
    return {
      bgStyle: undefined,
      bgClass: "bg-[#043e2d]",
      iconStyle: undefined,
      iconClass: "text-[#10b981]",
      icon: ShieldCheck,
    };
  }
  if (lower.includes("titas") || lower.includes("enlisted") || lower.includes("class")) {
    return {
      bgStyle: undefined,
      bgClass: "bg-[#1c355e]",
      iconStyle: undefined,
      iconClass: "text-white",
      icon: BadgeCheck,
    };
  }
  if (lower.includes("team") || lower.includes("engineer") || lower.includes("expert")) {
    return {
      bgStyle: undefined,
      bgClass: "bg-[#e0eaff]",
      iconStyle: undefined,
      iconClass: "text-[#f95700]",
      icon: Users,
    };
  }
  if (lower.includes("emergency") || lower.includes("24/7") || lower.includes("response")) {
    return {
      bgStyle: undefined,
      bgClass: "bg-[#ffe8dc]",
      iconStyle: undefined,
      iconClass: "text-[#8b1e1e]",
      icon: Asterisk,
    };
  }

  const fallbackList = [
    { bgStyle: undefined, bgClass: "bg-[#043e2d]", iconStyle: undefined, iconClass: "text-[#10b981]", icon: ShieldCheck },
    { bgStyle: undefined, bgClass: "bg-[#1c355e]", iconStyle: undefined, iconClass: "text-white", icon: BadgeCheck },
    { bgStyle: undefined, bgClass: "bg-[#e0eaff]", iconStyle: undefined, iconClass: "text-[#f95700]", icon: Users },
    { bgStyle: undefined, bgClass: "bg-[#ffe8dc]", iconStyle: undefined, iconClass: "text-[#8b1e1e]", icon: Asterisk },
  ];
  return fallbackList[index % fallbackList.length];
}

export default function WhyChooseUsSection({ items, metrics }: Props) {
  if (!items || items.length === 0) return null;

  return (
    <section id="why-choose-us" className="relative w-full py-16 sm:py-24 bg-[#f8fafd]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header Block */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-orange-50 border border-orange-200/60 shadow-2xs">
            <span className="text-[#f95700] text-[11px] font-bold tracking-widest uppercase">
              ENGINEERING INTEGRITY
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#0c1a30] tracking-tight leading-tight">
            Why Choose Digital Gas Service?
          </h2>

          <p className="text-sm sm:text-[15px] text-slate-600 leading-relaxed font-normal max-w-2xl mx-auto pt-1">
            Zero compromise on gas safety. Certified mechanical engineers verify every joint, flange, and pressure valve to safeguard life and property.
          </p>
        </div>

        {/* Dynamic Card Showcase Grid */}
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 ${items.length >= 4
            ? "lg:grid-cols-4"
            : items.length === 3
              ? "lg:grid-cols-3"
              : "lg:grid-cols-2"
            } gap-6`}
        >
          {items.map((item, idx) => {
            const style = getPropositionStyle(item, idx);
            const IconComponent = style.icon;

            return (
              <div
                key={item.id}
                className="rounded-2xl bg-white border border-slate-100 p-6 sm:p-7 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Icon Box */}
                  <div
                    style={style.bgStyle}
                    className={`w-12 h-12 rounded-xl ${style.bgClass || ""} flex items-center justify-center shadow-xs shrink-0 overflow-hidden`}
                  >
                    {item.icon_url ? (
                      <img
                        src={item.icon_url}
                        alt=""
                        className="w-6 h-6 object-contain"
                      />
                    ) : (
                      <IconComponent
                        style={style.iconStyle}
                        className={`w-6 h-6 ${style.iconClass || ""}`}
                        strokeWidth={2.2}
                      />
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="mt-5 text-lg sm:text-[19px] font-bold text-[#0c1a30] leading-snug tracking-tight">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="mt-3 text-xs sm:text-[13px] text-slate-500 leading-relaxed font-normal">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>


      </div>
    </section>
  );
}
