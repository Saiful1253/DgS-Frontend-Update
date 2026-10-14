/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Service, ServiceGroup, PaginatedServices } from "@/types/service";
import { ServiceQueryParams, ServiceSortBy, buildServicePath } from "@/lib/query/service-query";
import { toPillarOptions, type PillarOptionSource } from "@/lib/service-pillars";
import { assignSlotOrders, toReorderPayload } from "@/lib/service-order";
import type { ServiceStats } from "@/types/service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppPagination } from "@/components/common/app-pagination";
import SortableGrid from "@/components/common/sortable-grid";
import { listServices, reorderServices } from "@/services/service/service.service";
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
} from "lucide-react";
import ServiceCard from "./service-card";
import CreateServiceModal from "./modals/service/create-service-modal";
import EditGroupModal from "./modals/group/edit-group-modal";
import DeleteGroupDialog from "./modals/group/delete-group-dialog";

interface Props {
  initialServices: PaginatedServices;
  initialGroups: ServiceGroup[];
  pillars: PillarOptionSource[];
  initialStats: ServiceStats;
  query: ServiceQueryParams;
  filtersActive: boolean;
  pageSizeOptions: number[];
  canManage: boolean;
}

export default function ServicesManager({
  initialServices,
  initialGroups,
  pillars,
  initialStats,
  query,
  pageSizeOptions,
  canManage,
}: Props) {
  const router = useRouter();

  // Local Services State for optimistic drag-and-drop & ordering updates
  const [servicesList, setServicesList] = useState<Service[]>(initialServices.data || []);
  const [totalCount, setTotalCount] = useState<number>(initialServices.total ?? 0);
  const [totalPagesCount, setTotalPagesCount] = useState<number>(initialServices.totalPages ?? 1);
  const [reordering, setReordering] = useState(false);

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

  // Search & Filter Draft States
  const [searchDraft, setSearchDraft] = useState(query.search ?? "");
  const [pillarDraft, setPillarDraft] = useState<string>(query.pillar ?? "all");
  const [groupDraft, setGroupDraft] = useState<string>(query.group_id ? String(query.group_id) : "all");
  const [statusDraft, setStatusDraft] = useState<"all" | "active" | "inactive">(query.status || "all");
  const [sortDraft, setSortDraft] = useState<ServiceSortBy>(query.sortBy ?? "display_order");
  const [orderDraft, setOrderDraft] = useState<"asc" | "desc">(query.sortOrder ?? "asc");

  // Applied Filters State (matching Blog & Portfolio Manager pattern)
  const [appliedFilters, setAppliedFilters] = useState({
    search: query.search ?? "",
    pillar: query.pillar ?? "all",
    group: query.group_id ? String(query.group_id) : "all",
    status: query.status || "all",
    sortBy: query.sortBy ?? "display_order",
    sortOrder: query.sortOrder ?? "asc",
  });

  const [addServiceOpen, setAddServiceOpen] = useState(false);
  const [editGroupOpen, setEditGroupOpen] = useState(false);
  const [deleteGroupOpen, setDeleteGroupOpen] = useState(false);
  const [selectedGroup] = useState<ServiceGroup | null>(null);

  // Filter pending check
  const isFilterPending =
    searchDraft.trim() !== appliedFilters.search ||
    pillarDraft !== appliedFilters.pillar ||
    groupDraft !== appliedFilters.group ||
    statusDraft !== appliedFilters.status ||
    sortDraft !== appliedFilters.sortBy ||
    orderDraft !== appliedFilters.sortOrder;

  const hasActiveFilters = Boolean(
    appliedFilters.search ||
    appliedFilters.pillar !== "all" ||
    appliedFilters.group !== "all" ||
    appliedFilters.status !== "all" ||
    appliedFilters.sortBy !== "display_order" ||
    appliedFilters.sortOrder !== "asc"
  );

  const handleApplyFilters = () => {
    setAppliedFilters({
      search: searchDraft.trim(),
      pillar: pillarDraft,
      group: groupDraft,
      status: statusDraft,
      sortBy: sortDraft,
      sortOrder: orderDraft,
    });

    const sp = new URLSearchParams();
    if (searchDraft.trim()) sp.set("search", searchDraft.trim());
    if (pillarDraft !== "all") sp.set("pillar", pillarDraft);
    if (groupDraft !== "all") sp.set("group_id", groupDraft);
    if (statusDraft !== "all") sp.set("status", statusDraft);
    if (sortDraft !== "display_order") sp.set("sortBy", sortDraft);
    if (orderDraft !== "asc") sp.set("sortOrder", orderDraft);

    const qs = sp.toString();
    router.replace(qs ? `/services?${qs}` : "/services", { scroll: false });
  };

  const handleClearFilters = () => {
    setSearchDraft("");
    setPillarDraft("all");
    setGroupDraft("all");
    setStatusDraft("all");
    setSortDraft("display_order");
    setOrderDraft("asc");
    setAppliedFilters({
      search: "",
      pillar: "all",
      group: "all",
      status: "all",
      sortBy: "display_order",
      sortOrder: "asc",
    });
    router.replace("/services", { scroll: false });
  };

  // Filter services dynamically by active tab & applied filters
  const filteredServices = useMemo(() => {
    return servicesList.filter((s) => {
      // Pillar filter
      if (appliedFilters.pillar !== "all" && s.pillar !== appliedFilters.pillar) return false;

      // Group dropdown filter
      if (appliedFilters.group !== "all") {
        if (appliedFilters.group === "ungrouped") {
          if (s.group_id != null) return false;
        } else if (String(s.group_id) !== appliedFilters.group) {
          return false;
        }
      }

      // Status filter
      if (appliedFilters.status === "active" && !s.is_active) return false;
      if (appliedFilters.status === "inactive" && s.is_active) return false;

      // Search filter
      if (appliedFilters.search) {
        const q = appliedFilters.search.toLowerCase();
        const matchesName = (s.name || "").toLowerCase().includes(q);
        const matchesDesc = (s.description || "").toLowerCase().includes(q);
        const matchesSlug = (s.slug || "").toLowerCase().includes(q);
        const matchesGroup = (s.group?.name || "").toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesSlug && !matchesGroup) return false;
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
      if (key === "display_order") {
        comp = (a.display_order ?? 0) - (b.display_order ?? 0);
      } else if (key === "name") {
        comp = (a.name || "").localeCompare(b.name || "");
      } else if (key === "pillar") {
        comp = (a.pillar || "").localeCompare(b.pillar || "");
      } else if (key === "created_at") {
        comp = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      }
      return isAsc ? comp : -comp;
    });
  }, [filteredServices, appliedFilters.sortBy, appliedFilters.sortOrder]);

  const groups = initialGroups;
  const pillarOptions = toPillarOptions(pillars);

  // Filter groups dropdown based on selected pillar filter
  const availableGroups = useMemo(() => {
    if (appliedFilters.pillar === "all") return groups;
    return groups.filter((g) => g.pillar === appliedFilters.pillar);
  }, [groups, appliedFilters.pillar]);

  // Drag and drop for service cards — dnd-kit reports the final order;
  // persistence mirrors the old native-DnD path.
  const handleReorder = async (newList: Service[]) => {
    // Reuse the display_order values this page already owns instead of
    // renumbering from 0 — see lib/service-order.ts for why page-local
    // `index * 10` collides with rows on the other pages.
    const updatedList = assignSlotOrders(servicesList, newList);

    setServicesList(updatedList);

    // Commit reorder to backend
    if (canManage && !reordering) {
      setReordering(true);
      const payload = toReorderPayload(updatedList);

      const loadingToast = toast.loading("Saving new service card order...");
      try {
        const res = await reorderServices(payload);
        if (res.success) {
          toast.success(res.message || "Service order updated successfully", { id: loadingToast });
          router.refresh();
        } else {
          toast.error(res.message || "Failed to reorder services", { id: loadingToast });
        }
      } catch {
        toast.error("Failed to persist service order", { id: loadingToast });
      } finally {
        setReordering(false);
      }
    }
  };

  // Quick manual order update from card badge
  const handleQuickOrderUpdate = async (serviceId: number, newOrder: number) => {
    const updatedList = servicesList.map((s) =>
      s.id === serviceId ? { ...s, display_order: newOrder } : s
    );
    setServicesList(updatedList);

    if (canManage) {
      // Only the edited row is sent: the rest of the page already holds the
      // value it wants, and rewriting them all would push page-local orders
      // onto rows the admin never touched.
      const payload = [{ id: serviceId, display_order: newOrder }];

      const loadingToast = toast.loading("Updating service display order...");
      try {
        const res = await reorderServices(payload);
        if (res.success) {
          toast.success(`Updated order to ${newOrder}`, { id: loadingToast });
          router.refresh();
        } else {
          toast.error(res.message || "Failed to update order", { id: loadingToast });
        }
      } catch {
        toast.error("Failed to update display order", { id: loadingToast });
      }
    }
  };

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
            Services Taxonomy & Pillar Manager
          </h1>
        </div>

        {canManage && (
          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
            <Button
              onClick={() => setAddServiceOpen(true)}
              className="h-10 px-4 w-full sm:w-auto bg-[#00668a] hover:bg-[#004c69] text-white text-xs font-bold gap-1.5 shadow-xs transition-all flex items-center justify-center rounded-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Add Service</span>
            </Button>
          </div>
        )}
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
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Service Groups</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{initialStats.totalGroups}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Tag className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* 5. Filter & Search Controls (Matching Blog Manager Design) */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-end gap-3 flex-wrap">
          {/* Pillar Filter */}
          <div className="w-full sm:w-44 shrink-0 space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center h-4">
              Pillar Filter :
            </label>
            <div className="relative">
              <select
                value={pillarDraft}
                onChange={(e) => {
                  setPillarDraft(e.target.value);
                  setGroupDraft("all");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleApplyFilters();
                  }
                }}
                className="w-full h-10 pl-3 pr-8 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 shadow-2xs appearance-none focus:outline-hidden focus:ring-2 focus:ring-[#00668a]/20 focus:border-[#00668a] transition-all cursor-pointer truncate"
              >
                <option value="all">All Pillars</option>
                {pillarOptions.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
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

          {/* Service Group Dropdown */}
          <div className="w-full sm:w-48 shrink-0 space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center h-4">
              Service Group :
            </label>
            <div className="relative">
              <select
                value={groupDraft}
                onChange={(e) => setGroupDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleApplyFilters();
                  }
                }}
                className="w-full h-10 pl-3 pr-8 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 shadow-2xs appearance-none focus:outline-hidden focus:ring-2 focus:ring-[#00668a]/20 focus:border-[#00668a] transition-all cursor-pointer truncate"
              >
                <option value="all">All Service Groups</option>
                <option value="ungrouped">Ungrouped Services</option>
                {availableGroups.map((g) => (
                  <option key={g.id} value={String(g.id)}>
                    {g.name} ({g.pillar})
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
                  <option value="display_order">Display Order</option>
                  <option value="name">Service Name</option>
                  <option value="pillar">Pillar</option>
                  <option value="created_at">Creation Date</option>
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
              ? "Try adjusting your query, pillar tab, or group selection to view items."
              : "Get started by creating your first service card."}
          </p>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={handleClearFilters} className="mt-4">
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <SortableGrid
          items={sortedServices}
          getKey={(s) => s.id}
          onReorder={handleReorder}
          disabled={!canManage}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch"
        >
          {(s, { isDragging, isOver, rootProps, handleProps }) => (
            <ServiceCard
              service={s}
              groups={groups}
              canManage={canManage}
              rootProps={rootProps}
              dragHandleProps={handleProps}
              onQuickOrderUpdate={handleQuickOrderUpdate}
              onDeleted={handleServiceDeleted}
              isDragging={isDragging}
              isTarget={isOver}
            />
          )}
        </SortableGrid>
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
      {canManage && (
        <>
          <CreateServiceModal
            open={addServiceOpen}
            onOpenChange={setAddServiceOpen}
            groups={groups}
            pillars={pillars}
            defaultPillar={pillarDraft !== "all" ? pillarDraft : pillarOptions[0]?.value}
          />
          <EditGroupModal
            open={editGroupOpen}
            onOpenChange={setEditGroupOpen}
            group={selectedGroup}
            pillars={pillars}
            onDeleteRequest={() => setDeleteGroupOpen(true)}
          />
          <DeleteGroupDialog
            open={deleteGroupOpen}
            onOpenChange={setDeleteGroupOpen}
            group={selectedGroup}
          />
        </>
      )}
    </div>
  );
}
