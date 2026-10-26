/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Save, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import IconStylePicker from "@/components/services/why-choose-us/icon-style-picker";
import {
  saveWhyChooseUs,
  uploadWhyChooseUsImage,
} from "@/services/why-choose-us/why-choose-us.service";
import type { WhyChooseUs } from "@/types/why-choose-us";
import { whyChooseUsSchema } from "@/zod/why-choose-us.validation";
import { validateDraft, clearFieldError } from "@/lib/form-validation";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: WhyChooseUs | null;
  onSuccess: () => void;
  activeCount: number;
  requiredActiveCount?: number;
}

export default function EditWhyChooseUsModal({
  open,
  onOpenChange,
  item,
  onSuccess,
  activeCount,
  requiredActiveCount = 3,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [iconName, setIconName] = useState("shield-check");
  const [iconColor, setIconColor] = useState("#10b981");
  const [badgeColor, setBadgeColor] = useState("#043e2d");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isActive, setIsActive] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (item) {
      setTitle(item.title || "");
      setDescription(item.description || "");
      const existingImg = item.icon_url || item.image_url || "";
      setPreviewUrl(existingImg);
      setPendingFile(null);
      setIconName(item.icon_name || "shield-check");
      setIconColor(item.icon_color || "#10b981");
      setBadgeColor(item.badge_color || "#043e2d");
      setIsActive(Boolean(item.is_active));
      setErrors({});
    }
  }, [item]);

  const handleClose = () => {
    if (loading) return;
    setErrors({});
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    setLoading(true);
    setErrors({});

    if (!item.is_active && isActive && activeCount >= requiredActiveCount) {
      toast.error(
        `At most ${requiredActiveCount} items can be active at a time. Deactivate another item first before activating this one.`
      );
      setLoading(false);
      return;
    }

    try {
      let finalImage: string | null = null;
      if (pendingFile) {
        const formData = new FormData();
        formData.append("file", pendingFile);
        formData.append("folder", "why-choose-us");
        const uploadRes = await uploadWhyChooseUsImage(formData);
        if (!uploadRes.success || !uploadRes.data?.url) {
          toast.error(
            typeof uploadRes.message === "string" ? uploadRes.message : "Failed to upload image"
          );
          setLoading(false);
          return;
        }
        finalImage = uploadRes.data.url;
      } else if (previewUrl && (previewUrl.startsWith("http") || previewUrl.startsWith("/"))) {
        finalImage = previewUrl;
      } else {
        finalImage = null;
      }

      const { ok, fieldErrors, draft } = validateDraft(whyChooseUsSchema, {
        id: item.id,
        title: title.trim(),
        description: description.trim(),
        image_url: finalImage,
        icon_url: finalImage,
        icon_name: iconName || "shield-check",
        icon_color: iconColor || "#10b981",
        badge_color: badgeColor || "#043e2d",
        is_active: isActive,
      });

      if (!ok) {
        setErrors(fieldErrors);
        setLoading(false);
        toast.error("Please fill in the required fields correctly.");
        return;
      }

      const res = await saveWhyChooseUs({
        ...draft,
        image_url: finalImage,
        icon_url: finalImage,
        icon_name: iconName || "shield-check",
        icon_color: iconColor || "#10b981",
        badge_color: badgeColor || "#043e2d",
      });

      if (res.success) {
        toast.success(
          typeof res.message === "string" ? res.message : "Proposition updated successfully"
        );
        handleClose();
        onSuccess();
      } else {
        toast.error(typeof res.message === "string" ? res.message : "Failed to update proposition");
      }
    } catch (err: any) {
      toast.error(typeof err?.message === "string" ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-white p-6 rounded-2xl shadow-2xl">
        <DialogHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-[#00668a]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Edit Value Proposition
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Update card title, description, badge styling, or custom icon.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-title" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setErrors((prev) => clearFieldError(prev, "title"));
              }}
              placeholder="e.g. 100% Safety Guarantee"
              className="h-10 text-sm rounded-lg border-slate-200 bg-white"
            />
            {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-desc" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Description <span className="text-red-500">*</span>
            </Label>
            <textarea
              id="edit-desc"
              rows={3}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setErrors((prev) => clearFieldError(prev, "description"));
              }}
              placeholder="Strict adherence to global safety codes, high-pressure nitrogen testing..."
              className="w-full text-sm rounded-lg border border-slate-200 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-[#00668a]"
            />
            {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
          </div>

          {/* Icon Badge & Palette Customizer with upload button directly beside icon selection */}
          <IconStylePicker
            iconName={iconName}
            iconColor={iconColor}
            badgeColor={badgeColor}
            previewImageUrl={previewUrl}
            onSelectIcon={(icId) => {
              setIconName(icId);
              setPendingFile(null);
              setPreviewUrl("");
            }}
            onFileSelect={(file) => {
              setPendingFile(file);
              setPreviewUrl(file ? URL.createObjectURL(file) : "");
            }}
            onChangeColors={(colors) => {
              if (colors.icon_color) setIconColor(colors.icon_color);
              if (colors.badge_color) setBadgeColor(colors.badge_color);
            }}
            onApplyPreset={(preset) => {
              setIconName(preset.icon_name);
              setIconColor(preset.icon_color);
              setBadgeColor(preset.badge_color);
              setPendingFile(null);
              setPreviewUrl("");
            }}
          />

          {/* Redesigned Active Status Toggle Segment */}
          <div className="pt-2 border-t border-slate-100">
            <div
              className={`p-4 rounded-xl border transition-all ${
                isActive
                  ? "bg-emerald-50/70 border-emerald-200"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor="edit-is-active"
                      className="text-xs font-bold text-slate-900 cursor-pointer"
                    >
                      Publish to Active Showcase
                    </Label>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isActive
                          ? "bg-emerald-200/90 text-emerald-900"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {isActive ? "Live (Public)" : "Draft (Hidden)"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Live cards are immediately visible to clients on the public website. Max 3 active at a time.
                  </p>
                </div>
                <Switch
                  id="edit-is-active"
                  checked={isActive}
                  onCheckedChange={(checked) => {
                    if (checked && !item?.is_active && activeCount >= requiredActiveCount) {
                      toast.error(
                        `At most ${requiredActiveCount} items can be active at a time. Please deactivate another item first.`
                      );
                      return;
                    }
                    setIsActive(checked);
                  }}
                  className="data-[state=checked]:bg-emerald-600"
                />
              </div>

              {isActive && (
                <div className="mt-3 pt-3 border-t border-emerald-200/60 flex items-center gap-2 text-xs text-emerald-800 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>This proposition is active and live on the public website.</span>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="text-xs font-semibold h-10 px-4 rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="text-xs font-bold h-10 px-5 rounded-lg bg-[#00668a] hover:bg-[#004c69] text-white shadow-xs gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Update Proposition</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
