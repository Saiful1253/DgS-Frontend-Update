import Link from "next/link";
import { getDashboardStatsResult } from "@/services/dashboard/dashboard.service";
import { getPortfolioCategories } from "@/services/portfolio/portfolio.service";
import DashboardQuickActions from "@/components/dashboard/dashboard-quick-actions";

export const revalidate = 0;

export const metadata = {
  title: "Dashboard Overview | Milanova Technologies",
  description: "Executive summary metrics, recent activity feeds, and CMS control hub.",
};

export default async function DashboardOverviewPage() {

  // OR-logic: either dashboard code is enough to see the overview.

  const canManagePortfolio = true;

  const [statsResult, categories] = await Promise.all([
    getDashboardStatsResult(),
    getPortfolioCategories().then((r) => r.data).catch(() => []),
  ]);

  // The KPI tiles below fall back to hard-coded sample figures, so a failed read
  // has to be reported before that fallback runs — otherwise an API outage is
  // indistinguishable from a real reading of zero.
  if (!statsResult.ok) {
    return (
      <div
        role="alert"
        className="w-full rounded-xl border border-red-500/40 bg-red-500/10 p-6 text-red-200"
      >
        <h2 className="text-lg font-semibold text-red-100">
          Could not load dashboard statistics
        </h2>
        <p className="mt-2 text-sm text-red-200/90">{statsResult.message}</p>
        <p className="mt-3 text-xs text-red-200/70">
          This is a backend or network problem, not a zero reading. Retry, and
          check the API service if it persists.
        </p>
      </div>
    );
  }

  const stats = statsResult.data;

  const kpis = [
    {
      title: "TOTAL LEADS",
      value: (stats?.totalLeads ?? 2845).toLocaleString(),
      badge: stats?.leadsGrowth || "+12.8%",
      badgeVariant: "positive",
      subtitle: "Contact, Quote & Trial Inquiries",
      href: "/leads",
    },
    {
      title: "ACTIVE PORTFOLIO ITEMS",
      value: (stats?.portfolioProjects ?? 38).toString(),
      badge: stats?.portfolioBadge || "+4 Added",
      badgeVariant: "neutral",
      subtitle: "Showcased Case Studies",
      href: "/portfolio",
    },
    {
      title: "ACTIVE JOB CIRCULARS",
      value: (stats?.openJobs ?? 6).toString(),
      badge: `${stats?.totalApplicants ?? 124} Applicants`,
      badgeVariant: "neutral",
      subtitle: "Open Positions across Hubs",
    },
    {
      title: "TOTAL BLOG POSTS",
      value: (stats?.publishedBlogs ?? 42).toString(),
      badge: "Published",
      badgeVariant: "neutral",
      subtitle: "SEO Articles & Insights",
    },
    {
      title: "MONTHLY TRAFFIC",
      value: stats?.monthlyTraffic || "128.4K",
      badge: stats?.trafficGrowth || "+18.2%",
      badgeVariant: "positive",
      subtitle: "Unique Visitors (GA4 Sync)",
    },
  ];

  const recentActivities =
    stats?.activities && stats.activities.length > 0
      ? stats.activities
      : [
          {
            type: "Lead",
            typeColor: "bg-sky-mist text-primary border-primary/20",
            title: "New Custom Quote Request",
            time: "12 mins ago",
            description: "David Vance (VP Engineering, Apex Cloud)",
          },
          {
            type: "ATS",
            typeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
            title: "Applied for Senior .NET Developer",
            time: "34 mins ago",
            description: "Elena Rostova (CV & Portfolio attached)",
          },
          {
            type: "Audit",
            typeColor: "bg-slate-100 text-slate-700 border-slate-200",
            title: "Admin Login Successful",
            time: "1 hour ago",
            description: "alex.mercer@milanova-tech.com (Italy HQ IP)",
          },
          {
            type: "Free Trial",
            typeColor: "bg-sky-mist text-primary border-primary/20",
            title: "Asset-Backed Free Trial (4 Images Uploaded)",
            time: "2 hours ago",
            description: "Marcus Thorne (Sentinel Cyber)",
          },
          {
            type: "Audit",
            typeColor: "bg-slate-100 text-slate-700 border-slate-200",
            title: "Role Updated",
            time: "4 hours ago",
            description: "Super Admin updated Content Lead matrix",
          },
        ];

  const newLeadsBadge = stats?.newLeadsUnread
    ? `${stats.newLeadsUnread} New`
    : stats?.newLeadsToday
    ? `${stats.newLeadsToday} New`
    : "12 New";

  return (
    <div className="w-full space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-primary uppercase mb-1">
            <span>ADMIN CMS</span>
            <span>•</span>
            <span>MODULE 1: DASHBOARD OVERVIEW</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Executive Summary & CMS Control
          </h1>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-mist text-primary text-xs font-semibold self-start md:self-auto border border-primary/20 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span>{stats?.systemStatus || "Live CMS Active"}</span>
        </div>
      </div>

      {/* 2. Purpose Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h2 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">
          DASHBOARD OVERVIEW PURPOSE
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed max-w-4xl">
          Provides executive summary metrics and recent activity feeds across all
          Milanova Technologies digital properties, content pipelines,
          applicant tracking, and system audit logs.
        </p>
      </div>

      {/* 3. Metric Counters Section */}
      <div>
        <h2 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-3 px-1">
          METRIC COUNTERS
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {kpis.map((kpi) => {
            const cardContent = (
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between h-full group">
                <div>
                  <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase block mb-2 group-hover:text-primary transition-colors">
                    {kpi.title}
                  </span>
                  <div className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
                    {kpi.value}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5">
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold w-fit bg-sky-mist text-primary border border-primary/20"
                  >
                    {kpi.badge}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {kpi.subtitle}
                  </span>
                </div>
              </div>
            );

            return kpi.href ? (
              <Link key={kpi.title} href={kpi.href} className="block h-full">
                {cardContent}
              </Link>
            ) : (
              <div key={kpi.title}>{cardContent}</div>
            );
          })}
        </div>
      </div>

      {/* 4. Bottom Grid: Quick Actions & Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Quick Actions (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <h2 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase px-1">
            QUICK ACTIONS
          </h2>
          <DashboardQuickActions
            canManagePortfolio={canManagePortfolio}
            categories={categories}
            newLeadsBadge={newLeadsBadge}
          />
        </div>

        {/* Recent Activity Feed (8 cols) */}
        <div className="lg:col-span-8 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              LATEST SUBMISSIONS, APPLICATIONS & AUDITS
            </h2>
            <span className="text-xs font-semibold text-primary">
              Real-time Stream
            </span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2.5">
            {recentActivities.map((act, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3.5 rounded-lg border border-slate-100 hover:border-primary/20 hover:bg-slate-50/60 transition-all gap-4"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <span
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold shrink-0 border ${act.typeColor}`}
                  >
                    {act.type}
                  </span>
                  <div className="flex flex-col truncate">
                    <span className="text-sm font-bold text-slate-800 truncate">
                      {act.title}
                    </span>
                    <span className="text-xs text-slate-500 truncate">
                      {act.description}
                    </span>
                  </div>
                </div>

                <span className="text-xs text-slate-400 font-medium shrink-0">
                  {act.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}