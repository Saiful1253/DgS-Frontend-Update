
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Layers, HelpCircle, Wrench } from "lucide-react";

const SERVICE_TABS = [
  { label: "All Services", href: "/services", icon: Layers },
  { label: "Why Choose Us", href: "/services/why-coose-us", icon: HelpCircle },
  { label: "What We Do", href: "/services/what-we-do", icon: Wrench },
];

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isTabActive = (tabHref: string) => {
    if (tabHref === "/services") {
      return pathname === "/services";
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
            <span>ENGINEERING SERVICES</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight break-words">
            Engineering Services Manager
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 break-words">
            Manage LPG reticulation, industrial gas piping, fire safety grids, and public visibility.
          </p>
        </div>
        <div className="hidden md:flex shrink-0">
          <div className="w-12 h-12 rounded-full bg-[#e6eff6] text-[#00668a] flex items-center justify-center border border-[#00668a]/20">
            <Layers className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-200 p-1.5 shadow-xs w-full overflow-x-auto min-w-0 max-w-full">
        {SERVICE_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = isTabActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
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

      {children}
    </div>
  );
}
