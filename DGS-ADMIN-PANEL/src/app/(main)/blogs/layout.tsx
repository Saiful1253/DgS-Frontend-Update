"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { FileText, FolderTree, Users, Tags, BookOpen } from "lucide-react";

const ALL_TABS = [
  { label: "Posts", href: "/blogs", icon: FileText },
  { label: "Categories", href: "/blogs/categories", icon: FolderTree },
  { label: "Authors", href: "/blogs/authors", icon: Users },
  { label: "Tags", href: "/blogs/tags", icon: Tags },
];

export default function BlogsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="p-2 sm:p-4 md:p-6 space-y-6 w-full min-w-0 max-w-full">
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold tracking-wider text-primary uppercase mb-1 flex-wrap">
            <span>ADMIN CMS</span>
            <span>•</span>
            <span>EDITORIAL</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight break-words">
            Blogs &amp; Articles
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 break-words">
            Publish editorial content, manage categories, authors, tags and article metadata.
          </p>
        </div>
        <div className="hidden md:flex shrink-0">
          <div className="w-12 h-12 rounded-full bg-sky-mist text-primary flex items-center justify-center border border-primary/20">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-200 p-1.5 shadow-xs w-full overflow-x-auto min-w-0 max-w-full">
        {ALL_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = pathname === tab.href;
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