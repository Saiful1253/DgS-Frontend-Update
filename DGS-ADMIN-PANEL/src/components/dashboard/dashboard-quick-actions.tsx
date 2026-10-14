"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PortfolioCategory } from "@/types/portfolio";
import PortfolioFormModal from "@/components/portfolio/modals/item/portfolio-form-modal";

interface DashboardQuickActionsProps {
  categories: PortfolioCategory[];
  newLeadsBadge: string;
}

export default function DashboardQuickActions({
  categories,
  newLeadsBadge,
}: DashboardQuickActionsProps) {
  const router = useRouter();
  const [isAddPortfolioOpen, setIsAddPortfolioOpen] = useState(false);
  const [activeCategories, setActiveCategories] = useState<PortfolioCategory[]>(categories);

  const handlePortfolioCreated = () => {
    setIsAddPortfolioOpen(false);
    // Refresh dashboard stats to reflect new project counter & activities
    router.refresh();
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        {/* Action 1: Create Blog Post */}
        <Button
          asChild
          className="w-full h-11 bg-primary text-white hover:bg-primary-hover active:scale-[0.98] rounded-lg flex items-center justify-between px-4 font-semibold text-sm shadow-xs transition-all"
        >
          <Link href="/blogs">
            <span className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>Create New Blog Post</span>
            </span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>

        {/* Action 2: Add Portfolio Item (Opens Modal Directly Over Dashboard) */}
        {(
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsAddPortfolioOpen(true)}
            className="w-full h-11 border border-primary text-primary bg-transparent hover:bg-sky-mist hover:text-primary-hover active:scale-[0.98] rounded-lg flex items-center justify-between px-4 font-semibold text-sm transition-all cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>Add Portfolio Item</span>
            </span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}

        {/* Action 3: View Contact Leads */}
        <Link
          href="/leads"
          className="w-full h-11 border border-slate-200 rounded-lg flex items-center justify-between px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <span className="flex items-center gap-2.5">
            <Mail className="h-4 w-4 text-slate-500" />
            <span>View New Contact Leads</span>
          </span>
          <span className="px-2 py-0.5 rounded-full bg-sky-mist text-primary text-xs font-semibold border border-primary/20">
            {newLeadsBadge}
          </span>
        </Link>
      </div>

      {/* Add Portfolio Modal Over Dashboard */}
      {(
        <PortfolioFormModal
          open={isAddPortfolioOpen}
          onOpenChange={setIsAddPortfolioOpen}
          categories={activeCategories}
          onCategoriesChange={setActiveCategories}
          project={null}
          onSuccess={handlePortfolioCreated}
        />
      )}
    </>
  );
}
