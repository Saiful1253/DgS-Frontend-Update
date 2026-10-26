/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  X,
  Trash2,
  Edit,
  Search,
  Globe,
  Layers,
  Filter,
  AlertTriangle,
  FolderKanban,
  Loader2,
  ChevronDown,
  Star,
  Video,
  MapPin,
  Youtube,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppPagination } from "@/components/common/app-pagination";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { PortfolioItem, PortfolioCategory } from "@/types/portfolio";
import {
  deletePortfolio,
  togglePortfolioFeatured,
} from "@/services/portfolio/portfolio.service";
import PortfolioCategoryModal from "./modals/category/portfolio-category-modal";
import PortfolioDetailModal from "./modals/item/portfolio-detail-modal";
import PortfolioFormModal from "./modals/item/portfolio-form-modal";
import {
  PROJECT_TYPES,
  PROJECT_STATUSES,
} from "@/lib/bangladesh-locations";

interface PortfolioManagerProps {
  initialPortfolios: PortfolioItem[];
  initialCategories?: PortfolioCategory[];
  autoOpenCreate?: boolean;
}

const DEFAULT_CATEGORIES: PortfolioCategory[] = [
  { id: 1, name: "Software & Cloud" },
  { id: 2, name: "Software Engineering" },
  { id: 3, name: "Creative & Post-Production" },
  { id: 4, name: "Marketing & Growth" },
  { id: 5, name: "Mobile Apps & Platforms" },
  { id: 6, name: "AI & Automation" },
  { id: 7, name: "FinTech & Web3" },
];

