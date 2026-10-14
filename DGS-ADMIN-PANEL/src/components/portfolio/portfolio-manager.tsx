/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  
  X,
  Trash2,
  Edit,
  Save,
  Search,
  
  Smartphone,
  Globe,
  Layers,
  
  Filter,
  
  AlertTriangle,
  FolderKanban,
  UploadCloud,
  ImageIcon,
  Loader2,
  PlusCircle,
  ChevronDown,
  AlertCircle,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { portfolioSchema } from "@/zod/portfolio.validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { AppPagination } from "@/components/common/app-pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
  savePortfolio,
  deletePortfolio,
  togglePortfolioFeatured,
  uploadPortfolioImage,
  createPortfolioCategory,
} from "@/services/portfolio/portfolio.service";
import { listBlogTags, createBlogTag } from "@/services/blog/blog.service";
import OptionPicker, { PickerOption } from "@/components/blog/option-picker";
import PortfolioCategoryModal from "./modals/category/portfolio-category-modal";
import PortfolioDetailModal from "./modals/item/portfolio-detail-modal";

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

interface FormSnapshot {
  project_name: string;
  slug: string;
  client_name: string;
  category: string;
  cover_image: string;
  tags: string[];
  live_url: string;
  app_store_url: string;
  is_featured: boolean;
  primary_challenge: string;
  primary_solution: string;
  challenges: Array<{
    title: string;
    challenge_description: string;
    solution_provided: string;
    supporting_image: string;
  }>;
}

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

  useEffect(() => {
    if (initialCategories && initialCategories.length > 0) {
      setCategories(initialCategories);
    }
  }, [initialCategories]);

  // Dynamic Categories State
  const [categories, setCategories] = useState<PortfolioCategory[]>(
    initialCategories && initialCategories.length > 0 ? initialCategories : DEFAULT_CATEGORIES
  );
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Detail Modal State (Clicking Card Opens Case Study Details)
  const [viewingDetailItem, setViewingDetailItem] = useState<PortfolioItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Search & Filter State
  const [searchDraft, setSearchDraft] = useState("");
  const [categoryDraft, setCategoryDraft] = useState("All");
  const [featuredDraft, setFeaturedDraft] = useState("all");

  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    category: "All",
    featured: "all",
  });

  const handleApplyFilters = () => {
    setAppliedFilters({
      search: searchDraft.trim(),
      category: categoryDraft,
      featured: featuredDraft,
    });
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchDraft("");
    setCategoryDraft("All");
    setFeaturedDraft("all");
    setAppliedFilters({
      search: "",
      category: "All",
      featured: "all",
    });
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(
    appliedFilters.search ||
    appliedFilters.category !== "All" ||
    appliedFilters.featured !== "all" ||
    searchDraft.trim() ||
    categoryDraft !== "All" ||
    featuredDraft !== "all"
  );

  const isFilterPending =
    searchDraft.trim() !== appliedFilters.search ||
    categoryDraft !== appliedFilters.category ||
    featuredDraft !== appliedFilters.featured;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<number | null>(null);

  // Delete Dialog State
  const [deleteTarget, setDeleteTarget] = useState<PortfolioItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Featured Toggle State
  const [featuredTogglingId, setFeaturedTogglingId] = useState<number | null>(null);

  // Form State inside Modal
  const [projectName, setProjectName] = useState("");
  const [slug, setSlug] = useState("");
  const [clientName, setClientName] = useState("");
  const [category, setCategory] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<PickerOption[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);

  React.useEffect(() => {
    if (isModalOpen) {
      setLoadingTags(true);
      listBlogTags()
        .then((res) => {
          if (res.success && Array.isArray(res.data)) {
            setAllTags(
              res.data.map((tg: any) => ({
                key: String(tg.name),
                label: `#${tg.name}`,
                hint: (tg.posts_count ?? 0) > 0 ? `${tg.posts_count} posts` : undefined,
              }))
            );
          }
        })
        .catch(() => {})
        .finally(() => setLoadingTags(false));
    }
  }, [isModalOpen]);

  const toggleTag = (key: string) => {
    const t = key.trim().replace(/^#+/, "");
    if (!t) return;
    if (tags.some((x) => x.toLowerCase() === t.toLowerCase())) {
      setTags((prev) => prev.filter((x) => x.toLowerCase() !== t.toLowerCase()));
    } else {
      setTags((prev) => [...prev, t]);
    }
  };

  const handleCreateTag = (val: string) => {
    const t = val.trim().replace(/^#+/, "");
    if (!t) return;
    if (!tags.some((x) => x.toLowerCase() === t.toLowerCase())) {
      setTags((prev) => [...prev, t]);
      setAllTags((prev) =>
        prev.some((o) => o.key.toLowerCase() === t.toLowerCase())
          ? prev
          : [...prev, { key: t, label: `#${t}` }]
      );
      createBlogTag(t).catch(() => {});
    }
  };
  const [liveUrl, setLiveUrl] = useState("");
  const [appStoreUrl, setAppStoreUrl] = useState("");
  const [isFeatured, setIsFeatured] = useState<boolean>(false);
  const [primaryChallenge, setPrimaryChallenge] = useState("");
  const [primarySolution, setPrimarySolution] = useState("");
  const [challenges, setChallenges] = useState<
    Array<{
      id?: number;
      title: string;
      challenge_description: string;
      solution_provided: string;
      supporting_image?: string;
      imageFile?: File | null;
      imagePreview?: string;
    }>
  >([]);

  const [saving, setSaving] = useState(false);

  // Original form snapshot for dirty-checking (edit mode: disable Save until something changes)
  const [originalSnapshot, setOriginalSnapshot] = useState<FormSnapshot | null>(null);

  // True when edit-mode form differs from the loaded project (including image changes)
  const hasChanges = useMemo(() => {
    if (modalMode !== "edit" || !originalSnapshot) return true;

    const snap = originalSnapshot;
    if (projectName !== snap.project_name) return true;
    if (slug !== snap.slug) return true;
    if (clientName !== snap.client_name) return true;
    if (category !== snap.category) return true;
    if (isFeatured !== snap.is_featured) return true;
    if (liveUrl !== snap.live_url) return true;
    if (appStoreUrl !== snap.app_store_url) return true;
    if (primaryChallenge !== snap.primary_challenge) return true;
    if (primarySolution !== snap.primary_solution) return true;
    if (JSON.stringify([...tags].sort()) !== JSON.stringify([...snap.tags].sort())) return true;
    if (coverFile) return true;
    if (coverImage !== snap.cover_image) return true;
    if (challenges.length !== snap.challenges.length) return true;
    for (let i = 0; i < challenges.length; i++) {
      const c = challenges[i];
      const s = snap.challenges[i];
      if (
        c.title !== s.title ||
        c.challenge_description !== s.challenge_description ||
        c.solution_provided !== s.solution_provided
      ) {
        return true;
      }
      if (c.imageFile) return true;
      if ((c.supporting_image || "") !== (s.supporting_image || "")) return true;
    }
    return false;
  }, [
    modalMode,
    originalSnapshot,
    projectName,
    slug,
    clientName,
    category,
    isFeatured,
    liveUrl,
    appStoreUrl,
    primaryChallenge,
    primarySolution,
    tags,
    coverFile,
    coverImage,
    challenges,
  ]);

  // Inline Category Quick Add State
  const [isAddingCategoryInline, setIsAddingCategoryInline] = useState(false);
  const [newInlineCategory, setNewInlineCategory] = useState("");
  const [addingCategoryLoading, setAddingCategoryLoading] = useState(false);

  // Field Validation Errors State
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const clearError = (field: string) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Pagination Scope State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(6);

  // Filtered Portfolios (Fast multi-token indexing)
  const filteredPortfolios = useMemo(() => {
    const rawSearch = appliedFilters.search.toLowerCase().trim();
    const targetCat = appliedFilters.category;
    const reqFeatured = appliedFilters.featured;

    // Fast-path: return original array when no filters active
    if (!rawSearch && targetCat === "All" && reqFeatured === "all") {
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

      // 2. Separate Featured Status Filter
      if (reqFeatured === "featured" && !item.is_featured) {
        return false;
      }
      if (reqFeatured === "not_featured" && item.is_featured) {
        return false;
      }

      // 3. Fast multi-field token match
      if (searchTokens.length > 0) {
        const searchableBlob = `${item.project_name} ${item.client_name || ""} ${item.category || ""} ${(item.tags || []).join(" ")} ${item.primary_challenge || ""} ${item.primary_solution || ""}`.toLowerCase();

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

  // Handlers for Form
  const handleNameChange = (val: string) => {
    setProjectName(val);
    if (modalMode === "create") {
      const generatedSlug = `/portfolio/${val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")}`;
      setSlug(generatedSlug);
    }
  };



  const handleAddChallenge = () => {
    setChallenges([
      ...challenges,
      {
        title: `Challenge #${challenges.length + 1}`,
        challenge_description: "",
        solution_provided: "",
      },
    ]);
  };

  const handleRemoveChallenge = (index: number) => {
    setChallenges(challenges.filter((_, idx) => idx !== index));
  };

  const handleChallengeChange = (
    index: number,
    field: "title" | "challenge_description" | "solution_provided",
    val: string
  ) => {
    const updated = [...challenges];
    updated[index][field] = val;
    setChallenges(updated);
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    clearError("cover_image");
    e.target.value = "";
  };

  const handleRemoveCover = () => {
    setCoverFile(null);
    setCoverPreview("");
    setCoverImage("");
  };

  const handleChallengeImageChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    const preview = URL.createObjectURL(file);
    setChallenges((prev) =>
      prev.map((c, i) =>
        i === index ? { ...c, imageFile: file, imagePreview: preview } : c
      )
    );
    clearError(`challenges.${index}.supporting_image`);
    e.target.value = "";
  };

  const handleRemoveChallengeImage = (index: number) => {
    setChallenges((prev) =>
      prev.map((c, i) =>
        i === index
          ? { ...c, imageFile: null, imagePreview: "", supporting_image: "" }
          : c
      )
    );
  };

  const handleCreateInlineCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newInlineCategory.trim();
    if (!trimmed) {
      toast.error("Please enter a category name");
      return;
    }

    if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("A category with this name already exists");
      setCategory(trimmed);
      setIsAddingCategoryInline(false);
      setNewInlineCategory("");
      return;
    }

    setAddingCategoryLoading(true);
    try {
      const res = await createPortfolioCategory(trimmed);
      if (res.success) {
        toast.success(res.message || "Category created successfully!");
        const createdCat: PortfolioCategory = res.data || {
          id: Date.now(),
          name: trimmed,
        };
        const updated = [...categories, createdCat];
        setCategories(updated);
        setCategory(createdCat.name);
        setNewInlineCategory("");
        setIsAddingCategoryInline(false);
        router.refresh();
      } else {
        toast.error(res.message || "Failed to create category");
      }
    } catch {
      toast.error("Failed to create category");
    } finally {
      setAddingCategoryLoading(false);
    }
  };

  const openCreateModal = () => {
    setModalMode("create");
    setEditingId(null);
    setFieldErrors({});
    setOriginalSnapshot(null);
    setProjectName("");
    setSlug("");
    setClientName("");
    setCategory("Select category");
    setIsAddingCategoryInline(false);
    setNewInlineCategory("");
    setCoverImage("");
    setCoverFile(null);
    setCoverPreview("");
    setTags([]);
    setLiveUrl("");
    setAppStoreUrl("");
    setIsFeatured(false);
    setPrimaryChallenge("");
    setPrimarySolution("");
    setChallenges([
      {
        title: "Challenge #1",
        challenge_description: "",
        solution_provided: "",
        supporting_image: "",
        imageFile: null,
        imagePreview: "",
      },
    ]);
    setIsModalOpen(true);
  };

  React.useEffect(() => {
    if (autoOpenCreate) {
      openCreateModal();
    }
  }, [autoOpenCreate]);

  const openEditModal = (project: PortfolioItem) => {
    setModalMode("edit");
    setEditingId(project.id);
    setFieldErrors({});
    setProjectName(project.project_name);
    setSlug(project.slug.startsWith("/portfolio/") ? project.slug : `/portfolio/${project.slug}`);
    setClientName(project.client_name || "");
    setCategory(project.category || "Software & Cloud");
    setIsAddingCategoryInline(false);
    setNewInlineCategory("");
    setCoverImage(project.cover_image || "");
    setCoverFile(null);
    setCoverPreview("");
    setTags(project.tags || []);
    setLiveUrl(project.live_url || "");
    setAppStoreUrl(project.app_store_url || "");
    setIsFeatured(Boolean(project.is_featured));
    setPrimaryChallenge(project.primary_challenge || "");
    setPrimarySolution(project.primary_solution || "");
    setChallenges(
      project.challenges?.map((c) => ({
        id: c.id,
        title: c.title || "",
        challenge_description: c.challenge_description || "",
        solution_provided: c.solution_provided || "",
        supporting_image: c.supporting_image || "",
        imageFile: null,
        imagePreview: "",
      })) || []
    );
    setOriginalSnapshot({
      project_name: project.project_name,
      slug: project.slug.startsWith("/portfolio/") ? project.slug : `/portfolio/${project.slug}`,
      client_name: project.client_name || "",
      category: project.category || "Software & Cloud",
      cover_image: project.cover_image || "",
      tags: project.tags || [],
      live_url: project.live_url || "",
      app_store_url: project.app_store_url || "",
      is_featured: Boolean(project.is_featured),
      primary_challenge: project.primary_challenge || "",
      primary_solution: project.primary_solution || "",
      challenges: (project.challenges || []).map((c) => ({
        title: c.title || "",
        challenge_description: c.challenge_description || "",
        solution_provided: c.solution_provided || "",
        supporting_image: c.supporting_image || "",
      })),
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    const cleanSlug =
      slug.replace(/^\/portfolio\/?/, "").trim() ||
      (projectName.trim()
        ? projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
        : "");

    // 1. Client-side Zod validation before uploading any assets
    const tentativePayload = {
      id: editingId || undefined,
      project_name: projectName.trim(),
      slug: cleanSlug,
      client_name: clientName.trim(),
      category: category.trim(),
      cover_image: (coverFile ? "staged_cover" : (coverImage || "")).trim(),
      tags,
      live_url: liveUrl.trim(),
      app_store_url: appStoreUrl.trim(),
      is_featured: isFeatured,
      primary_challenge: primaryChallenge.trim(),
      primary_solution: primarySolution.trim(),
      challenges: challenges.map((c, i) => ({
        id: c.id,
        title: c.title.trim(),
        challenge_description: c.challenge_description?.trim() || "",
        solution_provided: c.solution_provided?.trim() || "",
        supporting_image: (c.imageFile ? "staged_diagram" : (c.supporting_image || "")).trim(),
        sort_order: i + 1,
      })),
    };

    const parsed = portfolioSchema.safeParse(tentativePayload);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        if (!errs[path]) {
          errs[path] = issue.message;
        }
      });
      setFieldErrors(errs);
      toast.error("Please fill in all required fields marked below.");
      const scrollEl = document.getElementById("portfolio-modal-scroll");
      if (scrollEl) {
        scrollEl.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    setFieldErrors({});
    setSaving(true);
    const loadingToast = toast.loading(
      modalMode === "create" ? "Uploading assets and creating portfolio..." : "Uploading assets and updating portfolio..."
    );

    try {
      // 1. Upload Cover Visual to Cloudinary if a new file was chosen
      let finalCoverUrl = coverImage;
      if (coverFile) {
        const coverFormData = new FormData();
        coverFormData.append("file", coverFile);
        coverFormData.append("folder", "portfolio");
        const uploadRes = await uploadPortfolioImage(coverFormData);
        if (!uploadRes.success || !uploadRes.data?.url) {
          throw new Error(uploadRes.message || "Failed to upload main cover visual");
        }
        finalCoverUrl = uploadRes.data.url;
      }

      // 2. Upload Challenge Diagrams to Cloudinary in parallel if new files were chosen
      const processedChallenges = await Promise.all(
        challenges.map(async (c, i) => {
          let finalChallengeImg = c.supporting_image;
          if (c.imageFile) {
            const challengeFormData = new FormData();
            challengeFormData.append("file", c.imageFile);
            challengeFormData.append("folder", "portfolio/challenges");
            const uploadRes = await uploadPortfolioImage(challengeFormData);
            if (!uploadRes.success || !uploadRes.data?.url) {
              throw new Error(`Failed to upload diagram for Challenge #${i + 1}`);
            }
            finalChallengeImg = uploadRes.data.url;
          }
          return {
            id: c.id,
            title: c.title.trim(),
            challenge_description: c.challenge_description?.trim() || "",
            solution_provided: c.solution_provided?.trim() || "",
            supporting_image: finalChallengeImg?.trim() || undefined,
            sort_order: i + 1,
          };
        })
      );

      const payload = {
        id: editingId || undefined,
        project_name: projectName.trim(),
        slug: cleanSlug,
        client_name: clientName.trim(),
        category: category.trim(),
        cover_image: finalCoverUrl?.trim() || undefined,
        tags,
        live_url: liveUrl.trim(),
        app_store_url: appStoreUrl.trim(),
        is_featured: isFeatured,
        primary_challenge: primaryChallenge.trim(),
        primary_solution: primarySolution.trim(),
        challenges: processedChallenges,
      };

      const res = await savePortfolio(payload);
      toast.dismiss(loadingToast);

      if (res.success) {
        toast.success(res.message || "Portfolio saved successfully!");
        setFieldErrors({});
        if (res.data) {
          const savedItem: PortfolioItem = res.data;
          const exists = portfolios.some((p) => p.id === savedItem.id);
          const updatedList = exists
            ? portfolios.map((p) => (p.id === savedItem.id ? savedItem : p))
            : [savedItem, ...portfolios];

          setPortfolios(updatedList);
          setIsModalOpen(false);
          setOriginalSnapshot(null);
          router.refresh();
        }
      } else {
        if (res.errors) {
          const sErrors: Record<string, string> = {};
          Object.entries(res.errors).forEach(([k, v]) => {
            sErrors[k] = Array.isArray(v) ? v[0] : String(v);
          });
          setFieldErrors(sErrors);
        }
        toast.error(res.message || "Failed to save portfolio project.");
      }
    } catch (error: any) {
      toast.dismiss();
      toast.error(error?.message || "An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

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
          Manages showcased client projects, case study details, category selectors, live search
          tags, and challenge vs. solution repeater blocks for detailed case study pages.
        </p>
      </div>

      {/* 3. Stat Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Case Studies
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
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-end gap-3">
          {/* Category Dropdown (Dynamic) */}
          <div className="w-full sm:w-48 lg:w-48 shrink-0 space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-primary" />
              <span>Category :</span>
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

          {/* Featured Status Dropdown (Separate) */}
          <div className="w-full sm:w-36 lg:w-36 shrink-0 space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
              Featured :
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
                <option value="all">All</option>
                <option value="featured">Featured Only</option>
                <option value="not_featured">Non-Featured</option>
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Search Input (Expands to fill available space, zero empty gap) */}
          <div className="flex-1 min-w-[220px] space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-primary" />
              <span>Search Case Studies :</span>
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
                placeholder="Search by title, client, tech tags, solutions..."
                className="h-10 text-xs font-semibold pl-3.5 pr-8 border-slate-200 w-full"
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
                "h-10 px-4 bg-primary text-white hover:bg-primary/90 text-xs font-bold gap-1.5 shadow-xs transition-all w-full lg:w-auto justify-center flex-1 lg:flex-initial",
                isFilterPending && "ring-2 ring-primary/40 ring-offset-1"
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
              onClick={() => setIsCategoryModalOpen(true)}
              className="h-10 px-3.5 rounded-lg text-xs font-semibold text-slate-700 border-slate-200 hover:border-primary/40 hover:text-primary gap-1.5 shadow-2xs shrink-0 whitespace-nowrap"
              title="Manage dynamic portfolio categories"
            >
              <FolderKanban className="w-3.5 h-3.5 text-primary" />
              <span>Manage Categories</span>
            </Button>
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
              : "No portfolio projects have been created yet. Click below to add your first case study."}
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
            {(
              <Button onClick={openCreateModal} size="sm" className="bg-primary text-white hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-1.5" />
                <span>Add Portfolio Project</span>
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedPortfolios.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setViewingDetailItem(item);
                  setIsDetailModalOpen(true);
                }}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md hover:border-primary/50 transition-all flex flex-col justify-between space-y-4 cursor-pointer group hover:-translate-y-0.5"
                title="Click to view full case study details"
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
                          Milanova Case Study
                        </span>
                      </div>
                    )}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                      <span className="px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-xs text-primary text-[10px] font-bold shadow-xs border border-primary/20">
                        {item.category}
                      </span>
                      {item.is_featured && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold shadow-xs">
                          Featured
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

                  {/* Challenge & Solution Snippet */}
                  <div className="space-y-2 pt-1 text-xs leading-relaxed border-t border-slate-100">
                    {item.primary_challenge && (
                      <p className="text-slate-600 line-clamp-2">
                        <span className="font-bold text-red-500">Challenge: </span>
                        {item.primary_challenge}
                      </p>
                    )}
                    {item.primary_solution && (
                      <p className="text-slate-600 line-clamp-2">
                        <span className="font-bold text-emerald-600">Solution: </span>
                        {item.primary_solution}
                      </p>
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
                    {item.app_store_url && (
                      <a
                        href={item.app_store_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="hover:text-sky-600 transition-colors ml-0.5"
                        title="Open App Store link"
                      >
                        <Smartphone className="w-3.5 h-3.5 text-sky-600" />
                      </a>
                    )}
                    {item.play_store_url && (
                      <a
                        href={item.play_store_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="hover:text-emerald-600 transition-colors ml-0.5"
                        title="Open Play Store link"
                      >
                        <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
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

                    {(
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
                    )}

                    {(
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(item);
                        }}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                        title="Delete case study"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <AppPagination
            page={validCurrentPage}
            totalPages={totalPages}
            total={totalItems}
            itemLabel="case studies"
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

      {/* 6. Add / Edit Modal Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-primary uppercase mb-1">
              <span>PORTFOLIO EDITOR</span>
              <span>•</span>
              <span>{modalMode === "create" ? "NEW CASE STUDY" : "UPDATE CASE STUDY"}</span>
            </div>
            <DialogTitle className="text-xl font-bold text-slate-900">
              {modalMode === "create"
                ? "Create New Portfolio Case Study"
                : `Edit: ${projectName || "Untitled Project"}`}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Configure project highlights, SEO slug, category, technology tags, and challenge-solution pairs.
            </DialogDescription>
          </DialogHeader>

          {/* Modal Scrollable Body */}
          <div id="portfolio-modal-scroll" className="p-6 overflow-y-auto space-y-6 flex-1 pr-4">
            {/* Section 1: Basic Info */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                BASIC PROJECT INFO & PRIMARY HIGHLIGHTS
              </h3>

              {/* Main Cover Visual Upload Box */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold tracking-wider text-slate-700 uppercase flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-primary" />
                    <span>MAIN PORTFOLIO COVER VISUAL</span>
                    <span className="text-red-500">*</span>
                  </label>
                  {(coverPreview || coverImage) && (
                    <button
                      type="button"
                      onClick={handleRemoveCover}
                      className="text-xs text-red-500 hover:text-red-700 font-semibold"
                    >
                      Remove Cover
                    </button>
                  )}
                </div>

                <div
                  className={cn(
                    "rounded-xl border-2 border-dashed p-4 transition-all hover:border-primary/50",
                    fieldErrors.cover_image
                      ? "border-red-500 bg-red-50/20"
                      : "border-slate-200 bg-slate-50/60"
                  )}
                >
                  {coverPreview || coverImage ? (
                    <div className="relative aspect-21/9 max-h-52 w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-900 group">
                      <img
                        src={coverPreview || coverImage}
                        alt="Project Cover"
                        className="w-full h-full object-cover"
                      />
                      {coverFile && (
                        <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md bg-amber-500/90 text-white text-[11px] font-bold shadow-xs backdrop-blur-xs flex items-center gap-1">
                          <span>Staged (Will upload when you hit Save)</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <label className="cursor-pointer px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                          <UploadCloud className="w-4 h-4 text-primary" />
                          <span>Change Visual</span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={saving}
                            onChange={handleCoverImageChange}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={handleRemoveCover}
                          className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-2 py-6 cursor-pointer group">
                      <div className="w-12 h-12 rounded-full bg-sky-mist text-primary flex items-center justify-center group-hover:scale-110 transition-transform border border-primary/20">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <div className="text-center">
                        <span className="text-xs font-bold text-slate-800 group-hover:text-primary transition-colors">
                          Click to select main showcase cover image
                        </span>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          High resolution PNG, JPG, or WebP (Uploads to cloud when you hit Upload Portfolio)
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={saving}
                        onChange={handleCoverImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                {fieldErrors.cover_image && (
                  <p className="text-xs font-semibold text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.cover_image}</span>
                  </p>
                )}
              </div>

              {/* Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold tracking-wider text-slate-700 uppercase">
                    PROJECT NAME <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={projectName}
                    onChange={(e) => {
                      handleNameChange(e.target.value);
                      clearError("project_name");
                    }}
                    placeholder="e.g. GasPay Centralized Utility Platform"
                    className={cn(
                      "h-10 text-sm font-medium",
                      fieldErrors.project_name && "border-red-500 focus-visible:ring-red-500/20"
                    )}
                  />
                  {fieldErrors.project_name && (
                    <p className="text-xs font-semibold text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.project_name}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold tracking-wider text-slate-700 uppercase">
                    SEO SLUG (AUTO-GENERATED) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value);
                      clearError("slug");
                    }}
                    placeholder="/portfolio/project-slug"
                    className={cn(
                      "h-10 text-sm font-medium bg-slate-50/50",
                      fieldErrors.slug && "border-red-500 focus-visible:ring-red-500/20"
                    )}
                  />
                  {fieldErrors.slug && (
                    <p className="text-xs font-semibold text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.slug}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold tracking-wider text-slate-700 uppercase">
                    CLIENT NAME
                  </label>
                  <Input
                    value={clientName}
                    onChange={(e) => {
                      setClientName(e.target.value);
                      clearError("client_name");
                    }}
                    placeholder="e.g. GasPay Energy EU"
                    className={cn(
                      "h-10 text-sm font-medium",
                      fieldErrors.client_name && "border-red-500 focus-visible:ring-red-500/20"
                    )}
                  />
                  {fieldErrors.client_name && (
                    <p className="text-xs font-semibold text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.client_name}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold tracking-wider text-slate-700 uppercase">
                      CATEGORY SELECTOR <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsAddingCategoryInline(!isAddingCategoryInline);
                          setNewInlineCategory("");
                        }}
                        className="h-6 text-[10px] gap-1 px-1.5 text-primary hover:text-primary/90 hover:bg-sky-50 font-semibold"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>{isAddingCategoryInline ? "Choose Existing" : "Add New"}</span>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsCategoryModalOpen(true)}
                        className="h-6 text-[10px] gap-1 px-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 font-medium"
                        title="Manage Categories"
                      >
                        <FolderKanban className="w-3.5 h-3.5" />
                        <span>Manage</span>
                      </Button>
                    </div>
                  </div>

                  {isAddingCategoryInline ? (
                    <div className="flex items-center gap-1.5">
                      <Input
                        value={newInlineCategory}
                        onChange={(e) => setNewInlineCategory(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleCreateInlineCategory();
                          } else if (e.key === "Escape") {
                            setIsAddingCategoryInline(false);
                          }
                        }}
                        placeholder="Enter new category name..."
                        className="h-10 text-sm font-medium flex-1"
                        autoFocus
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleCreateInlineCategory}
                        disabled={addingCategoryLoading || !newInlineCategory.trim()}
                        className="h-10 px-3 bg-primary text-white hover:bg-primary/90 font-bold text-xs shrink-0"
                      >
                        {addingCategoryLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Save"
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAddingCategoryInline(false)}
                        className="h-10 px-2.5 text-slate-500 hover:text-slate-800 shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <select
                        value={category || "Select category"}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "__add_new_inline__") {
                            setIsAddingCategoryInline(true);
                          } else {
                            setCategory(val);
                            if (val && val.toLowerCase() !== "select category") {
                              clearError("category");
                            } else {
                              setFieldErrors((prev) => ({
                                ...prev,
                                category: "Please select a category",
                              }));
                            }
                          }
                        }}
                        className={cn(
                          "w-full h-10 pl-3.5 pr-12 rounded-md border border-input bg-white text-sm font-medium shadow-xs appearance-none focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer",
                          !category || category.toLowerCase() === "select category" ? "text-slate-400" : "text-slate-800",
                          fieldErrors.category && "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                        )}
                      >
                        <option value="Select category" className="text-slate-400 font-normal">
                          Select category
                        </option>
                        {categories.map((cat) => (
                          <option key={cat.id || cat.name} value={cat.name} className="text-slate-800">
                            {cat.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 flex items-center">
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  )}
                  {fieldErrors.category && (
                    <p className="text-xs font-semibold text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.category}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Row 3: Tags */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold tracking-wider text-slate-700 uppercase">
                    TAGS (MULTI-SELECT WITH IN-LINE SEARCH & CREATE)
                  </label>
                  <span className="text-[10px] font-medium text-slate-400">
                    Shared with Tags Registry
                  </span>
                </div>
                <OptionPicker
                  options={allTags}
                  selected={tags}
                  onToggle={toggleTag}
                  allowCreate
                  onCreate={handleCreateTag}
                  placeholder="Search and select tags or type to create..."
                  countLabel="tags"
                  emptyText={loadingTags ? "Loading tags..." : "No matching tags found."}
                />
              </div>

              {/* Row 4: URLs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold tracking-wider text-slate-700 uppercase">
                    LIVE SITE LINK (OPTIONAL)
                  </label>
                  <Input
                    value={liveUrl}
                    onChange={(e) => setLiveUrl(e.target.value)}
                    placeholder="https://gaspay.eu"
                    className="h-10 text-sm font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold tracking-wider text-slate-700 uppercase">
                    APP STORE / PLAY STORE LINK (OPTIONAL)
                  </label>
                  <Input
                    value={appStoreUrl}
                    onChange={(e) => setAppStoreUrl(e.target.value)}
                    placeholder="https://apps.apple.com/app/gaspay"
                    className="h-10 text-sm font-medium"
                  />
                </div>
              </div>

              {/* Featured toggle */}
              <div className="flex items-center gap-2.5 pt-1">
                <Checkbox
                  id="modal-featured-status"
                  checked={isFeatured}
                  onCheckedChange={(c) => setIsFeatured(Boolean(c))}
                />
                <label
                  htmlFor="modal-featured-status"
                  className="text-xs font-bold text-slate-800 uppercase tracking-wider cursor-pointer select-none"
                >
                  FEATURED STATUS (TOGGLE ON/OFF FOR HOMEPAGE VISIBILITY)
                </label>
              </div>
            </div>

            {/* Section 2: Primary Challenge & Solution */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-bold tracking-wider text-slate-800 uppercase">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span>PRIMARY CHALLENGE / OVERVIEW <span className="text-red-500">*</span></span>
                </label>
                <Textarea
                  rows={3}
                  value={primaryChallenge}
                  onChange={(e) => {
                    setPrimaryChallenge(e.target.value);
                    clearError("primary_challenge");
                  }}
                  placeholder="Describe the client's critical technical or operational bottleneck..."
                  className={cn(
                    "text-sm font-medium leading-relaxed resize-y",
                    fieldErrors.primary_challenge && "border-red-500 focus-visible:ring-red-500/20"
                  )}
                />
                {fieldErrors.primary_challenge && (
                  <p className="text-xs font-semibold text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.primary_challenge}</span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-bold tracking-wider text-slate-800 uppercase">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>PRIMARY SOLUTION PROVIDED <span className="text-red-500">*</span></span>
                </label>
                <Textarea
                  rows={3}
                  value={primarySolution}
                  onChange={(e) => {
                    setPrimarySolution(e.target.value);
                    clearError("primary_solution");
                  }}
                  placeholder="Describe the architecture, deliverables, and engineering solutions delivered..."
                  className={cn(
                    "text-sm font-medium leading-relaxed resize-y",
                    fieldErrors.primary_solution && "border-red-500 focus-visible:ring-red-500/20"
                  )}
                />
                {fieldErrors.primary_solution && (
                  <p className="text-xs font-semibold text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.primary_solution}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Section 3: Secondary Challenges Repeater */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold tracking-wider text-slate-700 uppercase">
                  SECONDARY CHALLENGES & SOLUTIONS (DETAILS PAGE REPEATER)
                </h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddChallenge}
                  className="h-8 gap-1.5 text-xs font-semibold border-primary text-primary hover:bg-sky-mist"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Another Challenge</span>
                </Button>
              </div>

              <div className="space-y-3">
                {challenges.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary tracking-wide">
                        Challenge #{idx + 1}
                      </span>
                      {challenges.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveChallenge(idx)}
                          className="h-6 w-6 text-slate-400 hover:text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>

                    <div>
                      <Input
                        value={item.title}
                        onChange={(e) => {
                          handleChallengeChange(idx, "title", e.target.value);
                          clearError(`challenges.${idx}.title`);
                        }}
                        placeholder="Challenge Title (e.g. Multi-Currency Settlement) *"
                        className={cn(
                          "h-9 text-sm font-medium bg-white",
                          fieldErrors[`challenges.${idx}.title`] && "border-red-500 focus-visible:ring-red-500/20"
                        )}
                      />
                      {fieldErrors[`challenges.${idx}.title`] && (
                        <p className="text-xs font-semibold text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{fieldErrors[`challenges.${idx}.title`]}</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <Textarea
                        rows={2}
                        value={item.challenge_description}
                        onChange={(e) => {
                          handleChallengeChange(idx, "challenge_description", e.target.value);
                          clearError(`challenges.${idx}.challenge_description`);
                        }}
                        placeholder="Specific bottleneck description... *"
                        className={cn(
                          "text-xs font-medium bg-white resize-y",
                          fieldErrors[`challenges.${idx}.challenge_description`] && "border-red-500 focus-visible:ring-red-500/20"
                        )}
                      />
                      {fieldErrors[`challenges.${idx}.challenge_description`] && (
                        <p className="text-xs font-semibold text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{fieldErrors[`challenges.${idx}.challenge_description`]}</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <Textarea
                        rows={2}
                        value={item.solution_provided}
                        onChange={(e) => {
                          handleChallengeChange(idx, "solution_provided", e.target.value);
                          clearError(`challenges.${idx}.solution_provided`);
                        }}
                        placeholder="Engineered solution architecture... *"
                        className={cn(
                          "text-xs font-medium bg-white resize-y",
                          fieldErrors[`challenges.${idx}.solution_provided`] && "border-red-500 focus-visible:ring-red-500/20"
                        )}
                      />
                      {fieldErrors[`challenges.${idx}.solution_provided`] && (
                        <p className="text-xs font-semibold text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{fieldErrors[`challenges.${idx}.solution_provided`]}</span>
                        </p>
                      )}
                    </div>

                    {/* Individual Challenge Image Upload Box */}
                    <div className="space-y-1">
                      <div
                        className={cn(
                          "rounded-lg border p-2.5 flex items-center justify-between gap-3 transition-colors",
                          fieldErrors[`challenges.${idx}.supporting_image`]
                            ? "border-red-500 bg-red-50/20"
                            : "bg-white border-slate-200/80"
                        )}
                      >
                        {item.imagePreview || item.supporting_image ? (
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={item.imagePreview || item.supporting_image}
                              alt="Challenge visual"
                              className="w-12 h-12 object-cover rounded-md border border-slate-200 shrink-0"
                            />
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-slate-800 block truncate">
                                {item.imageFile ? "Diagram Selected" : "Visual / Diagram Attached"}
                              </span>
                              <span className="text-[10px] text-emerald-600 font-medium">
                                {item.imageFile
                                  ? "Staged (Uploads when saved)"
                                  : "Ready for case study details view"}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-slate-500">
                            <ImageIcon className="w-4 h-4 text-slate-400" />
                            <span className="text-xs font-medium text-slate-600">
                              No diagram attached yet <span className="text-red-500">*</span>
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 shrink-0">
                          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors">
                            <UploadCloud className="w-3.5 h-3.5 text-primary" />
                            <span>
                              {item.imagePreview || item.supporting_image ? "Change Diagram" : "Upload Diagram *"}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={saving}
                              onChange={(e) => handleChallengeImageChange(idx, e)}
                              className="hidden"
                            />
                          </label>

                          {(item.imagePreview || item.supporting_image) && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveChallengeImage(idx)}
                              className="h-7 w-7 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50"
                              title="Remove diagram"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                      {fieldErrors[`challenges.${idx}.supporting_image`] && (
                        <p className="text-xs font-semibold text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{fieldErrors[`challenges.${idx}.supporting_image`]}</span>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <DialogFooter className="p-4 px-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="bg-primary text-white hover:bg-primary/90 font-semibold"
            >
              <Save className="w-4 h-4 mr-1.5" />
              <span>
                {saving
                  ? "Uploading & Saving..."
                  : modalMode === "create"
                    ? "Upload Portfolio Project"
                    : "Save Portfolio Project"}
              </span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              This will permanently remove the case study and all its associated challenges from the public portfolio.
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
          if (updatedCategories.length > categories.length) {
            const newlyAdded = updatedCategories[updatedCategories.length - 1];
            if (newlyAdded?.name) {
              setCategory(newlyAdded.name);
            }
          } else if (!updatedCategories.some((c) => c.name === category)) {
            setCategory(updatedCategories[0]?.name || "Software & Cloud");
          }
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
