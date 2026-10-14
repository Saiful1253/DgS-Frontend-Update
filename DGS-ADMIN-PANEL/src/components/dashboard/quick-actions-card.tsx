"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Package,
  FileText,
  Briefcase,
  FolderGit2,
  Plus,
} from "lucide-react";
import AddProductModal from "@/components/products/modals/product/create-product-modal";

export default function QuickActionsCard() {
  const router = useRouter();
  const [productOpen, setProductOpen] = useState(false);

  const actions = [
    {
      title: "Add Tech Stack / Item",
      icon: Package,
      actionIcon: Plus,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
      hoverBorder: "hover:border-blue-300",
      hoverBg: "hover:bg-blue-50/40",
      onClick: () => setProductOpen(true),
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
      onClick: () => router.push("/blogs/new"),
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
      onClick: () => router.push("/careers/new"),
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
      onClick: () => router.push("/portfolio/new"),
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
      <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {actions.map((act) => {
          return (
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
          );
        })}
      </div>

      {productOpen && (
        <AddProductModal open={productOpen} onOpenChange={setProductOpen} />
      )}
    </div>
  );
}
