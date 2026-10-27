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
  PlusCircle,
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  FolderKanban,
  MapPin,
  Check,
  Search,
  ExternalLink,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
import { PortfolioItem, PortfolioCategory, PortfolioArea } from "@/types/portfolio";
import {
  savePortfolio,
  uploadPortfolioImage,
  createPortfolioArea,
  listPortfolioAreas,
} from "@/services/portfolio/portfolio.service";
import { listServices } from "@/services/service/service.service";
import { listBlogTags, createBlogTag } from "@/services/blog/blog.service";
import OptionPicker, { PickerOption } from "@/components/blog/option-picker";
import PortfolioAreaModal from "../area/portfolio-area-modal";
import CreateServiceModal from "@/components/services/modals/service/create-service-modal";
import RichTextEditor from "@/components/common/rich-text-editor";
import {
  BANGLADESH_DISTRICTS,
  COMMON_DHAKA_AREAS,
  PROJECT_STATUSES,
} from "@/lib/bangladesh-locations";

interface FormSnapshot {
  project_name: string;
  slug: string;
  client_name: string;
  category: string;
  cover_image: string;
  tags: string[];
  app_store_url: string;
  is_featured: boolean;
  project_status: "completed" | "ongoing";
  district: string;
  area: string;
  address: string;
  latitude: string;
  longitude: string;
  description: string;
}

export interface PortfolioFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: PortfolioCategory[];
  onCategoriesChange?: (categories: PortfolioCategory[]) => void;
  project?: PortfolioItem | null;
  onSuccess?: (savedProject: PortfolioItem) => void;
}

