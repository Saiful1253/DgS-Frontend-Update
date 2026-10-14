/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Plus,
  Trash2,
  Save,
  Loader2,
  UploadCloud,
  ImageIcon,
  PlusCircle,
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  FolderKanban,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { portfolioSchema } from "@/zod/portfolio.validation";
import { PortfolioItem, PortfolioCategory } from "@/types/portfolio";
import {
  savePortfolio,
  uploadPortfolioImage,
  createPortfolioCategory,
} from "@/services/portfolio/portfolio.service";
import { listBlogTags, createBlogTag } from "@/services/blog/blog.service";
import OptionPicker, { PickerOption } from "@/components/blog/option-picker";
import PortfolioCategoryModal from "../category/portfolio-category-modal";

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

export interface PortfolioFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: PortfolioCategory[];
  onCategoriesChange?: (categories: PortfolioCategory[]) => void;
  project?: PortfolioItem | null;
  onSuccess?: (savedProject: PortfolioItem) => void;
  canManage: boolean;
}

export default function PortfolioFormModal({
  open,
  onOpenChange,
  categories,
  onCategoriesChange,
  project,
  onSuccess,
  canManage,
}: PortfolioFormModalProps) {
  const modalMode = project ? "edit" : "create";

  // Form State
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [projectName, setProjectName] = useState("");
  const [slug, setSlug] = useState("");
  const [clientName, setClientName] = useState("");
  const [category, setCategory] = useState("Select category");
  const [coverImage, setCoverImage] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<PickerOption[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);
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
      supporting_image: string;
      imageFile?: File | null;
      imagePreview?: string;
    }>
  >([]);

  // Category Modal & Inline Add
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isAddingCategoryInline, setIsAddingCategoryInline] = useState(false);
  const [newInlineCategory, setNewInlineCategory] = useState("");
  const [addingCategoryLoading, setAddingCategoryLoading] = useState(false);

  // Field validation & save status
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [originalSnapshot, setOriginalSnapshot] = useState<FormSnapshot | null>(null);
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);

  // Load tag options from blog tag registry
  useEffect(() => {
    if (open) {
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
  }, [open]);

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

  // Synchronize initial state when modal opens or target project changes
  useEffect(() => {
    if (!open) {
      setCoverFile(null);
      setCoverPreview("");
      setFieldErrors({});
      setOriginalSnapshot(null);
      return;
    }

    if (project) {
      setEditingId(project.id);
      setProjectName(project.project_name || "");
      setSlug(
        project.slug?.startsWith("/portfolio/")
          ? project.slug
          : `/portfolio/${project.slug || ""}`
      );
      setClientName(project.client_name || "");
      setCategory(project.category || "Select category");
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
        project_name: project.project_name || "",
        slug: project.slug?.startsWith("/portfolio/")
          ? project.slug
          : `/portfolio/${project.slug || ""}`,
        client_name: project.client_name || "",
        category: project.category || "Select category",
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
    } else {
      setEditingId(null);
      setProjectName("");
      setSlug("");
      setClientName("");
      setCategory("Select category");
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
      setOriginalSnapshot(null);
    }
  }, [open, project]);

  // Dirty state calculation
  const hasChanges = useMemo(() => {
    if (modalMode === "create") {
      return Boolean(
        projectName.trim() ||
          clientName.trim() ||
          coverFile ||
          coverImage ||
          (category && category !== "Select category") ||
          tags.length > 0 ||
          liveUrl.trim() ||
          appStoreUrl.trim() ||
          primaryChallenge.trim() ||
          primarySolution.trim()
      );
    }
    if (!originalSnapshot) return false;
    const currentChallenges = challenges.map((c) => ({
      title: c.title.trim(),
      challenge_description: c.challenge_description?.trim() || "",
      solution_provided: c.solution_provided?.trim() || "",
      supporting_image: c.supporting_image?.trim() || "",
    }));
    return (
      projectName.trim() !== originalSnapshot.project_name.trim() ||
      slug.trim() !== originalSnapshot.slug.trim() ||
      clientName.trim() !== originalSnapshot.client_name.trim() ||
      category !== originalSnapshot.category ||
      (coverFile !== null || coverImage.trim() !== originalSnapshot.cover_image.trim()) ||
      JSON.stringify(tags) !== JSON.stringify(originalSnapshot.tags) ||
      liveUrl.trim() !== originalSnapshot.live_url.trim() ||
      appStoreUrl.trim() !== originalSnapshot.app_store_url.trim() ||
      isFeatured !== originalSnapshot.is_featured ||
      primaryChallenge.trim() !== originalSnapshot.primary_challenge.trim() ||
      primarySolution.trim() !== originalSnapshot.primary_solution.trim() ||
      JSON.stringify(currentChallenges) !== JSON.stringify(originalSnapshot.challenges)
    );
  }, [
    modalMode,
    projectName,
    slug,
    clientName,
    category,
    coverFile,
    coverImage,
    tags,
    liveUrl,
    appStoreUrl,
    isFeatured,
    primaryChallenge,
    primarySolution,
    challenges,
    originalSnapshot,
  ]);

  const clearError = (field: string) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleNameChange = (val: string) => {
    setProjectName(val);
    if (modalMode === "create") {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setSlug(generated ? `/portfolio/${generated}` : "");
    }
  };



  // Main Cover Image Handlers
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file (PNG, JPG, WebP)");
        return;
      }
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
      clearError("cover_image");
    }
  };

  const handleRemoveCover = () => {
    setCoverFile(null);
    setCoverPreview("");
    setCoverImage("");
  };

  // Secondary Challenges Handlers
  const handleAddChallenge = () => {
    setChallenges([
      ...challenges,
      {
        title: `Challenge #${challenges.length + 1}`,
        challenge_description: "",
        solution_provided: "",
        supporting_image: "",
        imageFile: null,
        imagePreview: "",
      },
    ]);
  };

  const handleRemoveChallenge = (idx: number) => {
    setChallenges(challenges.filter((_, i) => i !== idx));
  };

  const handleChallengeChange = (
    idx: number,
    field: "title" | "challenge_description" | "solution_provided",
    value: string
  ) => {
    const updated = [...challenges];
    updated[idx] = { ...updated[idx], [field]: value };
    setChallenges(updated);
  };

  const handleChallengeImageChange = (
    idx: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file");
        return;
      }
      const updated = [...challenges];
      updated[idx] = {
        ...updated[idx],
        imageFile: file,
        imagePreview: URL.createObjectURL(file),
      };
      setChallenges(updated);
      clearError(`challenges.${idx}.supporting_image`);
    }
  };

  const handleRemoveChallengeImage = (idx: number) => {
    const updated = [...challenges];
    updated[idx] = {
      ...updated[idx],
      imageFile: null,
      imagePreview: "",
      supporting_image: "",
    };
    setChallenges(updated);
  };

  // Create Category Inline
  const handleCreateInlineCategory = async () => {
    const trimmed = newInlineCategory.trim();
    if (!trimmed) return;
    setAddingCategoryLoading(true);
    try {
      const res = await createPortfolioCategory(trimmed);
      if (res.success && res.data) {
        toast.success(res.message || "Category created");
        const updated = [...categories, res.data];
        onCategoriesChange?.(updated);
        setCategory(res.data.name);
        setIsAddingCategoryInline(false);
        setNewInlineCategory("");
        clearError("category");
      } else {
        toast.error(res.message || "Failed to create category");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setAddingCategoryLoading(false);
    }
  };

  // Save Portfolio Project
  const handleSave = async () => {
    const cleanSlug =
      slug.replace(/^\/portfolio\/?/, "").trim() ||
      (projectName.trim()
        ? projectName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
        : "");

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
      modalMode === "create"
        ? "Uploading assets and creating portfolio..."
        : "Uploading assets and updating portfolio..."
    );

    try {
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
          onSuccess?.(res.data);
        }
        onOpenChange(false);
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

  const handleModalCloseAttempt = () => {
    if (hasChanges && !saving) {
      setConfirmLeaveOpen(true);
    } else {
      onOpenChange(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            handleModalCloseAttempt();
          } else {
            onOpenChange(true);
          }
        }}
      >
        <DialogContent className="w-[calc(100vw-2rem)] sm:w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-primary uppercase mb-1">
              <span>PORTFOLIO EDITOR</span>
              <span>•</span>
              <span>
                {modalMode === "create" ? "NEW CASE STUDY" : "UPDATE CASE STUDY"}
              </span>
            </div>
            <DialogTitle className="text-xl font-black text-slate-900 tracking-tight">
              {modalMode === "create"
                ? "Create Portfolio Case Study"
                : `Update "${projectName || "Case Study"}"`}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Configure showcase project information, required cover visual, architectural challenge
              breakdown, and technical stack tags.
            </DialogDescription>
          </DialogHeader>

          {/* Form Body (Scrollable) */}
          <div
            id="portfolio-modal-scroll"
            className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]"
          >
            {/* Dirty Changes Warning Banner */}
            {hasChanges && (
              <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3 flex items-center gap-2.5 text-xs text-amber-800 font-medium">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  You have unsaved changes. Remember to click &quot;
                  {modalMode === "create"
                    ? "Upload Portfolio Project"
                    : "Save Portfolio Project"}
                  &quot; before leaving.
                </span>
              </div>
            )}

            {/* Section 0: Primary Cover Visual */}
            <div className="space-y-2">
              <label className="text-xs font-bold tracking-wider text-slate-700 uppercase flex items-center justify-between">
                <span>
                  PRIMARY COVER VISUAL (SHOWCASE HERO IMAGE){" "}
                  <span className="text-red-500">*</span>
                </span>
                <span className="text-[11px] font-semibold text-slate-400 normal-case">
                  Recommended: 1200x630 or 16:9 ratio
                </span>
              </label>

              {coverPreview || coverImage ? (
                <div
                  className={cn(
                    "relative rounded-xl border overflow-hidden bg-slate-950 p-2 flex items-center justify-center min-h-[220px] max-h-[320px] group transition-all",
                    fieldErrors.cover_image ? "border-red-500 ring-2 ring-red-500/20" : "border-slate-200"
                  )}
                >
                  <img
                    src={coverPreview || coverImage}
                    alt="Cover Preview"
                    className="max-h-[300px] w-auto max-w-full object-contain rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <label className="cursor-pointer px-4 py-2 rounded-lg bg-white/90 hover:bg-white text-slate-800 text-xs font-bold transition-all shadow-md flex items-center gap-1.5">
                      <UploadCloud className="w-4 h-4 text-primary" />
                      <span>Change Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={saving}
                        onChange={handleCoverChange}
                        className="hidden"
                      />
                    </label>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleRemoveCover}
                      disabled={saving}
                      className="gap-1.5 font-bold text-xs"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Remove</span>
                    </Button>
                  </div>
                  {coverFile && (
                    <div className="absolute bottom-3 left-3 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                      <span>✓ Ready to upload: {coverFile.name}</span>
                    </div>
                  )}
                </div>
              ) : (
                <label
                  className={cn(
                    "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all",
                    fieldErrors.cover_image
                      ? "border-red-500 bg-red-50/20 hover:bg-red-50/40"
                      : "border-slate-300 hover:border-primary/50 hover:bg-sky-50/40 bg-slate-50/50"
                  )}
                >
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center",
                      fieldErrors.cover_image ? "bg-red-100 text-red-600" : "bg-sky-100 text-primary"
                    )}
                  >
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-bold text-slate-800 block">
                      Click to upload primary cover image{" "}
                      <span className="text-red-500">*</span>
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      High resolution PNG, JPG, or WebP up to 5MB
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={saving}
                    onChange={handleCoverChange}
                    className="hidden"
                  />
                </label>
              )}
              {fieldErrors.cover_image && (
                <p className="text-xs font-semibold text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.cover_image}</span>
                </p>
              )}
            </div>

            {/* Section 1: Basic Information */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                BASIC PROJECT INFORMATION
              </h3>

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
                          !category || category.toLowerCase() === "select category"
                            ? "text-slate-400"
                            : "text-slate-800",
                          fieldErrors.category &&
                            "border-red-500 focus:border-red-500 focus:ring-red-500/20"
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
                  <span>
                    PRIMARY CHALLENGE / OVERVIEW <span className="text-red-500">*</span>
                  </span>
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
                  <span>
                    PRIMARY SOLUTION PROVIDED <span className="text-red-500">*</span>
                  </span>
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
                          fieldErrors[`challenges.${idx}.title`] &&
                            "border-red-500 focus-visible:ring-red-500/20"
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
                          fieldErrors[`challenges.${idx}.challenge_description`] &&
                            "border-red-500 focus-visible:ring-red-500/20"
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
                          fieldErrors[`challenges.${idx}.solution_provided`] &&
                            "border-red-500 focus-visible:ring-red-500/20"
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
                              {item.imagePreview || item.supporting_image
                                ? "Change Diagram"
                                : "Upload Diagram *"}
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
              onClick={handleModalCloseAttempt}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving || !canManage || !hasChanges}
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

      {/* Unsaved Changes Confirmation Dialog */}
      <AlertDialog open={confirmLeaveOpen} onOpenChange={setConfirmLeaveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span>Discard Unsaved Changes?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-600">
              You have unsaved changes to this portfolio project. If you close this modal now, your
              staged inputs and image selections will be discarded.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" size="sm" onClick={() => setConfirmLeaveOpen(false)}>
              Keep Editing
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setConfirmLeaveOpen(false);
                onOpenChange(false);
              }}
            >
              Discard Changes
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Nested Category Management Modal */}
      <PortfolioCategoryModal
        open={isCategoryModalOpen}
        onOpenChange={setIsCategoryModalOpen}
        categories={categories}
        onCategoriesChange={(updated: any) => onCategoriesChange?.(updated)}
        canManage={canManage}
      />
    </>
  );
}