export default function PortfolioManager({
  initialPortfolios,
  initialCategories,
  autoOpenCreate,
}: PortfolioManagerProps) {
  const router = useRouter();
  const [portfolios, setPortfolios] = useState<PortfolioItem[]>(initialPortfolios);

  useEffect(() => {
    if (Array.isArray(initialPortfolios)) {
      setPortfolios(initialPortfolios);
    }
  }, [initialPortfolios]);

  // Dynamic Categories State
  const [categories, setCategories] = useState<PortfolioCategory[]>(
    initialCategories && initialCategories.length > 0 ? initialCategories : DEFAULT_CATEGORIES
  );
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Detail Modal State (Clicking Card Opens Case Study Details)
  const [viewingDetailItem, setViewingDetailItem] = useState<PortfolioItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Form Modal State (Add / Edit)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<PortfolioItem | null>(null);

  // Delete Dialog State
  const [deleteTarget, setDeleteTarget] = useState<PortfolioItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Featured Toggle State
  const [featuredTogglingId, setFeaturedTogglingId] = useState<number | null>(null);

  // Search & Filter State
  const [searchDraft, setSearchDraft] = useState("");
  const [categoryDraft, setCategoryDraft] = useState("All");
  const [featuredDraft, setFeaturedDraft] = useState("all");
  const [statusDraft, setStatusDraft] = useState("all");
  const [projectTypeDraft, setProjectTypeDraft] = useState("all");

  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    category: "All",
    featured: "all",
    status: "all",
    projectType: "all",
  });

  const handleApplyFilters = () => {
    setAppliedFilters({
      search: searchDraft.trim(),
      category: categoryDraft,
      featured: featuredDraft,
      status: statusDraft,
      projectType: projectTypeDraft,
    });
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchDraft("");
    setCategoryDraft("All");
    setFeaturedDraft("all");
    setStatusDraft("all");
    setProjectTypeDraft("all");
    setAppliedFilters({
      search: "",
      category: "All",
      featured: "all",
      status: "all",
      projectType: "all",
    });
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(
    appliedFilters.search ||
      appliedFilters.category !== "All" ||
      appliedFilters.featured !== "all" ||
      appliedFilters.status !== "all" ||
      appliedFilters.projectType !== "all" ||
      searchDraft.trim() ||
      categoryDraft !== "All" ||
      featuredDraft !== "all" ||
      statusDraft !== "all" ||
      projectTypeDraft !== "all"
  );

  const isFilterPending =
    searchDraft.trim() !== appliedFilters.search ||
    categoryDraft !== appliedFilters.category ||
    featuredDraft !== appliedFilters.featured ||
    statusDraft !== appliedFilters.status ||
    projectTypeDraft !== appliedFilters.projectType;

  // Pagination Scope State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(6);

  // Filtered Portfolios (Fast multi-token indexing)
  const filteredPortfolios = useMemo(() => {
    const rawSearch = appliedFilters.search.toLowerCase().trim();
    const targetCat = appliedFilters.category;
    const reqFeatured = appliedFilters.featured;
    const reqStatus = appliedFilters.status;
    const reqType = appliedFilters.projectType;

    // Fast-path: return original array when no filters active
    if (
      !rawSearch &&
      targetCat === "All" &&
      reqFeatured === "all" &&
      reqStatus === "all" &&
      reqType === "all"
    ) {
      return portfolios;
    }

    const searchTokens = rawSearch ? rawSearch.split(/\s+/).filter(Boolean) : [];

    return portfolios.filter((item) => {
      // 1. Dynamic Category Filter
      if (targetCat !== "All") {
        if (!item.category || item.category.toLowerCase() !== targetCat.toLowerCase()) {
          return false;
        }
      }

      // 2. Featured Status Filter
      if (reqFeatured === "featured" && !item.is_featured) {
        return false;
      }
      if (reqFeatured === "not_featured" && item.is_featured) {
        return false;
      }

      // 3. Project Status Filter
      if (reqStatus !== "all") {
        if ((item.project_status || "completed") !== reqStatus) {
          return false;
        }
      }

      // 4. Project Type Filter
      if (reqType !== "all") {
        if ((item.project_type || "residential") !== reqType) {
          return false;
        }
      }

      // 5. Fast multi-field token match
      if (searchTokens.length > 0) {
        const searchableBlob = `${item.project_name} ${item.client_name || ""} ${item.category || ""} ${(item.tags || []).join(" ")} ${item.district || ""} ${item.area || ""} ${item.address || ""} ${item.description || ""} ${item.primary_challenge || ""} ${item.primary_solution || ""}`.toLowerCase();

        for (let i = 0; i < searchTokens.length; i++) {
          if (!searchableBlob.includes(searchTokens[i])) {
            return false;
          }
        }
      }

      return true;
    });
  }, [portfolios, appliedFilters]);

  // Pagination Scope Calculations
  const totalItems = filteredPortfolios.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  // Sync currentPage whenever totalPages decreases or filters change
  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedPortfolios = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * pageSize;
    return filteredPortfolios.slice(startIndex, startIndex + pageSize);
  }, [filteredPortfolios, validCurrentPage, pageSize]);

  // Overall Statistics
  const totalProjects = portfolios.length;
  const featuredCount = portfolios.filter((p) => p.is_featured).length;
  const uniqueCategories = new Set(portfolios.map((p) => p.category).filter(Boolean)).size;
  const totalChallenges = portfolios.reduce((acc, p) => acc + (p.challenges?.length || 0), 0);

  const openCreateModal = () => {
    setEditingProject(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (project: PortfolioItem) => {
    setEditingProject(project);
    setIsFormModalOpen(true);
  };

  useEffect(() => {
    if (autoOpenCreate) {
      openCreateModal();
    }
  }, [autoOpenCreate]);

  const handleToggleFeatured = async (item: PortfolioItem) => {
    const next = !item.is_featured;
    setFeaturedTogglingId(item.id ?? null);
    try {
      const res = await togglePortfolioFeatured(item.id, next);
      if (res.success && res.data) {
        const saved = res.data as PortfolioItem;
        setPortfolios((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
        setViewingDetailItem((cur) => (cur && cur.id === saved.id ? saved : cur));
        router.refresh();
        toast.success(res.message || (next ? "Marked as featured" : "Removed from featured showcase"));
      } else {
        toast.error(res.message || "Failed to update featured status");
      }
    } catch (error: any) {
      toast.error(error?.message || "An unexpected error occurred.");
    } finally {
      setFeaturedTogglingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    toast.loading("Deleting portfolio item...");

    try {
      const res = await deletePortfolio(deleteTarget.id);
      toast.dismiss();

      if (res.success) {
        toast.success("Portfolio deleted successfully.");
        setPortfolios(portfolios.filter((p) => p.id !== deleteTarget.id));
        setDeleteTarget(null);
        router.refresh();
      } else {
        toast.error(res.message || "Failed to delete.");
      }
    } catch (error: any) {
      toast.dismiss();
      toast.error(error?.message || "Failed to delete.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap text-[10px] sm:text-xs font-bold tracking-wider text-primary uppercase mb-1">
            <span>ADMIN CMS</span>
            <span>•</span>
            <span className="truncate">MODULE 3: PORTFOLIO & CASE STUDIES MANAGER</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight break-words">
            Portfolio & Case Studies Manager
          </h1>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            onClick={openCreateModal}
            className="h-10 px-4 w-full sm:w-auto bg-primary text-white hover:bg-primary/90 font-bold text-xs rounded-lg shadow-xs flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Portfolio Project</span>
          </Button>
        </div>
      </div>

      {/* 2. Purpose Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h2 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">
          PURPOSE
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed max-w-5xl">
          Manages showcased client projects, media showcase (Images & YouTube Video), location coverage,
          project categories & types, status tracking, and challenge vs. solution repeater blocks.
        </p>
      </div>

      {/* 3. Stat Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Projects
          </span>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{totalProjects}</div>
          <p className="text-xs text-slate-500 font-medium">Published in catalogue</p>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Featured Projects
          </span>
          <div className="text-3xl font-extrabold text-emerald-600 tracking-tight">{featuredCount}</div>
          <p className="text-xs text-slate-500 font-medium">Highlighted on homepage</p>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Active Domains
          </span>
          <div className="text-3xl font-extrabold text-primary tracking-tight">{uniqueCategories}</div>
          <p className="text-xs text-slate-500 font-medium">Industry specialties</p>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Documented Challenges
          </span>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{totalChallenges}</div>
          <p className="text-xs text-slate-500 font-medium">Detailed solutions delivered</p>
        </div>
      </div>

      {/* 4. Filter & Search Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {/* Category Dropdown (Dynamic) */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-primary" />
              <span>Category:</span>
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
                className="w-full h-10 pl-3 pr-8 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 shadow-2xs appearance-none focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer truncate"
              >
                <option value="All">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id || cat.name} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Project Type Filter */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
              Project Type:
            </label>
            <div className="relative">
              <select
                value={projectTypeDraft}
                onChange={(e) => setProjectTypeDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleApplyFilters();
                  }
                }}
                className="w-full h-10 pl-3 pr-8 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 shadow-2xs appearance-none focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer truncate"
              >
                <option value="all">All Types</option>
                {PROJECT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
              Status:
            </label>
            <div className="relative">
              <select
                value={statusDraft}
                onChange={(e) => setStatusDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleApplyFilters();
                  }
                }}
                className="w-full h-10 pl-3 pr-8 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 shadow-2xs appearance-none focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer truncate"
              >
                <option value="all">All Statuses</option>
                {PROJECT_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Featured Status Dropdown */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
              Featured:
            </label>
            <div className="relative">
              <select
                value={featuredDraft}
                onChange={(e) => setFeaturedDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleApplyFilters();
                  }
                }}
                className="w-full h-10 pl-3 pr-8 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 shadow-2xs appearance-none focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer truncate"
              >
                <option value="all">All Projects</option>
                <option value="featured">Featured Only</option>
                <option value="not_featured">Non-Featured</option>
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Manage Categories Action */}
          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCategoryModalOpen(true)}
              className="w-full h-10 px-3.5 rounded-lg text-xs font-semibold text-slate-700 border-slate-200 hover:border-primary/40 hover:text-primary gap-1.5 shadow-2xs shrink-0 whitespace-nowrap"
              title="Manage dynamic portfolio categories"
            >
              <FolderKanban className="w-3.5 h-3.5 text-primary" />
              <span>Manage Categories</span>
            </Button>
          </div>
        </div>

        {/* Search Bar & Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1 border-t border-slate-100">
          <div className="flex-1 min-w-[200px] relative">
            <Input
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleApplyFilters();
                }
              }}
              placeholder="Search by title, location, client, tags, description..."
              className="h-10 text-xs font-semibold pl-9 pr-8 border-slate-200 w-full"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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

          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={handleApplyFilters}
              className={cn(
                "h-10 px-4 bg-primary text-white hover:bg-primary/90 text-xs font-bold gap-1.5 shadow-xs transition-all",
                isFilterPending && "ring-2 ring-primary/40 ring-offset-1"
              )}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Apply Filters</span>
            </Button>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="outline"
                onClick={handleClearFilters}
                className="h-10 px-3 text-xs font-semibold bg-slate-100 hover:bg-slate-200 border-transparent text-slate-700 gap-1 transition-colors shrink-0"
                title="Reset all filters"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 5. Visual Portfolio Grid */}
      {filteredPortfolios.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-sky-mist text-primary flex items-center justify-center mx-auto border border-primary/20">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Portfolio Projects Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {hasActiveFilters
              ? "No case studies match your current search and filter criteria. Try adjusting or clearing your filters."
              : "No portfolio projects have been created yet. Click below to add your first project."}
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            {hasActiveFilters && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="border-slate-200 text-xs font-semibold"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                <span>Clear Filters</span>
              </Button>
            )}
            <Button onClick={openCreateModal} size="sm" className="bg-primary text-white hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Add Portfolio Project</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedPortfolios.map((item) => {
              const isVideo = item.media_type === "youtube";
              const isCompleted = (item.project_status || "completed") === "completed";
              const typeLabel =
                PROJECT_TYPES.find((t) => t.value === item.project_type)?.label ||
                (item.project_type ? item.project_type.replace(/_/g, " ") : "Residential");

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setViewingDetailItem(item);
                    setIsDetailModalOpen(true);
                  }}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md hover:border-primary/50 transition-all flex flex-col justify-between space-y-4 cursor-pointer group hover:-translate-y-0.5"
                  title="Click to view full project details"
                >
                  <div className="space-y-3.5">
                    {/* Card Visual Banner */}
                    <div className="relative aspect-16/9 w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80">
                      {item.cover_image ? (
                        <img
                          src={item.cover_image}
                          alt={item.project_name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-sky-50 text-slate-400 gap-1.5">
                          <Layers className="w-8 h-8 text-slate-300 group-hover:text-primary transition-colors" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Project Showcase
                          </span>
                        </div>
                      )}

                      {/* Top Badges */}
                      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-xs text-primary text-[10px] font-bold shadow-xs border border-primary/20">
                            {item.category || "Case Study"}
                          </span>
                          {isVideo && (
                            <span className="px-2 py-0.5 rounded-full bg-red-600/95 text-white text-[10px] font-bold shadow-xs flex items-center gap-1">
                              <Youtube className="w-3 h-3" />
                              <span>Video</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs",
                              isCompleted
                                ? "bg-emerald-600 text-white"
                                : "bg-sky-600 text-white"
                            )}
                          >
                            {isCompleted ? "Completed" : "Ongoing"}
                          </span>
                          {item.is_featured && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold shadow-xs flex items-center gap-0.5">
                              <Star className="w-2.5 h-2.5 fill-white" />
                              <span>Featured</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bottom Banner Info: Type & Location */}
                      <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between pointer-events-none text-[10px] font-semibold text-white">
                        <span className="px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs">
                          {typeLabel}
                        </span>
                        {(item.district || item.area) && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs flex items-center gap-1 truncate max-w-[150px]">
                            <MapPin className="w-2.5 h-2.5 text-primary shrink-0" />
                            <span className="truncate">
                              {[item.area, item.district].filter(Boolean).join(", ")}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title & Client */}
                    <div className="space-y-1">
                      <h3 className="text-base font-extrabold text-slate-900 tracking-tight leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                        {item.project_name}
                      </h3>
                      {item.client_name && (
                        <p className="text-xs text-slate-500 font-medium">{item.client_name}</p>
                      )}
                    </div>

                    {/* Tags */}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {item.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-md border border-slate-200 text-[10px] font-semibold text-slate-600 bg-slate-50"
                          >
                            {tag}
                          </span>
                        ))}
                        {item.tags.length > 3 && (
                          <span className="px-1.5 py-0.5 rounded-md border border-slate-200 text-[10px] font-semibold text-slate-400 bg-slate-50">
                            +{item.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Description or Challenge snippet */}
                    <div className="pt-1 text-xs leading-relaxed border-t border-slate-100">
                      {item.description ? (
                        <p className="text-slate-600 line-clamp-2">{item.description}</p>
                      ) : item.primary_challenge ? (
                        <p className="text-slate-600 line-clamp-2">
                          <span className="font-bold text-red-500">Challenge: </span>
                          {item.primary_challenge}
                        </p>
                      ) : (
                        <p className="text-slate-400 italic text-[11px]">No description provided.</p>
                      )}
                    </div>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                      <span>{item.challenges?.length || 0} Challenges</span>
                      {item.live_url && (
                        <a
                          href={item.live_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="hover:text-primary transition-colors ml-1"
                          title="Open live website"
                        >
                          <Globe className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(item);
                        }}
                        className="h-8 px-2.5 text-xs font-semibold border-slate-200 hover:border-primary/40 hover:text-primary"
                      >
                        <Edit className="w-3.5 h-3.5 mr-1" />
                        <span>Edit</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        disabled={featuredTogglingId === item.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFeatured(item);
                        }}
                        className={
                          item.is_featured
                            ? "h-8 px-2 text-xs font-semibold border-emerald-300 text-emerald-700 hover:border-emerald-400 hover:bg-emerald-50"
                            : "h-8 px-2 text-xs font-semibold border-slate-200 text-slate-500 hover:text-amber-600 hover:border-amber-300"
                        }
                        title={
                          item.is_featured
                            ? "Remove from featured showcase"
                            : "Mark as featured showcase"
                        }
                      >
                        {featuredTogglingId === item.id ? (
                          <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                        ) : item.is_featured ? (
                          <Star className="w-3.5 h-3.5 mr-1 fill-amber-400 text-amber-400" />
                        ) : (
                          <Star className="w-3.5 h-3.5 mr-1" />
                        )}
                        <span>{item.is_featured ? "Unfeature" : "Feature"}</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(item);
                        }}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                        title="Delete project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          <AppPagination
            page={validCurrentPage}
            totalPages={totalPages}
            total={totalItems}
            itemLabel="projects"
            appliedPath={() => "#"}
            onPageChange={(p) => setCurrentPage(p)}
            pageSize={pageSize}
            onPageSizeChange={(v) => {
              setPageSize(v);
              setCurrentPage(1);
            }}
            pageSizeOptions={[6, 9, 12, 24]}
          />
        </div>
      )}

      {/* 6. Self-contained Add / Edit Modal Dialog */}
      <PortfolioFormModal
        open={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        categories={categories}
        onCategoriesChange={setCategories}
        project={editingProject}
        onSuccess={(savedProject) => {
          if (editingProject) {
            setPortfolios((prev) =>
              prev.map((p) => (p.id === savedProject.id ? savedProject : p))
            );
          } else {
            setPortfolios((prev) => [savedProject, ...prev]);
          }
          setIsFormModalOpen(false);
          setEditingProject(null);
          router.refresh();
        }}
      />

      {/* 7. Safety Delete Confirmation Dialog */}
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-2">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <AlertDialogTitle className="text-lg font-bold text-slate-900">
              Confirm Project Deletion
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete{" "}
              <strong className="text-slate-900 font-bold">&ldquo;{deleteTarget?.project_name}&rdquo;</strong>?
              This will permanently remove the project and all its associated data from the portfolio showcase.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              {isDeleting ? "Deleting..." : "Confirm Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 8. Miniature Portfolio Categories Modal */}
      <PortfolioCategoryModal
        open={isCategoryModalOpen}
        onOpenChange={setIsCategoryModalOpen}
        categories={categories}
        onCategoriesChange={(updatedCategories) => {
          setCategories(updatedCategories);
        }}
      />

      {/* 9. Case Study Detailed View Modal */}
      <PortfolioDetailModal
        item={viewingDetailItem}
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        onEdit={(item) => openEditModal(item)}
        onToggleFeatured={handleToggleFeatured}
        featuredLoading={featuredTogglingId === viewingDetailItem?.id}
      />
    </div>
  );
}
