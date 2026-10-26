/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import type {
  WhyChooseUs,
  PaginatedWhyChooseUs,
  WhyChooseUsStats,
  WhyChooseUsMetrics,
} from "@/types/why-choose-us";
import {
  WhyChooseUsQueryParams,
  WhyChooseUsSortBy,
  buildWhyChooseUsPath,
} from "@/lib/query/why-choose-us-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppPagination } from "@/components/common/app-pagination";
import {
  listWhyChooseUs,
  DEFAULT_WHY_CHOOSE_US_METRICS,
} from "@/services/why-choose-us/why-choose-us.service";
import { cn } from "@/lib/utils";
import {
  Layers,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Sparkles,
  X,
  HelpCircle,
} from "lucide-react";
import WhyChooseUsCard from "./why-choose-us-card";
import CreateWhyChooseUsModal from "./modals/create-why-choose-us-modal";
import EditWhyChooseUsModal from "./modals/edit-why-choose-us-modal";
import DeleteWhyChooseUsDialog from "./modals/delete-why-choose-us-dialog";
import WhyChooseUsMetricsBanner from "./why-choose-us-metrics-banner";
import EditWhyChooseUsMetricsModal from "./modals/edit-why-choose-us-metrics-modal";

interface Props {
  initialItems: PaginatedWhyChooseUs;
  initialStats: WhyChooseUsStats;
  initialMetrics?: WhyChooseUsMetrics;
  query: WhyChooseUsQueryParams;
  filtersActive: boolean;
  pageSizeOptions: number[];
}

