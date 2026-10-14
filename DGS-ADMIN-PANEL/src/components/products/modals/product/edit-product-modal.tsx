/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {  PlusCircle,  Globe, Check, ChevronsUpDown, Trash2, Plus, Settings, Star, GripVertical, Edit, ShieldCheck } from "lucide-react"
import AddCategoryModal from "@/components/products/modals/category/create-category-modal"
import AddBrandModal from "@/components/products/modals/brand/create-brand-modal"
import { Product } from "@/types/product/product"
import { productSchema, type ProductInput } from "@/zod/product.validation"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { toast } from "sonner"
import {
  updateProductSeo,
  deleteProductImage,
  setPrimaryImage,
  uploadProductImages,
} from "@/services/product.service"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface EditProductModalProps {
  product: Product
  categories?: { id: string | number; name: string; parent_id?: string | number | null }[]
  brands?: { id: string; name: string }[]
  warrantyPolicies?: { id: string | number; name: string; code: string }[]
  onSave?: (
    updatedProduct: ProductInput & { id: string | number },
    imageFile?: File
  ) => Promise<void>
  onOpenChange?: (open: boolean) => void
  triggerIcon?: React.ReactNode
  defaultOpen?: boolean
}

export default function EditProductModal({
  product,
  categories = [],
  brands = [],
  warrantyPolicies: initialPolicies = [],
  onSave,
  onOpenChange,
  triggerIcon,
  defaultOpen = false,
}: EditProductModalProps) {
  const [open, setOpen] = useState(defaultOpen)
  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    onOpenChange?.(next)
  }
  const [submitting, setSubmitting] = useState(false)

  const [localCategories, setLocalCategories] = useState(categories)
  const [localBrands, setLocalBrands] = useState(brands)

  useEffect(() => {
    setLocalCategories(categories)
  }, [categories])

  useEffect(() => {
    setLocalBrands(brands)
  }, [brands])

  // Form States
  const [name, setName] = useState(product.name)
  const [categoryId, setCategoryId] = useState(String(product.category?.id ?? ""))
  const [brandId, setBrandId] = useState(String(product.brand_id || product.brand?.id || ""))
  const [description, setDescription] = useState(product.description || "")
  const [status, setStatus] = useState<"active" | "inactive" | "archived">(
    (product.status as "active" | "inactive" | "archived") || "active"
  )
  const [basePrice, setBasePrice] = useState(String(product.base_price || ""))
  const [weightKg, setWeightKg] = useState(
    product.weight_grams ? String(Number(product.weight_grams) / 1000) : ""
  )
  const [discountType, setDiscountType] = useState<"fixed" | "percentage" | "none">(
    (product.discount_type as any) || "none"
  )
  const [discountValue, setDiscountValue] = useState(String(product.discount_value || ""))

  // Warranty components (multiple dynamic warranty categories)
  const [warrantyPolicies, setWarrantyPolicies] = useState<{ id: string | number; name: string; code: string }[]>(initialPolicies)
  const [warrantyComponents, setWarrantyComponents] = useState<
    { policyId: string; months: string; note: string }[]
  >([])

  useEffect(() => {
    if (initialPolicies && initialPolicies.length > 0) {
      setWarrantyPolicies(initialPolicies)
    }
  }, [initialPolicies])

  const isNoWarrantyPolicy = (policyId: string) => {
    if (!policyId) return true
    const chosen = warrantyPolicies.find((p) => String(p.id) === String(policyId))
    if (!chosen) return false
    const code = (chosen.code || "").toLowerCase()
    const name = (chosen.name || "").toLowerCase()
    return code === "none" || code === "no_warranty" || code === "no-warranty" || name.includes("no warranty")
  }

  // Electronics Details
  const [countryOfOrigin, setCountryOfOrigin] = useState(product.country_of_origin || "")
  const [serialNumber, setSerialNumber] = useState(product.serial_number || "")
  const [emiAvailable, setEmiAvailable] = useState(!!product.emi_available)
  const [productVideoUrl, setProductVideoUrl] = useState(product.product_video_url || "")

  // Specifications
  const [customSpecs, setCustomSpecs] = useState<{ group: string; label: string; value: string }[]>([])
  const [customSpecGroup, setCustomSpecGroup] = useState("")
  const [customSpecLabel, setCustomSpecLabel] = useState("")
  const [customSpecValue, setCustomSpecValue] = useState("")

  // Multi-Image Queue States (Existing + New)
  const [productImages, setProductImages] = useState<{ id: string; file?: File; previewUrl: string; isPrimary: boolean; isExisting: boolean }[]>([])
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // DND Kit Sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const [errors, setErrors] = useState<Record<string, string | undefined>>({})

  // Category Selector Popover Open State
  const [catOpen, setCatOpen] = useState(false)
  const [isFeatured, setIsFeatured] = useState(!!product.is_featured)
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(product.low_stock_threshold || 10)
  const [lifecycleMonths, setLifecycleMonths] = useState<number>(product.lifecycle_months || 12)

  // SEO States
  const [seoTitle, setSeoTitle] = useState((product as any).seo_meta?.meta_title || "")
  const [seoDescription, setSeoDescription] = useState((product as any).seo_meta?.meta_description || "")
  const [seoOgImage, setSeoOgImage] = useState((product as any).seo_meta?.og_image_url || "")
  const [seoKeywords, setSeoKeywords] = useState((product as any).seo_meta?.keywords || "")
  const [seoIndexable, setSeoIndexable] = useState((product as any).seo_meta?.indexable !== false)
  const [showSeo, setShowSeo] = useState(false)

  // Initial Load from Product values
  useEffect(() => {
    if (open) {
      setName(product.name)
      setCategoryId(String(product.category?.id ?? ""))
      setBrandId(String(product.brand_id || product.brand?.id || ""))
      setDescription(product.description || "")
      setStatus((product.status as any) || "active")
      setBasePrice(String(product.base_price || ""))
      setWeightKg(product.weight_grams ? String(Number(product.weight_grams) / 1000) : "")
      setDiscountType((product.discount_type as any) || "none")
      setDiscountValue(String(product.discount_value || ""))
      const rawWarranty = (product.warranty_components || []).map((wc: any) => {
        const policyId = String(
          wc.warranty_policy_id ??
          wc.warrantyPolicy?.id ??
          wc.warranty_policy?.id ??
          wc.policy_id ??
          ""
        );
        const months =
          wc.warranty_months != null && String(wc.warranty_months) !== "0"
            ? String(wc.warranty_months)
            : wc.warranty_duration_days != null && Number(wc.warranty_duration_days) > 0
            ? String(Math.round(Number(wc.warranty_duration_days) / 30))
            : "";
        return {
          policyId,
          months,
          note: wc.customer_policy_note || "",
        };
      }).filter((w: any) => w.policyId);

      setWarrantyComponents(
        rawWarranty.length > 0 ? rawWarranty : [{ policyId: "", months: "", note: "" }]
      );
      setCountryOfOrigin(product.country_of_origin || "")
      setSerialNumber(product.serial_number || "")
      setEmiAvailable(!!product.emi_available)
      setProductVideoUrl(product.product_video_url || "")
      setIsFeatured(!!product.is_featured)

      // Initialize specs
      const loadedSpecs = Object.entries(product.specifications_json || {}).map(([key, val]) => {
        const parts = key.split("__")
        return {
          group: parts[0] || "General",
          label: parts[1] || parts[0],
          value: String(val || ""),
        }
      })
      setCustomSpecs(loadedSpecs)

      // Initialize images
      const initialImgs = (product.images || []).map((img) => ({
        id: String(img.id),
        previewUrl: img.image_url,
        isPrimary: img.is_primary,
        isExisting: true,
      }))
      setProductImages(initialImgs)
      setImagesToDelete([])
      setErrors({})
      setSeoTitle((product as any).seo_meta?.meta_title || "")
      setSeoDescription((product as any).seo_meta?.meta_description || "")
      setSeoOgImage((product as any).seo_meta?.og_image_url || "")
      setSeoKeywords((product as any).seo_meta?.keywords || "")
      setSeoIndexable((product as any).seo_meta?.indexable !== false)
      setShowSeo(false)
      setCatOpen(false)
    }
  }, [open, product])

  const handleAddCustomSpec = () => {
    let finalGroup = customSpecGroup.trim()

    if (!finalGroup || !customSpecLabel.trim() || !customSpecValue.trim()) {
      toast.error("Group Name, Spec Name, and Value are all required")
      return
    }

    // Match existing group case-insensitively and reuse its casing
    const existingGroup = customSpecs.find(
      (c) => c.group.toLowerCase().trim() === finalGroup.toLowerCase()
    )
    if (existingGroup) {
      finalGroup = existingGroup.group
    }

    const labelKey = customSpecLabel.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/(^_|_$)/g, "")
    
    // Check if key is already occupied in the same group
    const isOccupied = customSpecs.some(
      (c) =>
        c.group.toLowerCase().trim() === finalGroup.toLowerCase() &&
        c.label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/(^_|_$)/g, "") === labelKey
    )
    if (isOccupied) {
      toast.error(`A specification field "${customSpecLabel}" already exists in the "${finalGroup}" group`)
      return
    }

    setCustomSpecs((prev) => [...prev, { group: finalGroup, label: customSpecLabel, value: customSpecValue }])
    
    setCustomSpecLabel("")
    setCustomSpecValue("")
  }

  const handleSpecValueUpdate = (idx: number, value: string) => {
    setCustomSpecs((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, value } : item))
    )
  }

  const handleSpecLabelUpdate = (idx: number, label: string) => {
    setCustomSpecs((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, label } : item))
    )
  }

  const handleRemoveCustomSpec = (idx: number) => {
    setCustomSpecs((prev) => prev.filter((_, i) => i !== idx))
  }

  // Image Queue Handlers
  const handleAddImages = (files: FileList | null) => {
    if (!files || files.length === 0) return

    const newImgs = Array.from(files).map((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File "${file.name}" exceeds the 5MB size limit.`)
      }
      return {
        id: `new-${crypto.randomUUID()}`,
        file,
        previewUrl: URL.createObjectURL(file),
        isPrimary: false,
        isExisting: false,
      }
    }).filter(img => img.file && img.file.size <= 5 * 1024 * 1024)

    setProductImages((prev) => {
      const combined = [...prev, ...newImgs]
      if (combined.length > 0 && !combined.some((img) => img.isPrimary)) {
        combined[0].isPrimary = true
      }
      return combined
    })
  }

  const handleRemoveImage = (id: string, isExisting: boolean) => {
    if (isExisting) {
      setImagesToDelete((prev) => [...prev, id])
    }

    setProductImages((prev) => {
      const filtered = prev.filter((img) => img.id !== id)
      const removed = prev.find((img) => img.id === id)
      if (removed && !isExisting) URL.revokeObjectURL(removed.previewUrl)

      // Re-assign primary if necessary
      if (filtered.length > 0 && !filtered.some((img) => img.isPrimary)) {
        filtered[0].isPrimary = true
      }
      return filtered
    })
  }

  const handleSetPrimaryImage = (id: string) => {
    setProductImages((prev) =>
      prev.map((img) => ({
        ...img,
        isPrimary: img.id === id,
      }))
    )
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setProductImages((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id)
        const newIndex = items.findIndex((i) => i.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const handleSave = async () => {
    setErrors({})

    // Validate warranty requirements
    if (warrantyComponents.length === 0) {
      toast.error("Please add at least one warranty category (or select No Warranty)")
      setErrors((prev) => ({ ...prev, warranty: "At least one warranty category is required" }))
      return
    }

    let hasWarrantyError = false
    const warrantyErrs: Record<string, string> = {}
    warrantyComponents.forEach((wc, idx) => {
      if (!wc.policyId) {
        hasWarrantyError = true
        warrantyErrs[`warranty_policy_${idx}`] = "Warranty type is required"
      } else if (!isNoWarrantyPolicy(wc.policyId)) {
        if (!wc.months || !wc.months.trim() || Number(wc.months) <= 0 || isNaN(Number(wc.months))) {
          hasWarrantyError = true
          warrantyErrs[`warranty_months_${idx}`] = "Duration (months) is required"
        }
      }
    })

    if (hasWarrantyError) {
      setErrors((prev) => ({ ...prev, ...warrantyErrs }))
      toast.error("Please complete the required warranty fields")
      return
    }

    // Product images are optional
    // Serialize custom specs
    const mergedSpecs: Record<string, any> = {}
    customSpecs.forEach((cs) => {
      const key = `${cs.group}__${cs.label}`
      mergedSpecs[key] = cs.value
    })

    const validation = productSchema.safeParse({
      name,
      category_id: categoryId,
      brand_id: brandId ? Number(brandId) : undefined,
      description,
      status,
      is_featured: isFeatured,
      base_price: basePrice || undefined,
      weight_grams: weightKg ? Math.round(Number(weightKg) * 1000) : null,
      discount_type: discountType,
      discount_value: discountType === "none" ? 0 : (discountValue ? Number(discountValue) : 0),
      warranty_components: warrantyComponents
        .filter((wc) => wc.policyId)
        .map((wc) => ({
          warranty_policy_id: Number(wc.policyId),
          warranty_months: isNoWarrantyPolicy(wc.policyId) ? 0 : Number(wc.months || 0),
          customer_policy_note: wc.note || undefined,
        })),
      country_of_origin: countryOfOrigin || undefined,
      serial_number: serialNumber || undefined,
      emi_available: emiAvailable,
      product_video_url: productVideoUrl || undefined,
      specifications_json: mergedSpecs,
      low_stock_threshold: lowStockThreshold,
      lifecycle_months: lifecycleMonths,
    })

    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors
      const errs: Record<string, string | undefined> = {}
      Object.keys(fieldErrors).forEach((key) => {
        errs[key] = fieldErrors[key as keyof typeof fieldErrors]?.[0]
      })
      setErrors(errs)
      return
    }

    setSubmitting(true)
    const productLoadingToast = toast.loading("Updating product...")
    try {
      // 1. Delete removed database images
      for (const imgId of imagesToDelete) {
        await deleteProductImage(product.id, imgId)
      }

      // 2. Upload new images if any
      const newFiles = productImages.filter(img => !img.isExisting)
      let uploadResults: any[] = []
      if (newFiles.length > 0) {
        const formData = new FormData()
        newFiles.forEach((img) => {
          if (img.file) formData.append("files", img.file)
        })
        formData.append("isPrimary", "0")
        
        const uploadRes = await uploadProductImages(product.id, formData)
        if (uploadRes.success && uploadRes.data) {
          uploadResults = uploadRes.data
        }
      }

      // 3. Re-evaluate primary image settings
      // Find the index of the image in the current list that is marked primary
      const primaryItem = productImages.find(img => img.isPrimary)
      if (primaryItem) {
        if (primaryItem.isExisting) {
          // If existing, set by its database id
          await setPrimaryImage(product.id, primaryItem.id)
        } else {
          // If newly uploaded, find its index in the newly uploaded files array
          const newFilesIdx = newFiles.findIndex(img => img.id === primaryItem.id)
          if (newFilesIdx >= 0 && uploadResults[newFilesIdx]) {
            await setPrimaryImage(product.id, uploadResults[newFilesIdx].id)
          }
        }
      }

      // 4. Update core fields
      if (onSave) {
        await onSave({ ...validation.data, id: product.id })
      }

      // 5. Update SEO — auto-fill defaults from product fields when left blank
      const primaryImg = productImages.find(img => img.isPrimary) || productImages[0]
      const defaultOgImage = primaryImg?.previewUrl || ""
      const descText = description?.trim() || ""
      await updateProductSeo(product.id, {
        meta_title: seoTitle.trim() || name.trim() || undefined,
        meta_description: seoDescription.trim() || (descText ? descText.slice(0, 160) : undefined),
        og_image_url: seoOgImage.trim() || defaultOgImage || undefined,
        keywords: seoKeywords.trim() || undefined,
        indexable: seoIndexable,
      })

      toast.dismiss(productLoadingToast)
      setOpen(false)
    } catch (error) {
      toast.dismiss(productLoadingToast)
      console.error(error)
      toast.error("Failed to update product")
    } finally {
      setSubmitting(false)
    }
  }

  const groupedCustomSpecs = customSpecs.reduce((acc, curr) => {
    if (!acc[curr.group]) acc[curr.group] = []
    acc[curr.group].push(curr)
    return acc
  }, {} as Record<string, typeof customSpecs>)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {triggerIcon ? (
          triggerIcon
        ) : (
          <Button variant="outline" size="icon" className="h-8 w-8">
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-2rem)] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Edit Product</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          
          {/* Multi-Image Upload Queue with Drag & Drop */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold">
                Product Media Queue <span className="text-[10px] font-semibold text-muted-foreground">(optional)</span> :
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={(e) => handleAddImages(e.target.files)}
              />
            </div>
 
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={productImages.map((i) => i.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {productImages.map((img, index) => (
                    <SortableProductImage
                      key={img.id}
                      img={img}
                      index={index}
                      onDelete={() => handleRemoveImage(img.id, img.isExisting)}
                      onSetPrimary={() => handleSetPrimaryImage(img.id)}
                    />
                  ))}

                  {/* Add Image Box inside Queue */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "relative aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 hover:bg-slate-50 transition group cursor-pointer",
                      errors.images ? "border-red-400 bg-red-50/20" : "border-slate-300 bg-slate-50/50"
                    )}
                  >
                    <Plus className="w-5 h-5 text-slate-400 group-hover:text-slate-500 transition" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-500 transition">
                      Add Image
                    </span>
                  </button>
                </div>
              </SortableContext>
            </DndContext>
            {errors.images && <p className="text-[10px] font-bold text-red-500">{errors.images}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold">Name :</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && <p className="text-[10px] font-bold text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-1 flex flex-col">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold">Category:</label>
                <AddCategoryModal
                  categories={localCategories}
                  onCreated={(newCat) => {
                    if (newCat) {
                      setLocalCategories((prev) => {
                        const exists = prev.some((c) => String(c.id) === String(newCat.id));
                        return exists ? prev : [...prev, newCat];
                      });
                      setCategoryId(String(newCat.id));
                    }
                  }}
                  trigger={
                    <Button variant="ghost" size="sm" type="button" className="h-6 text-[10px] gap-1 px-1 text-green-600 hover:text-green-700 hover:bg-green-50">
                      <PlusCircle size={10} /> Add New
                    </Button>
                  }
                />
              </div>
              <Popover open={catOpen} onOpenChange={setCatOpen} modal={true}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={catOpen}
                    className={cn(
                      "w-full justify-between text-left font-normal bg-white",
                      errors.category_id ? "border-red-500" : ""
                    )}
                  >
                    <span className="truncate">
                      {categoryId
                        ? (() => {
                            const cat = localCategories.find((c) => String(c.id) === String(categoryId));
                            if (!cat) return "Select category";
                            
                            const getCategoryPath = (c: any): string => {
                              const parts = [c.name];
                              let curr = c;
                              while (curr.parent_id) {
                                const p = localCategories.find((x) => String(x.id) === String(curr.parent_id));
                                if (!p) break;
                                parts.unshift(p.name);
                                curr = p;
                              }
                              return parts.join(" → ");
                            };
                            return getCategoryPath(cat);
                          })()
                        : "Select category"}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[450px] p-0"
                  align="start"
                  onWheel={(e) => e.stopPropagation()}
                  onTouchMove={(e) => e.stopPropagation()}
                >
                  <Command>
                    <CommandInput placeholder="Search category..." className="h-9" />
                    <CommandList
                      className="max-h-[250px] overflow-y-auto overscroll-contain"
                      onWheel={(e) => e.stopPropagation()}
                      onTouchMove={(e) => e.stopPropagation()}
                    >
                      <CommandEmpty>No category found.</CommandEmpty>
                      <CommandGroup>
                        {localCategories
                          .map((cat) => {
                            const getCategoryPath = (c: any): string => {
                              const parts = [c.name];
                              let curr = c;
                              while (curr.parent_id) {
                                const p = localCategories.find((x) => String(x.id) === String(curr.parent_id));
                                if (!p) break;
                                parts.unshift(p.name);
                                curr = p;
                              }
                              return parts.join(" → ");
                            };
                            return {
                              ...cat,
                              displayName: getCategoryPath(cat),
                            };
                          })
                          .sort((a, b) => a.displayName.localeCompare(b.displayName))
                          .map((cat) => (
                            <CommandItem
                              key={cat.id}
                              value={cat.displayName}
                              onSelect={() => {
                                setCategoryId(String(cat.id))
                                setCatOpen(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  String(categoryId) === String(cat.id) ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {cat.displayName}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {errors.category_id && <p className="text-[10px] font-bold text-red-500 mt-1">{errors.category_id}</p>}
            </div>

            {/* Brand Dropdown */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold">Brand :</label>
                <AddBrandModal
                  onCreated={(newBrand) => {
                    if (newBrand && newBrand.id) {
                      setLocalBrands((prev) => {
                        const exists = prev.some((b) => String(b.id) === String(newBrand.id));
                        if (exists) return prev;
                        return [...prev, { id: String(newBrand.id), name: newBrand.name }];
                      });
                      setBrandId(String(newBrand.id));
                    }
                  }}
                  trigger={
                    <Button variant="ghost" size="sm" type="button" className="h-6 text-[10px] gap-1 px-1 text-green-600 hover:text-green-700 hover:bg-green-50">
                      <PlusCircle size={10} /> Add New
                    </Button>
                  }
                />
              </div>
              <Select value={brandId} onValueChange={setBrandId}>
                <SelectTrigger className={cn("w-full", errors.brand_id ? "border-red-500" : "")}>
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent className="w-full">
                  {localBrands.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.brand_id && <p className="text-[10px] font-bold text-red-500">{errors.brand_id}</p>}
            </div>

            {/* Base Price */}
            <div className="space-y-1">
              <label className="text-xs font-bold">Base Price :</label>
              <Input
                type="number"
                min={0}
                value={basePrice}
                onChange={(e) => {
                  const val = e.target.value
                  if (val === "" || Number(val) >= 0) setBasePrice(val)
                }}
                className={errors.base_price ? "border-red-500" : ""}
              />
              {errors.base_price && <p className="text-[10px] font-bold text-red-500">{errors.base_price}</p>}
            </div>

            {/* Weight (KG) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold">
                  Weight (KG) <span className="text-[10px] font-semibold text-muted-foreground">(optional)</span> :
                </label>
                {weightKg && Number(weightKg) > 0 ? (
                  <span className="text-[10px] text-blue-600 font-semibold">
                    ≈ {Math.round(Number(weightKg) * 1000)}g
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-600 font-semibold">Not set</span>
                )}
              </div>
              <Input
                type="number"
                step="0.01"
                min={0}
                value={weightKg}
                onChange={(e) => {
                  const val = e.target.value
                  if (val === "" || Number(val) >= 0) setWeightKg(val)
                }}
                placeholder="e.g. 0.5 or 1.2 (leave blank if unknown)"
                className={errors.weight_grams ? "border-red-500" : ""}
              />
              {errors.weight_grams && <p className="text-[10px] font-bold text-red-500">{errors.weight_grams}</p>}
            </div>

            {/* Discount Type */}
            <div className="space-y-1">
              <label className="text-xs font-bold">Discount Type :</label>
              <Select value={discountType} onValueChange={(v) => setDiscountType(v as any)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Discount Type" />
                </SelectTrigger>
                <SelectContent className="w-full">
                  <SelectItem value="none">No Discount</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Discount Value */}
            <div className="space-y-1">
              <label className="text-xs font-bold">Discount Value :</label>
              <Input
                type="number"
                min={0}
                disabled={discountType === "none"}
                value={discountValue}
                onChange={(e) => {
                  const val = e.target.value
                  if (val === "" || Number(val) >= 0) setDiscountValue(val)
                }}
              />
            </div>

            {/* Serial Number */}
            <div className="space-y-1">
              <label className="text-xs font-bold">Serial Number / Model No :</label>
              <Input
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="e.g. MX-200"
                className={errors.serial_number ? "border-red-500" : ""}
              />
              {errors.serial_number && <p className="text-[10px] font-bold text-red-500">{errors.serial_number}</p>}
            </div>

            {/* Low Stock Threshold */}
            <div className="space-y-1">
              <label className="text-xs font-bold">Low Stock Threshold :</label>
              <Input
                type="number"
                min={0}
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                placeholder="e.g. 10"
                className={errors.low_stock_threshold ? "border-red-500" : ""}
              />
              {errors.low_stock_threshold && <p className="text-[10px] font-bold text-red-500">{errors.low_stock_threshold}</p>}
            </div>

            {/* Lifecycle Target (Months) */}
            <div className="space-y-1">
              <label className="text-xs font-bold">Lifecycle Target (Months) :</label>
              <Input
                type="number"
                min={1}
                value={lifecycleMonths}
                onChange={(e) => setLifecycleMonths(Number(e.target.value))}
                placeholder="e.g. 6"
                className={errors.lifecycle_months ? "border-red-500" : ""}
              />
              {errors.lifecycle_months && <p className="text-[10px] font-bold text-red-500">{errors.lifecycle_months}</p>}
            </div>

            {/* Country of Origin */}
            <div className="space-y-1">
              <label className="text-xs font-bold">Country of Origin :</label>
              <Input
                value={countryOfOrigin}
                onChange={(e) => setCountryOfOrigin(e.target.value)}
                placeholder="e.g. Thailand"
              />
            </div>

            {/* Status */}
            <div className="space-y-1">
              <label className="text-xs font-bold">Status :</label>
              <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                <SelectTrigger className={errors.status ? "border-red-500 w-full" : "w-full"}>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="w-full">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && <p className="text-[10px] font-bold text-red-500">{errors.status}</p>}
            </div>

            {/* Product Video URL */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold">Video Review URL :</label>
              <Input
                value={productVideoUrl}
                onChange={(e) => setProductVideoUrl(e.target.value)}
                placeholder="e.g. https://youtube.com/..."
              />
            </div>

            {/* Warranty Categories Section Card */}
            <div className={cn("border rounded-xl p-4 bg-slate-50/70 shadow-xs space-y-3 md:col-span-2", errors.warranty ? "border-red-500 bg-red-50/10" : "border-slate-200/80")}>
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-emerald-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Warranty Categories <span className="text-red-500">*</span> <span className="text-[10px] font-normal text-slate-400 lowercase">(multiple)</span>
                  </h3>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setWarrantyComponents([...warrantyComponents, { policyId: "", months: "", note: "" }])}
                  className="h-7 text-xs gap-1 bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 font-semibold shadow-xs"
                >
                  <Plus size={13} /> Add Category
                </Button>
              </div>

              {errors.warranty && (
                <p className="text-[11px] font-bold text-red-500">{errors.warranty}</p>
              )}

              {warrantyComponents.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2 text-center">
                  No warranty categories added yet. Click &quot;Add Category&quot; above to configure.
                </p>
              ) : (
                <div className="space-y-3">
                  {warrantyComponents.map((wc, idx) => {
                    const chosen = warrantyPolicies.find((p) => String(p.id) === wc.policyId)
                    const isNone = isNoWarrantyPolicy(wc.policyId)
                    const policyErr = errors[`warranty_policy_${idx}`]
                    const monthsErr = errors[`warranty_months_${idx}`]

                    return (
                      <div
                        key={idx}
                        className={cn(
                          "border rounded-xl p-3.5 space-y-3 bg-white shadow-xs transition-all",
                          (policyErr || monthsErr)
                            ? "border-red-300 ring-1 ring-red-100 bg-red-50/20"
                            : "border-slate-200/90 hover:border-slate-300"
                        )}
                      >
                        {/* Header: Badge & Actions */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold tracking-wide uppercase bg-emerald-50 text-emerald-800 border border-emerald-200/70">
                              <ShieldCheck className="size-3.5 text-emerald-600" />
                              Category {idx + 1}
                            </span>
                            {chosen && !isNone && (
                              <span
                                className={cn(
                                  "text-[10px] font-semibold px-2 py-0.5 rounded-md border",
                                  chosen.code === "service"
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : chosen.code === "parts"
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : chosen.code === "full"
                                    ? "bg-purple-50 text-purple-700 border-purple-200"
                                    : "bg-slate-50 text-slate-700 border-slate-200"
                                )}
                              >
                                {chosen.code === "service"
                                  ? "Labor Service Covered"
                                  : chosen.code === "parts"
                                  ? "Parts Replacement Covered"
                                  : chosen.code === "full"
                                  ? "Full Labor + Parts Covered"
                                  : chosen.name}
                              </span>
                            )}
                            {isNone && wc.policyId && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200">
                                No Warranty Coverage
                              </span>
                            )}
                          </div>

                          {warrantyComponents.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setWarrantyComponents(warrantyComponents.filter((_, i) => i !== idx))}
                              className="h-6 px-2 text-red-500 hover:text-red-700 hover:bg-red-50 text-xs font-medium gap-1"
                              aria-label="Remove warranty category"
                            >
                              <Trash2 className="size-3.5" />
                              <span className="text-[11px]">Remove</span>
                            </Button>
                          )}
                        </div>

                        {/* Fields Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                          {/* Warranty Policy (7 cols) */}
                          <div className="sm:col-span-7 space-y-1">
                            <label className="text-[11px] font-bold text-slate-700">
                              Warranty Policy <span className="text-red-500">*</span>
                            </label>
                            <Select
                              value={wc.policyId || ""}
                              onValueChange={(v) => {
                                const next = [...warrantyComponents]
                                const noneSelected = isNoWarrantyPolicy(v)
                                next[idx] = {
                                  ...next[idx],
                                  policyId: v,
                                  months: noneSelected ? "" : next[idx].months,
                                }
                                setWarrantyComponents(next)
                              }}
                            >
                              <SelectTrigger className={cn("w-full bg-slate-50/70 text-xs h-8.5", policyErr && "border-red-500 ring-1 ring-red-200")}>
                                <SelectValue placeholder={warrantyPolicies.length ? "Select warranty policy..." : "No policies available"} />
                              </SelectTrigger>
                              <SelectContent className="w-full">
                                {warrantyPolicies.map((p) => (
                                  <SelectItem key={p.id} value={String(p.id)}>
                                    <div className="flex items-center gap-1.5">
                                      <span>{p.name}</span>
                                      {p.code && (
                                        <span className="text-[10px] text-slate-400">({p.code})</span>
                                      )}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {policyErr && (
                              <p className="text-[10px] font-bold text-red-500 leading-tight">{policyErr}</p>
                            )}
                          </div>

                          {/* Duration (Months) (5 cols) */}
                          <div className="sm:col-span-5 space-y-1">
                            <label className="text-[11px] font-bold text-slate-700">
                              Duration {!isNone && <span className="text-red-500">*</span>}
                            </label>
                            <div className="relative">
                              <Input
                                type="number"
                                min={1}
                                disabled={isNone || !wc.policyId}
                                value={isNone ? "" : wc.months}
                                onChange={(e) => {
                                  const next = [...warrantyComponents]
                                  next[idx] = { ...next[idx], months: e.target.value }
                                  setWarrantyComponents(next)
                                }}
                                placeholder={!wc.policyId ? "Select policy" : isNone ? "N/A" : "e.g. 12"}
                                className={cn(
                                  "bg-slate-50/70 text-xs h-8.5 pr-14",
                                  isNone || !wc.policyId ? "bg-slate-100/80 cursor-not-allowed text-slate-400" : monthsErr ? "border-red-500 ring-1 ring-red-200" : ""
                                )}
                              />
                              {!isNone && wc.policyId && (
                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-medium pointer-events-none">
                                  months
                                </span>
                              )}
                            </div>
                            {monthsErr && (
                              <p className="text-[10px] font-bold text-red-500 leading-tight">{monthsErr}</p>
                            )}
                          </div>

                          {/* Coverage / Component Note (12 cols) */}
                          <div className="sm:col-span-12 space-y-1">
                            <label className="text-[11px] font-bold text-slate-700">
                              Component / Part Note <span className="text-slate-400 font-normal text-[10px]">(optional)</span>
                            </label>
                            <Input
                              value={wc.note}
                              disabled={isNone}
                              onChange={(e) => {
                                const next = [...warrantyComponents]
                                next[idx] = { ...next[idx], note: e.target.value }
                                setWarrantyComponents(next)
                              }}
                              placeholder={isNone ? "Not applicable" : "e.g. Compressor 5 yrs, Panel 2 yrs, Motor"}
                              className={cn("text-xs bg-slate-50/70 h-8.5", isNone && "bg-slate-100/80 cursor-not-allowed opacity-60")}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-6 items-center flex-wrap">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-is-featured"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <label htmlFor="edit-is-featured" className="text-xs font-bold cursor-pointer select-none">
                Feature this Product
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-emi-available"
                checked={emiAvailable}
                onChange={(e) => setEmiAvailable(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="edit-emi-available" className="text-xs font-bold cursor-pointer select-none">
                EMI Available
              </label>
            </div>
          </div>

          {/* Premium Product Specifications Card */}
          <div className="border border-slate-150 rounded-xl p-5 bg-slate-50/70 shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-1 border-b">
              <Settings className="size-4 text-emerald-600 animate-spin-slow" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Product Specifications</h3>
            </div>
            
            {/* Added specifications lists grouped under header blocks */}
            {Object.keys(groupedCustomSpecs).length > 0 ? (
              <div className="space-y-4">
                {Object.keys(groupedCustomSpecs).map((groupName) => (
                  <div key={groupName} className="border border-slate-200/80 rounded-lg p-3 bg-white space-y-2">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100/50 uppercase tracking-wider">
                      {groupName}
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1.5">
                      {groupedCustomSpecs[groupName].map((item) => {
                        const idx = customSpecs.findIndex((c) => c.label === item.label && c.group === item.group)
                        return (
                          <div key={idx} className="flex items-center gap-2 bg-slate-50 border border-slate-100 hover:border-slate-200 p-2 rounded-md transition text-xs">
                            <div className="flex-1 grid grid-cols-2 gap-2">
                              <div className="space-y-0.5">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Spec Name :</span>
                                <Input
                                  value={item.label}
                                  onChange={(e) => handleSpecLabelUpdate(idx, e.target.value)}
                                  placeholder="Spec Name"
                                  className="h-7 text-xs bg-white border border-slate-200 focus:border-green-400 focus:ring-1 focus:ring-green-400 w-full font-medium"
                                />
                              </div>
                              <div className="space-y-0.5">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Spec Value :</span>
                                <Input
                                  value={item.value}
                                  onChange={(e) => handleSpecValueUpdate(idx, e.target.value)}
                                  placeholder="Enter value"
                                  className="h-7 text-xs bg-white border border-slate-200 focus:border-green-400 focus:ring-1 focus:ring-green-400 w-full"
                                />
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => handleRemoveCustomSpec(idx)}
                              className="text-red-500 hover:text-red-600 hover:bg-red-50 p-1 h-7 w-7 rounded-md mt-4"
                            >
                              <Trash2 size={13} />
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-2 text-center">No specification parameters added yet.</p>
            )}

            {/* Custom spec inputs with simple text fields */}
            <div className="border border-slate-200/70 rounded-xl p-4 bg-white shadow-xs space-y-4">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Add Custom Field</span>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Group Text Input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Spec Group Header :</label>
                  <Input
                    placeholder="e.g. Display, Connectivity, Power..."
                    value={customSpecGroup}
                    onChange={(e) => setCustomSpecGroup(e.target.value)}
                    className="h-8 text-xs bg-slate-50/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Spec Name :</label>
                  <Input
                    placeholder="e.g. Refresh Rate, HDMI Ports"
                    value={customSpecLabel}
                    onChange={(e) => setCustomSpecLabel(e.target.value)}
                    className="h-8 text-xs bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="flex gap-3 items-end">
                <div className="space-y-1 flex-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Spec Value :</label>
                  <Input
                    placeholder="e.g. 120Hz, 3 Ports"
                    value={customSpecValue}
                    onChange={(e) => setCustomSpecValue(e.target.value)}
                    className="h-8 text-xs bg-slate-50/50"
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleAddCustomSpec}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-4 text-xs font-bold flex items-center gap-1.5 shadow-sm rounded-lg transition"
                >
                  <Plus size={12} /> Add Field
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold">Description :</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className={errors.description ? "border-red-500" : ""}
            />
            {errors.description && <p className="text-[10px] font-bold text-red-500">{errors.description}</p>}
          </div>

          {/* SEO Override Settings Accordion */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
            <button
              type="button"
              onClick={() => setShowSeo(!showSeo)}
              className="flex items-center justify-between w-full text-left font-bold text-xs uppercase tracking-wider text-slate-700 hover:text-slate-900"
            >
              <span className="flex items-center gap-1.5">
                <Globe className="size-4 text-emerald-600 animate-pulse" />
                Optional: Customize Search Engine SEO
              </span>
              <span>{showSeo ? "Hide" : "Show"}</span>
            </button>
            
            {showSeo && (
              <div className="grid gap-4 mt-4 pt-4 border-t border-slate-200">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500">Custom Meta Title :</label>
                  <Input
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder="Defaults to Product Name if left blank"
                    className="bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500">Custom Meta Description :</label>
                  <Textarea
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    placeholder="Defaults to a short excerpt of description if left blank"
                    rows={3}
                    className="bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500">Custom Social Sharing (OG) Image URL :</label>
                  <Input
                    value={seoOgImage}
                    onChange={(e) => setSeoOgImage(e.target.value)}
                    placeholder="Defaults to Primary Image URL if left blank"
                    className="bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500">Custom SEO Keywords (comma separated) :</label>
                  <Input
                    value={seoKeywords}
                    onChange={(e) => setSeoKeywords(e.target.value)}
                    placeholder="e.g. led tv, smart tv, general ac"
                    className="bg-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="edit-seo-indexable"
                    checked={seoIndexable}
                    onChange={(e) => setSeoIndexable(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="edit-seo-indexable" className="text-xs font-bold text-slate-600 cursor-pointer select-none">
                    Allow search engines to index this product (Indexable)
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            onClick={handleSave}
            disabled={submitting}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            {submitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface SortableProductImageProps {
  img: any
  index: number
  onDelete: () => void
  onSetPrimary: () => void
}

function SortableProductImage({ img, index, onDelete, onSetPrimary }: SortableProductImageProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: img.id })
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : 1 }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative aspect-square rounded-xl border-2 overflow-hidden group transition bg-slate-50",
        img.isPrimary ? "border-amber-400 shadow-sm" : "border-slate-200",
        isDragging && "opacity-50"
      )}
    >
      <Image src={img.previewUrl} alt="Preview" fill sizes="200px" className="object-cover" unoptimized={true} />
      
      {/* Hover Actions Bar */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onSetPrimary}
            className={cn(
              "h-8 w-8 rounded-full bg-white transition hover:scale-110",
              img.isPrimary ? "text-amber-500 hover:text-amber-600" : "text-slate-400 hover:text-amber-500"
            )}
            title="Set Primary Image"
          >
            <Star size={14} fill={img.isPrimary ? "currentColor" : "none"} />
          </Button>
          
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="p-2 bg-white text-slate-600 rounded-full cursor-grab active:cursor-grabbing hover:scale-110 transition"
            title="Drag to Reorder"
          >
            <GripVertical size={14} />
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-8 w-8 rounded-full bg-white text-red-500 hover:text-red-600 hover:scale-110 transition"
            title="Delete Image"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      {/* Primary Badge */}
      {img.isPrimary && (
        <div className="absolute top-1.5 left-1.5 bg-amber-500 text-white text-[8px] font-bold uppercase px-1.5 py-0.5 rounded shadow-sm">
          Primary
        </div>
      )}

      {/* Order Number Badge */}
      <div className="absolute bottom-1.5 right-1.5 bg-slate-900/60 text-white text-[8px] font-bold px-1.5 py-0.5 rounded backdrop-blur-xs">
        #{index + 1}
      </div>
    </div>
  )
}
