/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import EditProductModal from "./modals/product/edit-product-modal";
import DeleteProductDialog from "./modals/product/delete-product-dialog";
import { Product } from "@/types/product/product";
import { type ProductInput } from "@/zod/product.validation";
import { Edit, Trash2, Star,  Cpu,  FileText, CheckCircle2, XCircle,    Eye, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { toggleProductFeatured } from "@/services/product.service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

export interface ProductCardsProps {
  products: Product[];
  categories?: { id: string | number; name: string; parent_id?: string | number | null }[];
  brands?: { id: string; name: string }[];
  warrantyPolicies?: { id: string | number; name: string; code: string }[];
  onProductUpdate?: (updated: ProductInput & { id: string | number }, imageFile?: File) => Promise<void>;
  hasManageAccess?: boolean;
}

export default function ProductCards({
  products,
  categories = [],
  brands = [],
  warrantyPolicies = [],
  onProductUpdate,
  hasManageAccess = false,
}: ProductCardsProps) {
  const router = useRouter();
  const [togglingFeaturedId, setTogglingFeaturedId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeImageMap, setActiveImageMap] = useState<Record<string | number, string>>({});
  const [cardHoverImageMap, setCardHoverImageMap] = useState<Record<string | number, string>>({});

  // Track whether any child modal (Edit / Delete) is currently open.
  const childModalOpenRef = React.useRef(false);
  const justClosedRef = React.useRef(false);
  const justClosedTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleChildModalOpenChange = React.useCallback((open: boolean) => {
    childModalOpenRef.current = open;
    if (!open) {
      justClosedRef.current = true;
      clearTimeout(justClosedTimer.current);
      justClosedTimer.current = setTimeout(() => {
        justClosedRef.current = false;
      }, 300);
    }
  }, []);

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

  const handleFeaturedToggle = async (id: string, currentFeatured: boolean) => {
    if (togglingFeaturedId) return;
    setTogglingFeaturedId(id);

    const nextVal = !currentFeatured;
    const loadingToast = toast.loading(nextVal ? "Featuring product..." : "Removing from featured...");

    try {
      const res = await toggleProductFeatured(id, nextVal);
      toast.dismiss(loadingToast);
      if (res.success) {
        toast.success(nextVal ? "Product featured successfully" : "Product unfeatured successfully");
        router.refresh();
      } else {
        toast.error(res.message || "Failed to update featured status");
      }
    } catch (e: unknown) {
      toast.dismiss(loadingToast);
      toast.error(e instanceof Error ? e.message : "Failed to update featured status");
    } finally {
      setTogglingFeaturedId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {products.map((p) => {
        const images = p.images || [];
        const primaryImage = images.find((img) => img.is_primary) || images[0];
        const displayImageUrl = cardHoverImageMap[p.id] || primaryImage?.image_url || "/placeholder-product.svg";

        return (
          <div
            key={p.id}
            onClick={(e) => {
              if (childModalOpenRef.current || justClosedRef.current) return;
              const target = e.target as HTMLElement;
              if (
                target.closest("[role='dialog']") ||
                target.closest("[role='alertdialog']") ||
                target.closest("button") ||
                target.closest("a") ||
                target.closest(".prevent-modal")
              ) {
                return;
              }
              setSelectedProduct(p);
            }}
            className="rounded-xl border bg-card shadow-sm transition-all hover:shadow-md flex flex-col overflow-hidden group cursor-pointer border-slate-200"
          >
            {/* Image Header */}
            <div className="relative h-56 w-full bg-slate-50 flex items-center justify-center overflow-hidden border-b border-slate-100">
              <Image
                src={displayImageUrl}
                alt={p.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-102"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                unoptimized={true}
              />

              {/* Action Buttons Overlay */}
              <div
                className="absolute top-2.5 right-2.5 flex gap-1 bg-background/90 backdrop-blur-xs rounded-lg p-1 shadow-sm border border-slate-150 z-10"
                onClick={(e) => e.stopPropagation()}
              >
                {/* View Details Eye button matching Table view */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-sky-600 hover:text-sky-700 hover:bg-sky-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedProduct(p);
                  }}
                  aria-label="View product details"
                  title="View details"
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={`h-7 w-7 ${p.is_featured ? "text-amber-500 hover:text-amber-600 hover:bg-amber-50" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}
                  disabled={!hasManageAccess || togglingFeaturedId === p.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFeaturedToggle(p.id, !!p.is_featured);
                  }}
                  aria-label={p.is_featured ? "Remove from featured" : "Feature product"}
                  title={p.is_featured ? "Remove from featured" : "Feature product"}
                >
                  <Star className={`h-3.5 w-3.5 ${p.is_featured ? "fill-amber-400 text-amber-500" : ""}`} />
                </Button>
                <EditProductModal
                  product={p}
                  categories={categories}
                  brands={brands}
                  warrantyPolicies={warrantyPolicies}
                  onSave={onProductUpdate}
                  onOpenChange={handleChildModalOpenChange}
                  triggerIcon={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      aria-label="Edit product"
                      disabled={!hasManageAccess}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                  }
                />
                <DeleteProductDialog
                  productId={p.id}
                  productName={p.name}
                  onOpenChange={handleChildModalOpenChange}
                  trigger={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                      aria-label="Delete product"
                      disabled={!hasManageAccess}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  }
                />
              </div>

              {/* Card Image Hover Thumbnail Queue */}
              {images.length > 1 && (
                <div
                  className="absolute bottom-2 left-2 right-2 flex gap-1.5 p-1 bg-slate-900/60 rounded-md backdrop-blur-xs overflow-x-auto scrollbar-none opacity-0 group-hover:opacity-100 transition-opacity prevent-modal z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  {images.map((img) => (
                    <div
                      key={img.id}
                      onMouseEnter={() => setCardHoverImageMap((prev) => ({ ...prev, [p.id]: img.image_url }))}
                      className={`relative h-8 w-8 rounded-sm overflow-hidden border cursor-pointer flex-shrink-0 transition-all ${displayImageUrl === img.image_url ? "border-amber-400 scale-105" : "border-white/50"
                        }`}
                    >
                      <Image src={img.image_url} alt="thumbnail" fill sizes="32px" className="object-cover" unoptimized={true} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Card Body */}
            <div className="p-4 flex flex-col flex-1 space-y-3">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-wider">
                    {getCategoryPath(p.category_id || p.category?.id)}
                  </span>
                  {p.emi_available && (
                    <span className="text-[9px] font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 uppercase tracking-wide">
                      EMI Available
                    </span>
                  )}
                </div>

                <h3 className="font-extrabold text-slate-800 text-base leading-tight mt-2 truncate" title={p.name}>
                  {p.name}
                </h3>

                {/* Additional Information details on card */}
                <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500">
                  <div className="truncate">
                    <span className="font-bold text-slate-400">Brand:</span> {p.brand?.name || "Generic"}
                  </div>
                  <div className="truncate">
                    <span className="font-bold text-slate-400">Model:</span> {p.serial_number || "N/A"}
                  </div>
                  {p.country_of_origin && (
                    <div className="truncate">
                      <span className="font-bold text-slate-400">Origin:</span> {p.country_of_origin}
                    </div>
                  )}
                  <div>
                    <span className="font-bold text-slate-400">Warranty:</span>{" "}
                    {p.warranty_components && p.warranty_components.length > 0
                      ? p.warranty_components
                        .map((wc: any) => {
                          const name = wc.warrantyPolicy?.name || wc.warranty_policy?.name;
                          const mo = wc.warranty_months != null && Number(wc.warranty_months) > 0
                            ? Number(wc.warranty_months)
                            : wc.warranty_duration_days
                              ? Math.round(Number(wc.warranty_duration_days) / 30)
                              : null;
                          if (name?.toLowerCase().includes("no warranty")) return "No Warranty";
                          return mo ? `${name ? `${name.replace(/ warranty/i, '')}: ` : ''}${mo} Mo` : (name || "Standard");
                        })
                        .join(", ")
                      : "No Warranty"}
                  </div>
                </div>
              </div>

              {/* Price Details */}
              <div className="flex items-baseline justify-between pt-1 mt-auto">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Cost</div>
                <div>
                  {p.discount_type && p.discount_value && Number(p.discount_value) > 0 ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400 line-through">
                        ৳{Number(p.base_price || 0).toLocaleString()}
                      </span>
                      <span className="text-base font-black text-green-600">
                        ৳{Number(p.final_price || p.base_price || 0).toLocaleString()}
                      </span>
                    </div>
                  ) : (
                    <span className="text-base font-black text-slate-800">
                      ৳{Number(p.final_price || p.base_price || 0).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Product Details Read-Only Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        {selectedProduct && (() => {
          const p = selectedProduct;
          const images = p.images || [];
          const defaultImage = images.find((i) => i.is_primary)?.image_url || images[0]?.image_url || "";
          const activeImage = activeImageMap[p.id] || defaultImage;

          // Parse specifications json (format Group__Label)
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

          return (
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6">
              <DialogHeader className="border-b pb-4">
                <DialogTitle className="text-xl font-black text-slate-800">{p.name}</DialogTitle>
                <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wider">
                  {getCategoryPath(p.category_id || p.category?.id)} {p.brand?.name ? `• ${p.brand.name}` : ""}
                </p>
              </DialogHeader>

              {/* Top Section: Gallery (Left) & Core Info (Right) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                {/* Left: Product Images Gallery */}
                <div className="space-y-3">
                  <div className="relative aspect-video sm:aspect-square w-full rounded-xl overflow-hidden bg-slate-50 border border-slate-100">
                    <Image
                      src={activeImage || "/placeholder-product.svg"}
                      alt="Product Image"
                      fill
                      sizes="600px"
                      className="object-cover"
                      unoptimized={true}
                    />
                  </div>

                  {images.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                      {images.map((img) => (
                        <button
                          key={img.id}
                          onClick={() => setActiveImageMap((prev) => ({ ...prev, [p.id]: img.image_url }))}
                          className={`relative h-12 w-12 rounded-md overflow-hidden border-2 flex-shrink-0 transition ${activeImage === img.image_url ? "border-emerald-500 shadow-xs" : "border-slate-200"
                            }`}
                        >
                          <Image src={img.image_url} alt="Thumbnail" fill sizes="48px" className="object-cover" unoptimized={true} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: Core Information */}
                <div className="space-y-4">
                  {/* Prices & Status */}
                  <div className="bg-slate-50 border border-slate-150 rounded-xl p-3.5 space-y-1.5">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pricing Information</div>
                    <div className="flex items-baseline gap-3">
                      {p.discount_type && p.discount_value && Number(p.discount_value) > 0 ? (
                        <>
                          <span className="text-2xl font-black text-slate-800">
                            ৳{Number(p.final_price).toLocaleString()}
                          </span>
                          <span className="text-sm text-slate-400 line-through">
                            ৳{Number(p.base_price).toLocaleString()}
                          </span>
                          <span className="text-xs font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-150">
                            {p.discount_type === "percentage" ? `${p.discount_value}% OFF` : `৳${p.discount_value} OFF`}
                          </span>
                        </>
                      ) : (
                        <span className="text-2xl font-black text-slate-800">
                          ৳{Number(p.base_price).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Device Specifics Grid */}
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div className="border rounded-lg p-2.5 space-y-1 bg-white">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Model / Serial No :</span>
                      <span className="font-extrabold text-slate-700 break-all">{p.serial_number || "N/A"}</span>
                    </div>
                    <div className="border rounded-lg p-2.5 space-y-1 bg-white">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Country of Origin :</span>
                      <span className="font-extrabold text-slate-700">{p.country_of_origin || "N/A"}</span>
                    </div>
                    <div className="border rounded-lg p-2.5 space-y-1 bg-white">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">EMI Status :</span>
                      <span className="font-extrabold flex items-center gap-1">
                        {p.emi_available ? (
                          <span className="text-blue-600 flex items-center gap-0.5"><CheckCircle2 size={12} /> Available</span>
                        ) : (
                          <span className="text-slate-400 flex items-center gap-0.5"><XCircle size={12} /> Not Available</span>
                        )}
                      </span>
                    </div>
                    <div className="border rounded-lg p-2.5 space-y-1 bg-white">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Status :</span>
                      <span className={p.status === "active" ? "font-extrabold text-emerald-600 capitalize" : "font-extrabold text-slate-500 capitalize"}>
                        {p.status}
                      </span>
                    </div>
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
                                  className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${laborCovered
                                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                      : 'text-slate-400 bg-slate-50 border-slate-200'
                                    }`}
                                >
                                  Labor: {laborCovered ? '✓ Covered' : '✕ No'}
                                </span>

                                <span
                                  className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${partsCovered
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

              {/* Group-wise Tables Specifications Rendering */}
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
                                <th className="px-4 py-2 border-r border-slate-200 w-1/3">Feature Parameter</th>
                                <th className="px-4 py-2">Specification Value</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-150">
                              {specsGrouped[groupName].map((spec, sIdx) => (
                                <tr key={sIdx} className="hover:bg-slate-50/50 transition">
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
                  <Button variant="outline" className="px-5">Close Details</Button>
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
            handleChildModalOpenChange(open);
            if (!open) setEditingProduct(null);
          }}
          triggerIcon={<span className="hidden" />}
        />
      )}
    </div>
  );
}
