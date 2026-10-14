/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { categoryUpdateSchema } from "@/zod/category.validation";
import type { Category } from "@/types/product/product.category";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Upload, X, Check, ChevronsUpDown } from "lucide-react";
import { updateCategory, uploadCategoryImage, listCategoriesOptions } from "@/services/category/category.service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type CategoryStatus = "active" | "inactive" | "archived";

interface Props {
  category: Category;
  categories?: any[];
  onSaved?: () => void | Promise<void>;
  trigger?: React.ReactNode;
}

export default function EditCategoryModal({
  category,
  categories = [],
  onSaved,
  trigger,
}: Props) {
  const initialStatus = useMemo<CategoryStatus>(() => category.status, [category.status]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [open, setOpen] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<any[]>(categories);

  useEffect(() => {
    if (categories && categories.length > 0) {
      setAvailableCategories(categories);
    }
  }, [categories]);

  useEffect(() => {
    if (open && availableCategories.length === 0) {
      listCategoriesOptions()
        .then((res) => {
          if (res.success && res.data) {
            setAvailableCategories(res.data);
          }
        })
        .catch(() => {});
    }
  }, [open, availableCategories.length]);

  const [name, setName] = useState(category.name ?? "");
  const [description, setDescription] = useState(category.description ?? "");
  const [parentId, setParentId] = useState<string>(category.parent_id?.toString() ?? "root");
  const [parentPopoverOpen, setParentPopoverOpen] = useState(false);
  const [status, setStatus] = useState<CategoryStatus>(initialStatus);
  const [categoryImage, setCategoryImage] = useState<{ file?: File; preview: string } | null>(
    category.image_url ? { preview: category.image_url } : null
  );
  
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; description?: string; status?: string; parent_id?: string; image_url?: string } | null>(null);

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setName(category.name ?? "");
      setDescription(category.description ?? "");
      setParentId(category.parent_id?.toString() ?? "root");
      setStatus(category.status);
      setCategoryImage(category.image_url ? { preview: category.image_url } : null);
      setErrors(null);
    }
    setOpen(next);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5MB limit.");
      return;
    }

    if (categoryImage?.preview && !categoryImage.preview.startsWith("http")) {
      URL.revokeObjectURL(categoryImage.preview);
    }

    setCategoryImage({
      file,
      preview: URL.createObjectURL(file),
    });
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (categoryImage?.preview && !categoryImage.preview.startsWith("http")) {
      URL.revokeObjectURL(categoryImage.preview);
    }
    setCategoryImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const save = async () => {
    if (submitting) return;
    setErrors(null);

    const parsedParentId = parentId === "root" ? null : Number(parentId);

    const parsed = categoryUpdateSchema.safeParse({
      name,
      description,
      parent_id: parsedParentId,
      image_url: categoryImage ? (categoryImage.file ? "https://temp-placeholder.com" : categoryImage.preview) : null,
      status,
    });
    
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors({
        name: fieldErrors.name?.[0],
        description: fieldErrors.description?.[0],
        status: fieldErrors.status?.[0],
        parent_id: fieldErrors.parent_id?.[0],
        image_url: fieldErrors.image_url?.[0],
      });
      return;
    }

    setSubmitting(true);
    const loadingToast = toast.loading("Saving category...");

    try {
      let finalImageUrl: string | null = categoryImage ? categoryImage.preview : null;

      // If a new file is chosen, upload it
      if (categoryImage && categoryImage.file) {
        const formData = new FormData();
        formData.append("file", categoryImage.file);
        formData.append("folder", "categories");

        const uploadRes = await uploadCategoryImage(formData);
        if (!uploadRes.success || !uploadRes.data?.url) {
          toast.dismiss(loadingToast);
          toast.error(uploadRes.message || "Failed to upload category image");
          setSubmitting(false);
          return;
        }
        finalImageUrl = uploadRes.data.url;
      }

      const json = await updateCategory(category.id, {
        name: parsed.data.name,
        description: parsed.data.description,
        status: parsed.data.status as CategoryStatus,
        parent_id: parsed.data.parent_id,
        image_url: finalImageUrl,
      });

      toast.dismiss(loadingToast);

      if (!json.success) {
        setErrors({
          name: json?.errors?.name,
          description: json?.errors?.description,
          status: json?.errors?.status,
          parent_id: json?.errors?.parent_id,
          image_url: json?.errors?.image_url,
        });
        toast.error(json.message || "Failed to update category");
        return;
      }

      toast.success("Category updated successfully");
      await onSaved?.();
      setOpen(false);
    } catch (e: unknown) {
      toast.dismiss(loadingToast);
      toast.error(e instanceof Error ? e.message : "Failed to update category");
    } finally {
      setSubmitting(false);
    }
  };

  // Exclude current category and its children recursively to prevent loops
  const parentChoices = useMemo(() => {
    const excludedIds = new Set<string>([category.id.toString()]);
    const queue = [category.id.toString()];
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const children = availableCategories.filter((c) => c.parent_id?.toString() === currentId);
      children.forEach((child) => {
        const cid = child.id.toString();
        if (!excludedIds.has(cid)) {
          excludedIds.add(cid);
          queue.push(cid);
        }
      });
    }

    const result: { id: string | number; name: string; displayName: string; rawName: string }[] = [];
    const childrenMap = availableCategories.reduce((acc, c) => {
      if (c.parent_id) {
        const pid = c.parent_id.toString();
        if (!acc[pid]) acc[pid] = [];
        acc[pid].push(c);
      }
      return acc;
    }, {} as Record<string, any[]>);

    const traverse = (cat: any, depth: number) => {
      const cid = cat.id.toString();
      if (!excludedIds.has(cid)) {
        const displayPrefix = "— ".repeat(depth);
        result.push({
          id: cat.id,
          name: cat.name,
          rawName: cat.name,
          displayName: `${displayPrefix}${cat.name}`,
        });
      }
      const children = childrenMap[cid];
      if (children) {
        children.sort((a: any, b: any) => a.name.localeCompare(b.name));
        children.forEach((child: any) => traverse(child, depth + 1));
      }
    };

    const roots = availableCategories.filter((c) => !c.parent_id);
    roots.sort((a, b) => a.name.localeCompare(b.name));
    roots.forEach((root) => traverse(root, 0));

    const processedIds = new Set(result.map((c) => String(c.id)));
    availableCategories.forEach((c) => {
      const cid = String(c.id);
      if (!excludedIds.has(cid) && !processedIds.has(cid)) {
        result.push({
          id: c.id,
          name: c.name,
          rawName: c.name,
          displayName: c.name,
        });
      }
    });

    return result;
  }, [availableCategories, category.id]);

  const selectedParentLabel = useMemo(() => {
    if (parentId === "root") return "None (Top-Level Category)";
    const match = parentChoices.find((c) => String(c.id) === String(parentId));
    return match ? match.rawName : "Select Parent Category";
  }, [parentId, parentChoices]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? <Button variant="outline" size="sm">Update</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update category</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Category Image Upload */}
          <div>
            <label className="text-sm font-medium mb-2 block">Category Banner/Icon</label>
            <div className="flex items-center gap-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 h-32 border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 rounded-lg flex flex-col items-center justify-center cursor-pointer transition bg-muted/5 group relative overflow-hidden"
              >
                {categoryImage ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={categoryImage.preview}
                      alt="Category Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={handleRemoveImage}
                        className="h-8 w-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-4">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground group-hover:text-primary transition mb-2" />
                    <p className="text-xs text-muted-foreground">
                      Click to upload banner (max 5MB)
                    </p>
                  </div>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
            {errors?.image_url && <p className="text-red-500 text-sm mt-1">{errors.image_url}</p>}
          </div>

          <div>
            <label htmlFor="category-name" className="text-sm font-medium mb-2 block">
              Category name
            </label>
            <Input
              id="category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Premium"
            />
            {errors?.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Searchable Parent Category Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">Parent Category (Optional)</label>
            <Popover open={parentPopoverOpen} onOpenChange={setParentPopoverOpen} modal={true}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={parentPopoverOpen}
                  className="w-full justify-between font-normal bg-white"
                >
                  <span className="truncate">{selectedParentLabel}</span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[380px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search parent category..." className="h-9" />
                  <CommandList className="max-h-[220px] overflow-y-auto overscroll-contain">
                    <CommandEmpty>No parent category found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="none top level category"
                        onSelect={() => {
                          setParentId("root");
                          setParentPopoverOpen(false);
                        }}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            parentId === "root" ? "opacity-100 text-primary" : "opacity-0"
                          )}
                        />
                        <span className="font-semibold text-slate-800">None (Top-Level Category)</span>
                      </CommandItem>
                      {parentChoices.map((cat) => (
                        <CommandItem
                          key={cat.id}
                          value={`${cat.rawName} ${cat.displayName}`}
                          onSelect={() => {
                            setParentId(String(cat.id));
                            setParentPopoverOpen(false);
                          }}
                          className="cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              String(parentId) === String(cat.id) ? "opacity-100 text-primary" : "opacity-0"
                            )}
                          />
                          <span className={cn(
                            cat.displayName.startsWith("—") ? "text-slate-600" : "font-medium text-slate-900"
                          )}>
                            {cat.displayName}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {errors?.parent_id && <p className="text-red-500 text-sm mt-1">{errors.parent_id}</p>}
          </div>

          <div>
            <label htmlFor="category-description" className="text-sm font-medium mb-2 block">
              Description
            </label>
            <Textarea
              id="category-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
            {errors?.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Status</label>
            <Select value={status} onValueChange={(v) => setStatus(v as CategoryStatus)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Hidden</SelectItem>
              </SelectContent>
            </Select>
            {errors?.status && <p className="text-red-500 text-sm mt-1">{errors.status}</p>}
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={save} disabled={submitting}>
            {submitting ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
