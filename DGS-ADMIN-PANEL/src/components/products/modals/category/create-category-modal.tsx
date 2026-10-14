/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React, { useState, useRef, useEffect, useMemo } from "react"
import { categoryCreateSchema } from "@/zod/category.validation"
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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Upload, X, Check, ChevronsUpDown } from "lucide-react"

import { createCategory, uploadCategoryImage, listCategoriesOptions } from "@/services/category/category.service"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

type CategoryStatus = "active" | "inactive" | "archived"

interface Props {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onAdd?: (
    name: string,
    description: string,
    status: CategoryStatus,
    parentId?: number | null,
    imageUrl?: string | null,
  ) => void | Promise<void>
  onCreated?: (category: any) => void
  categories?: any[]
  triggerLabel?: string
  trigger?: React.ReactNode
  disabled?: boolean
}

export default function AddCategoryModal({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onAdd,
  onCreated,
  categories = [],
  triggerLabel = "Add category",
  trigger,
  disabled = false,
}: Props) {
  const router = useRouter()
  const [localOpen, setLocalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const isOpen = isControlled ? controlledOpen : localOpen

  const [availableCategories, setAvailableCategories] = useState<any[]>(categories)

  useEffect(() => {
    if (categories && categories.length > 0) {
      setAvailableCategories(categories)
    }
  }, [categories])

  useEffect(() => {
    if (isOpen && availableCategories.length === 0) {
      listCategoriesOptions()
        .then((res) => {
          if (res.success && res.data) {
            setAvailableCategories(res.data)
          }
        })
        .catch(() => {})
    }
  }, [isOpen, availableCategories.length])

  const setOpen = (val: boolean) => {
    if (isControlled) {
      controlledOnOpenChange?.(val)
    } else {
      setLocalOpen(val)
    }
  }

  const [categoryName, setCategoryName] = useState("")
  const [parentId, setParentId] = useState("root")
  const [parentPopoverOpen, setParentPopoverOpen] = useState(false)
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<CategoryStatus>("active")
  const [categoryImage, setCategoryImage] = useState<{ file: File; preview: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})

  const reset = () => {
    setCategoryName("")
    setParentId("root")
    setDescription("")
    setStatus("active")
    setCategoryImage(null)
    setErrors({})
  }

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      reset()
    }
    setOpen(val)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5MB limit.")
      return
    }

    if (categoryImage?.preview) URL.revokeObjectURL(categoryImage.preview)

    setCategoryImage({
      file,
      preview: URL.createObjectURL(file),
    })
  }

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (categoryImage?.preview) URL.revokeObjectURL(categoryImage.preview)
    setCategoryImage(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleAdd = async () => {
    setErrors({})

    const parentVal = parentId === "root" ? null : Number(parentId)
    const result = categoryCreateSchema.safeParse({
      name: categoryName,
      description,
      status,
      parent_id: parentVal,
    })

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors
      const errs: Record<string, string | undefined> = {}
      Object.keys(fieldErrors).forEach((k) => {
        errs[k] = fieldErrors[k as keyof typeof fieldErrors]?.[0]
      })
      setErrors(errs)
      return
    }

    setSubmitting(true)
    const loadingToast = toast.loading("Saving category...")

    try {
      let finalImageUrl = null
      if (categoryImage?.file) {
        toast.message("Uploading category banner...", { id: loadingToast })
        const formData = new FormData()
        formData.append("file", categoryImage.file)

        const uploadRes = await uploadCategoryImage(formData)
        if (!uploadRes.success || !uploadRes.data?.url) {
          toast.dismiss(loadingToast)
          toast.error(uploadRes.message || "Failed to upload category image")
          setSubmitting(false)
          return
        }
        finalImageUrl = uploadRes.data.url
      }

      toast.message("Saving category...", { id: loadingToast })

      if (onAdd) {
        await onAdd(
          result.data.name,
          result.data.description || "",
          result.data.status as CategoryStatus,
          result.data.parent_id,
          finalImageUrl,
        )
        reset()
        onCreated?.(null)
        handleOpenChange(false)
        router.refresh()
      } else {
        const res = await createCategory({
          name: result.data.name,
          description: result.data.description || "",
          status: result.data.status as CategoryStatus,
          parent_id: result.data.parent_id,
          image_url: finalImageUrl,
        })

        if (res.success) {
          toast.dismiss(loadingToast)
          toast.success("Category created successfully")
          reset()
          onCreated?.(res.data)
          handleOpenChange(false)
          router.refresh()
        } else {
          toast.dismiss(loadingToast)
          toast.error(res.message || "Failed to create category")
          if (res.errors) {
            setErrors(res.errors as any)
          }
        }
      }
    } catch (err: any) {
      toast.dismiss(loadingToast)
      toast.error(err.message || "An unexpected error occurred")
    } finally {
      toast.dismiss(loadingToast)
      setSubmitting(false)
    }
  }

  const parentChoices = useMemo(() => {
    const result: { id: string | number; name: string; displayName: string; rawName: string }[] = []
    const childrenMap = availableCategories.reduce((acc, c) => {
      if (c.parent_id) {
        const pid = c.parent_id.toString()
        if (!acc[pid]) acc[pid] = []
        acc[pid].push(c)
      }
      return acc
    }, {} as Record<string, any[]>)

    const traverse = (cat: any, depth: number) => {
      const displayPrefix = "— ".repeat(depth)
      result.push({
        id: cat.id,
        name: cat.name,
        rawName: cat.name,
        displayName: `${displayPrefix}${cat.name}`,
      })
      const children = childrenMap[cat.id.toString()]
      if (children) {
        children.sort((a: any, b: any) => a.name.localeCompare(b.name))
        children.forEach((child: any) => traverse(child, depth + 1))
      }
    }

    const roots = availableCategories.filter((c) => !c.parent_id)
    roots.sort((a, b) => a.name.localeCompare(b.name))
    roots.forEach((root) => traverse(root, 0))

    const processedIds = new Set(result.map((c) => String(c.id)))
    availableCategories.forEach((c) => {
      if (!processedIds.has(String(c.id))) {
        result.push({
          id: c.id,
          name: c.name,
          rawName: c.name,
          displayName: c.name,
        })
      }
    })

    return result
  }, [availableCategories])

  const selectedParentLabel = useMemo(() => {
    if (parentId === "root") return "None (Top-Level Category)"
    const match = parentChoices.find((c) => String(c.id) === String(parentId))
    return match ? match.rawName : "Select Parent Category"
  }, [parentId, parentChoices])

  return (
    <Dialog open={disabled ? false : isOpen} onOpenChange={disabled ? undefined : handleOpenChange}>
      <DialogTrigger asChild disabled={disabled}>
        {trigger ?? <Button variant="secondary" disabled={disabled}>{triggerLabel}</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Category</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          
          {/* Category Image Upload */}
          <div>
            <label className="text-xs font-bold mb-2 block">Category Banner / Icon</label>
            <div className="flex items-center gap-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 h-32 border-2 border-dashed border-muted-foreground/25 hover:border-emerald-500 rounded-lg flex flex-col items-center justify-center cursor-pointer transition bg-muted/5 group relative overflow-hidden"
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
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground group-hover:text-emerald-500 transition mb-2" />
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

          <div className="space-y-1">
            <Label htmlFor="category-name" className="text-xs font-bold">Category Name :</Label>
            <Input
              id="category-name"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="e.g. Smart TV"
            />
            {errors?.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Searchable Parent Category Selection */}
          <div className="space-y-1">
            <Label className="text-xs font-bold">Parent Category (Optional) :</Label>
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
                          setParentId("root")
                          setParentPopoverOpen(false)
                        }}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            parentId === "root" ? "opacity-100 text-emerald-600" : "opacity-0"
                          )}
                        />
                        <span className="font-semibold text-slate-800">None (Top-Level Category)</span>
                      </CommandItem>
                      {parentChoices.map((cat) => (
                        <CommandItem
                          key={cat.id}
                          value={`${cat.rawName} ${cat.displayName}`}
                          onSelect={() => {
                            setParentId(String(cat.id))
                            setParentPopoverOpen(false)
                          }}
                          className="cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              String(parentId) === String(cat.id) ? "opacity-100 text-emerald-600" : "opacity-0"
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

          <div className="space-y-1">
            <Label htmlFor="description" className="text-xs font-bold">Description :</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description..."
              rows={3}
            />
            {errors?.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold">Status :</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as CategoryStatus)}>
              <SelectTrigger className="w-full bg-white">
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

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            onClick={handleAdd}
            className="bg-green-500 hover:bg-green-600 text-white"
            disabled={submitting}
          >
            {submitting ? "Adding..." : "Add Category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