export default function WhyChooseUsManager({
  initialItems,
  initialStats,
  initialMetrics,
  query,
  pageSizeOptions,
}: Props) {
  const router = useRouter();

  const [itemsList, setItemsList] = useState<WhyChooseUs[]>(initialItems.data || []);
  const [totalCount, setTotalCount] = useState<number>(initialItems.total ?? 0);
  const [totalPagesCount, setTotalPagesCount] = useState<number>(initialItems.totalPages ?? 1);
  const [stats, setStats] = useState<WhyChooseUsStats>(initialStats);
  const [metrics, setMetrics] = useState<WhyChooseUsMetrics>(
    initialMetrics || DEFAULT_WHY_CHOOSE_US_METRICS
  );

  // Search & Filter Draft States (exact mechanism as services-manager)
  const [searchDraft, setSearchDraft] = useState(query.search ?? "");
  const [statusDraft, setStatusDraft] = useState<"all" | "active" | "inactive">(query.status || "all");
  const [sortDraft, setSortDraft] = useState<WhyChooseUsSortBy>(query.sortBy ?? "created_at");
  const [orderDraft, setOrderDraft] = useState<"asc" | "desc">(query.sortOrder ?? "desc");

  // Applied Filters State
  const [appliedFilters, setAppliedFilters] = useState({
    search: query.search ?? "",
    status: query.status || "all",
    sortBy: query.sortBy ?? "created_at",
    sortOrder: query.sortOrder ?? "desc",
  });

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WhyChooseUs | null>(null);
  const [deletingItem, setDeletingItem] = useState<WhyChooseUs | null>(null);
  const [metricsModalOpen, setMetricsModalOpen] = useState(false);

  useEffect(() => {
    setItemsList(initialItems.data || []);
    setTotalCount(initialItems.total ?? 0);
    setTotalPagesCount(initialItems.totalPages ?? 1);
  }, [initialItems]);

  useEffect(() => {
    setStats(initialStats);
  }, [initialStats]);

  useEffect(() => {
    if (initialMetrics) {
      setMetrics(initialMetrics);
    }
  }, [initialMetrics]);

  useEffect(() => {
    setSearchDraft(query.search ?? "");
    setStatusDraft(query.status || "all");
    setSortDraft(query.sortBy ?? "created_at");
    setOrderDraft(query.sortOrder ?? "desc");
    setAppliedFilters({
      search: query.search ?? "",
      status: query.status || "all",
      sortBy: query.sortBy ?? "created_at",
      sortOrder: query.sortOrder ?? "desc",
    });
  }, [query]);

  // Dynamic active count
  const activeCount = useMemo(
    () => stats.active ?? itemsList.filter((i) => i.is_active && !i.is_deleted).length,
    [stats.active, itemsList]
  );

  const refreshData = async () => {
    try {
      const res = await listWhyChooseUs(query);
      if (res.success && res.data) {
        const paginated = res.data as PaginatedWhyChooseUs;
        setItemsList(paginated.data || []);
        setTotalCount(paginated.total ?? 0);
        setTotalPagesCount(paginated.totalPages ?? 1);
      }
    } catch {
      // fallback to router refresh
    }
    router.refresh();
  };

  const handleStatusChanged = (id: number, newStatus: boolean) => {
    setItemsList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, is_active: newStatus } : item))
    );
    setStats((prev) => ({
      ...prev,
      active: newStatus ? prev.active + 1 : Math.max(0, prev.active - 1),
      inactive: newStatus ? Math.max(0, prev.inactive - 1) : prev.inactive + 1,
    }));
    router.refresh();
  };

  const handleItemDeleted = async (deletedId: number) => {
    setItemsList((prev) => prev.filter((item) => item.id !== deletedId));
    setTotalCount((prev) => Math.max(0, prev - 1));
    setStats((prev) => ({
      ...prev,
      total: Math.max(0, prev.total - 1),
    }));

    try {
      const res = await listWhyChooseUs(query);
      if (res.success && res.data) {
        const paginated = res.data as PaginatedWhyChooseUs;
        if ((!paginated.data || paginated.data.length === 0) && (query.page ?? 1) > 1) {
          router.push(buildWhyChooseUsPath((query.page ?? 1) - 1, query));
          return;
        }
        setItemsList(paginated.data || []);
        setTotalCount(paginated.total ?? 0);
        setTotalPagesCount(paginated.totalPages ?? 1);
      }
    } catch {
      // fallback
    }
    router.refresh();
  };

  // Filter pending check
  const isFilterPending =
    searchDraft.trim() !== appliedFilters.search ||
    statusDraft !== appliedFilters.status ||
    sortDraft !== appliedFilters.sortBy ||
    orderDraft !== appliedFilters.sortOrder;

  const hasActiveFilters = Boolean(
    appliedFilters.search ||
    appliedFilters.status !== "all" ||
    appliedFilters.sortBy !== "created_at" ||
    appliedFilters.sortOrder !== "desc"
  );

  const handleApplyFilters = () => {
    setAppliedFilters({
      search: searchDraft.trim(),
      status: statusDraft,
      sortBy: sortDraft,
      sortOrder: orderDraft,
    });

    const sp = new URLSearchParams();
    if (searchDraft.trim()) sp.set("search", searchDraft.trim());
    if (statusDraft !== "all") sp.set("status", statusDraft);
    if (sortDraft !== "created_at") sp.set("sortBy", sortDraft);
    if (orderDraft !== "desc") sp.set("sortOrder", orderDraft);

    const qs = sp.toString();
    router.replace(qs ? `/services/why-coose-us?${qs}` : "/services/why-coose-us", { scroll: false });
  };

  const handleClearFilters = () => {
    setSearchDraft("");
    setStatusDraft("all");
    setSortDraft("created_at");
    setOrderDraft("desc");
    setAppliedFilters({
      search: "",
      status: "all",
      sortBy: "created_at",
      sortOrder: "desc",
    });
    router.replace("/services/why-coose-us", { scroll: false });
  };

  // Filter items dynamically by applied filters
  const filteredItems = useMemo(() => {
    return itemsList.filter((item) => {
      // Status filter
      if (appliedFilters.status === "active" && !item.is_active) return false;
      if (appliedFilters.status === "inactive" && item.is_active) return false;

      // Search filter
      if (appliedFilters.search) {
        const q = appliedFilters.search.toLowerCase();
        const matchesTitle = (item.title || "").toLowerCase().includes(q);
        const matchesDesc = (item.description || "").toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc) return false;
      }

      return true;
    });
  }, [itemsList, appliedFilters]);

  // Sort items according to applied sort
  const sortedItems = useMemo(() => {
    const list = [...filteredItems];
    const key = appliedFilters.sortBy;
    const isAsc = appliedFilters.sortOrder === "asc";

    return list.sort((a, b) => {
      let comp = 0;
      if (key === "title") {
        comp = (a.title || "").localeCompare(b.title || "");
      } else if (key === "display_order") {
        comp = (a.display_order ?? 0) - (b.display_order ?? 0);
      } else {
        comp = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      }
      return isAsc ? comp : -comp;
    });
  }, [filteredItems, appliedFilters.sortBy, appliedFilters.sortOrder]);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Banner (Matching Services Manager Design) */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap text-[10px] sm:text-xs font-bold tracking-wider text-[#00668a] uppercase mb-1">
            <span>ADMIN CMS</span>
            <span>•</span>
            <span className="truncate">MODULE 6: SERVICES MANAGER</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight break-words">
            Why Choose Us Manager
          </h1>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="h-10 px-4 w-full sm:w-auto bg-[#00668a] hover:bg-[#004c69] text-white text-xs font-bold gap-1.5 shadow-xs transition-all flex items-center justify-center rounded-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Add Proposition</span>
          </Button>
        </div>
      </div>

      {/* Live Achievements Statistics Strip Banner */}
      <WhyChooseUsMetricsBanner
        metrics={metrics}
        onEdit={() => setMetricsModalOpen(true)}
      />

      {/* 2. Stat Cards (Exact 4-Card Layout & Aesthetic from Services Manager) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Propositions</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{stats.total}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e6eff6] text-[#00668a]">
            <Layers className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Propositions</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">{stats.active}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Inactive Propositions</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1">{stats.inactive}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <XCircle className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Live Capacity</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#f95700] mt-1">
              {activeCount} <span className="text-sm font-semibold text-slate-400">/ 3 Max</span>
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-[#f95700]">
            <Sparkles className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* 3. Filter & Search Controls (Exact Layout & Mechanism from Screenshot) */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-end gap-3 flex-wrap">
          {/* Status Filter */}
          <div className="w-full sm:w-44 shrink-0 space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center h-4">
              Status Filter :
            </label>
            <div className="relative">
              <select
                value={statusDraft}
                onChange={(e) => setStatusDraft(e.target.value as any)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleApplyFilters();
                  }
                }}
                className="w-full h-10 pl-3 pr-8 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 shadow-2xs appearance-none focus:outline-hidden focus:ring-2 focus:ring-[#00668a]/20 focus:border-[#00668a] transition-all cursor-pointer truncate"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </div>
          </div>

          {/* Sort By Filter */}
          <div className="w-full sm:w-56 shrink-0 space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center h-4">
              Sort By :
            </label>
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <select
                  value={sortDraft}
                  onChange={(e) => setSortDraft(e.target.value as any)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleApplyFilters();
                    }
                  }}
                  className="w-full h-10 pl-3 pr-8 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 shadow-2xs appearance-none focus:outline-hidden focus:ring-2 focus:ring-[#00668a]/20 focus:border-[#00668a] transition-all cursor-pointer truncate"
                >
                  <option value="created_at">Creation Date</option>
                  <option value="title">Title (A-Z)</option>
                  <option value="display_order">Display Order</option>
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOrderDraft(orderDraft === "asc" ? "desc" : "asc")}
                className="h-10 px-2.5 border-slate-200 text-xs font-bold text-slate-700 font-mono shadow-2xs bg-white"
                title="Toggle sort order"
              >
                {orderDraft.toUpperCase()}
              </Button>
            </div>
          </div>

          {/* Search Input */}
          <div className="flex-1 min-w-[220px] space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 h-4">
              <Search className="w-3.5 h-3.5 text-[#00668a]" />
              <span>Search Propositions :</span>
            </label>
            <div className="relative">
              <Input
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleApplyFilters();
                  }
                }}
                placeholder="Search by title, description..."
                className="h-10 text-xs font-semibold pl-3.5 pr-8 border-slate-200 w-full bg-white shadow-2xs"
              />
              {searchDraft && (
                <button
                  type="button"
                  onClick={() => setSearchDraft("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                  title="Clear search input"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full lg:w-auto flex items-center gap-2 shrink-0">
            <div className="hidden lg:block h-4" />
            <div className="flex items-center gap-2 w-full">
              <Button
                type="button"
                onClick={handleApplyFilters}
                className={cn(
                  "h-10 px-4 bg-[#00668a] text-[#fff] hover:bg-[#004c69] text-xs font-bold gap-1.5 shadow-xs transition-all w-full lg:w-auto justify-center flex-1 lg:flex-initial",
                  isFilterPending && "ring-2 ring-[#00668a]/40 ring-offset-1"
                )}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search</span>
              </Button>
              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClearFilters}
                  className="h-10 px-3 text-xs font-semibold bg-slate-100 hover:bg-slate-200 border-transparent text-slate-700 gap-1 transition-colors shrink-0 whitespace-nowrap"
                  title="Reset all filters"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Cards Grid */}
      {sortedItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-full bg-sky-50 text-[#00668a] flex items-center justify-center mx-auto">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">No value propositions found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {hasActiveFilters
                ? "No items match your active search filters. Try clearing filters to see all."
                : "Create your first 'Why Choose Digital Gas Service' reason."}
            </p>
          </div>
          {hasActiveFilters ? (
            <Button variant="outline" size="sm" onClick={handleClearFilters} className="text-xs">
              Clear Filters
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => setCreateModalOpen(true)}
              className="bg-[#00668a] hover:bg-[#004c69] text-white text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Proposition
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sortedItems.map((item) => (
            <WhyChooseUsCard
              key={item.id}
              item={item}
              activeCount={activeCount}
              requiredActiveCount={stats.requiredActiveCount || 3}
              onEdit={(target) => setEditingItem(target)}
              onDelete={(target) => setDeletingItem(target)}
              onStatusChanged={handleStatusChanged}
            />
          ))}
        </div>
      )}

      {/* 5. Pagination Bar */}
      {totalCount > 0 && (
        <div className="pt-2">
          <AppPagination
            page={query.page || 1}
            totalPages={totalPagesCount}
            total={totalCount}
            itemLabel="propositions"
            appliedPath={(p) => buildWhyChooseUsPath(p, query)}
            pageSize={query.limit || 20}
            onPageSizeChange={(size) => router.push(buildWhyChooseUsPath(1, { ...query, limit: size }))}
            pageSizeOptions={pageSizeOptions}
          />
        </div>
      )}

      {/* 6. Modals */}
      <CreateWhyChooseUsModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={refreshData}
        activeCount={activeCount}
        requiredActiveCount={stats.requiredActiveCount || 3}
      />

      <EditWhyChooseUsModal
        open={Boolean(editingItem)}
        onOpenChange={(open) => !open && setEditingItem(null)}
        item={editingItem}
        onSuccess={refreshData}
        activeCount={activeCount}
        requiredActiveCount={stats.requiredActiveCount || 3}
      />

      <DeleteWhyChooseUsDialog
        open={Boolean(deletingItem)}
        onOpenChange={(open) => !open && setDeletingItem(null)}
        item={deletingItem}
        onSuccess={handleItemDeleted}
        activeCount={activeCount}
        requiredActiveCount={stats.requiredActiveCount || 3}
      />

      <EditWhyChooseUsMetricsModal
        open={metricsModalOpen}
        onOpenChange={setMetricsModalOpen}
        metrics={metrics}
        onSaved={(updated) => setMetrics(updated)}
      />
    </div>
  );
}
