/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Service, PaginatedServices } from "@/types/service";
import { ServiceQueryParams, ServiceSortBy, buildServicePath } from "@/lib/query/service-query";
import { toCategoryOptions, type CategoryOptionSource } from "@/lib/service-categories";
import type { ServiceStats } from "@/types/service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppPagination } from "@/components/common/app-pagination";
import { listServices } from "@/services/service/service.service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Layers,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Tag,
  X,
  Sparkles,
  FolderKanban,
} from "lucide-react";
import ServiceCard from "./service-card";
import CreateServiceModal from "./modals/service/create-service-modal";
import ServiceCategoryModal from "./modals/service/service-category-modal";

interface Props {
  initialServices: PaginatedServices;
  categories?: CategoryOptionSource[];
  initialStats: ServiceStats;
  query: ServiceQueryParams;
  filtersActive: boolean;
  pageSizeOptions: number[];
}

export default function ServicesManager({
  initialServices,
  categories,
  initialStats,
  query,
  pageSizeOptions,
}: Props) {
  const router = useRouter();

  const [servicesList, setServicesList] = useState<Service[]>(initialServices.data || []);
  const [totalCount, setTotalCount] = useState<number>(initialServices.total ?? 0);
  const [totalPagesCount, setTotalPagesCount] = useState<number>(initialServices.totalPages ?? 1);

  // Category Directory State
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [localCategories, setLocalCategories] = useState<CategoryOptionSource[]>(categories || []);

  useEffect(() => {
    if (categories) {
      setLocalCategories(categories);
    }
  }, [categories]);

  useEffect(() => {
    setServicesList(initialServices.data || []);
    setTotalCount(initialServices.total ?? 0);
    setTotalPagesCount(initialServices.totalPages ?? 1);
  }, [initialServices]);

  const handleServiceDeleted = async (deletedId: number) => {
    // 1. Optimistically remove from local state
    setServicesList((prev) => prev.filter((s) => s.id !== deletedId));
    setTotalCount((prev) => Math.max(0, prev - 1));

    // 2. Fetch fresh page data from backend so next item auto-fills the slot
    try {
      const res = await listServices(query);
      if (res.success && res.data) {
        const paginated = res.data as PaginatedServices;
        if ((!paginated.data || paginated.data.length === 0) && (query.page ?? 1) > 1) {
          router.push(buildServicePath((query.page ?? 1) - 1, query));
          return;
        }
        setServicesList(paginated.data || []);
        setTotalCount(paginated.total ?? 0);
        setTotalPagesCount(paginated.totalPages ?? 1);
      }
    } catch {
      // fallback
    }
    router.refresh();
  };

  const featuredCount = useMemo(
    () => servicesList.filter((s) => s.is_flagship && !s.is_deleted).length,
    [servicesList]
  );

  const handleFlagshipSwitched = (featuredId: number) => {
    setServicesList((prev) =>
      prev.map((item) => ({
        ...item,
        is_flagship: item.id === featuredId,
        is_active: item.id === featuredId ? true : item.is_active,
      }))
    );
    router.refresh();
  };

  const handleServiceUpdated = (updated: Service) => {
    setServicesList((prev) =>
      prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item))
    );
    router.refresh();
  };

  // Search & Filter Draft States
  const [searchDraft, setSearchDraft] = useState(query.search ?? "");
  const [categoryDraft, setCategoryDraft] = useState<string>(query.category ?? "all");
  const [statusDraft, setStatusDraft] = useState<"all" | "active" | "inactive">(query.status || "all");
  const [sortDraft, setSortDraft] = useState<ServiceSortBy>(query.sortBy ?? "created_at");
  const [orderDraft, setOrderDraft] = useState<"asc" | "desc">(query.sortOrder ?? "desc");

  // Applied Filters State
  const [appliedFilters, setAppliedFilters] = useState({
    search: query.search ?? "",
    category: query.category ?? "all",
    status: query.status || "all",
    sortBy: query.sortBy ?? "created_at",
    sortOrder: query.sortOrder ?? "desc",
  });

  const [addServiceOpen, setAddServiceOpen] = useState(false);

  // Filter pending check
  const isFilterPending =
    searchDraft.trim() !== appliedFilters.search ||
    categoryDraft !== appliedFilters.category ||
    statusDraft !== appliedFilters.status ||
    sortDraft !== appliedFilters.sortBy ||
    orderDraft !== appliedFilters.sortOrder;

  const hasActiveFilters = Boolean(
    appliedFilters.search ||
    appliedFilters.category !== "all" ||
    appliedFilters.status !== "all" ||
    appliedFilters.sortBy !== "created_at" ||
    appliedFilters.sortOrder !== "desc"
  );

  const handleApplyFilters = () => {
    setAppliedFilters({
      search: searchDraft.trim(),
      category: categoryDraft,
      status: statusDraft,
      sortBy: sortDraft,
      sortOrder: orderDraft,
    });

    const sp = new URLSearchParams();
    if (searchDraft.trim()) sp.set("search", searchDraft.trim());
    if (categoryDraft !== "all") sp.set("category", categoryDraft);
    if (statusDraft !== "all") sp.set("status", statusDraft);
    if (sortDraft !== "created_at") sp.set("sortBy", sortDraft);
    if (orderDraft !== "desc") sp.set("sortOrder", orderDraft);

    const qs = sp.toString();
    router.replace(qs ? `/services?${qs}` : "/services", { scroll: false });
  };

  const handleClearFilters = () => {
    setSearchDraft("");
    setCategoryDraft("all");
    setStatusDraft("all");
    setSortDraft("created_at");
    setOrderDraft("desc");
    setAppliedFilters({
      search: "",
      category: "all",
      status: "all",
      sortBy: "created_at",
      sortOrder: "desc",
    });
    router.replace("/services", { scroll: false });
  };

  // Filter services dynamically by active category & applied filters
  const filteredServices = useMemo(() => {
    return servicesList.filter((s) => {
      // Category filter
      if (appliedFilters.category !== "all" && s.category !== appliedFilters.category) return false;

      // Status filter
      if (appliedFilters.status === "active" && !s.is_active) return false;
      if (appliedFilters.status === "inactive" && s.is_active) return false;

      // Search filter
      if (appliedFilters.search) {
        const q = appliedFilters.search.toLowerCase();
        const matchesName = (s.name || "").toLowerCase().includes(q);
        const matchesDesc = (s.description || "").toLowerCase().includes(q);
        const matchesSlug = (s.slug || "").toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesSlug) return false;
      }

      return true;
    });
  }, [servicesList, appliedFilters]);

  // Sort services according to sort draft / applied sort
  const sortedServices = useMemo(() => {
    const list = [...filteredServices];
    const key = appliedFilters.sortBy;
    const isAsc = appliedFilters.sortOrder === "asc";

    return list.sort((a, b) => {
      let comp = 0;
      if (key === "name") {
        comp = (a.name || "").localeCompare(b.name || "");
      } else if (key === "category") {
        comp = (a.category || "").localeCompare(b.category || "");
      } else {
        comp = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      }
      return isAsc ? comp : -comp;
    });
  }, [filteredServices, appliedFilters.sortBy, appliedFilters.sortOrder]);

  const categoryOptions = toCategoryOptions(localCategories);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap text-[10px] sm:text-xs font-bold tracking-wider text-[#00668a] uppercase mb-1">
            <span>ADMIN CMS</span>
            <span>•</span>
            <span className="truncate">MODULE 6: SERVICES MANAGER</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight break-words">
            Services Taxonomy & Category Manager
          </h1>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => setCategoryModalOpen(true)}
            className="h-10 px-3.5 rounded-lg text-xs font-semibold text-slate-700 border-slate-200 hover:border-[#00668a]/40 hover:text-[#00668a] gap-1.5 shadow-2xs shrink-0 whitespace-nowrap"
            title="Manage service categories"
          >
            <FolderKanban className="w-3.5 h-3.5 text-[#00668a]" />
            <span>Manage Categories</span>
          </Button>
          <Button
            onClick={() => setAddServiceOpen(true)}
            className="h-10 px-4 w-full sm:w-auto bg-[#00668a] hover:bg-[#004c69] text-white text-xs font-bold gap-1.5 shadow-xs transition-all flex items-center justify-center rounded-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Add Service</span>
          </Button>
        </div>
      </div>

      {/* 3. Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Services</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{initialStats.total}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e6eff6] text-[#00668a]">
            <Layers className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Services</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">{initialStats.active}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Inactive Services</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1">{initialStats.inactive}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <XCircle className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Flagship Specials</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#f95700] mt-1">
              {servicesList.filter((s) => s.is_flagship).length}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-[#f95700]">
            <Sparkles className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* 5. Filter & Search Controls (Matching Blog Manager Design) */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-end gap-3 flex-wrap">
          {/* Category Filter */}
          <div className="w-full sm:w-60 shrink-0 space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center h-4">
              Category Filter :
            </label>
            <div className="relative">
              <select
                value={categoryDraft}
                onChange={(e) => {
                  setCategoryDraft(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleApplyFilters();
                  }
                }}
                className="w-full h-10 pl-3 pr-8 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 shadow-2xs appearance-none focus:outline-hidden focus:ring-2 focus:ring-[#00668a]/20 focus:border-[#00668a] transition-all cursor-pointer truncate"
              >
                <option value="all">All Categories</option>
                {categoryOptions.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </div>
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-36 shrink-0 space-y-1.5">
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
          <div className="w-full sm:w-48 shrink-0 space-y-1.5">
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
                  <option value="name">Service Name</option>
                  <option value="category">Category</option>
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
              <span>Search Services :</span>
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
                placeholder="Search by name, description, slug..."
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
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCategoryModalOpen(true)}
                className="h-10 px-3.5 rounded-lg text-xs font-semibold text-slate-700 border-slate-200 hover:border-[#00668a]/40 hover:text-[#00668a] gap-1.5 shadow-2xs shrink-0 whitespace-nowrap"
                title="Manage dynamic service categories"
              >
                <FolderKanban className="w-3.5 h-3.5 text-[#00668a]" />
                <span>Categories</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Service Cards Grid */}
      {sortedServices.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Layers className="h-6 w-6" />
          </div>
          <h3 className="mt-4 font-bold text-slate-900">
            {hasActiveFilters ? "No services match search criteria" : "No services created yet"}
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            {hasActiveFilters
              ? "Try adjusting your search query or category filter to view items."
              : "Get started by creating your first service card."}
          </p>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={handleClearFilters} className="mt-4">
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
          {sortedServices.map((s) => (
            <ServiceCard
              key={s.id}
              service={s}
              categories={localCategories}
              featuredCount={featuredCount}
              onFlagshipSwitched={handleFlagshipSwitched}
              onServiceUpdated={handleServiceUpdated}
              onOpenManageCategories={() => setCategoryModalOpen(true)}
              onCategoriesUpdated={(cats) => {
                setLocalCategories(cats);
                router.refresh();
              }}
              onDeleted={handleServiceDeleted}
            />
          ))}
        </div>
      )}

      {/* 7. Pagination Bar */}
      {totalCount > 0 && (
        <AppPagination
          page={query.page || 1}
          totalPages={totalPagesCount}
          total={totalCount}
          itemLabel="services"
          appliedPath={(p) => buildServicePath(p, query)}
          pageSize={query.limit || 21}
          onPageSizeChange={(size) => router.push(buildServicePath(1, { ...query, limit: size }))}
          pageSizeOptions={pageSizeOptions}
        />
      )}

      {/* Modals */}
      {(
        <>
          <CreateServiceModal
            open={addServiceOpen}
            onOpenChange={setAddServiceOpen}
            categories={localCategories}
            defaultCategory={categoryDraft !== "all" ? categoryDraft : categoryOptions[0]?.value}
            onOpenManageCategories={() => setCategoryModalOpen(true)}
            onCategoriesUpdated={(cats) => {
              setLocalCategories(cats);
              router.refresh();
            }}
          />
          <ServiceCategoryModal
            open={categoryModalOpen}
            onOpenChange={setCategoryModalOpen}
            categories={localCategories as any}
            onCategoriesChange={(cats) => {
              setLocalCategories(cats as any);
              router.refresh();
            }}
          />
        </>
      )}
    </div>
  );
}
