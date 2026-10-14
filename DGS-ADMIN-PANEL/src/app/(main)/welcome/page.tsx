"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  ShieldCheck,
  ArrowRight,
  Users,
  Layers,
  Briefcase,
  Settings,
  Activity,
  CheckCircle2,
  Clock,
  Globe,
  Building2,
  ChevronRight,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function WelcomePage() {
  const { user } = useAuth();

  const userName = user?.name || user?.Name || "Administrator";
  const userRole = user?.role?.name ? user.role.name.replace(/_/g, " ") : "Super Admin";

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const quickStats = [
    {
      title: "CRM Inquiries",
      value: "128",
      change: "+14.2% this week",
      icon: Users,
      iconBg: "bg-sky-mist text-primary",
      href: "/leads",
      actionText: "Review pipeline",
      
    },
    {
      title: "Portfolio Projects",
      value: "38",
      change: "Active case studies",
      icon: Briefcase,
      iconBg: "bg-blue-50 text-blue-600",
      href: "/portfolio",
      actionText: "Manage portfolio",
      
    },
    {
      title: "SaaS Platforms",
      value: "4 Live",
      change: "99.98% uptime",
      icon: Layers,
      iconBg: "bg-emerald-50 text-emerald-600",
      href: "/products",
      actionText: "Inspect architecture",
      
    },
    {
      title: "Access Governance",
      value: "38 Scopes",
      change: "Active RBAC matrix",
      icon: ShieldCheck,
      iconBg: "bg-purple-50 text-purple-600",
      href: "/users",
      actionText: "Manage users",
      
    },
  ];

  const modules = [
    {
      title: "Dashboard Overview",
      description: "Business intelligence KPIs, monthly engagement traffic, and aggregated activity feeds.",
      href: "/dashboard",
      icon: Activity,
      badge: "Core Analytics",
      
    },
    {
      title: "Client Leads & RFPs",
      description: "Evaluate dual-intake submissions, free trial asset downloads, and custom quote requests.",
      href: "/leads",
      icon: Users,
      badge: "CRM Engine",
      
    },
    {
      title: "Portfolio & Case Studies",
      description: "Curate enterprise case studies, architectural challenges, and client deliverables.",
      href: "/portfolio",
      icon: Briefcase,
      badge: "Showcase",
      
    },
    {
      title: "SaaS Products Catalog",
      description: "Manage proprietary SaaS systems, pricing tiers, and recurring service modules.",
      href: "/products",
      icon: Layers,
      badge: "Enterprise SaaS",
      
    },
    {
      title: "User & Role Access (RBAC)",
      description: "Administer teammates, assign role privileges, and inspect granular system scopes.",
      href: "/users",
      icon: UserCheck,
      badge: "Security",
      
    },
    {
      title: "System & Site Configuration",
      description: "Brand identity, global SEO parameters, legal rich-text policies, and SMS OTP notifications.",
      href: "/settings/site-config",
      icon: Settings,
      badge: "Settings",
      
    },
  ];

  return (
    <div className="w-full space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* 1. Hero Executive Greeting Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-white via-sky-mist/30 to-primary/5 border border-slate-200/80 p-6 sm:p-8 md:p-10 shadow-xs">
        {/* Subtle decorative background circles */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 rounded-full bg-sky-mist blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            {/* Top metadata pill bar */}
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge variant="outline" className="text-xs bg-white/80 text-primary border-primary/20 font-semibold px-3 py-1 shadow-2xs">
                <Building2 className="w-3.5 h-3.5 mr-1 text-primary" />
                MilanoVA Technologies S.R.L.
              </Badge>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentDate}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>System Nominal</span>
              </div>
            </div>

            {/* Welcome Heading */}
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900">
                Welcome back,{" "}
                <span className="text-primary">{userName}</span>
              </h1>
              <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
                Your enterprise workspace is active. Manage digital engineering deliverables, customer pipelines, and RBAC governance from your central command hub.
              </p>
            </div>

            {/* User role & status indicator */}
            <div className="flex items-center gap-3 pt-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white/90 border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span className="font-semibold text-slate-700 uppercase tracking-wide text-[10px]">
                  Role:
                </span>
                <span className="font-bold text-primary capitalize">{userRole}</span>
              </div>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500 font-medium">
                GDPR Compliant · Italy Registered
              </span>
            </div>
          </div>

          {/* Primary CTA */}
          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3 shrink-0">
            <Button
              asChild
              className="h-11 px-6 font-bold shadow-xs bg-primary hover:bg-primary/90 text-white rounded-xl gap-2"
            >
              <Link href="/dashboard">
                <span>Go to Full Analytics</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <span className="text-[11px] text-slate-400 font-medium">
              Real-time synchronization active
            </span>
          </div>
        </div>
      </div>

      {/* 2. Pulse Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {quickStats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-sm hover:border-primary/40 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    {stat.title}
                  </span>
                  <span className="text-2xl font-black text-slate-900 tracking-tight">
                    {stat.value}
                  </span>
                </div>
                <div className={`p-2.5 rounded-xl ${stat.iconBg} shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <span className="text-slate-500 font-medium text-[11px] truncate">
                  {stat.change}
                </span>
                <Link
                  href={stat.href}
                  className="font-bold text-primary hover:text-primary/80 flex items-center gap-1 group shrink-0"
                >
                  <span>{stat.actionText}</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Quick Access Launchpad */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold uppercase tracking-tight text-slate-900">
              Workspace Modules & Launchpad
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Direct pathways to your daily management tools and operational suites.
            </p>
          </div>
          <Badge variant="secondary" className="text-xs font-semibold px-2.5 py-1">
            {modules.length} Modules Available
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {modules.map((mod, idx) => {
            const Icon = mod.icon;
            return (
              <Link
                key={idx}
                href={mod.href}
                className="group relative bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-primary/50 hover:-translate-y-0.5 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-sky-mist text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-semibold text-slate-500 group-hover:border-primary/30 group-hover:text-primary transition-colors"
                    >
                      {mod.badge}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-primary transition-colors">
                      {mod.title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                      {mod.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center text-xs font-bold text-primary pt-2 border-t border-slate-100 group-hover:border-primary/20 transition-colors">
                  <span>Access Module</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 4. Infrastructure & Governance Footer Bar */}
      <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-slate-700">API Gateway:</span>
            <span>Online (NestJS v1.0)</span>
          </div>
          <span className="hidden sm:inline text-slate-300">|</span>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-slate-700">Database:</span>
            <span>PostgreSQL (Connected)</span>
          </div>
          <span className="hidden sm:inline text-slate-300">|</span>
          <div className="flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-primary" />
            <span className="font-semibold text-slate-700">Server Hub:</span>
            <span>Milan, Italy (EU-Central)</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 font-medium">
          MilanoVA Technologies © 2026
        </div>
      </div>
    </div>
  );
}
