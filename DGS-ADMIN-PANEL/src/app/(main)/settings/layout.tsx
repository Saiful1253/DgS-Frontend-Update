"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Settings, Globe, FileText, Bell } from "lucide-react";

const SETTINGS_TABS = [
  { label: "Site Configuration", href: "/settings/site-config", targetHref: "/settings/site-config", icon: Globe },
  { label: "Pages & Policies", href: "/settings/pages", targetHref: "/settings/pages/terms-and-condition", icon: FileText },
  { label: "Notifications", href: "/settings/notifications", targetHref: "/settings/notifications", icon: Bell },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { loading } = useAuth();

  const isActiveTab = (tabHref: string) => {
    if (tabHref === "/settings/site-config" && pathname === "/settings") {
      return true;
    }
    return pathname.startsWith(tabHref);
  };

  return (
    <div className="p-2 sm:p-4 md:p-6 space-y-6 w-full min-w-0 max-w-full">
      {/* Module Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold tracking-wider text-[#00668a] uppercase mb-1 flex-wrap">
            <span>ADMIN MODULE</span>
            <span>•</span>
            <span>SYSTEM CONFIGURATION</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight break-words">
            System Settings &amp; Configuration
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 break-words">
            Configure company branding, logo, contact coordinates, social channels, and public legal policies.
          </p>
        </div>
        <div className="hidden md:flex shrink-0">
          <div className="w-12 h-12 rounded-full bg-[#e6eff6] text-[#00668a] flex items-center justify-center border border-[#00668a]/20">
            <Settings className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-200 p-1.5 shadow-xs w-full overflow-x-auto min-w-0 max-w-full">
        {SETTINGS_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = isActiveTab(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.targetHref}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all shrink-0 whitespace-nowrap",
                active
                  ? "bg-primary text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </Link>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 text-sm text-muted-foreground">
          Loading settings...
        </div>
      ) : (
        <div>{children}</div>
      )}
    </div>
  );
}
