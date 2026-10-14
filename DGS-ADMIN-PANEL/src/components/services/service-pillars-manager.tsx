/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ServicePillarEntity, ServiceGroup } from "@/types/service";
import type { ServiceStats } from "@/types/service";
import { assignSlotOrders, toReorderPayload } from "@/lib/service-order";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { listServicePillars, reorderServicePillars } from "@/services/service/service.service";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { AppPagination } from "@/components/common/app-pagination";
import SortableGrid from "@/components/common/sortable-grid";
import {
  Plus,
  Columns,
  Edit2,
  Trash2,
  GripVertical,
  Search,
  Check,
  X,
} from "lucide-react";
import CreatePillarModal from "./modals/pillar/create-pillar-modal";
import EditPillarModal from "./modals/pillar/edit-pillar-modal";
import DeletePillarDialog from "./modals/pillar/delete-pillar-dialog";
import { cn } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [21, 45, 66];

interface Props {
  pillars?: ServicePillarEntity[];
  stats?: ServiceStats;
  groups?: ServiceGroup[];
  canManage: boolean;
}

export default function ServicePillarsManager({
  pillars: initialPillars = [],
  stats = { total: 0, active: 0, inactive: 0, totalGroups: 0, byPillar: {}, byGroup: {} },
  groups = [],
  canManage,
}: Props) {
  const router = useRouter();

  // Local state for optimistic drag-and-drop & ordering updates
  const [pillarsList, setPillarsList] = useState<ServicePillarEntity[]>(initialPillars || []);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(21);
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    setPillarsList(initialPillars || []);
  }, [initialPillars]);

  const handlePillarDeleted = async (pillarId: number) => {
    // 1. Optimistic removal
    setPillarsList((prev) => prev.filter((p) => p.id !== pillarId));

    // 2. Fetch fresh pillars from backend
    try {
      const res = await listServicePillars();
      if (res.success && Array.isArray(res.data)) {
        setPillarsList(res.data as ServicePillarEntity[]);
      }
    } catch {
      // fallback
    }
    router.refresh();
  };

  // Search & Filter Drafts
  const [searchDraft, setSearchDraft] = useState("");
  const [statusDraft, setStatusDraft] = useState<"all" | "active" | "inactive">("all");
  const [sortDraft, setSortDraft] = useState<"display_order" | "display_label" | "name">("display_order");
  const [orderDraft, setOrderDraft] = useState<"asc" | "desc">("asc");

  // Applied Filters State (matching Blog & Portfolio pattern)
  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    status: "all",
    sortBy: "display_order",
    sortOrder: "asc",
  });

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPillar, setSelectedPillar] = useState<ServicePillarEntity | null>(null);

  // Manual display order state per card
  const [editingPillarId, setEditingPillarId] = useState<number | null>(null);
  const [manualOrderValue, setManualOrderValue] = useState<string>("");

  const safeGroups = Array.isArray(groups) ? groups : [];
  const safeStats = stats || { total: 0, active: 0, inactive: 0, totalGroups: 0, byPillar: {}, byGroup: {} };

  const isFilterPending =
    searchDraft.trim() !== appliedFilters.search ||
    statusDraft !== appliedFilters.status ||
    sortDraft !== appliedFilters.sortBy ||
    orderDraft !== appliedFilters.sortOrder;

  const hasActiveFilters = Boolean(
    appliedFilters.search ||
    appliedFilters.status !== "all" ||
    appliedFilters.sortBy !== "display_order" ||
    appliedFilters.sortOrder !== "asc"
  );

  const handleApplyFilters = () => {
    setAppliedFilters({
      search: searchDraft.trim(),
      status: statusDraft,
      sortBy: sortDraft,
      sortOrder: orderDraft,
    });
  };

  const handleClearFilters = () => {
    setSearchDraft("");
    setStatusDraft("all");
    setSortDraft("display_order");
    setOrderDraft("asc");
    setAppliedFilters({
      search: "",
      status: "all",
      sortBy: "display_order",
      sortOrder: "asc",
    });
  };

  // Filter & Sort Pillars dynamically
  const filteredPillars = useMemo(() => {
    const list = pillarsList.filter((p) => {
      if (appliedFilters.status === "active" && !p.is_active) return false;
      if (appliedFilters.status === "inactive" && p.is_active) return false;
      if (appliedFilters.search) {
        const q = appliedFilters.search.toLowerCase();
        const matchesName = (p.name || "").toLowerCase().includes(q);
        const matchesLabel = (p.display_label || "").toLowerCase().includes(q);
        const matchesSlug = (p.slug || "").toLowerCase().includes(q);
        const matchesBlurb = (p.blurb || "").toLowerCase().includes(q);
        if (!matchesName && !matchesLabel && !matchesSlug && !matchesBlurb) return false;
      }
      return true;
    });

    const isAsc = appliedFilters.sortOrder === "asc";
    const key = appliedFilters.sortBy;

    return list.sort((a, b) => {
      let comp = 0;
      if (key === "display_order") {
        comp = (a.display_order ?? 0) - (b.display_order ?? 0);
      } else if (key === "display_label") {
        comp = (a.display_label || "").localeCompare(b.display_label || "");
      } else if (key === "name") {
        comp = (a.name || "").localeCompare(b.name || "");
      }
      return isAsc ? comp : -comp;
    });
  }, [pillarsList, appliedFilters]);

  // Drag & drop — dnd-kit reports the final order; persistence mirrors the old
  // native-DnD path (assign this page's display_order slots, then PATCH).
  const handleReorder = async (newList: ServicePillarEntity[]) => {
    const updatedList = assignSlotOrders(pillarsList, newList);
    setPillarsList(updatedList);

    if (canManage && !reordering) {
      setReordering(true);
      const payload = toReorderPayload(updatedList);

      const loadingToast = toast.loading("Saving service pillar order...");
      try {
        const res = await reorderServicePillars(payload);
        if (res.success) {
          toast.success("Pillar order updated successfully", { id: loadingToast });
          router.refresh();
        } else {
          toast.error(res.message || "Failed to reorder service pillars", { id: loadingToast });
        }
      } catch {
        toast.error("Failed to reorder service pillars", { id: loadingToast });
      } finally {
        setReordering(false);
      }
    }
  };

  // Save manual order adjustment
  const handleSaveManualOrder = async (pillar: ServicePillarEntity) => {
    const val = parseInt(manualOrderValue, 10);
    if (isNaN(val) || val < 0) {
      toast.error("Please enter a valid non-negative order number");
      setEditingPillarId(null);
      return;
    }

    if (val === pillar.display_order) {
      setEditingPillarId(null);
      return;
    }

    const updatedList = pillarsList.map((p) =>
      p.id === pillar.id ? { ...p, display_order: val } : p
    );
    setPillarsList(updatedList);
    setEditingPillarId(null);

    if (canManage) {
      const payload = [{ id: pillar.id, display_order: val }];

      const loadingToast = toast.loading("Updating service pillar order...");
      try {
        const res = await reorderServicePillars(payload);
        if (res.success) {
          toast.success(`Pillar display order set to ${val}`, { id: loadingToast });
          router.refresh();
        } else {
          toast.error(res.message || "Failed to update pillar order", { id: loadingToast });
        }
      } catch {
        toast.error("Failed to update pillar order", { id: loadingToast });
      }
    }
  };

  const totalPages = Math.max(1, Math.ceil(filteredPillars.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedPillars = filteredPillars.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  // Clamp back to a valid page whenever filtering shrinks the list.
  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap text-[10px] sm:text-xs font-bold tracking-wider text-[#00668a] uppercase mb-1">
            <span>ADMIN CMS</span>
            <span>•</span>
            <span className="truncate">MODULE 6: SERVICE PILLARS MANAGER</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight break-words">
            Service Pillars Manager
          </h1>
        </div>

        {canManage && (
          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
            <Button
              onClick={() => {
                setSelectedPillar(null);
                setCreateModalOpen(true);
              }}
              className="h-10 px-4 w-full sm:w-auto bg-[#00668a] hover:bg-[#004c69] text-white text-xs font-bold gap-1.5 shadow-xs transition-all flex items-center justify-center rounded-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Create Service Pillar</span>
            </Button>
          </div>
        )}
      </div>

      {/* Search, Sort, Filter, Apply & Clear Controls (Matching Blog Manager Design) */}
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
                  <option value="display_label">Display Label</option>
                  <option value="name">Pillar Key</option>
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
              <span>Search Pillars :</span>
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
                placeholder="Search pillar label, name, slug, blurb..."
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
                  "h-10 px-4 bg-[#00668a] text-white hover:bg-[#004c69] text-xs font-bold gap-1.5 shadow-xs transition-all w-full lg:w-auto justify-center flex-1 lg:flex-initial",
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

      {/* Pillars Grid with Drag & Drop */}
      {filteredPillars.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <Columns className="mx-auto h-8 w-8 text-slate-400" />
          <h3 className="mt-3 font-bold text-slate-900">
            {hasActiveFilters ? "No service pillars match criteria" : "No service pillars found"}
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            {hasActiveFilters
              ? "Try clearing search query or status filter."
              : "Create service pillars to establish top-level capability tabs."}
          </p>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={handleClearFilters} className="mt-4">
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <SortableGrid
          items={paginatedPillars}
          getKey={(p) => p.id}
          onReorder={handleReorder}
          disabled={!canManage}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start"
        >
          {(p, { isDragging, isOver, rootProps, handleProps }) => {
            const pillarGroups = safeGroups.filter(
              (g) => g.pillar_id === p.id || g.pillar === p.name
            );
            const serviceCount = safeStats.byPillar?.[p.name] || 0;

            return (
              <div
                {...rootProps}
                className={cn(
                  "group relative flex flex-col rounded-xl border bg-white p-6 shadow-xs transition-all duration-200",
                  isDragging && "opacity-40 border-dashed border-[#00668a] scale-[0.98]",
                  isOver && "border-2 border-[#00668a] bg-[#e6eff6]/30 shadow-md",
                  !isDragging && !isOver && "border-slate-200 hover:border-slate-300 hover:shadow-md"
                )}
              >
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <div className="flex items-center gap-2.5">
                      {canManage && (
                        <div
                          {...handleProps}
                          title="Drag to reorder pillar"
                          className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-600 rounded transition-colors touch-none"
                        >
                          <GripVertical className="h-4 w-4" />
                        </div>
                      )}
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e6eff6] text-[#00668a] overflow-hidden">
                        {p.icon ? (
                          <img
                            src={p.icon}
                            alt={`${p.name} icon`}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <Columns className="h-5 w-5" />
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        className={
                          p.is_active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }
                      >
                        {p.is_active ? "Active" : "Inactive"}
                      </Badge>

                      {canManage && (
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedPillar(p);
                              setEditModalOpen(true);
                            }}
                            className="h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit pillar"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedPillar(p);
                              setDeleteDialogOpen(true);
                            }}
                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete pillar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">{p.display_label}</h3>
                  <p className="text-xs font-mono text-[#00668a] font-semibold mt-0.5">{p.name}</p>
                  <p className="text-xs font-mono text-slate-400">/{p.slug}</p>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">{p.blurb || "No blurb description provided."}</p>

                  <div className="mt-4 grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-50/80 border border-slate-100">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Service Groups</span>
                      <span className="text-sm font-bold text-slate-800">{pillarGroups.length}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Services</span>
                      <span className="text-sm font-bold text-emerald-600">{serviceCount}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-2">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Groups in this pillar:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {pillarGroups.length === 0 ? (
                        <span className="text-xs text-slate-400 italic">No groups assigned</span>
                      ) : (
                        pillarGroups.map((g) => (
                          <Badge key={g.id} variant="secondary" className="bg-slate-100 text-slate-700 text-[11px]">
                            {g.name}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  {/* Manual Display Order Adjustment */}
                  {canManage ? (
                    editingPillarId === p.id ? (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min={0}
                          value={manualOrderValue}
                          onChange={(e) => setManualOrderValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveManualOrder(p);
                            if (e.key === "Escape") setEditingPillarId(null);
                          }}
                          className="h-6 w-14 text-xs font-mono px-1.5 py-0 border-slate-300"
                          autoFocus
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleSaveManualOrder(p)}
                          className="h-6 w-6 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPillarId(p.id);
                          setManualOrderValue(String(p.display_order ?? 0));
                        }}
                        title="Click to manually adjust display order"
                        className="text-[11px] font-medium text-slate-500 hover:text-[#00668a] bg-slate-50 hover:bg-[#e6eff6] px-1.5 py-0.5 rounded border border-slate-200 transition-colors"
                      >
                        Order: <span className="font-bold font-mono">{p.display_order}</span>
                      </button>
                    )
                  ) : (
                    <span>Display Order: {p.display_order}</span>
                  )}

                  <span>ID: #{p.id}</span>
                </div>
              </div>
            );
          }}
        </SortableGrid>
      )}

      {filteredPillars.length > 0 && (
        <AppPagination
          page={currentPage}
          totalPages={totalPages}
          total={filteredPillars.length}
          itemLabel="pillars"
          pageSize={pageSize}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          appliedPath={() => "/services/pillars"}
          onPageChange={setPage}
          scroll={false}
        />
      )}

      {canManage && (
        <>
          <CreatePillarModal
            open={createModalOpen}
            onOpenChange={setCreateModalOpen}
          />
          <EditPillarModal
            open={editModalOpen}
            onOpenChange={setEditModalOpen}
            pillar={selectedPillar}
            onDeleteRequest={() => setDeleteDialogOpen(true)}
          />
          <DeletePillarDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            pillar={selectedPillar}
            onDeleted={() => {
              if (selectedPillar) {
                handlePillarDeleted(selectedPillar.id);
              }
            }}
          />
        </>
      )}
    </div>
  );
}