export default function PortfolioFormModal({
  open,
  onOpenChange,
  categories,
  onCategoriesChange,
  project,
  onSuccess,
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
  const [appStoreUrl, setAppStoreUrl] = useState("");
  const [isFeatured, setIsFeatured] = useState<boolean>(false);

  // New Portfolio Engine Form State
  const [projectStatus, setProjectStatus] = useState<"completed" | "ongoing">("completed");
  const [district, setDistrict] = useState("Dhaka");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [coordinatesInput, setCoordinatesInput] = useState("");
  const [description, setDescription] = useState("");
  const [areaObjects, setAreaObjects] = useState<PortfolioArea[]>([]);
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [isAddingAreaInline, setIsAddingAreaInline] = useState(false);
  const [newInlineArea, setNewInlineArea] = useState("");
  const [addingAreaLoading, setAddingAreaLoading] = useState(false);
  const [isAreaPickerOpen, setIsAreaPickerOpen] = useState(false);
  const [areaSearchQuery, setAreaSearchQuery] = useState("");


  // Category (Sourced dynamically from Services) & Searchable Picker
  const [servicesAsCategories, setServicesAsCategories] = useState<PortfolioCategory[]>([]);
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [isCreateServiceOpen, setIsCreateServiceOpen] = useState(false);

  const fetchServices = () => {
    listServices({ limit: 100 })
      .then((res) => {
        if (res.success && res.data) {
          const raw = res.data as any;
          const items = Array.isArray(raw) ? raw : (Array.isArray(raw.data) ? raw.data : []);
          if (items.length > 0) {
            setServicesAsCategories(
              items.map((s: any) => ({
                id: s.id,
                name: s.name,
                slug: s.slug,
              }))
            );
          }
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (open) {
      fetchServices();
    }
  }, [open]);

  useEffect(() => {
    if (isCategoryPickerOpen) {
      fetchServices();
    }
  }, [isCategoryPickerOpen]);

  const effectiveCategories = useMemo(() => {
    if (servicesAsCategories.length > 0) return servicesAsCategories;
    if (categories && categories.length > 0) return categories;
    return [];
  }, [servicesAsCategories, categories]);

  const filteredCategories = useMemo(() => {
    const q = categorySearchQuery.trim().toLowerCase();
    if (!q) return effectiveCategories;
    return effectiveCategories.filter((cat) => cat.name.toLowerCase().includes(q));
  }, [effectiveCategories, categorySearchQuery]);

  const handleSelectCategory = (catName: string) => {
    const cleanName = catName.trim();
    if (!cleanName) return;
    setCategory(cleanName);
    clearError("category");
    setIsCategoryPickerOpen(false);
    setCategorySearchQuery("");
  };

  // Area Modal & Searchable Picker computations
  useEffect(() => {
    if (open) {
      listPortfolioAreas(1, 100)
        .then((res) => {
          if (res.success && Array.isArray(res.data) && res.data.length > 0) {
            setAreaObjects(res.data);
          } else {
            setAreaObjects(COMMON_DHAKA_AREAS.map((name, idx) => ({ id: idx + 1, name })));
          }
        })
        .catch(() => {
          setAreaObjects(COMMON_DHAKA_AREAS.map((name, idx) => ({ id: idx + 1, name })));
        });
    }
  }, [open]);

  const effectiveAreas = useMemo(() => {
    if (areaObjects.length > 0) return areaObjects;
    return COMMON_DHAKA_AREAS.map((name, idx) => ({ id: idx + 1, name }));
  }, [areaObjects]);

  const filteredAreas = useMemo(() => {
    const q = areaSearchQuery.trim().toLowerCase();
    if (!q) return effectiveAreas;
    return effectiveAreas.filter((a) => a.name.toLowerCase().includes(q));
  }, [effectiveAreas, areaSearchQuery]);

  const exactAreaMatch = useMemo(() => {
    const q = areaSearchQuery.trim().toLowerCase();
    if (!q) return false;
    return effectiveAreas.some((a) => a.name.toLowerCase() === q);
  }, [effectiveAreas, areaSearchQuery]);

  const handleSelectArea = (areaName: string) => {
    const cleanName = areaName.trim();
    if (!cleanName) return;
    setArea(cleanName);
    setIsAreaPickerOpen(false);
    setAreaSearchQuery("");

    if (!areaObjects.some((a) => a.name.toLowerCase() === cleanName.toLowerCase())) {
      const newAreaItem: PortfolioArea = { id: Date.now(), name: cleanName };
      setAreaObjects((prev) => [newAreaItem, ...prev]);
      createPortfolioArea(cleanName).catch(() => {});
    }
  };

  const handleCreateInlineArea = async () => {
    const trimmed = newInlineArea.trim();
    if (!trimmed) return;
    setAddingAreaLoading(true);
    try {
      const res = await createPortfolioArea(trimmed);
      if (res.success && res.data) {
        toast.success(res.message || "Area created");
        const createdArea: PortfolioArea = res.data;
        setAreaObjects((prev) => {
          if (!prev.some((a) => a.id === createdArea.id || a.name.toLowerCase() === createdArea.name.toLowerCase())) {
            return [createdArea, ...prev];
          }
          return prev;
        });
        setArea(createdArea.name);
        setIsAddingAreaInline(false);
        setNewInlineArea("");
      } else {
        toast.error(res.message || "Failed to create area");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setAddingAreaLoading(false);
    }
  };

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
      setAppStoreUrl(project.app_store_url || "");
      setIsFeatured(Boolean(project.is_featured));

      // New Portfolio Engine values
      setProjectStatus(project.project_status || "completed");
      
      const rawAddr = project.address || "";
      setAddress(rawAddr);
      let matchedDist = "Dhaka";
      for (const d of BANGLADESH_DISTRICTS) {
        if (rawAddr.toLowerCase().includes(d.toLowerCase())) {
          matchedDist = d;
          break;
        }
      }
      setDistrict(matchedDist);

      let matchedArea = "";
      for (const a of COMMON_DHAKA_AREAS) {
        if (rawAddr.toLowerCase().includes(a.toLowerCase())) {
          matchedArea = a;
          break;
        }
      }
      setArea(matchedArea);

      const latStr = project.latitude !== undefined && project.latitude !== null ? String(project.latitude) : "";
      const lngStr = project.longitude !== undefined && project.longitude !== null ? String(project.longitude) : "";
      setLatitude(latStr);
      setLongitude(lngStr);
      setCoordinatesInput(latStr && lngStr ? `${latStr}, ${lngStr}` : latStr || lngStr || "");
      setDescription(project.description || "");
      setOriginalSnapshot({
        project_name: project.project_name || "",
        slug: project.slug?.startsWith("/portfolio/")
          ? project.slug
          : `/portfolio/${project.slug || ""}`,
        client_name: project.client_name || "",
        category: project.category || "Select category",
        cover_image: project.cover_image || "",
        tags: project.tags || [],
        app_store_url: project.app_store_url || "",
        is_featured: Boolean(project.is_featured),
        project_status: project.project_status || "completed",
        district: matchedDist,
        area: matchedArea,
        address: rawAddr,
        latitude: project.latitude !== undefined && project.latitude !== null ? String(project.latitude) : "",
        longitude: project.longitude !== undefined && project.longitude !== null ? String(project.longitude) : "",
        description: project.description || "",
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
      setAppStoreUrl("");
      setIsFeatured(false);
      setProjectStatus("completed");
      setDistrict("Dhaka");
      setArea("");
      setAddress("");
      setLatitude("");
      setLongitude("");
      setCoordinatesInput("");
      setDescription("");
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
          appStoreUrl.trim() ||
          description.trim() ||
          address.trim()
      );
    }
    if (!originalSnapshot) return false;
    return (
      projectName.trim() !== originalSnapshot.project_name.trim() ||
      slug.trim() !== originalSnapshot.slug.trim() ||
      clientName.trim() !== originalSnapshot.client_name.trim() ||
      category !== originalSnapshot.category ||
      (coverFile !== null || coverImage.trim() !== originalSnapshot.cover_image.trim()) ||
      JSON.stringify(tags) !== JSON.stringify(originalSnapshot.tags) ||
      appStoreUrl.trim() !== originalSnapshot.app_store_url.trim() ||
      isFeatured !== originalSnapshot.is_featured ||
      projectStatus !== originalSnapshot.project_status ||
      address.trim() !== originalSnapshot.address.trim() ||
      latitude.trim() !== originalSnapshot.latitude.trim() ||
      longitude.trim() !== originalSnapshot.longitude.trim() ||
      description.trim() !== originalSnapshot.description.trim()
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
    appStoreUrl,
    isFeatured,
    projectStatus,
    address,
    latitude,
    longitude,
    description,
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

  const handleCoordinatesChange = (val: string) => {
    setCoordinatesInput(val);
    const clean = val.replace(/[()]/g, "").trim();
    if (!clean) {
      setLatitude("");
      setLongitude("");
    } else if (clean.includes(",")) {
      const parts = clean.split(",");
      setLatitude(parts[0]?.trim() || "");
      setLongitude(parts.slice(1).join(",").trim());
    } else {
      setLatitude(clean);
      setLongitude("");
    }
    clearError("latitude");
    clearError("longitude");
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

    const finalAddress = address.trim() || (area && district ? `${area}, ${district}` : district || "");

    const tentativePayload = {
      id: editingId || undefined,
      project_name: projectName.trim(),
      slug: cleanSlug,
      client_name: clientName.trim(),
      category: category.trim(),
      cover_image: (coverFile ? "staged_cover" : (coverImage || "")).trim(),
      tags,
      app_store_url: appStoreUrl.trim(),
      is_featured: isFeatured,
      media_type: "image" as const,
      media_url: "",
      project_status: projectStatus,
      address: finalAddress,
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
      description: description.trim(),
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

      const payload = {
        id: editingId || undefined,
        project_name: projectName.trim(),
        slug: cleanSlug,
        client_name: clientName.trim(),
        category: category.trim(),
        cover_image: finalCoverUrl?.trim() || undefined,
        tags,
        app_store_url: appStoreUrl.trim(),
        is_featured: isFeatured,
        media_type: "image" as const,
        media_url: undefined,
        project_status: projectStatus,
        address: finalAddress || undefined,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        description: description.trim() || undefined,
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
              Configure showcase project information, required cover visual, rich text description, and tags.
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

              {/* Row 2: Status & Client Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold tracking-wider text-slate-700 uppercase">
                    PROJECT STATUS <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={projectStatus}
                      onChange={(e) => {
                        setProjectStatus(e.target.value as "completed" | "ongoing");
                        clearError("project_status");
                      }}
                      className={cn(
                        "w-full h-10 pl-3.5 pr-10 rounded-md border border-input bg-white text-sm font-medium text-slate-800 shadow-xs appearance-none focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer",
                        fieldErrors.project_status && "border-red-500 focus-visible:ring-red-500/20"
                      )}
                    >
                      {PROJECT_STATUSES.map((st) => (
                        <option key={st.value} value={st.value}>
                          {st.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  {fieldErrors.project_status && (
                    <p className="text-xs font-semibold text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.project_status}</span>
                    </p>
                  )}
                </div>

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
              </div>

              {/* Row 3: Category & Featured Status (Side by Side) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                {/* Category Selector (Sourced from Services) */}
                {/* Service Selector (Sourced strictly from Services /services) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between h-6">
                    <label className="text-xs font-bold tracking-wider text-slate-700 uppercase">
                      CATEGORY SELECTOR <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCreateServiceOpen(true)}
                      className="h-6 text-[10px] gap-1 px-2 text-primary hover:text-primary/90 hover:bg-sky-50 font-semibold flex items-center rounded-md border border-primary/20 hover:border-primary/40 cursor-pointer transition-colors"
                      title="Open Add Service Modal"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Add Service</span>
                    </button>
                  </div>

                  <Popover open={isCategoryPickerOpen} onOpenChange={setIsCategoryPickerOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          "w-full h-10 px-3.5 rounded-md border border-input bg-white text-sm font-medium shadow-xs flex items-center justify-between text-left focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer",
                          !category ||
                            category.toLowerCase() === "select category" ||
                            category.toLowerCase() === "select service"
                            ? "text-slate-400"
                            : "text-slate-800 font-semibold",
                          fieldErrors.category &&
                            "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                        )}
                      >
                        <span className="truncate">
                          {category &&
                          category.toLowerCase() !== "select category" &&
                          category.toLowerCase() !== "select service"
                            ? category
                            : "Select category"}
                        </span>
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="start"
                      sideOffset={6}
                      collisionPadding={16}
                      onWheel={(e) => e.stopPropagation()}
                      className="w-[calc(100vw-4rem)] sm:w-[var(--radix-popover-trigger-width)] max-w-full p-2.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 space-y-2 max-h-[var(--radix-popover-content-available-height,85vh)]"
                    >
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          value={categorySearchQuery}
                          onChange={(e) => setCategorySearchQuery(e.target.value)}
                          placeholder="Type to search services..."
                          className="w-full h-8.5 pl-8 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-primary focus:bg-white transition-all font-medium text-slate-800"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && filteredCategories.length > 0) {
                              e.preventDefault();
                              handleSelectCategory(filteredCategories[0].name);
                            }
                          }}
                        />
                      </div>

                      <div className="max-h-60 overflow-y-auto space-y-1 p-1 overscroll-contain">
                        {filteredCategories.length === 0 ? (
                          <div className="py-4 px-3 text-center space-y-2">
                            <p className="text-xs text-slate-500 font-medium">
                              No services found.
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setIsCategoryPickerOpen(false);
                                setIsCreateServiceOpen(true);
                              }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-primary bg-sky-50 hover:bg-sky-100 rounded-md transition-colors cursor-pointer"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              <span>Add Service</span>
                            </button>
                          </div>
                        ) : (
                          filteredCategories.map((cat) => {
                            const isSelected =
                              category.toLowerCase() === cat.name.toLowerCase();
                            return (
                              <button
                                key={cat.id || cat.name}
                                type="button"
                                onClick={() => handleSelectCategory(cat.name)}
                                className={cn(
                                  "w-full px-2.5 py-2 rounded-lg text-xs font-semibold flex items-center justify-between text-left transition-colors cursor-pointer",
                                  isSelected
                                    ? "bg-primary/10 text-primary font-bold"
                                    : "text-slate-700 hover:bg-slate-100"
                                )}
                              >
                                <span className="truncate">{cat.name}</span>
                                {isSelected && (
                                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 px-1">
                        <span>Need a new service?</span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCategoryPickerOpen(false);
                            setIsCreateServiceOpen(true);
                          }}
                          className="text-primary hover:underline font-semibold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <PlusCircle className="w-3 h-3" />
                          <span>Add Service</span>
                        </button>
                      </div>
                    </PopoverContent>
                  </Popover>
                  {fieldErrors.category && (
                    <p className="text-xs font-semibold text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.category}</span>
                    </p>
                  )}
                </div>

                {/* Featured Status (Follows Testimonial Card Design) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between h-6">
                    <label className="text-xs font-bold tracking-wider text-slate-700 uppercase">
                      HOMEPAGE VISIBILITY
                    </label>
                    <span className="text-[10px] font-medium text-slate-400">
                      Public Carousel
                    </span>
                  </div>
                  <div
                    className={cn(
                      "h-10 px-3.5 rounded-md border transition-all flex items-center justify-between gap-3",
                      isFeatured
                        ? "bg-amber-50/70 border-amber-200"
                        : "bg-slate-50 border-slate-200"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Label
                        htmlFor="modal-is-featured"
                        className="text-xs font-bold text-slate-900 cursor-pointer truncate"
                      >
                        Feature in Public Showcase
                      </Label>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0",
                          isFeatured
                            ? "bg-amber-200/90 text-amber-900"
                            : "bg-slate-200 text-slate-600"
                        )}
                      >
                        {isFeatured ? "Featured" : "Standard"}
                      </span>
                    </div>
                    <Switch
                      id="modal-is-featured"
                      checked={isFeatured}
                      onCheckedChange={(c) => setIsFeatured(Boolean(c))}
                    />
                  </div>
                </div>
              </div>

              {/* Row 4: Tags */}
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
            </div>

            {/* Section: Location & Coverage */}
            <div className="space-y-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold tracking-wider text-slate-700 uppercase">
                  PROJECT LOCATION &amp; COVERAGE
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* District Dropdown */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between h-6">
                    <label className="text-xs font-bold tracking-wider text-slate-700 uppercase">
                      DISTRICT (BANGLADESH)
                    </label>
                  </div>
                  <div className="relative">
                    <select
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full h-10 pl-3.5 pr-10 rounded-md border border-input bg-white text-sm font-medium text-slate-800 shadow-xs appearance-none focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                    >
                      {BANGLADESH_DISTRICTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Area Combobox with inline Add and Manage Modal */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between h-6">
                    <label className="text-xs font-bold tracking-wider text-slate-700 uppercase">
                      AREA / ZONE
                    </label>
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsAddingAreaInline(!isAddingAreaInline);
                          setNewInlineArea("");
                        }}
                        className="h-6 text-[10px] gap-1 px-1.5 text-primary hover:text-primary/90 hover:bg-sky-50 font-semibold cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>{isAddingAreaInline ? "Choose Existing" : "Add New"}</span>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsAreaModalOpen(true)}
                        className="h-6 text-[10px] gap-1 px-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 font-medium cursor-pointer"
                        title="Manage Areas / Zones"
                      >
                        <FolderKanban className="w-3.5 h-3.5" />
                        <span>Manage</span>
                      </Button>
                    </div>
                  </div>

                  {isAddingAreaInline ? (
                    <div className="flex items-center gap-1.5">
                      <Input
                        value={newInlineArea}
                        onChange={(e) => setNewInlineArea(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleCreateInlineArea();
                          } else if (e.key === "Escape") {
                            setIsAddingAreaInline(false);
                          }
                        }}
                        placeholder="Enter new area / zone name..."
                        className="h-10 text-sm font-medium flex-1"
                        autoFocus
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleCreateInlineArea}
                        disabled={addingAreaLoading || !newInlineArea.trim()}
                        className="h-10 px-3 bg-primary text-white hover:bg-primary/90 font-bold text-xs shrink-0 cursor-pointer"
                      >
                        {addingAreaLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Save"
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAddingAreaInline(false)}
                        className="h-10 px-2.5 text-slate-500 hover:text-slate-800 shrink-0 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Popover open={isAreaPickerOpen} onOpenChange={setIsAreaPickerOpen}>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            "w-full h-10 px-3.5 rounded-md border border-input bg-white text-sm font-medium shadow-xs flex items-center justify-between text-left focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer",
                            !area
                              ? "text-slate-400"
                              : "text-slate-800 font-semibold"
                          )}
                        >
                          <span className="truncate">
                            {area ? area : "Select Area (or click + Add)"}
                          </span>
                          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        align="start"
                        sideOffset={6}
                        collisionPadding={16}
                        onWheel={(e) => e.stopPropagation()}
                        className="w-[calc(100vw-4rem)] sm:w-[var(--radix-popover-trigger-width)] max-w-full p-2.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 space-y-2 max-h-[var(--radix-popover-content-available-height,85vh)]"
                      >
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            value={areaSearchQuery}
                            onChange={(e) => setAreaSearchQuery(e.target.value)}
                            placeholder="Type to search or enter new area..."
                            className="w-full h-8.5 pl-8 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-primary focus:bg-white transition-all font-medium text-slate-800"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && areaSearchQuery.trim()) {
                                e.preventDefault();
                                handleSelectArea(areaSearchQuery.trim());
                              }
                            }}
                          />
                        </div>

                        <div className="max-h-72 overflow-y-auto space-y-1 p-1 pb-2 overscroll-contain">
                          {filteredAreas.length === 0 && !areaSearchQuery.trim() ? (
                            <p className="text-xs text-slate-400 text-center py-3">
                              No areas found.
                            </p>
                          ) : (
                            filteredAreas.map((aItem) => {
                              const isSelected =
                                area.toLowerCase() === aItem.name.toLowerCase();
                              return (
                                <button
                                  key={aItem.id || aItem.name}
                                  type="button"
                                  onClick={() => handleSelectArea(aItem.name)}
                                  className={cn(
                                    "w-full px-2.5 py-2 rounded-lg text-xs font-semibold flex items-center justify-between text-left transition-colors cursor-pointer",
                                    isSelected
                                      ? "bg-primary/10 text-primary font-bold"
                                      : "text-slate-700 hover:bg-slate-100"
                                  )}
                                >
                                  <span className="truncate">{aItem.name}</span>
                                  {isSelected && (
                                    <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                                  )}
                                </button>
                              );
                            })
                          )}

                          {areaSearchQuery.trim() && !exactAreaMatch && (
                            <button
                              type="button"
                              onClick={() => handleSelectArea(areaSearchQuery.trim())}
                              className="w-full px-2.5 py-2 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 flex items-center gap-1.5 transition-colors cursor-pointer border-t border-slate-100 mt-1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span className="truncate">
                                Create &quot;{areaSearchQuery.trim()}&quot;
                              </span>
                            </button>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              </div>

              {/* Specific Address & Coordinates */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 uppercase">
                    STREET ADDRESS / LANDMARK (OPTIONAL)
                  </label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Sector #9, Uttara, Dhaka"
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 uppercase">
                    COORDINATES (LAT, LNG) (OPTIONAL)
                  </label>
                  <Input
                    value={coordinatesInput}
                    onChange={(e) => handleCoordinatesChange(e.target.value)}
                    placeholder="e.g. 23.8103, 90.4125"
                    className="h-9 text-xs font-mono"
                  />
                  {(fieldErrors.latitude || fieldErrors.longitude) && (
                    <span className="text-[10px] text-red-500 font-bold uppercase mt-1 block">
                      {fieldErrors.latitude || fieldErrors.longitude}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Section: Rich Project Description */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-bold tracking-wider text-slate-700 uppercase">
                Project Description (Rich Text)
              </label>
              <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-2xs [&_.ql-editor]:min-h-[180px]">
                <RichTextEditor
                  value={description}
                  onChange={(val) => {
                    setDescription(val);
                    clearError("description");
                  }}
                  placeholder="Detailed project summary, technical scope, reticulation network layout, pipeline specifications, safety certifications..."
                />
              </div>
              {fieldErrors.description && (
                <p className="text-xs font-semibold text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.description}</span>
                </p>
              )}
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



      {/* Nested Area Management Modal */}
      <PortfolioAreaModal
        open={isAreaModalOpen}
        onOpenChange={setIsAreaModalOpen}
        areas={areaObjects}
        onAreasChange={setAreaObjects}
        onSelectArea={(a) => setArea(a)}
      />

      {/* Create Service Modal (Adds service and automatically selects it) */}
      <CreateServiceModal
        open={isCreateServiceOpen}
        onOpenChange={setIsCreateServiceOpen}
        onSuccess={(createdService) => {
          if (createdService?.name) {
            const newCat: PortfolioCategory = {
              id: createdService.id || Date.now(),
              name: createdService.name,
              slug: createdService.slug,
            };
            setServicesAsCategories((prev) => [
              newCat,
              ...prev.filter(
                (c) => c.name.toLowerCase() !== newCat.name.toLowerCase()
              ),
            ]);
            setCategory(createdService.name);
            clearError("category");
            if (onCategoriesChange) {
              onCategoriesChange([
                newCat,
                ...servicesAsCategories.filter(
                  (c) => c.name.toLowerCase() !== newCat.name.toLowerCase()
                ),
              ]);
            }
            fetchServices();
          }
        }}
      />
    </>
  );
}
