"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  sortCategories,
  TECHNOLOGY_CATEGORIES,
  type Technology,
  type TechnologyInput,
} from "@/types/technology";
import {
  createTechnology,
  updateTechnology,
  uploadTechnologyIcon,
  createTechnologyCategory,
} from "@/services/technology/technology.service";
import { technologySchema } from "@/zod/technology.validation";
import { validateDraft, firstError, clearFieldError, type FieldErrors } from "@/lib/form-validation";
import { ImageUploadField, type ImageUploadFieldHandle } from "@/components/common/image-upload-field";
import { PlusCircle, FolderKanban, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Null for create, populated for edit. */
  technology: Technology | null;
  /** Categories already in use, so an existing value stays selectable. */
  availableCategories: string[];
  onSaved: (saved: Technology) => void;
  onOpenManageCategories?: () => void;
  onCategoryCreated?: (newCategory: string) => void;
}

export default function TechnologyFormModal({
  open,
  onOpenChange,
  technology,
  availableCategories = [],
  onSaved,
  onOpenManageCategories,
  onCategoryCreated,
}: Props) {
  const isEdit = technology !== null;
  const safeCategories = Array.isArray(availableCategories) ? availableCategories : [];
  const categoryOptions = sortCategories([...TECHNOLOGY_CATEGORIES, ...safeCategories]);

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>(TECHNOLOGY_CATEGORIES[0]);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [isAddingCategoryInline, setIsAddingCategoryInline] = useState(false);
  const [newInlineCategory, setNewInlineCategory] = useState("");
  const [addingCategoryLoading, setAddingCategoryLoading] = useState(false);
  const [iconUrl, setIconUrl] = useState("");
  const iconRef = useRef<ImageUploadFieldHandle>(null);
  const [tagline, setTagline] = useState("");
  const [displayOrder, setDisplayOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);

  // Reset form when modal opens
  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (technology) {
      setName(technology.name ?? "");
      const isKnown = categoryOptions.includes(technology.category);
      if (isKnown) {
        setCategory(technology.category);
        setIsCustomCategory(false);
        setCustomCategory("");
      } else {
        setIsCustomCategory(true);
        setCustomCategory(technology.category);
      }
      setIconUrl(technology.icon_url ?? "");
      setTagline(technology.proficiency_tagline ?? "");
      setDisplayOrder(Number(technology.display_order ?? 0));
      setIsActive(technology.is_active ?? true);
    } else {
      setName("");
      setCategory(TECHNOLOGY_CATEGORIES[0]);
      setIsCustomCategory(false);
      setCustomCategory("");
      setIconUrl("");
      setTagline("");
      setDisplayOrder(0);
      setIsActive(true);
    }
  }, [open, technology]);

  const handleCreateInlineCategory = async () => {
    const trimmed = newInlineCategory.trim();
    if (!trimmed) {
      toast.error("Category name cannot be empty");
      return;
    }
    setAddingCategoryLoading(true);
    try {
      const res = await createTechnologyCategory(trimmed);
      if (res.success) {
        toast.success(`Category "${trimmed}" created successfully`);
        setCategory(trimmed);
        setIsCustomCategory(false);
        setCustomCategory("");
        setIsAddingCategoryInline(false);
        setNewInlineCategory("");
        setErrors((prev) => clearFieldError(prev, "category"));
        onCategoryCreated?.(trimmed);
      } else {
        toast.error(res.message || "Failed to create category");
      }
    } catch {
      toast.error("An error occurred while creating category");
    } finally {
      setAddingCategoryLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    const resolvedCategory = isCustomCategory ? customCategory.trim() : category;

    const draft = {
      id: technology?.id,
      name: name.trim(),
      category: resolvedCategory,
      icon_url: iconUrl.trim() || null,
      proficiency_tagline: tagline.trim() || null,
      display_order: Number.isFinite(displayOrder) ? displayOrder : 0,
      is_active: isActive,
    };

    const { ok, fieldErrors, draft: validDraft } = validateDraft(technologySchema, draft);
    if (!ok) {
      setErrors(fieldErrors);
      toast.error(firstError(fieldErrors) || "Please fill in all required fields correctly.");
      return;
    }

    setSaving(true);
    const loadingId = toast.loading(
      isEdit ? `Updating ${validDraft.name}...` : `Creating ${validDraft.name}...`
    );

    try {
      // 1. Flush any pending deferred image upload to Cloudinary
      const flushedUrl = await iconRef.current?.flush();
      if (flushedUrl === null) {
        setSaving(false);
        toast.dismiss(loadingId);
        return;
      }

      const finalIconUrl = flushedUrl !== undefined ? flushedUrl : validDraft.icon_url;

      const payload: TechnologyInput = {
        name: validDraft.name,
        category: validDraft.category,
        icon_url: finalIconUrl,
        proficiency_tagline: validDraft.proficiency_tagline,
        display_order: validDraft.display_order,
        is_active: validDraft.is_active,
      };

      const res = isEdit
        ? await updateTechnology(technology.id, payload)
        : await createTechnology(payload);

      if (!res.success) {
        toast.error(res.message || "Failed to save technology", { id: loadingId });
        return;
      }

      const saved = (res.data as Technology | undefined) ?? {
        ...payload,
        id: technology?.id ?? Date.now(),
        display_order: payload.display_order ?? 0,
        is_active: payload.is_active ?? true,
      };

      toast.success(
        isEdit ? "Technology updated successfully" : "Technology created successfully",
        { id: loadingId }
      );
      onSaved(saved);
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "An unexpected error occurred",
        { id: loadingId }
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-2xl border-slate-200 p-6 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight text-slate-900">
            {isEdit ? "Edit Technology" : "Add New Technology"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Name & Category 2-Column Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="tech-name"
                className="text-xs font-semibold text-slate-700 uppercase tracking-wider"
              >
                Technology Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="tech-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrors((prev) => clearFieldError(prev, "name"));
                }}
                placeholder="e.g. Next.js, Docker, PostgreSQL"
                disabled={saving}
                className="h-10 rounded-lg border-slate-200"
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="tech-category"
                  className="text-xs font-semibold text-slate-700 uppercase tracking-wider"
                >
                  Category <span className="text-red-500">*</span>
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
                    className="h-10 px-3 bg-[#00668a] text-white hover:bg-[#004c69] font-bold text-xs shrink-0 rounded-lg"
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
                  disabled={saving}
                >
                  <SelectTrigger id="tech-category" className="h-10 rounded-lg border-slate-200">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.category && <p className="text-xs text-red-500">{errors.category}</p>}
            </div>
          </div>

          {/* Proficiency Tagline */}
          <div className="space-y-1.5">
            <Label
              htmlFor="tech-tagline"
              className="text-xs font-semibold text-slate-700 uppercase tracking-wider"
            >
              Proficiency Tagline &amp; Competency
            </Label>
            <Input
              id="tech-tagline"
              value={tagline}
              onChange={(e) => {
                setTagline(e.target.value);
                setErrors((prev) => clearFieldError(prev, "proficiency_tagline"));
              }}
              placeholder="e.g. Enterprise Production Standard, Low-Latency Microservices"
              disabled={saving}
              className="h-10 rounded-lg border-slate-200"
            />
            {errors.proficiency_tagline && (
              <p className="text-xs text-red-500">{errors.proficiency_tagline}</p>
            )}
          </div>

          {/* Image & Icon Upload (Full Drag & Drop Image Upload with Defer) */}
          <ImageUploadField
            ref={iconRef}
            id="tech-icon-upload"
            value={iconUrl}
            onChange={setIconUrl}
            uploadAction={uploadTechnologyIcon}
            label="Technology Icon / Image Asset"
            hint="PNG, SVG, JPG, WebP — max 5MB. Square icon or vector recommended."
            assetNoun="Technology Icon"
            acceptedLabel="Current Technology Asset"
            previewAlt="Technology icon"
            deferUpload
            error={errors.icon_url}
          />

          {/* Display Order & Active Visibility (Balanced 2-Column Row) */}
          <div className="grid grid-cols-2 gap-4 items-center">
            <div className="space-y-1.5">
              <Label
                htmlFor="tech-order"
                className="text-xs font-semibold text-slate-700 uppercase tracking-wider"
              >
                Display Order
              </Label>
              <Input
                id="tech-order"
                type="number"
                min={0}
                value={displayOrder}
                onChange={(e) => {
                  setDisplayOrder(Number(e.target.value));
                  setErrors((prev) => clearFieldError(prev, "display_order"));
                }}
                disabled={saving}
                className="h-10 rounded-lg border-slate-200"
              />
              {errors.display_order && (
                <p className="text-xs text-red-500">{errors.display_order}</p>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg border border-slate-200 p-2.5 bg-slate-50 h-10 mt-5">
              <span className="text-xs font-semibold text-slate-900">Active Visibility</span>
              <Switch
                id="tech-active"
                checked={isActive}
                onCheckedChange={setIsActive}
                disabled={saving}
              />
            </div>
          </div>

          <DialogFooter className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-[#00668a] hover:bg-[#004c69] text-white"
            >
              {saving
                ? isEdit
                  ? "Updating..."
                  : "Creating..."
                : isEdit
                ? "Save Changes"
                : "Create Technology"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
