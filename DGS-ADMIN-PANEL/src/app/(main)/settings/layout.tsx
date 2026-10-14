"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { loading } = useAuth();

  const allTabs = [
    { label: "Site Config", href: "/settings/site-config", targetHref: "/settings/site-config" },
    { label: "Pages & Policies", href: "/settings/pages", targetHref: "/settings/pages/terms-and-condition" },
    { label: "Notifications", href: "/settings/notifications", targetHref: "/settings/notifications" },
  ];

  const isActiveTab = (tabHref: string) => {
    if (tabHref === "/settings/site-config" && pathname === "/settings") {
      return true;
    }
    return pathname.startsWith(tabHref);
  };

  return (
    <div className="p-2 sm:p-4 md:p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-foreground">System Settings</h1>
          <p className="text-sm font-medium text-muted-foreground">Configure site settings, SEO parameters, and page content.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border overflow-x-auto pb-px scrollbar-none">
        {allTabs.map((tab) => {
          const active = isActiveTab(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.targetHref}
              className={cn(
                "px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all whitespace-nowrap border-b-2 -mb-px",
                active
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
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
