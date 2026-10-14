/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ServiceGroup, Service } from "@/types/service";
import { toPillarOptions, type PillarOptionSource } from "@/lib/service-pillars";
import { assignSlotOrders, toReorderPayload } from "@/lib/service-order";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { listServiceGroups, reorderServiceGroups } from "@/services/service/service.service";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { AppPagination } from "@/components/common/app-pagination";
import SortableGrid from "@/components/common/sortable-grid";
import {
  Plus,
  FolderTree,
  Edit2,
  Trash2,
  Tag,
  Columns,
  GripVertical,
  Search,
  Check,
  X,
  Layers,
} from "lucide-react";
import CreateGroupModal from "./modals/group/create-group-modal";
import EditGroupModal from "./modals/group/edit-group-modal";
import DeleteGroupDialog from "./modals/group/delete-group-dialog";
import GroupDetailsModal from "./modals/group/group-details-modal";
import { cn } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [21, 45, 66];

interface Props {
  groups: ServiceGroup[];
  services: Service[];
  pillars: PillarOptionSource[];
  canManage: boolean;
}

export default function ServiceGroupsManager({ groups: initialGroups, services, pillars, canManage }: Props) {
  const router = useRouter();
  const pillarOptions = toPillarOptions(pillars);

  // Local state for optimistic drag-and-drop & ordering updates
  const [groupsList, setGroupsList] = useState<ServiceGroup[]>(initialGroups || []);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(21);
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    setGroupsList(initialGroups || []);
  }, [initialGroups]);

  const handleGroupDeleted = async (groupId: number) => {
    // 1. Optimistic removal
    setGroupsList((prev) => prev.filter((g) => g.id !== groupId));

    // 2. Fetch fresh groups from backend so pagination auto-fills
    try {
      const res = await listServiceGroups(appliedFilters.pillar !== "all" ? appliedFilters.pillar : undefined);
      if (res.success && Array.isArray(res.data)) {
        setGroupsList(res.data as ServiceGroup[]);
      }
    } catch {
      // fallback
    }
    router.refresh();
  };

  // Search & Filter Drafts
  const [searchDraft, setSearchDraft] = useState("");
  const [pillarDraft, setPillarDraft] = useState<string>("all");
  const [sortDraft, setSortDraft] = useState<"display_order" | "name" | "pillar">("display_order");
  const [orderDraft, setOrderDraft] = useState<"asc" | "desc">("asc");

  // Applied Filters State (matching Blog & Portfolio pattern)
  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    pillar: "all",
    sortBy: "display_order",
    sortOrder: "asc",
  });

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<ServiceGroup | null>(null);

  // Manual display order state per card
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [manualOrderValue, setManualOrderValue] = useState<string>("");

  const isFilterPending =
    searchDraft.trim() !== appliedFilters.search ||
    pillarDraft !== appliedFilters.pillar ||
    sortDraft !== appliedFilters.sortBy ||
    orderDraft !== appliedFilters.sortOrder;

  const hasActiveFilters = Boolean(
    appliedFilters.search ||
    appliedFilters.pillar !== "all" ||
    appliedFilters.sortBy !== "display_order" ||
    appliedFilters.sortOrder !== "asc"
  );

  const handleApplyFilters = () => {
    setAppliedFilters({
      search: searchDraft.trim(),
      pillar: pillarDraft,
      sortBy: sortDraft,
      sortOrder: orderDraft,
    });
  };

  const handleClearFilters = () => {
    setSearchDraft("");
    setPillarDraft("all");
    setSortDraft("display_order");
    setOrderDraft("asc");
    setAppliedFilters({
      search: "",
      pillar: "all",
      sortBy: "display_order",
      sortOrder: "asc",
    });
  };

  // Filter & Sort Groups dynamically
  const filteredGroups = useMemo(() => {
    const list = groupsList.filter((g) => {
      if (appliedFilters.pillar !== "all" && g.pillar !== appliedFilters.pillar) return false;
      if (appliedFilters.search) {
        const q = appliedFilters.search.toLowerCase();
        const matchesName = (g.name || "").toLowerCase().includes(q);
        const matchesSlug = (g.slug || "").toLowerCase().includes(q);
        const matchesPillar = (g.pillar || "").toLowerCase().includes(q);
        if (!matchesName && !matchesSlug && !matchesPillar) return false;
      }
      return true;
    });

    const isAsc = appliedFilters.sortOrder === "asc";
    const key = appliedFilters.sortBy;

    return list.sort((a, b) => {
      let comp = 0;
      if (key === "display_order") {
        comp = (a.display_order ?? 0) - (b.display_order ?? 0);
      } else if (key === "name") {
        comp = (a.name || "").localeCompare(b.name || "");
      } else if (key === "pillar") {
        comp = (a.pillar || "").localeCompare(b.pillar || "");
      }
      return isAsc ? comp : -comp;
    });
  }, [groupsList, appliedFilters]);

  // Drag & drop — dnd-kit reports the final order; persistence mirrors the old
  // native-DnD path (assign this page's display_order slots, then PATCH).
  const handleReorder = async (newList: ServiceGroup[]) => {
    const updatedList = assignSlotOrders(groupsList, newList);
    setGroupsList(updatedList);

    if (canManage && !reordering) {
      setReordering(true);
      const payload = toReorderPayload(updatedList);

      const loadingToast = toast.loading("Saving service group order...");
      try {
        const res = await reorderServiceGroups(payload);
        if (res.success) {
          toast.success("Group order updated successfully", { id: loadingToast });
          router.refresh();
        } else {
          toast.error(res.message || "Failed to reorder service groups", { id: loadingToast });
        }
      } catch {
        toast.error("Failed to reorder service groups", { id: loadingToast });
      } finally {
        setReordering(false);
      }
    }
  };

  // Save manual order adjustment
  const handleSaveManualOrder = async (group: ServiceGroup) => {
    const val = parseInt(manualOrderValue, 10);
    if (isNaN(val) || val < 0) {
      toast.error("Please enter a valid non-negative order number");
      setEditingGroupId(null);
      return;
    }

    if (val === group.display_order) {
      setEditingGroupId(null);
      return;
    }

    const updatedList = groupsList.map((g) =>
      g.id === group.id ? { ...g, display_order: val } : g
    );
    setGroupsList(updatedList);
    setEditingGroupId(null);

    if (canManage) {
      const payload = [{ id: group.id, display_order: val }];

      const loadingToast = toast.loading("Updating service group order...");
      try {
        const res = await reorderServiceGroups(payload);
        if (res.success) {
          toast.success(`Group display order set to ${val}`, { id: loadingToast });
          router.refresh();
        } else {
          toast.error(res.message || "Failed to update group order", { id: loadingToast });
        }
      } catch {
        toast.error("Failed to update group order", { id: loadingToast });
      }
    }
  };

  const totalPages = Math.max(1, Math.ceil(filteredGroups.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedGroups = filteredGroups.slice(
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
            <span className="truncate">MODULE 6: SERVICE GROUPS MANAGER</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight break-words">
            Service Groups Manager
          </h1>
        </div>

        {canManage && (
          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
            <Button
              onClick={() => {
                setSelectedGroup(null);
                setCreateModalOpen(true);
              }}
              className="h-10 px-4 w-full sm:w-auto bg-[#00668a] hover:bg-[#004c69] text-white text-xs font-bold gap-1.5 shadow-xs transition-all flex items-center justify-center rounded-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Create Service Group</span>
            </Button>
          </div>
        )}
      </div>

      {/* Search, Sort, Filter, Apply & Clear Controls (Matching Blog Manager Design) */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-end gap-3 flex-wrap">
          {/* Pillar Filter */}
          <div className="w-full sm:w-48 shrink-0 space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center h-4">
              Pillar Filter :
            </label>
            <div className="relative">
              <select
                value={pillarDraft}
                onChange={(e) => setPillarDraft(e.target.value)}
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
                  <option value="name">Group Name</option>
                  <option value="pillar">Pillar</option>
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
              <span>Search Groups :</span>
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
                placeholder="Search group name, slug, pillar..."
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

      {/* Groups Grid with Drag & Drop */}
      {filteredGroups.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <FolderTree className="mx-auto h-8 w-8 text-slate-400" />
          <h3 className="mt-3 font-bold text-slate-900">
            {hasActiveFilters ? "No service groups match criteria" : "No service groups found"}
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            {hasActiveFilters
              ? "Try clearing search query or pillar filters."
              : "Create service groups to organize capability items."}
          </p>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={handleClearFilters} className="mt-4">
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <SortableGrid
          items={paginatedGroups}
          getKey={(g) => g.id}
          onReorder={handleReorder}
          disabled={!canManage}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch"
        >
          {(g, { isDragging, isOver, rootProps, handleProps }) => {
            const groupServices = services.filter((s) => s.group_id === g.id);

            return (
              <div
                {...rootProps}
                onClick={() => {
                  setSelectedGroup(g);
                  setDetailsModalOpen(true);
                }}
                title="Click to view group details & assigned services"
                className={cn(
                  "group relative flex flex-col justify-between rounded-xl border bg-white p-5 shadow-xs transition-all duration-200 cursor-pointer h-full",
                  isDragging && "opacity-40 border-dashed border-[#00668a] scale-[0.98]",
                  isOver && "border-2 border-[#00668a] bg-[#e6eff6]/30 shadow-md",
                  !isDragging && !isOver && "border-slate-200 hover:border-[#00668a]/50 hover:shadow-md"
                )}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {canManage && (
                        <div
                          {...handleProps}
                          title="Drag to reorder group"
                          onClick={(e) => e.stopPropagation()}
                          className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-600 rounded transition-colors shrink-0 touch-none"
                        >
                          <GripVertical className="h-4 w-4" />
                        </div>
                      )}
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e6eff6] text-[#00668a] shrink-0">
                        <Tag className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-sm truncate" title={g.name}>{g.name}</h3>
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 shrink-0">
                            #{g.id}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-slate-400 truncate">/{g.slug}</p>
                      </div>
                    </div>

                    {canManage && (
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedGroup(g);
                            setEditModalOpen(true);
                          }}
                          className="h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit group"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedGroup(g);
                            setDeleteDialogOpen(true);
                          }}
                          className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete group"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-[#00668a]" />
                      <span className="text-xs font-semibold text-slate-700">
                        Assigned Services
                      </span>
                    </div>
                    <Badge className="bg-[#e6eff6] text-[#00668a] hover:bg-[#e6eff6] font-bold text-xs px-2.5 py-0.5">
                      {groupServices.length} {groupServices.length === 1 ? "service" : "services"}
                    </Badge>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                    <Badge variant="outline" className="text-slate-700 bg-slate-50 font-medium gap-1 text-[11px]">
                      <Columns className="h-3 w-3 text-[#00668a]" />
                      <span>{g.pillar}</span>
                    </Badge>

                    <Badge
                      variant="outline"
                      className={cn(
                        "font-medium text-[11px]",
                        g.is_active === false
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      )}
                      title={g.is_active === false ? "Hidden from the client portal" : "Visible on the client portal"}
                    >
                      {g.is_active === false ? "Inactive" : "Active"}
                    </Badge>

                    {/* Manual Display Order Adjustment */}
                    {canManage ? (
                      editingGroupId === g.id ? (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min={0}
                            value={manualOrderValue}
                            onChange={(e) => setManualOrderValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveManualOrder(g);
                              if (e.key === "Escape") setEditingGroupId(null);
                            }}
                            className="h-6 w-14 text-xs font-mono px-1.5 py-0 border-slate-300"
                            autoFocus
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleSaveManualOrder(g)}
                            className="h-6 w-6 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingGroupId(g.id);
                            setManualOrderValue(String(g.display_order ?? 0));
                          }}
                          title="Click to manually adjust display order"
                          className="text-[11px] font-medium text-slate-500 hover:text-[#00668a] bg-slate-50 hover:bg-[#e6eff6] px-1.5 py-0.5 rounded border border-slate-200 transition-colors"
                        >
                          Order: <span className="font-bold font-mono">{g.display_order}</span>
                        </button>
                      )
                    ) : (
                      <span className="text-[11px]">Order: {g.display_order}</span>
                    )}
                  </div>

                  <span className="text-[11px] font-mono text-slate-400">ID: #{g.id}</span>
                </div>
              </div>
            );
          }}
        </SortableGrid>
      )}

      {filteredGroups.length > 0 && (
        <AppPagination
          page={currentPage}
          totalPages={totalPages}
          total={filteredGroups.length}
          itemLabel="groups"
          pageSize={pageSize}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          appliedPath={() => "/services/groups"}
          onPageChange={setPage}
          scroll={false}
        />
      )}

      {canManage && (
        <>
          <CreateGroupModal
            open={createModalOpen}
            onOpenChange={setCreateModalOpen}
            pillars={pillars}
            defaultPillar={pillarDraft !== "all" ? pillarDraft : pillarOptions[0]?.value}
          />
          <EditGroupModal
            open={editModalOpen}
            onOpenChange={setEditModalOpen}
            group={selectedGroup}
            pillars={pillars}
            onDeleteRequest={() => setDeleteDialogOpen(true)}
          />
          <DeleteGroupDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            group={selectedGroup}
            onDeleted={() => {
              if (selectedGroup) {
                handleGroupDeleted(selectedGroup.id);
              }
            }}
          />
        </>
      )}

      <GroupDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        group={selectedGroup}
        assignedServices={selectedGroup ? services.filter((s) => s.group_id === selectedGroup.id) : []}
        onEditClick={canManage ? () => setEditModalOpen(true) : undefined}
        onDeleteClick={canManage ? () => setDeleteDialogOpen(true) : undefined}
      />
    </div>
  );
}

