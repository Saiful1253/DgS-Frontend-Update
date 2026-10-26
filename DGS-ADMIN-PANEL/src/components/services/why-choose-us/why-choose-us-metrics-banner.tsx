"use client";

import React from "react";
import { Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WhyChooseUsMetrics } from "@/types/why-choose-us";
import { DEFAULT_WHY_CHOOSE_US_METRICS } from "@/services/why-choose-us/why-choose-us.service";

interface Props {
  metrics?: WhyChooseUsMetrics;
  onEdit: () => void;
}

export default function WhyChooseUsMetricsBanner({
  metrics = DEFAULT_WHY_CHOOSE_US_METRICS,
  onEdit,
}: Props) {
  const m = metrics || DEFAULT_WHY_CHOOSE_US_METRICS;

  return (
    <div className="relative w-full rounded-2xl bg-primary p-6 sm:p-8 lg:py-8 lg:px-10 shadow-md text-white overflow-hidden border border-white/10">
      {/* Top action row with Edit button */}
      <div className="relative z-10 flex items-center justify-between mb-4 pb-2 border-b border-white/15">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-sky-100 bg-white/15 px-2.5 py-0.5 rounded-full">
            Live Achievements Strip
          </span>
          <span className="hidden sm:inline text-xs text-sky-100/80">
            Rendered dynamically on client storefront
          </span>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={onEdit}
          className="h-7 px-3 bg-white/15 hover:bg-white/25 text-white border border-white/25 text-xs font-semibold gap-1.5 rounded-lg shadow-2xs transition-all"
        >
          <Edit2 className="w-3 h-3 text-sky-100" />
          <span>Edit Stats</span>
        </Button>
      </div>

      {/* 4 Metrics Grid matching target design screenshot */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 divide-y sm:divide-y-0 sm:divide-x divide-white/15">
        {/* Metric 1 */}
        <div className="flex flex-col sm:px-4 first:sm:pl-0">
          <div className="text-3xl sm:text-4xl lg:text-[44px] font-black tracking-tight text-[#FE6A34] leading-none">
            {m.metric1?.value || "0"}
          </div>
          <div className="mt-2.5 text-base font-bold text-white tracking-tight leading-snug">
            {m.metric1?.label || DEFAULT_WHY_CHOOSE_US_METRICS.metric1.label}
          </div>
          <div className="mt-1 text-xs text-sky-100/80 font-normal leading-relaxed">
            {m.metric1?.subtitle || DEFAULT_WHY_CHOOSE_US_METRICS.metric1.subtitle}
          </div>
        </div>

        {/* Metric 2 */}
        <div className="flex flex-col pt-4 sm:pt-0 sm:px-4">
          <div className="text-3xl sm:text-4xl lg:text-[44px] font-black tracking-tight text-[#4EDEA3] leading-none">
            {m.metric2?.value || "0"}
          </div>
          <div className="mt-2.5 text-base font-bold text-white tracking-tight leading-snug">
            {m.metric2?.label || DEFAULT_WHY_CHOOSE_US_METRICS.metric2.label}
          </div>
          <div className="mt-1 text-xs text-sky-100/80 font-normal leading-relaxed">
            {m.metric2?.subtitle || DEFAULT_WHY_CHOOSE_US_METRICS.metric2.subtitle}
          </div>
        </div>

        {/* Metric 3 */}
        <div className="flex flex-col pt-4 sm:pt-0 sm:px-4">
          <div className="text-3xl sm:text-4xl lg:text-[44px] font-black tracking-tight text-[#D5E3FF] leading-none">
            {m.metric3?.value || "0%"}
          </div>
          <div className="mt-2.5 text-base font-bold text-white tracking-tight leading-snug">
            {m.metric3?.label || DEFAULT_WHY_CHOOSE_US_METRICS.metric3.label}
          </div>
          <div className="mt-1 text-xs text-sky-100/80 font-normal leading-relaxed">
            {m.metric3?.subtitle || DEFAULT_WHY_CHOOSE_US_METRICS.metric3.subtitle}
          </div>
        </div>

        {/* Metric 4 */}
        <div className="flex flex-col pt-4 sm:pt-0 sm:px-4 last:sm:pr-0">
          <div className="text-3xl sm:text-4xl lg:text-[44px] font-black tracking-tight text-[#FFDBD0] leading-none">
            {m.metric4?.value || "0"}
          </div>
          <div className="mt-2.5 text-base font-bold text-white tracking-tight leading-snug">
            {m.metric4?.label || DEFAULT_WHY_CHOOSE_US_METRICS.metric4.label}
          </div>
          <div className="mt-1 text-xs text-sky-100/80 font-normal leading-relaxed">
            {m.metric4?.subtitle || DEFAULT_WHY_CHOOSE_US_METRICS.metric4.subtitle}
          </div>
        </div>
      </div>
    </div>
  );
}
