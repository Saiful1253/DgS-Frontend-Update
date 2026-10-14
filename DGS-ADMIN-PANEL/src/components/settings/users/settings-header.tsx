import React from "react";

interface HeaderStat {
  label: string;
  value: string | number;
  subtitle: string;
  tone?: "default" | "primary" | "emerald";
}

interface SettingsHeaderProps {
  module: string;
  title: string;
  purpose: string;
  stats: HeaderStat[];
  action?: React.ReactNode;
}

const TONE_CLASS: Record<NonNullable<HeaderStat["tone"]>, string> = {
  default: "text-slate-900",
  primary: "text-primary",
  emerald: "text-emerald-600",
};

/**
 * Replicates the portfolio page header pattern:
 * breadcrumb banner + title + action, purpose card, and stat overview grid.
 */
export default function SettingsHeader({
  module,
  title,
  purpose,
  stats,
  action,
}: SettingsHeaderProps) {
  return (
    <div className="space-y-6 w-full">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap text-[10px] sm:text-xs font-bold tracking-wider text-primary uppercase mb-1">
            <span>ADMIN CMS</span>
            <span>•</span>
            <span className="truncate">{module}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight break-words">
            {title}
          </h1>
        </div>

        {action && <div className="flex items-center gap-3 w-full sm:w-auto">{action}</div>}
      </div>

      {/* 2. Purpose Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h2 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">
          PURPOSE
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed max-w-5xl">
          {purpose}
        </p>
      </div>

      {/* 3. Stat Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1"
          >
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {stat.label}
            </span>
            <div
              className={`text-3xl font-extrabold tracking-tight ${
                TONE_CLASS[stat.tone ?? "default"]
              }`}
            >
              {stat.value}
            </div>
            <p className="text-xs text-slate-500 font-medium">{stat.subtitle}</p>
          </div>
        ))}
      </div>
    </div>
  );
}