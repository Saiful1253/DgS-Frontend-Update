"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export default function PagesPoliciesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { loading } = useAuth();

  const isActive = (tabPath: string) => {
    if (tabPath === "/settings/pages/terms-and-condition" && pathname === "/settings/pages") {
      return true;
    }
    return pathname === tabPath || pathname.startsWith(tabPath + "/");
  };

  const allTabs = [
    { label: "Terms & Conditions", href: "/settings/pages/terms-and-condition", },
    { label: "Privacy Policy", href: "/settings/pages/privacy-policy", },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold uppercase tracking-tight text-foreground">
          Pages & Policies
        </h2>
        <p className="text-sm font-medium text-muted-foreground">
          Update public rich-text pages like Terms & Conditions and Privacy Policy.
        </p>
      </div>

      {/* Tabs following unified tab routing design */}
      <div className="flex items-center gap-2 border-b border-border overflow-x-auto pb-px scrollbar-none">
        {loading ? (
          <div className="flex gap-2 pb-1">
            {[1, 2].map((i) => (
              <div key={i} className="h-9 w-36 bg-muted/60 animate-pulse rounded-t-lg" />
            ))}
          </div>
        ) : (
          allTabs.map((tab) => {
            const active = isActive(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all whitespace-nowrap border-b-2 -mb-px",
                  active
                    ? "border-primary text-primary bg-primary/5 font-bold"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                {tab.label}
              </Link>
            );
          })
        )}
      </div>

      <div>
        {children}
      </div>
    </div>
  );
}
