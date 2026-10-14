"use client";

import React, { useState, useRef } from "react";
import { brandUpdateSchema } from "@/zod/brand.validation";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateBrand, uploadBrandLogo } from "@/services/brand.service";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { Brand } from "@/types/product/brand";
import { Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface Props {
  brand: Brand;
  trigger?: React.ReactNode;
  disabled?: boolean;
}

export default function EditBrandModal({
  brand,
  trigger,
  disabled = false,
}: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(brand.name || "");
  const [description, setDescription] = useState(brand.description || "");
  const [websiteUrl, setWebsiteUrl] = useState(brand.website_url || "");
  const [status, setStatus] = useState<"active" | "inactive">(brand.status || "active");
  const [submitting, setSubmitting] = useState(false);
  const [logoImage, setLogoImage] = useState<{ file: File; preview: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoUrl, setLogoUrl] = useState(brand.logo_url || "");
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    if (newOpen) {
      setName(brand.name || "");
      setDescription(brand.description || "");
      setWebsiteUrl(brand.website_url || "");
      setStatus(brand.status || "active");
      setLogoUrl(brand.logo_url || "");
      setLogoImage(null);
      setErrors({});
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5MB limit.");
      return;
    }

    if (logoImage?.preview) URL.revokeObjectURL(logoImage.preview);

    setLogoImage({
      file,
      preview: URL.createObjectURL(file),
    });
  };

  const handleSave = async () => {
    if (submitting) return;
    setErrors({});

    const result = brandUpdateSchema.safeParse({
      name,
      description: description || undefined,
      logo_url: logoImage ? "https://temp-placeholder.com" : (logoUrl || undefined),
      website_url: websiteUrl || undefined,
      status,
    });

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      const errs: Record<string, string | undefined> = {};
      Object.keys(fieldErrors).forEach((key) => {
        errs[key] = fieldErrors[key as keyof typeof fieldErrors]?.[0];
      });
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    const loadingToast = toast.loading("Updating brand...");
    try {
      let finalLogoUrl = logoUrl;

      // 1. Upload logo to Cloudinary if new logo is selected
      if (logoImage) {
        toast.loading("Uploading new logo image...", { id: loadingToast });
        const formData = new FormData();
        formData.append("file", logoImage.file);
        formData.append("folder", "brands");

        const uploadRes = await uploadBrandLogo(formData);
        if (!uploadRes.success || !uploadRes.data?.url) {
          toast.dismiss(loadingToast);
          toast.error(uploadRes.message || "Failed to upload logo image");
          setSubmitting(false);
          return;
        }
        finalLogoUrl = uploadRes.data.url;
      }

      // 2. Save brand edits
      toast.loading("Saving changes...", { id: loadingToast });
      const res = await updateBrand(brand.id, {
        name: result.data.name,
        description: result.data.description,
        logo_url: finalLogoUrl || undefined,
        website_url: result.data.website_url,
        status: result.data.status as "active" | "inactive",
      });

      toast.dismiss(loadingToast);
      if (res.success) {
        toast.success("Brand updated successfully");
        handleOpenChange(false);
        router.refresh();
      } else {
        toast.error(res.message || "Failed to update brand");
        if (res.errors) {
          setErrors(res.errors as Record<string, string | undefined>);
        }
      }
    } catch (e: unknown) {
      toast.dismiss(loadingToast);
      toast.error(e instanceof Error ? e.message : "Failed to update brand");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={disabled ? false : isOpen} onOpenChange={disabled ? undefined : handleOpenChange}>
      <DialogTrigger asChild disabled={disabled}>
        {trigger ?? <Button variant="outline" size="sm" disabled={disabled}>Edit</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Brand</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Logo Upload Box (Matches Product Image Style) */}
          <div className="space-y-1">
            <label className="text-xs font-bold">Brand Logo</label>
            <div
              className={cn(
                "relative aspect-3/1 w-full rounded-lg border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all group bg-muted/20 hover:border-green-400",
                errors.logo_url ? "border-red-500" : ""
              )}
            >
              {logoImage || logoUrl ? (
                <>
                  <Image
                    src={logoImage ? logoImage.preview : logoUrl}
                    alt="Logo Preview"
                    fill
                    sizes="600px"
                    className="object-contain p-2"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      variant="secondary"
                      size="sm"
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[10px] font-bold px-3 h-7"
                    >
                      Change Logo
                    </Button>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  <ImageIcon className="h-6 w-6 stroke-1" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Click to upload brand logo</span>
                </button>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
            {errors.logo_url && <p className="text-red-500 text-xs mt-1">{errors.logo_url}</p>}
          </div>

          <div>
            <label htmlFor="edit-brand-name" className="text-sm font-medium mb-2 block">
              Brand Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="edit-brand-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Samsung"
              className="border-green-500"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="edit-website-url" className="text-sm font-medium mb-2 block">
              Website URL
            </label>
            <Input
              id="edit-website-url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://samsung.com"
            />
            {errors.website_url && <p className="text-red-500 text-sm mt-1">{errors.website_url}</p>}
          </div>

          <div>
            <label htmlFor="edit-description" className="text-sm font-medium mb-2 block">
              Description
            </label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brand details..."
              rows={3}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Status</label>
            <Select value={status} onValueChange={(v) => setStatus(v as "active" | "inactive")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && <p className="text-red-500 text-sm mt-1">{errors.status}</p>}
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            onClick={handleSave}
            className="bg-green-500 hover:bg-green-600 text-white"
            disabled={submitting}
          >
            {submitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
