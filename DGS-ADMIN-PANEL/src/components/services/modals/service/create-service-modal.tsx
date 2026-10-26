"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { type CategoryOptionSource } from "@/lib/service-categories";
import { Service } from "@/types/service";
import { saveService, saveServiceCategory, uploadServiceIcon } from "@/services/service/service.service";
import { serviceSchema } from "@/zod/service.validation";
import { validateDraft, firstError, clearFieldError } from "@/lib/form-validation";
import { ImageUploadField, type ImageUploadFieldHandle } from "@/components/common/image-upload-field";
import RichTextEditor from "@/components/common/rich-text-editor";
import { PlusCircle, Sparkles, Factory, ShieldCheck, Flame, Trash2, Plus, FolderKanban, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface CreateServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories?: CategoryOptionSource[];
  defaultCategory?: string;
  onOpenManageCategories?: () => void;
  onCategoriesUpdated?: (newCategories: CategoryOptionSource[]) => void;
}

interface FeatureItem {
  title: string;
  description: string;
}

function generateSlug(val: string): string {
  return val
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function CreateServiceModal({
  open,
  onOpenChange,
  categories: categoriesProp,
  defaultCategory,
  onOpenManageCategories,
  onCategoriesUpdated,
}: CreateServiceModalProps) {
  const router = useRouter();

  const effectiveCategories = categoriesProp || [];
  const initialCategory = defaultCategory || "";

  const [categories, setCategories] = useState<string[]>(() => {
    const list = effectiveCategories.map((p) => p.name).filter(Boolean);
    if (initialCategory && !list.includes(initialCategory)) {
      list.push(initialCategory);
    }
    return Array.from(new Set(list));
  });

  const [category, setCategory] = useState<string>(initialCategory || categories[0] || "");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const iconRef = useRef<ImageUploadFieldHandle>(null);
  const imageRef = useRef<ImageUploadFieldHandle>(null);
  const [isActive, setIsActive] = useState(true);

  // DGS Engineering Specification Fields
  const [isFlagship, setIsFlagship] = useState(false);
  const [badgeLabel, setBadgeLabel] = useState("");
  const [badgeStatus, setBadgeStatus] = useState("");
  const [subTitle, setSubTitle] = useState("");
  const [categoryTag, setCategoryTag] = useState("");
  const [tierLabel, setTierLabel] = useState("");
  const [features, setFeatures] = useState<FeatureItem[]>([
    { title: "", description: "" },
  ]);
  const [complianceCodes, setComplianceCodes] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");

  const handleAddFeature = () => {
    setFeatures((prev) => [...prev, { title: "", description: "" }]);
    setErrors((prev) => clearFieldError(prev, "features"));
  };

  const handleUpdateFeature = (index: number, field: "title" | "description", value: string) => {
    setFeatures((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    setErrors((prev) => clearFieldError(prev, "features"));
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : [{ title: "", description: "" }]));
    setErrors((prev) => clearFieldError(prev, "features"));
  };

  const [isAddingCategoryInline, setIsAddingCategoryInline] = useState(false);
  const [newInlineCategory, setNewInlineCategory] = useState("");
  const [addingCategoryLoading, setAddingCategoryLoading] = useState(false);

  const availableCategories = useMemo<string[]>(() => {
    const list = [...categories];
    if (defaultCategory && !list.includes(defaultCategory)) {
      list.push(defaultCategory);
    }
    if (category && !list.includes(category)) {
      list.push(category);
    }
    return Array.from(new Set(list));
  }, [categories, defaultCategory, category]);

  const handleCreateInlineCategory = async () => {
    const trimmed = newInlineCategory.trim();
    if (!trimmed) {
      toast.error("Please enter a category name");
      return;
    }

    const existingMatch = availableCategories.find(
      (c: string) => c.toLowerCase() === trimmed.toLowerCase()
    );
    if (existingMatch) {
      setCategory(existingMatch);
      setIsAddingCategoryInline(false);
      setNewInlineCategory("");
      setErrors((prev) => clearFieldError(prev, "category"));
      return;
    }

    setAddingCategoryLoading(true);
    try {
      const res = await saveServiceCategory({
        name: trimmed,
        slug: trimmed
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-"),
        display_label: trimmed,
        display_order: 0,
        is_active: true,
      });

      if (res.success || (res.message && /already exists/i.test(res.message))) {
        toast.success(res.message || "Category set successfully");
        const nextList = Array.from(new Set([...categories, trimmed]));
        setCategories(nextList);
        setCategory(trimmed);
        setIsAddingCategoryInline(false);
        setNewInlineCategory("");
        setErrors((prev) => clearFieldError(prev, "category"));
        if (onCategoriesUpdated) {
          const newCategoryItem: CategoryOptionSource = (res.data as any) || {
            name: trimmed,
            slug: trimmed
              .toLowerCase()
              .trim()
              .replace(/[^a-z0-9\s-]/g, "")
              .replace(/\s+/g, "-"),
            display_label: trimmed,
            display_order: 0,
          };
          onCategoriesUpdated([...effectiveCategories, newCategoryItem]);
        }
      } else {
        toast.error(res.message || "Failed to create category");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setAddingCategoryLoading(false);
    }
  };

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [autoSlug, setAutoSlug] = useState(true);

  useEffect(() => {
    if (categoriesProp && categoriesProp.length > 0) {
      const list = categoriesProp.map((p) => p.name).filter(Boolean);
      setCategories(Array.from(new Set(list)));
    }
  }, [categoriesProp]);

  useEffect(() => {
    if (open) {
      setCategory(defaultCategory || categories[0] || "");
      setName("");
      setSlug("");
      setDescription("");
      setIconUrl("");
      setImageUrl("");
      setIsActive(true);
      setAutoSlug(true);
      setIsFlagship(false);
      setBadgeLabel("");
      setBadgeStatus("");
      setSubTitle("");
      setCategoryTag("");
      setTierLabel("");
      setFeatures([
        { title: "", description: "" },
        { title: "", description: "" },
      ]);
      setComplianceCodes("");
      setCtaLabel("");
      setCtaUrl("");
      setIsAddingCategoryInline(false);
      setNewInlineCategory("");
      setErrors({});
    }
  }, [open, defaultCategory, categories]);

  const handleNameChange = (val: string) => {
    setName(val);
    setErrors((prev) => clearFieldError(prev, "name"));
    if (autoSlug) {
      setSlug(generateSlug(val));
      setErrors((prev) => clearFieldError(prev, "slug"));
    }
  };

  const handleToggleAutoSlug = () => {
    const next = !autoSlug;
    setAutoSlug(next);
    if (next && name.trim()) {
      setSlug(generateSlug(name));
      setErrors((prev) => clearFieldError(prev, "slug"));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const activeFeatures = features
      .map((f) => ({
        title: f.title.trim(),
        description: f.description.trim() ? f.description.trim() : undefined,
      }))
      .filter((f) => f.title.length > 0 || (f.description && f.description.length > 0));

    const validFeatures = activeFeatures;

    const hasImage = Boolean(imageUrl.trim()) || Boolean(imageRef.current?.hasPending());

    const finalSlug = (slug.trim() || generateSlug(name)).trim();

    // Validate before any side effect, and before the uploads are flushed.
    const { ok, fieldErrors, draft } = validateDraft(serviceSchema, {
      name: name.trim(),
      slug: finalSlug,
      category: category,
      description: description.trim(),
      icon_url: iconUrl.trim(),
      badge_label: badgeLabel.trim(),
      badge_status: badgeStatus.trim(),
      sub_title: subTitle.trim(),
      category_tag: categoryTag.trim(),
      tier_label: tierLabel.trim(),
      image_url: hasImage ? (imageUrl.trim() || "pending-upload") : "",
      is_flagship: isFlagship,
      features: validFeatures,
      compliance_codes: complianceCodes.trim(),
      cta_label: ctaLabel.trim(),
      cta_url: ctaUrl.trim(),
      is_active: isActive,
    });
    if (!ok) {
      setErrors(fieldErrors);
      toast.error(firstError(fieldErrors) || "Please fill in the required fields");
      setLoading(false);
      return;
    }

    const payload = draft;

    try {
      const flushedIcon = await iconRef.current?.flush();
      if (flushedIcon === null) {
        setLoading(false);
        return;
      }

      const flushedImage = await imageRef.current?.flush();
      if (flushedImage === null) {
        setLoading(false);
        return;
      }

      const res = await saveService({
        ...payload,
        icon_url: flushedIcon !== undefined ? flushedIcon : payload.icon_url,
        image_url: flushedImage !== undefined ? flushedImage : payload.image_url,
      });

      if (res.success) {
        toast.success(res.message || "Service created successfully");
        onOpenChange(false);
        router.refresh();
      } else {
        if (res.errors) {
          const flatErrors: Record<string, string> = {};
          Object.entries(res.errors).forEach(([k, v]) => {
            flatErrors[k] = Array.isArray(v) ? v[0] : (v as string);
          });
          setErrors(flatErrors);
        }
        toast.error(res.message || "Failed to create service");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border-slate-200 p-6 shadow-2xl">
          <DialogHeader className="pr-10">
            <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5 flex-wrap">
              <span>Create New Service</span>
              {isFlagship && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                  ★ Flagship Specialty
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 py-2">
            {/* Single Service Category with On-the-Go Add & Manage */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="create-svc-category" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Service Category <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsAddingCategoryInline(!isAddingCategoryInline);
                      setNewInlineCategory("");
                    }}
                    className="h-6 text-[10px] gap-1 px-1.5 text-[#00668a] hover:text-[#004c69] hover:bg-sky-50 font-semibold"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>{isAddingCategoryInline ? "Choose Existing" : "Add New"}</span>
                  </Button>
                  {onOpenManageCategories && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={onOpenManageCategories}
                      className="h-6 text-[10px] gap-1 px-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 font-medium"
                      title="Manage Categories"
                    >
                      <FolderKanban className="w-3.5 h-3.5" />
                      <span>Manage</span>
                    </Button>
                  )}
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
                    placeholder="Enter category name..."
                    disabled={addingCategoryLoading}
                    className="h-10 text-xs font-semibold rounded-lg border-slate-200 flex-1"
                    autoFocus
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateInlineCategory}
                    disabled={addingCategoryLoading || !newInlineCategory.trim()}
                    className="h-10 px-3 bg-[#00668a] text-white hover:bg-[#004c69] font-bold text-xs shrink-0 rounded-lg gap-1"
                  >
                    {addingCategoryLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Save"
                    )}
                  </Button>
                </div>
              ) : (
                <Select
                  value={category}
                  onValueChange={(val) => {
                    setCategory(val);
                    setErrors((prev) => clearFieldError(prev, "category"));
                  }}
                >
                  <SelectTrigger id="create-svc-category" className="h-10 rounded-lg border-slate-200">
                    <SelectValue placeholder="Select Service Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((cat: string) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.category && <p className="text-xs text-red-500">{errors.category}</p>}
            </div>

            {/* Service Name and Slug */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="create-svc-name" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Service Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="create-svc-name"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Central LPG Reticulation System"
                  className="h-10 rounded-lg border-slate-200"
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="create-svc-slug" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    SEO Slug <span className="text-red-500">*</span>
                  </Label>
                  <button
                    type="button"
                    onClick={handleToggleAutoSlug}
                    className="text-[11px] font-medium text-[#00668a] hover:underline"
                  >
                    {autoSlug ? "Manual Slug" : "Auto Slug"}
                  </button>
                </div>
                <Input
                  id="create-svc-slug"
                  value={slug}
                  onChange={(e) => {
                    setAutoSlug(false);
                    setSlug(e.target.value);
                    setErrors((prev) => clearFieldError(prev, "slug"));
                  }}
                  placeholder="e.g. central-lpg-reticulation-system"
                  className="h-10 font-mono text-xs rounded-lg border-slate-200"
                />
                {errors.slug && <p className="text-xs text-red-500">{errors.slug}</p>}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="create-svc-desc" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Description (Rich Text) <span className="text-red-500">*</span>
              </Label>
              <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-2xs">
                <RichTextEditor
                  value={description}
                  onChange={(val) => setDescription(val)}
                  placeholder="Describe the engineering scope, infrastructure setup, and compliance benefits..."
                />
              </div>
              {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
            </div>

            {/* SECTION: DGS ENGINEERING & PRESENTATION SPECIFICATIONS */}
            <div className="rounded-xl border border-sky-100 bg-sky-50/40 p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-sky-100 pb-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Factory className="w-4 h-4 text-[#0072b2]" />
                  Engineering Specifications (DGS Spec &amp; Screenshot)
                </span>
                
                {/* Flagship Switch */}
                <div className="flex items-center gap-2">
                  <Label htmlFor="create-svc-flagship" className="text-xs font-bold text-amber-900 cursor-pointer">
                    Flagship Hero Card
                  </Label>
                  <Switch
                    id="create-svc-flagship"
                    checked={isFlagship}
                    onCheckedChange={(val) => {
                      setIsFlagship(val);
                      if (val) setIsActive(true);
                    }}
                  />
                </div>
              </div>

              {/* Badge Label & Tier */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="create-svc-badge" className="text-[11px] font-semibold text-slate-700">
                    Badge Label
                  </Label>
                  <Input
                    id="create-svc-badge"
                    value={badgeLabel}
                    onChange={(e) => setBadgeLabel(e.target.value)}
                    placeholder="e.g. HIGHEST DEMAND IN BD"
                    className="h-9 text-xs rounded-lg border-slate-200 bg-white"
                  />
                  {errors.badge_label && <p className="text-xs text-red-500 mt-1">{errors.badge_label}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="create-svc-tier" className="text-[11px] font-semibold text-slate-700">
                    Tier / Quality Level
                  </Label>
                  <Input
                    id="create-svc-tier"
                    value={tierLabel}
                    onChange={(e) => setTierLabel(e.target.value)}
                    placeholder="e.g. Turnkey Blueprint / Industrial Grade"
                    className="h-9 text-xs rounded-lg border-slate-200 bg-white"
                  />
                  {errors.tier_label && <p className="text-xs text-red-500 mt-1">{errors.tier_label}</p>}
                </div>
              </div>

              {/* Specifications: Category Tag, Highlight Label, Status Pill */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="space-y-1">
                  <Label htmlFor="create-svc-cat-tag" className="text-[11px] font-semibold text-slate-700">
                    Category Tag (Header Star)
                  </Label>
                  <Input
                    id="create-svc-cat-tag"
                    value={categoryTag}
                    onChange={(e) => {
                      setCategoryTag(e.target.value);
                      setErrors((prev) => clearFieldError(prev, "category_tag"));
                    }}
                    placeholder="e.g. NATIONAL LEADER IN RETICULATION"
                    className="h-9 text-xs rounded-lg border-slate-200 bg-white"
                  />
                  {errors.category_tag && <p className="text-xs text-red-500 mt-1">{errors.category_tag}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="create-svc-subtitle" className="text-[11px] font-semibold text-slate-700">
                    Highlight Label (Overlay)
                  </Label>
                  <Input
                    id="create-svc-subtitle"
                    value={subTitle}
                    onChange={(e) => {
                      setSubTitle(e.target.value);
                      setErrors((prev) => clearFieldError(prev, "sub_title"));
                    }}
                    placeholder="e.g. Automated Digital Vaporizer & Dual Regulator"
                    className="h-9 text-xs rounded-lg border-slate-200 bg-white"
                  />
                  {errors.sub_title && <p className="text-xs text-red-500 mt-1">{errors.sub_title}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="create-svc-badge-status" className="text-[11px] font-semibold text-slate-700">
                    Status Pill (Overlay)
                  </Label>
                  <Input
                    id="create-svc-badge-status"
                    value={badgeStatus}
                    onChange={(e) => {
                      setBadgeStatus(e.target.value);
                      setErrors((prev) => clearFieldError(prev, "badge_status"));
                    }}
                    placeholder="e.g. AUTO-FAILSAFE"
                    className="h-9 text-xs rounded-lg border-slate-200 bg-white"
                  />
                  {errors.badge_status && <p className="text-xs text-red-500 mt-1">{errors.badge_status}</p>}
                </div>
              </div>

              {/* Feature Points / 2x2 Matrix with Separate Title and Description */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                      Engineering Features / Matrix ({features.length})
                    </Label>
                    <p className="text-[11px] text-slate-500">
                      Separate Title &amp; Description for each capability (e.g. 2x2 Flagship or card bullet points)
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddFeature}
                    className="h-7 text-xs border-dashed border-[#0072b2] text-[#0072b2] hover:bg-sky-100/50"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add Feature
                  </Button>
                </div>
                {errors.features && <p className="text-xs text-red-500 font-semibold mt-1">{errors.features}</p>}

                <div className="space-y-2.5">
                  {features.map((feat, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white p-2.5 shadow-2xs"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-50 text-[10px] font-bold text-[#0072b2] mt-1 border border-sky-100">
                        {idx + 1}
                      </span>
                      <div className="grid flex-1 grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <Input
                            value={feat.title}
                            onChange={(e) => handleUpdateFeature(idx, "title", e.target.value)}
                            placeholder="Feature Title (e.g. Auto-Regulated Manifold)"
                            className="h-8 text-xs font-medium rounded-md border-slate-200 bg-slate-50/50 focus:bg-white"
                          />
                        </div>
                        <div>
                          <Input
                            value={feat.description}
                            onChange={(e) => handleUpdateFeature(idx, "description", e.target.value)}
                            placeholder="Feature Description (e.g. Dual stage regulators & automated vaporizers)"
                            className="h-8 text-xs rounded-md border-slate-200 bg-slate-50/50 focus:bg-white"
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveFeature(idx)}
                        disabled={features.length === 1 && !feat.title && !feat.description}
                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                        title="Remove feature"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Compliance & CTAs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="create-svc-comp" className="text-[11px] font-semibold text-slate-700">
                    Compliance Standards
                  </Label>
                  <Input
                    id="create-svc-comp"
                    value={complianceCodes}
                    onChange={(e) => {
                      setComplianceCodes(e.target.value);
                      setErrors((prev) => clearFieldError(prev, "compliance_codes"));
                    }}
                    placeholder="NFPA 58 • BNBC Code 2020 • Dept. of Explosives"
                    className="h-9 text-xs rounded-lg border-slate-200 bg-white"
                  />
                  {errors.compliance_codes && <p className="text-xs text-red-500 mt-1">{errors.compliance_codes}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="create-svc-cta-lbl" className="text-[11px] font-semibold text-slate-700">
                    Action Button Label
                  </Label>
                  <Input
                    id="create-svc-cta-lbl"
                    value={ctaLabel}
                    onChange={(e) => {
                      setCtaLabel(e.target.value);
                      setErrors((prev) => clearFieldError(prev, "cta_label"));
                    }}
                    placeholder="e.g. Request Reticulation Design Blueprint"
                    className="h-9 text-xs rounded-lg border-slate-200 bg-white"
                  />
                  {errors.cta_label && <p className="text-xs text-red-500 mt-1">{errors.cta_label}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="create-svc-cta-url" className="text-[11px] font-semibold text-slate-700">
                    Action Button Link
                  </Label>
                  <Input
                    id="create-svc-cta-url"
                    value={ctaUrl}
                    onChange={(e) => {
                      setCtaUrl(e.target.value);
                      setErrors((prev) => clearFieldError(prev, "cta_url"));
                    }}
                    placeholder="/contact?topic=lpg-reticulation"
                    className="h-9 text-xs rounded-lg border-slate-200 bg-white"
                  />
                  {errors.cta_url && <p className="text-xs text-red-500 mt-1">{errors.cta_url}</p>}
                </div>
              </div>
            </div>

            {/* Visuals: Service Icon & Main Photo Upload */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="space-y-2">
                <ImageUploadField
                  ref={iconRef}
                  id="create-svc-icon"
                  value={iconUrl}
                  onChange={setIconUrl}
                  uploadAction={uploadServiceIcon}
                  label="Service Icon / SVG Asset"
                  hint="SVG or PNG (max 5MB)"
                  assetNoun="Service Icon"
                  acceptedLabel="Current Service Icon"
                  previewAlt="Service icon"
                  deferUpload
                  compact
                  error={errors.icon_url}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Engineering Visual / Card Photo <span className="text-red-500">*</span>
                </Label>
                <ImageUploadField
                  ref={imageRef}
                  id="create-svc-image"
                  value={imageUrl}
                  onChange={setImageUrl}
                  error={errors.image_url}
                  label="Primary Image"
                  hint="High-resolution photo of gas pipeline, manifold, or industrial plant"
                  deferUpload
                />
              </div>
            </div>

            {/* Active Visibility */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="space-y-0.5">
                  <Label htmlFor="create-svc-active" className="text-xs font-semibold text-slate-800">
                    Publish Service
                  </Label>
                  <p className="text-[11px] text-slate-500">Live on public website</p>
                </div>
                <Switch
                  id="create-svc-active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="h-10 rounded-lg px-5 font-semibold border-slate-200 text-slate-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="h-10 rounded-lg px-6 font-semibold bg-[#00668a] hover:bg-[#005270] text-white shadow-xs"
              >
                {loading ? "Creating Service..." : "Create Service"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
