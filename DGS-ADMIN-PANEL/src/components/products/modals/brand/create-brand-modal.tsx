/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useRef } from "react";
import { brandCreateSchema } from "@/zod/brand.validation";
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
import { createBrand, uploadBrandLogo } from "@/services/brand.service";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Image as ImageIcon,  } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface Props {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerLabel?: string;
  trigger?: React.ReactNode;
  disabled?: boolean;
  onCreated?: (brand: any) => void;
}

export default function AddBrandModal({
  open,
  onOpenChange,
  triggerLabel = "Add Brand",
  trigger,
  disabled = false,
  onCreated,
}: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(open ?? false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [submitting, setSubmitting] = useState(false);
  const [logoImage, setLogoImage] = useState<{ file: File; preview: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
    if (!newOpen) reset();
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

  const reset = () => {
    setName("");
    setDescription("");
    setWebsiteUrl("");
    setStatus("active");
    setLogoImage(null);
    setErrors({});
  };

  const handleAdd = async () => {
    if (submitting) return;
    setErrors({});

    // Validate using Zod first
    const createSchemaWithLogo = brandCreateSchema;
    const result = createSchemaWithLogo.safeParse({
      name,
      description: description || undefined,
      logo_url: logoImage ? "https://temp-placeholder.com" : undefined, // placeholder to satisfy URL check
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
    const loadingToast = toast.loading("Creating brand...");
    try {
      let finalLogoUrl = "";

      // 1. Upload logo to Cloudinary if selected
      if (logoImage) {
        toast.loading("Uploading logo image...", { id: loadingToast });
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

      // 2. Create brand with logo URL
      toast.loading("Saving brand details...", { id: loadingToast });
      const res = await createBrand({
        name: result.data.name,
        description: result.data.description,
        logo_url: finalLogoUrl || undefined,
        website_url: result.data.website_url,
        status: result.data.status as "active" | "inactive",
      });

      toast.dismiss(loadingToast);
      if (res.success) {
        toast.success("Brand created successfully");
        if (onCreated) {
          onCreated(res.data || { name: result.data.name });
        }
        reset();
        handleOpenChange(false);
        router.refresh();
      } else {
        toast.error(res.message || "Failed to create brand");
        if (res.errors) {
          setErrors(res.errors as any);
        }
      }
    } catch (e: unknown) {
      toast.dismiss(loadingToast);
      toast.error(e instanceof Error ? e.message : "Failed to create brand");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={disabled ? false : isOpen} onOpenChange={disabled ? undefined : handleOpenChange}>
      <DialogTrigger asChild disabled={disabled}>
        {trigger ?? (
          <Button variant="secondary" disabled={disabled}>
            {triggerLabel}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Add Brand</DialogTitle>
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
              {logoImage ? (
                <>
                  <Image src={logoImage.preview} alt="Logo Preview" fill sizes="600px" className="object-contain p-2" />
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
            <label htmlFor="brand-name" className="text-sm font-medium mb-2 block">
              Brand Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="brand-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Samsung"
              className="border-green-500"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="website-url" className="text-sm font-medium mb-2 block">
              Website URL
            </label>
            <Input
              id="website-url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://samsung.com"
            />
            {errors.website_url && <p className="text-red-500 text-sm mt-1">{errors.website_url}</p>}
          </div>

          <div>
            <label htmlFor="description" className="text-sm font-medium mb-2 block">
              Description
            </label>
            <Textarea
              id="description"
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
            onClick={handleAdd}
            className="bg-green-500 hover:bg-green-600 text-white"
            disabled={submitting}
          >
            {submitting ? "Adding..." : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
