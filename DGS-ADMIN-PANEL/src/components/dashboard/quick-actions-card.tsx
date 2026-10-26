"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Layers,
  FileText,
  Briefcase,
  FolderGit2,
  Plus,
} from "lucide-react";

export default function QuickActionsCard() {
  const router = useRouter();

  const actions = [
    {
      title: "Add New Service",
      icon: Layers,
      actionIcon: Plus,
      color: "text-cyan-600",
      bg: "bg-cyan-50",
      border: "border-cyan-100",
      hoverBorder: "hover:border-cyan-300",
      hoverBg: "hover:bg-cyan-50/40",
      onClick: () => router.push("/services"),
    },
    {
      title: "New Blog Post",
      icon: FileText,
      actionIcon: Plus,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      border: "border-indigo-100",
      hoverBorder: "hover:border-indigo-300",
      hoverBg: "hover:bg-indigo-50/40",
      onClick: () => router.push("/blogs"),
    },
    {
      title: "Post Career Listing",
      icon: Briefcase,
      actionIcon: Plus,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
      hoverBorder: "hover:border-emerald-300",
      hoverBg: "hover:bg-emerald-50/40",
      onClick: () => router.push("/careers"),
    },
    {
      title: "Add Portfolio Project",
      icon: FolderGit2,
      actionIcon: Plus,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-100",
      hoverBorder: "hover:border-amber-300",
      hoverBg: "hover:bg-amber-50/40",
      onClick: () => router.push("/portfolio"),
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
      <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {actions.map((act) => (
          <button
            key={act.title}
            onClick={act.onClick}
            className={cn(
              "flex flex-col items-center justify-center p-4 rounded-xl border transition-all text-center group cursor-pointer",
              act.bg,
              act.border,
              act.hoverBorder,
              act.hoverBg
            )}
          >
            <div className={cn("p-2.5 rounded-lg mb-2 transition-transform group-hover:scale-110", act.color)}>
              <act.icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900 line-clamp-1">
              {act.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
