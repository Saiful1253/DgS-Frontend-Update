/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Edit,
  Trash2,
  Star,
  Eye,
  CheckCircle2,
  XCircle,
  FileText,
  Cpu,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import { type Product } from "@/types/product/product";
import { type ProductInput } from "@/zod/product.validation";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import EditProductModal from "./modals/product/edit-product-modal";
import DeleteProductDialog from "./modals/product/delete-product-dialog";
import { Button } from "../ui/button";
import {
  updateProduct,
  toggleProductFeatured,
} from "@/services/product.service";

export interface ProductTableProps {
  products: Product[];
  categories?: { id: string | number; name: string; parent_id?: string | number | null }[];
  brands?: { id: string; name: string }[];
  warrantyPolicies?: { id: string | number; name: string; code: string }[];
  onProductUpdate?: (
    updatedProduct: ProductInput & { id: string | number },
    imageFile?: File
  ) => Promise<void>;
  hasManageAccess?: boolean;
}

export const ProductTable = ({
  products,
  categories = [],
  brands = [],
  warrantyPolicies = [],
  onProductUpdate,
  hasManageAccess = false,
}: ProductTableProps) => {
  const router = useRouter();
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [togglingFeaturedId, setTogglingFeaturedId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeImageMap, setActiveImageMap] = useState<Record<string | number, string>>({});

  /* ── helpers ── */
  const getCategoryPath = (catId: string | number | undefined) => {
    if (!catId) return "Uncategorized";
    const parts: string[] = [];
    let currId = String(catId);
    const visited = new Set<string>();
    while (currId) {
      if (visited.has(currId)) break;
      visited.add(currId);
      const cat = categories.find((c) => String(c.id) === currId);
      if (!cat) break;
      parts.unshift(cat.name);
      currId = cat.parent_id ? String(cat.parent_id) : "";
    }
    return parts.length > 0 ? parts.join(" → ") : "Uncategorized";
  };

  /* ── actions ── */
  const handleStatusChange = async (id: string, newStatus: string) => {
    if (updatingStatusId) return;
    setUpdatingStatusId(id);
    toast.loading(`Marking product as ${newStatus}...`);
    try {
      const json = await updateProduct(id, { status: newStatus });
      toast.dismiss();
      if (!json.success) {
        toast.error(json.message || "Failed to update status");
        return;
      }
      toast.success(`Product marked as ${newStatus}`);
      router.refresh();
    } catch (e: unknown) {
      toast.dismiss();
      toast.error(e instanceof Error ? e.message : "Failed to update status");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleFeaturedToggle = async (id: string, currentFeatured: boolean) => {
    if (togglingFeaturedId) return;
    setTogglingFeaturedId(id);
    const nextVal = !currentFeatured;
    const loadingToast = toast.loading(
      nextVal ? "Featuring product..." : "Removing from featured..."
    );
    try {
      const res = await toggleProductFeatured(id, nextVal);
      toast.dismiss(loadingToast);
      if (res.success) {
        toast.success(
          nextVal ? "Product featured successfully" : "Product unfeatured successfully"
        );
        router.refresh();
      } else {
        toast.error(res.message || "Failed to update featured status");
      }
    } catch (e: unknown) {
      toast.dismiss(loadingToast);
      toast.error(
        e instanceof Error ? e.message : "Failed to update featured status"
      );
    } finally {
      setTogglingFeaturedId(null);
    }
  };

  /* ── detail modal helpers ── */
  const getSpecsGrouped = (p: Product) => {
    const specsGrouped: Record<string, { label: string; value: any }[]> = {};
    if (p.specifications_json) {
      Object.entries(p.specifications_json).forEach(([key, val]) => {
        const parts = key.split("__");
        const group = parts[0] || "General";
        const label = parts[1] || parts[0];
        if (!specsGrouped[group]) specsGrouped[group] = [];
        specsGrouped[group].push({ label, value: val });
      });
    }
    return specsGrouped;
  };

  /* ── render ── */
  return (
    <>
      <div className="rounded-lg border bg-card w-full overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/60 hover:bg-muted/60">
              <TableHead className="text-left uppercase font-bold text-[11px] tracking-wider whitespace-nowrap">Image</TableHead>
              <TableHead className="text-left uppercase font-bold text-[11px] tracking-wider whitespace-nowrap">Product</TableHead>
              <TableHead className="text-left uppercase font-bold text-[11px] tracking-wider whitespace-nowrap">Category</TableHead>
              <TableHead className="text-left uppercase font-bold text-[11px] tracking-wider whitespace-nowrap">Brand</TableHead>
              <TableHead className="text-left uppercase font-bold text-[11px] tracking-wider whitespace-nowrap">Model / Serial</TableHead>
              <TableHead className="text-right uppercase font-bold text-[11px] tracking-wider whitespace-nowrap">Final Price</TableHead>
              <TableHead className="text-center uppercase font-bold text-[11px] tracking-wider whitespace-nowrap">Discount</TableHead>
              <TableHead className="text-center uppercase font-bold text-[11px] tracking-wider whitespace-nowrap">EMI</TableHead>
              <TableHead className="text-center uppercase font-bold text-[11px] tracking-wider whitespace-nowrap">Featured</TableHead>
              <TableHead className="text-center uppercase font-bold text-[11px] tracking-wider whitespace-nowrap">Status</TableHead>
              <TableHead className="text-center uppercase font-bold text-[11px] tracking-wider whitespace-nowrap">Update Status</TableHead>
              <TableHead className="text-right uppercase font-bold text-[11px] tracking-wider whitespace-nowrap">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products && products.length > 0 ? (
              products.map((p) => {
                const images = p.images || [];
                const primaryImage =
                  images.find((img) => img.is_primary) || images[0];
                const hasDiscount =
                  p.discount_type &&
                  p.discount_value &&
                  Number(p.discount_value) > 0;

                return (
                  <TableRow key={p.id} className="hover:bg-muted/30 transition-colors">
                    {/* Image thumbnail */}
                    <TableCell className="py-2 px-3">
                      <div className="relative h-12 w-12 rounded-lg overflow-hidden border border-slate-100 bg-slate-50 shrink-0">
                        <Image
                          src={primaryImage?.image_url || "/placeholder-product.svg"}
                          alt={p.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    </TableCell>

                    {/* Name + slug */}
                    <TableCell className="py-2 px-3 min-w-[160px] max-w-[200px]">
                      <div className="font-semibold text-sm text-foreground truncate" title={p.name}>
                        {p.name}
                      </div>
                      {p.slug && (
                        <div className="text-[10px] text-muted-foreground truncate mt-0.5" title={p.slug}>
                          /{p.slug}
                        </div>
                      )}
                    </TableCell>

                    {/* Category (full path) */}
                    <TableCell className="py-2 px-3 max-w-[160px]">
                      <span className="text-xs text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 font-medium truncate block" title={getCategoryPath(p.category_id || p.category?.id)}>
                        {getCategoryPath(p.category_id || p.category?.id)}
                      </span>
                    </TableCell>

                    {/* Brand */}
                    <TableCell className="py-2 px-3 whitespace-nowrap">
                      <span className="text-xs text-slate-600 font-medium">
                        {p.brand?.name || "—"}
                      </span>
                    </TableCell>

                    {/* Model / Serial */}
                    <TableCell className="py-2 px-3 whitespace-nowrap text-xs text-muted-foreground font-mono">
                      {p.serial_number || "—"}
                    </TableCell>

                    {/* Final Price */}
                    <TableCell className="py-2 px-3 text-right whitespace-nowrap">
                      <span className="text-sm font-bold text-green-700">
                        ৳{Number(p.final_price || p.base_price || 0).toLocaleString()}
                      </span>
                    </TableCell>

                    {/* Discount */}
                    <TableCell className="py-2 px-3 text-center whitespace-nowrap">
                      {hasDiscount ? (
                        <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">
                          {p.discount_type === "percentage"
                            ? `${p.discount_value}% OFF`
                            : `৳${p.discount_value} OFF`}
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* EMI */}
                    <TableCell className="py-2 px-3 text-center">
                      {p.emi_available ? (
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                          EMI
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Featured toggle */}
                    <TableCell className="py-2 px-3 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`p-2 h-auto rounded ${
                          p.is_featured
                            ? "text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                            : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                        }`}
                        disabled={!hasManageAccess || togglingFeaturedId === p.id}
                        onClick={() => handleFeaturedToggle(p.id, !!p.is_featured)}
                        title={p.is_featured ? "Remove from featured" : "Feature product"}
                      >
                        <Star
                          size={16}
                          className={p.is_featured ? "fill-amber-400 text-amber-500" : ""}
                        />
                      </Button>
                    </TableCell>

                    {/* Status badge */}
                    <TableCell className="py-2 px-3 text-center">
                      <Badge
                        variant={p.status === "active" ? "default" : "secondary"}
                        className={`font-normal text-[10px] ${
                          p.status === "active"
                            ? "bg-green-100 text-green-800 hover:bg-green-200 border-green-200"
                            : p.status === "archived"
                            ? "bg-red-100 text-red-800 hover:bg-red-200 border-red-200"
                            : "bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200"
                        }`}
                      >
                        {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                      </Badge>
                    </TableCell>

                    {/* Status select */}
                    <TableCell className="py-2 px-3 text-center">
                      <Select
                        disabled={!hasManageAccess || updatingStatusId === p.id}
                        value={p.status}
                        onValueChange={(value) => handleStatusChange(p.id, value)}
                      >
                        <SelectTrigger className="h-7 w-28 text-xs">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Hidden</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="py-2 px-3 text-right">
                      <div className="flex items-center gap-1 justify-end">
                        {/* Details */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2 h-auto hover:bg-sky-50 text-sky-600 rounded"
                          aria-label="View product details"
                          title="View details"
                          onClick={() => setSelectedProduct(p)}
                        >
                          <Eye size={15} />
                        </Button>

                        <EditProductModal
                          product={p}
                          categories={categories}
                          brands={brands}
                          warrantyPolicies={warrantyPolicies}
                          onSave={onProductUpdate}
                          triggerIcon={
                            <Button
                              variant="ghost"
                              className="p-2 h-auto hover:bg-gray-100 rounded"
                              aria-label="Edit product"
                              disabled={!hasManageAccess}
                            >
                              <Edit size={15} />
                            </Button>
                          }
                        />

                        <DeleteProductDialog
                          productId={p.id}
                          productName={p.name}
                          onDeleted={() => router.refresh()}
                          trigger={
                            <Button
                              variant="ghost"
                              className="p-2 h-auto hover:bg-red-50 text-red-600 rounded"
                              aria-label="Delete product"
                              disabled={!hasManageAccess}
                            >
                              <Trash2 size={15} />
                            </Button>
                          }
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={12}
                  className="px-4 py-10 text-sm text-muted-foreground text-center"
                >
                  No products found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Details Modal ── */}
      <Dialog
        open={!!selectedProduct}
        onOpenChange={(open) => !open && setSelectedProduct(null)}
      >
        {selectedProduct &&
          (() => {
            const p = selectedProduct;
            const images = p.images || [];
            const defaultImage =
              images.find((i) => i.is_primary)?.image_url ||
              images[0]?.image_url ||
              "";
            const activeImage = activeImageMap[p.id] || defaultImage;
            const specsGrouped = getSpecsGrouped(p);

            return (
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6">
                <DialogHeader className="border-b pb-4">
                  <DialogTitle className="text-xl font-black text-slate-800">
                    {p.name}
                  </DialogTitle>
                  <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wider">
                    {getCategoryPath(p.category_id || p.category?.id)}
                    {p.brand?.name ? ` • ${p.brand.name}` : ""}
                  </p>
                </DialogHeader>

                {/* Top Section: Gallery (Left) & Pricing/Facts (Right) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  {/* Left: Image gallery */}
                  <div className="space-y-3">
                    <div className="relative aspect-video sm:aspect-square w-full rounded-xl overflow-hidden bg-slate-50 border border-slate-100">
                      {activeImage ? (
                        <Image
                          src={activeImage}
                          alt="Product Image"
                          fill
                          sizes="600px"
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-slate-300 font-bold uppercase">
                          No Image
                        </div>
                      )}
                    </div>
                    {images.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                        {images.map((img) => (
                          <button
                            key={img.id}
                            onClick={() =>
                              setActiveImageMap((prev) => ({
                                ...prev,
                                [p.id]: img.image_url,
                              }))
                            }
                            className={`relative h-12 w-12 rounded-md overflow-hidden border-2 flex-shrink-0 transition ${
                              activeImage === img.image_url
                                ? "border-emerald-500 shadow-xs"
                                : "border-slate-200"
                            }`}
                          >
                            <Image
                              src={img.image_url}
                              alt="Thumbnail"
                              fill
                              sizes="48px"
                              className="object-cover"
                              unoptimized
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right: Details */}
                  <div className="space-y-4">
                    {/* Pricing */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Pricing Information
                      </div>
                      <div className="flex items-baseline gap-3">
                        {p.discount_type &&
                        p.discount_value &&
                        Number(p.discount_value) > 0 ? (
                          <>
                            <span className="text-2xl font-black text-slate-800">
                              ৳{Number(p.final_price).toLocaleString()}
                            </span>
                            <span className="text-sm text-slate-400 line-through">
                              ৳{Number(p.base_price).toLocaleString()}
                            </span>
                            <span className="text-xs font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
                              {p.discount_type === "percentage"
                                ? `${p.discount_value}% OFF`
                                : `৳${p.discount_value} OFF`}
                            </span>
                          </>
                        ) : (
                          <span className="text-2xl font-black text-slate-800">
                            ৳{Number(p.base_price).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick facts grid */}
                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                      <div className="border rounded-lg p-2.5 space-y-1 bg-white">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">
                          Model / Serial No:
                        </span>
                        <span className="font-extrabold text-slate-700 break-all">
                          {p.serial_number || "N/A"}
                        </span>
                      </div>
                      <div className="border rounded-lg p-2.5 space-y-1 bg-white">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">
                          Country of Origin:
                        </span>
                        <span className="font-extrabold text-slate-700">
                          {p.country_of_origin || "N/A"}
                        </span>
                      </div>
                      <div className="border rounded-lg p-2.5 space-y-1 bg-white">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">
                          EMI Status:
                        </span>
                        <span className="font-extrabold flex items-center gap-1">
                          {p.emi_available ? (
                            <span className="text-blue-600 flex items-center gap-0.5">
                              <CheckCircle2 size={12} /> Available
                            </span>
                          ) : (
                            <span className="text-slate-400 flex items-center gap-0.5">
                              <XCircle size={12} /> Not Available
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="border rounded-lg p-2.5 space-y-1 bg-white">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">
                          Status:
                        </span>
                        <span
                          className={`font-extrabold capitalize ${
                            p.status === "active"
                              ? "text-emerald-600"
                              : p.status === "archived"
                              ? "text-red-500"
                              : "text-slate-500"
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>
                      <div className="border rounded-lg p-2.5 space-y-1 bg-white">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">
                          Featured:
                        </span>
                        <span className="font-extrabold flex items-center gap-1">
                          {p.is_featured ? (
                            <span className="text-amber-500 flex items-center gap-0.5">
                              <CheckCircle2 size={12} /> Yes
                            </span>
                          ) : (
                            <span className="text-slate-400 flex items-center gap-0.5">
                              <XCircle size={12} /> No
                            </span>
                          )}
                        </span>
                      </div>
                      {p.slug && (
                        <div className="border rounded-lg p-2.5 space-y-1 bg-white">
                          <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">
                            Slug:
                          </span>
                          <span className="font-mono text-xs text-slate-600 truncate block">
                            /{p.slug}
                          </span>
                        </div>
                      )}
                      {p.created_at && (
                        <div className="border rounded-lg p-2.5 space-y-1 bg-white">
                          <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">
                            Created At:
                          </span>
                          <span className="text-[11px] text-slate-600">
                            {new Date(p.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {p.updated_at && (
                        <div className="border rounded-lg p-2.5 space-y-1 bg-white">
                          <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">
                            Updated At:
                          </span>
                          <span className="text-[11px] text-slate-600">
                            {new Date(p.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Warranty & Guarantee Coverage Section (Individual Row) */}
                <div className="mt-4">
                  <div className="border border-emerald-200/80 bg-gradient-to-br from-emerald-50/40 via-slate-50/60 to-white rounded-xl p-3.5 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-emerald-800">
                        <ShieldCheck className="size-4 text-emerald-600" />
                        <span className="text-xs font-bold uppercase tracking-wider">
                          Warranty & Guarantee Coverage
                        </span>
                      </div>
                      {p.warranty_components && p.warranty_components.length > 0 && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                          {p.warranty_components.length} {p.warranty_components.length === 1 ? 'Plan' : 'Plans'}
                        </span>
                      )}
                    </div>

                    {(!p.warranty_components || p.warranty_components.length === 0) ? (
                      <div className="flex items-center gap-2 py-1 text-slate-500 text-xs">
                        <span className="inline-block w-2 h-2 rounded-full bg-slate-300" />
                        <span>No Warranty Coverage Configured</span>
                      </div>
                    ) : (
                      <div className="space-y-1.5 pt-0.5">
                        {p.warranty_components.map((wc: any, idx: number) => {
                          const policyName =
                            wc.warrantyPolicy?.name ||
                            wc.warranty_policy?.name ||
                            (wc.warranty_policy_id ? `Warranty Plan #${wc.warranty_policy_id}` : 'General Warranty');
                          const months =
                            wc.warranty_months != null && Number(wc.warranty_months) > 0
                              ? Number(wc.warranty_months)
                              : wc.warranty_duration_days
                              ? Math.round(Number(wc.warranty_duration_days) / 30)
                              : null;
                          const isNone =
                            policyName.toLowerCase().includes('no warranty') ||
                            wc.warrantyPolicy?.code === 'none' ||
                            wc.warrantyPolicy?.code === 'no_warranty';

                          const laborCovered =
                            wc.service_coverage != null
                              ? Boolean(wc.service_coverage)
                              : wc.warrantyPolicy?.labor_covered != null
                              ? Boolean(wc.warrantyPolicy.labor_covered)
                              : wc.warrantyPolicy?.code === 'service' ||
                                wc.warrantyPolicy?.code === 'full' ||
                                policyName.toLowerCase().includes('service');

                          const partsCovered =
                            wc.parts_coverage != null
                              ? Boolean(wc.parts_coverage)
                              : wc.warrantyPolicy?.parts_covered != null
                              ? Boolean(wc.warrantyPolicy.parts_covered)
                              : wc.warrantyPolicy?.code === 'parts' ||
                                wc.warrantyPolicy?.code === 'full' ||
                                policyName.toLowerCase().includes('parts');

                          return (
                            <div
                              key={idx}
                              className="border border-emerald-100/90 rounded-lg p-2.5 bg-white shadow-2xs space-y-1.5"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-xs font-bold text-slate-800" title={policyName}>
                                  {policyName}
                                </span>

                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span
                                    className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                                      laborCovered
                                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                        : 'text-slate-400 bg-slate-50 border-slate-200'
                                    }`}
                                  >
                                    Labor: {laborCovered ? '✓ Covered' : '✕ No'}
                                  </span>

                                  <span
                                    className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                                      partsCovered
                                        ? 'text-blue-700 bg-blue-50 border-blue-200'
                                        : 'text-slate-400 bg-slate-50 border-slate-200'
                                    }`}
                                  >
                                    Parts: {partsCovered ? '✓ Covered' : '✕ No'}
                                  </span>

                                  {months && !isNone ? (
                                    <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded border border-emerald-300 shrink-0">
                                      {months >= 12 && months % 12 === 0
                                        ? `${months / 12} ${months === 12 ? 'Year' : 'Years'} (${months} Mo)`
                                        : `${months} Months`}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                                      {isNone ? 'No Coverage' : 'Standard'}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {wc.customer_policy_note && (
                                <p className="text-[10px] text-slate-500 leading-tight italic pt-0.5">
                                  Note: {wc.customer_policy_note}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Product Overview (Description) (Individual Row) */}
                <div className="mt-4">
                  <div className="border border-slate-200 bg-slate-50/40 rounded-xl p-3.5 space-y-1.5 shadow-2xs">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <FileText size={12} /> Product Overview
                    </div>
                    {p.description ? (
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                        {p.description}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 italic py-1">No description provided</p>
                    )}
                  </div>
                </div>

                {/* Specifications */}
                {Object.keys(specsGrouped).length > 0 && (
                  <div className="mt-6 pt-5 border-t space-y-5">
                    <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Cpu size={14} className="text-emerald-600" />
                      Technical Specifications
                    </div>
                    <div className="space-y-6">
                      {Object.keys(specsGrouped).map((groupName) => (
                        <div key={groupName} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800 border-l-4 border-emerald-500 pl-2 uppercase tracking-wide">
                              {groupName}
                            </span>
                          </div>
                          <div className="border border-slate-200 rounded-lg overflow-hidden overflow-x-auto shadow-xs">
                            <table className="w-full text-xs text-left border-collapse bg-white min-w-[480px]">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                                  <th className="px-4 py-2 border-r border-slate-200 w-1/3">
                                    Feature Parameter
                                  </th>
                                  <th className="px-4 py-2">Specification Value</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {specsGrouped[groupName].map((spec, sIdx) => (
                                  <tr
                                    key={sIdx}
                                    className="hover:bg-slate-50/50 transition"
                                  >
                                    <td className="px-4 py-2.5 font-bold text-slate-500 bg-slate-50/20 border-r border-slate-200">
                                      {spec.label}
                                    </td>
                                    <td className="px-4 py-2.5 font-semibold text-slate-800">
                                      {spec.value || "—"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <DialogFooter className="border-t pt-4 mt-6 flex-col gap-2 sm:flex-row">
                  <DialogClose asChild>
                    <Button variant="outline" className="px-5">
                      Close Details
                    </Button>
                  </DialogClose>
                  {hasManageAccess && (
                    <Button
                      variant="default"
                      className="gap-2 px-5"
                      onClick={() => setEditingProduct(p)}
                    >
                      <Edit size={14} /> Edit Product
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            );
          })()}
      </Dialog>

      {/* Edit modal — opened from the details modal footer */}
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          categories={categories}
          brands={brands}
          onSave={onProductUpdate}
          defaultOpen
          onOpenChange={(open) => {
            if (!open) setEditingProduct(null);
          }}
          triggerIcon={<span className="hidden" />}
        />
      )}
    </>
  );
};