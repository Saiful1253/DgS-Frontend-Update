import React from "react";
import { BarChart3, TrendingUp,  Globe,  ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const revalidate = 0;

export const metadata = {
  title: "Analytics & Traffic Insights | MilanoVA",
  description: "Platform traffic analytics, visitor geography, and conversion attribution.",
};

export default async function AnalyticsPage() {

  const hasManageAccess = true;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-sky-mist text-primary border border-primary/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Platform Analytics & Intelligence</h1>
            <Badge variant="outline" className="text-xs bg-sky-mist/50 text-primary border-primary/20 font-medium">
              Real-Time
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Monitor client traffic demographics, consultation funnel conversions, page popularity, and organic acquisition channels.
          </p>
        </div>

        <div>
          {hasManageAccess ? (
            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 font-medium">
              Full Analytics Access
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs gap-1 py-1">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
              Read-Only Access
            </Badge>
          )}
        </div>
      </div>

      {/* Traffic KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Monthly Visitors</span>
          <div className="text-2xl font-bold text-slate-900">48,250</div>
          <p className="text-[11px] text-emerald-600 flex items-center gap-0.5">
            <TrendingUp className="w-3 h-3" /> +14.2% vs last month
          </p>
        </div>
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Session Duration</span>
          <div className="text-2xl font-bold text-primary">3m 42s</div>
          <p className="text-[11px] text-slate-400">High engagement on Case Studies</p>
        </div>
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Top Geography</span>
          <div className="text-2xl font-bold text-slate-900">Italy & EU</div>
          <p className="text-[11px] text-slate-400">64% of total traffic</p>
        </div>
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lead Conversion Rate</span>
          <div className="text-2xl font-bold text-emerald-600">4.8%</div>
          <p className="text-[11px] text-emerald-600 flex items-center gap-0.5">
            <TrendingUp className="w-3 h-3" /> +0.6% vs benchmark
          </p>
        </div>
      </div>

      {/* Analytics Chart Container */}
      <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
        <div className="w-12 h-12 rounded-full bg-sky-mist text-primary flex items-center justify-center mx-auto border border-primary/20">
          <Globe className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Global Visitor Analytics & Traffic Attribution</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Detailed metrics on organic search queries, referrer domains, device distributions, and technical blog article read ratios.
        </p>
      </div>
    </div>
  );
}
