"use client";

import * as React from "react";
import type { Testimonial, TestimonialsStats, TestimonialQueryParams } from "@/types/testimonial";
import { useRouter, useSearchParams } from "next/navigation";
import { buildTestimonialsPath } from "@/lib/query/testimonial-query";
import { MessageSquare, Star, Clock, Quote } from "lucide-react";
import { toast } from "sonner";
import {
  setTestimonialStatusAction,
  setTestimonialFeaturedAction,
} from "@/actions/testimonial.actions";
import AddTestimonialModal from "./add-testimonial-modal";
import { AppPagination } from "@/components/common/app-pagination";
import { TestimonialCard } from "./testimonial-card";
import { TestimonialsListSkeleton } from "./testimonials-skeleton";
import { TestimonialsFilters } from "./testimonials-filters";
import { cn } from "@/lib/utils";

interface Props {
  testimonials: Testimonial[];
  total: number;
  page: number;
  limit: number;
  activeTab: "all" | "featured" | "pending";
  stats?: TestimonialsStats;
}

export default function TestimonialsClient({
  testimonials,
  total,
  page,
  limit,
  activeTab = "all",
  stats,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Tab State: 'all' | 'featured' | 'pending'
  const isFeaturedParam = searchParams.get("is_featured") === "true";
  const statusParam = searchParams.get("status") || "all";

  const resolvedTab: "all" | "featured" | "pending" = isFeaturedParam
    ? "featured"
    : statusParam === "pending"
    ? "pending"
    : "all";

  const [currentTab, setCurrentTab] = React.useState<"all" | "featured" | "pending">(resolvedTab);

  // Filter Draft States (Matches services-manager.tsx pattern)
  const [searchDraft, setSearchDraft] = React.useState(searchParams.get("search") || "");
  const [statusDraft, setStatusDraft] = React.useState(searchParams.get("status") || "all");
  const [typeDraft, setTypeDraft] = React.useState(searchParams.get("type") || "all");
  const [sortDraft, setSortDraft] = React.useState(searchParams.get("sortBy") || "created_at");
  const [orderDraft, setOrderDraft] = React.useState<"asc" | "desc">(
    searchParams.get("order")?.toLowerCase() === "asc" ? "asc" : "desc"
  );

  const [isPending, startTransition] = React.useTransition();

  // Sync draft states when searchParams change
  React.useEffect(() => {
    setSearchDraft(searchParams.get("search") || "");
    setStatusDraft(searchParams.get("status") || "all");
    setTypeDraft(searchParams.get("type") || "all");
    setSortDraft(searchParams.get("sortBy") || "created_at");
    setOrderDraft(searchParams.get("order")?.toLowerCase() === "asc" ? "asc" : "desc");

    const isFeat = searchParams.get("is_featured") === "true";
    const st = searchParams.get("status");
    if (isFeat) setCurrentTab("featured");
    else if (st === "pending") setCurrentTab("pending");
    else setCurrentTab("all");
  }, [searchParams]);

  const navigateWithFilters = (updates: Record<string, unknown>) => {
    const isFeatTab = (updates.tab ?? currentTab) === "featured";
    const isPendingTab = (updates.tab ?? currentTab) === "pending";

    let targetStatus: string | undefined = updates.status !== undefined ? (updates.status as string) : statusDraft;
    if (isPendingTab) {
      targetStatus = "pending";
    } else if (isFeatTab) {
      targetStatus = undefined;
    } else if (targetStatus === "all") {
      targetStatus = undefined;
    }

    const currentParams: Record<string, unknown> = {
      status: targetStatus,
      type: updates.type !== undefined ? updates.type : typeDraft !== "all" ? typeDraft : undefined,
      search: updates.search !== undefined ? updates.search : searchDraft.trim() || undefined,
      sortBy: updates.sortBy !== undefined ? updates.sortBy : sortDraft !== "created_at" ? sortDraft : undefined,
      order: updates.order !== undefined ? updates.order : orderDraft !== "desc" ? orderDraft : undefined,
      is_featured: isFeatTab ? true : undefined,
      page: updates.page ?? 1,
      limit: updates.limit ?? limit,
      ...updates,
    };
    delete currentParams.tab;

    startTransition(() => {
      router.push(buildTestimonialsPath("/testimonials", currentParams), {
        scroll: false,
      });
    });
  };

  const handleTabChange = (newTab: "all" | "featured" | "pending") => {
    setCurrentTab(newTab);
    if (newTab === "pending") {
      setStatusDraft("pending");
    } else if (newTab === "all" && statusDraft === "pending") {
      setStatusDraft("all");
    }
    navigateWithFilters({
      tab: newTab,
      page: 1,
      status: newTab === "pending" ? "pending" : newTab === "featured" ? undefined : "all",
      is_featured: newTab === "featured" ? true : undefined,
    });
  };

  const handleApplyFilters = () => {
    navigateWithFilters({
      page: 1,
      search: searchDraft.trim() || undefined,
      status: statusDraft,
      type: typeDraft,
      sortBy: sortDraft,
      order: orderDraft,
    });
  };

  const handleClearFilters = () => {
    setSearchDraft("");
    setStatusDraft(currentTab === "pending" ? "pending" : "all");
    setTypeDraft("all");
    setSortDraft("created_at");
    setOrderDraft("desc");

    navigateWithFilters({
      page: 1,
      search: "",
      status: currentTab === "pending" ? "pending" : "all",
      type: "all",
      sortBy: "created_at",
      order: "desc",
      is_featured: currentTab === "featured" ? true : undefined,
    });
  };

  const handleStatusToggle = async (
    id: number,
    newStatus: "approved" | "rejected"
  ) => {
    try {
      const res = await setTestimonialStatusAction(id, newStatus);
      if (!res.success) {
        toast.error(res.message || "Failed to update status");
        return;
      }
      toast.success(
        newStatus === "approved"
          ? "Testimonial approved and published!"
          : "Testimonial marked as rejected and unfeatured"
      );
      router.refresh();
    } catch {
      toast.error("An error occurred while updating status");
    }
  };

  const handleFeaturedToggle = async (id: number, currentVal: boolean) => {
    try {
      const target = testimonials.find((t) => t.id === id);
      if (target?.status === "rejected" && !currentVal) {
        toast.error("Rejected testimonials cannot be featured in marquee.");
        return;
      }
      const newVal = !currentVal;
      const res = await setTestimonialFeaturedAction(id, newVal);
      if (!res.success) {
        toast.error(res.message || "Failed to update featured status");
        return;
      }
      toast.success(
        newVal
          ? "Testimonial added to homepage marquee showcase"
          : "Testimonial removed from marquee"
      );
      router.refresh();
    } catch {
      toast.error("An error occurred while updating featured status");
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasActiveFilters =
    Boolean(searchDraft) ||
    (currentTab !== "pending" && statusDraft !== "all") ||
    typeDraft !== "all" ||
    sortDraft !== "created_at" ||
    orderDraft !== "desc";

  const tabsConfig = [
    {
      key: "all" as const,
      label: "All Testimonials",
      icon: MessageSquare,
      count: stats?.total ?? total,
    },
    {
      key: "featured" as const,
      label: "Featured in Marquee",
      icon: Star,
      count: stats?.featured ?? 0,
    },
    {
      key: "pending" as const,
      label: "Pending Moderation",
      icon: Clock,
      count: stats?.pending ?? 0,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Exact DGS Unified Tab Bar Design */}
      <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-200 p-1.5 shadow-xs w-full overflow-x-auto min-w-0 max-w-full">
        {tabsConfig.map((tab) => {
          const Icon = tab.icon;
          const active = currentTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all shrink-0 whitespace-nowrap cursor-pointer",
                active
                  ? "bg-primary text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span
                className={cn(
                  "ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                  active
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 text-slate-700"
                )}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search, Sort, and Filter Row (100% Matching services-manager.tsx) */}
      <TestimonialsFilters
        searchDraft={searchDraft}
        onSearchDraftChange={setSearchDraft}
        statusDraft={statusDraft}
        onStatusDraftChange={setStatusDraft}
        typeDraft={typeDraft}
        onTypeDraftChange={setTypeDraft}
        sortDraft={sortDraft}
        onSortDraftChange={setSortDraft}
        orderDraft={orderDraft}
        onOrderDraftToggle={() => setOrderDraft(orderDraft === "asc" ? "desc" : "asc")}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
        isFilterPending={isPending}
      />

      {/* Content Feed */}
      {isPending ? (
        <TestimonialsListSkeleton />
      ) : testimonials.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Showing {testimonials.length} of {total} records
            </span>
          </div>

          <div className="space-y-3">
            {testimonials.map((item) => (
              <TestimonialCard
                key={item.id}
                testimonial={item}
                activeTab={currentTab === "featured" ? "featured" : "all"}
                onStatusToggle={handleStatusToggle}
                onFeaturedToggle={handleFeaturedToggle}
                onRefresh={() => router.refresh()}
              />
            ))}
          </div>

          {/* DGS Standard AppPagination */}
          {total > 0 && (
            <AppPagination
              page={page}
              totalPages={totalPages}
              total={total}
              itemLabel="testimonials"
              pageSize={limit}
              onPageSizeChange={(size) =>
                navigateWithFilters({ limit: size, page: 1 })
              }
              pageSizeOptions={[10, 20, 50, 100]}
              appliedPath={(p) =>
                buildTestimonialsPath("/testimonials", {
                  page: p,
                  limit,
                  search: searchDraft.trim() || undefined,
                  status: currentTab === "pending" ? "pending" : statusDraft !== "all" ? statusDraft : undefined,
                  type: typeDraft !== "all" ? typeDraft : undefined,
                  sortBy: sortDraft !== "created_at" ? sortDraft : undefined,
                  order: orderDraft !== "desc" ? orderDraft : undefined,
                  is_featured: currentTab === "featured" ? true : undefined,
                })
              }
              onPageChange={(p) => navigateWithFilters({ page: p })}
            />
          )}
        </div>
      ) : (
        <div className="p-16 text-center bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 text-primary flex items-center justify-center mx-auto border border-primary/20">
            <Quote className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              No testimonials match your criteria
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {hasActiveFilters
                ? "Try adjusting your search keywords, status filter, format type, or sorting options."
                : "No client testimonials found in this category. Click 'Add Testimonial' to create one."}
            </p>
          </div>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Clear Active Filters
            </button>
          ) : (
            <AddTestimonialModal
              onAdded={() => router.refresh()}
            />
          )}
        </div>
      )}
    </div>
  );
}
