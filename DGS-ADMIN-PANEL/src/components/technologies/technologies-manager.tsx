/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Tag,
  X,
  Cpu,
  Layers,
  FolderKanban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppPagination } from "@/components/common/app-pagination";
import SortableGrid from "@/components/common/sortable-grid";
import { cn } from "@/lib/utils";
import {
  sortCategories,
  TECHNOLOGY_CATEGORIES,
  type Technology,
  type TechnologyCategoryItem,
} from "@/types/technology";
import {
  reorderTechnologies,
  updateTechnology,
  listTechnologyCategories,
} from "@/services/technology/technology.service";
import { assignSlotOrders, toReorderPayload } from "@/lib/service-order";
import TechnologyCard from "./technology-card";
import TechnologyFormModal from "./technology-form-modal";
import TechnologyCategoryModal from "./technology-category-modal";
import DeleteTechnologyDialog from "./delete-technology-dialog";

interface Props {
  initialTechnologies: Technology[];
  initialCategories?: TechnologyCategoryItem[];
}

export type TechSortBy = "display_order" | "name" | "category" | "created_at";

export default function TechnologiesManager({
  initialTechnologies,
  initialCategories,
}: Props) {
  const router = useRouter();

  // Local state for instant optimistic updates & DnD
  const [technologiesList, setTechnologiesList] = useState<Technology[]>(initialTechnologies || []);
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    setTechnologiesList(initialTechnologies || []);
  }, [initialTechnologies]);

  // Modals state
  const [formOpen, setFormOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [dbCategories, setDbCategories] = useState<TechnologyCategoryItem[]>(initialCategories || []);
  const [editingTech, setEditingTech] = useState<Technology | null>(null);
  const [deletingTech, setDeletingTech] = useState<Technology | null>(null);

  useEffect(() => {
    if (initialCategories && initialCategories.length > 0) {
      setDbCategories(initialCategories);
    }
  }, [initialCategories]);

  // Fetch dynamic categories from DB on mount if not pre-seeded
  useEffect(() => {
    if (!initialCategories || initialCategories.length === 0) {
      listTechnologyCategories(1, 100)
        .then((res) => {
          if (res.success && Array.isArray(res.data)) {
            setDbCategories(res.data);
          }
        })
        .catch(() => {});
    }
  }, [initialCategories]);

  // Search & Filter Draft States
  const [searchDraft, setSearchDraft] = useState("");
  const [categoryDraft, setCategoryDraft] = useState<string>("all");
  const [statusDraft, setStatusDraft] = useState<"all" | "active" | "inactive">("all");
  const [sortDraft, setSortDraft] = useState<TechSortBy>("display_order");
  const [orderDraft, setOrderDraft] = useState<"asc" | "desc">("asc");

  // Applied Filters State (Matching ServicesManager)
  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    category: "all",
    status: "all" as "all" | "active" | "inactive",
    sortBy: "display_order" as TechSortBy,
    sortOrder: "asc" as "asc" | "desc",
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(21);
  const pageSizeOptions = [12, 21, 45, 60];

  // Derived category list including predefined and custom database rows
  const availableCategories = useMemo(() => {
    const dbNames = dbCategories.map((c) => c.name);
    const techNames = technologiesList.map((t) => t.category);
    return sortCategories([...TECHNOLOGY_CATEGORIES, ...dbNames, ...techNames]);
  }, [dbCategories, technologiesList]);

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
    appliedFilters.sortBy !== "display_order" ||
    appliedFilters.sortOrder !== "asc"
  );

  const handleApplyFilters = () => {
    setAppliedFilters({
      search: searchDraft.trim(),
      category: categoryDraft,
      status: statusDraft,
      sortBy: sortDraft,
      sortOrder: orderDraft,
    });
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchDraft("");
    setCategoryDraft("all");
    setStatusDraft("all");
    setSortDraft("display_order");
    setOrderDraft("asc");
    setAppliedFilters({
      search: "",
      category: "all",
      status: "all",
      sortBy: "display_order",
      sortOrder: "asc",
    });
    setCurrentPage(1);
  };

  // 1. Filtered Technologies
  const filteredTechnologies = useMemo(() => {
    return technologiesList.filter((tech) => {
      // Category filter
      if (appliedFilters.category !== "all" && tech.category !== appliedFilters.category) {
        return false;
      }

      // Status filter
      if (appliedFilters.status === "active" && !tech.is_active) return false;
      if (appliedFilters.status === "inactive" && tech.is_active) return false;

      // Search filter
      if (appliedFilters.search) {
        const q = appliedFilters.search.toLowerCase();
        const matchesName = (tech.name || "").toLowerCase().includes(q);
        const matchesCategory = (tech.category || "").toLowerCase().includes(q);
        const matchesTagline = (tech.proficiency_tagline || "").toLowerCase().includes(q);
        if (!matchesName && !matchesCategory && !matchesTagline) return false;
      }

      return true;
    });
  }, [technologiesList, appliedFilters]);

  // 2. Sorted Technologies
  const sortedTechnologies = useMemo(() => {
    const list = [...filteredTechnologies];
    const key = appliedFilters.sortBy;
    const isAsc = appliedFilters.sortOrder === "asc";

    return list.sort((a, b) => {
      let comp = 0;
      if (key === "display_order") {
        comp = (a.display_order ?? 0) - (b.display_order ?? 0);
      } else if (key === "name") {
        comp = (a.name || "").localeCompare(b.name || "");
      } else if (key === "category") {
        comp = (a.category || "").localeCompare(b.category || "");
      } else if (key === "created_at") {
        comp = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      }
      return isAsc ? comp : -comp;
    });
  }, [filteredTechnologies, appliedFilters.sortBy, appliedFilters.sortOrder]);

  // 3. Paginated Technologies for Grid
  const totalCount = sortedTechnologies.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedTechnologies = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return sortedTechnologies.slice(start, start + pageSize);
  }, [sortedTechnologies, safeCurrentPage, pageSize]);

  // Overall Statistics for Stat Cards
  const stats = useMemo(() => {
    const total = technologiesList.length;
    const active = technologiesList.filter((t) => t.is_active).length;
    const inactive = total - active;
    const totalCategories = new Set(technologiesList.map((t) => t.category)).size;
    return { total, active, inactive, totalCategories };
  }, [technologiesList]);

  // Category counts for quick tabs
  const categoryCounts = useMemo(() => {
    const map = new Map<string, { total: number; active: number }>();
    for (const t of technologiesList) {
      const entry = map.get(t.category) ?? { total: 0, active: 0 };
      entry.total += 1;
      if (t.is_active) entry.active += 1;
      map.set(t.category, entry);
    }
    return map;
  }, [technologiesList]);

  // Drag and drop reordering handler (preserves slot order across pages)
  const handleReorder = async (reorderedPage: Technology[]) => {
    const updatedPage = assignSlotOrders(paginatedTechnologies, reorderedPage);

    // Update in local overall list
    const updatedAll = technologiesList.map((item) => {
      const found = updatedPage.find((p) => p.id === item.id);
      return found || item;
    });

    setTechnologiesList(updatedAll);

    if (!reordering) {
      setReordering(true);
      const payload = toReorderPayload(updatedPage);
      const loadingToast = toast.loading("Saving new technology card order...");

      try {
        const res = await reorderTechnologies(payload);
        if (res.success) {
          toast.success(res.message || "Technology order updated successfully", {
            id: loadingToast,
          });
          router.refresh();
        } else {
          toast.error(res.message || "Failed to reorder technologies", { id: loadingToast });
        }
      } catch {
        toast.error("Failed to persist technology order", { id: loadingToast });
      } finally {
        setReordering(false);
      }
    }
  };

  // Quick manual order update from card badge
  const handleQuickOrderUpdate = async (technologyId: number | string, newOrder: number) => {
    const updatedList = technologiesList.map((t) =>
      t.id === technologyId ? { ...t, display_order: newOrder } : t
    );
    setTechnologiesList(updatedList);

    {
      const loadingToast = toast.loading("Updating display order...");
      try {
        const res = await updateTechnology(technologyId, { display_order: newOrder });
        if (res.success) {
          toast.success(`Display order updated to ${newOrder}`, { id: loadingToast });
          router.refresh();
        } else {
          toast.error(res.message || "Failed to update order", { id: loadingToast });
        }
      } catch {
        toast.error("Failed to update display order", { id: loadingToast });
      }
    }
  };

  const handleSaved = (saved: Technology) => {
    setTechnologiesList((prev) => {
      const exists = prev.some((t) => t.id === saved.id);
      return exists ? prev.map((t) => (t.id === saved.id ? saved : t)) : [saved, ...prev];
    });
    router.refresh();
  };

  const handleDeleted = (id: string | number) => {
    setTechnologiesList((prev) => prev.filter((t) => t.id !== id));
    router.refresh();
  };

  return (
    <div className="space-y-6 pb-12 w-full">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap text-[10px] sm:text-xs font-bold tracking-wider text-[#00668a] uppercase mb-1">
            <span>ADMIN CMS</span>
            <span>•</span>
            <span className="truncate">MODULE 10: TECHNOLOGIES &amp; TECH STACKS</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight break-words">
            Technologies Taxonomy &amp; Tech Stacks Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Organize tech categories, frameworks, cloud infrastructure tools, and architecture competencies shown across the public portal.
          </p>
        </div>

        {(
          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
            <Button
              onClick={() => {
                setEditingTech(null);
                setFormOpen(true);
              }}
              className="h-10 px-4 w-full sm:w-auto bg-[#00668a] hover:bg-[#004c69] text-white text-xs font-bold gap-1.5 shadow-xs transition-all flex items-center justify-center rounded-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Add Technology</span>
            </Button>
          </div>
        )}
      </div>

      {/* 2. Stat Cards (Exact same aesthetic as Services Manager) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Technologies</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{stats.total}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e6eff6] text-[#00668a]">
            <Cpu className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Technologies</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">{stats.active}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Inactive / Hidden</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1">{stats.inactive}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <XCircle className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tech Categories</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{stats.totalCategories}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Tag className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* 3. Filter & Search Controls (Matching Services Manager Design) */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-end gap-3 flex-wrap">
          {/* Category Dropdown */}
          <div className="w-full sm:w-48 shrink-0 space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center h-4">
              Category Filter :
            </label>
            <div className="relative">
              <select
                value={categoryDraft}
                onChange={(e) => setCategoryDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleApplyFilters();
                  }
                }}
                className="w-full h-10 pl-3 pr-8 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 shadow-2xs appearance-none focus:outline-hidden focus:ring-2 focus:ring-[#00668a]/20 focus:border-[#00668a] transition-all cursor-pointer truncate"
              >
                <option value="all">All Categories ({technologiesList.length})</option>
                {availableCategories.map((c) => {
                  const stat = categoryCounts.get(c);
                  return (
                    <option key={c} value={c}>
                      {c} ({stat?.total ?? 0})
                    </option>
                  );
                })}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </div>
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-40 shrink-0 space-y-1.5">
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
                  <option value="name">Technology Name</option>
                  <option value="category">Category</option>
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
              <span>Search Technologies :</span>
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
                placeholder="Search by name, category, or tagline..."
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

          {/* Action Buttons: Search, Clear Filters, and Manage Categories */}
          <div className="w-full lg:w-auto flex flex-wrap items-center gap-2 shrink-0 pt-1 lg:pt-0">
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCategoryModalOpen(true)}
              className="h-10 px-3.5 rounded-lg text-xs font-semibold text-slate-700 border-slate-200 hover:border-[#00668a]/40 hover:text-[#00668a] gap-1.5 shadow-2xs shrink-0 whitespace-nowrap"
              title="Manage dynamic technology categories"
            >
              <FolderKanban className="w-3.5 h-3.5 text-[#00668a]" />
              <span>Manage Categories</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 4. Technology Cards Grid with SortableGrid (Drag & Drop) */}
      {paginatedTechnologies.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Layers className="h-6 w-6" />
          </div>
          <h3 className="mt-4 font-bold text-slate-900">
            {hasActiveFilters ? "No technologies match search criteria" : "No technologies created yet"}
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            {hasActiveFilters
              ? "Try adjusting your query, category filter, or status selection to view items."
              : "Get started by adding your first technical stack or framework."}
          </p>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="mt-4 border-slate-200"
            >
              Clear Filters
            </Button>
          )}
          {!hasActiveFilters && (
            <Button
              size="sm"
              onClick={() => {
                setEditingTech(null);
                setFormOpen(true);
              }}
              className="mt-4 bg-[#00668a] hover:bg-[#004c69] text-white"
            >
              Add Technology
            </Button>
          )}
        </div>
      ) : (
        <SortableGrid
          items={paginatedTechnologies}
          getKey={(t) => t.id}
          onReorder={handleReorder}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5 items-stretch"
        >
          {(t, { isDragging, isOver, rootProps, handleProps }) => (
            <TechnologyCard
              key={t.id}
              technology={t}
              rootProps={rootProps}
              dragHandleProps={handleProps}
              onQuickOrderUpdate={handleQuickOrderUpdate}
              onDeleted={handleDeleted}
              onEdit={(tech) => {
                setEditingTech(tech);
                setFormOpen(true);
              }}
              isDragging={isDragging}
              isTarget={isOver}
            />
          )}
        </SortableGrid>
      )}

      {/* 5. Pagination Bar (Exact same AppPagination component as Services) */}
      {totalCount > 0 && (
        <AppPagination
          page={safeCurrentPage}
          totalPages={totalPages}
          total={totalCount}
          itemLabel="technologies"
          appliedPath={() => "#"}
          onPageChange={(p) => setCurrentPage(p)}
          pageSize={pageSize}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
          pageSizeOptions={pageSizeOptions}
        />
      )}

      {/* Modals */}
      {(
        <>
          <TechnologyFormModal
            open={formOpen}
            onOpenChange={setFormOpen}
            technology={editingTech}
            availableCategories={availableCategories}
            onSaved={handleSaved}
            onOpenManageCategories={() => setCategoryModalOpen(true)}
            onCategoryCreated={(newCat) => {
              setDbCategories((prev) =>
                prev.some((c) => c.name.toLowerCase() === newCat.toLowerCase())
                  ? prev
                  : [
                      ...prev,
                      {
                        id: Date.now(),
                        name: newCat,
                        display_order: prev.length + 1,
                        is_active: true,
                      },
                    ]
              );
            }}
          />
          <TechnologyCategoryModal
            open={categoryModalOpen}
            onOpenChange={setCategoryModalOpen}
            categories={dbCategories}
            onCategoriesChange={(updatedCategories) => {
              setDbCategories(updatedCategories);
            }}
          />
          {deletingTech && (
            <DeleteTechnologyDialog
              technology={deletingTech}
              open={Boolean(deletingTech)}
              onOpenChange={(open) => !open && setDeletingTech(null)}
              onDeleted={handleDeleted}
            />
          )}
        </>
      )}
    </div>
  );
}
