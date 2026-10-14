"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Category } from "@/types/product/product.category";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AddCategoryModal from "../modals/category/create-category-modal";
import EditCategoryModal from "../modals/category/edit-category-modal";
import DeleteCategoryDialog from "../modals/category/delete-category-dialog";
import { Edit, Trash2 } from "lucide-react";
import { createCategory, updateCategory } from "@/services/category/category.service";
import type { CategoryStatus } from "@/types/product/product.category";
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

interface Props {
  categories: Category[];
  allCategories?: Category[];
  showStandaloneHeader?: boolean;
}

export default function CategoriesClient({
  categories,
  allCategories = [],
  showStandaloneHeader = true,
}: Props) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (updatingStatusId) return;
    setUpdatingStatusId(id);

    toast.loading(`Marking category as ${newStatus}...`);

    try {
      const json = await updateCategory(id, { status: newStatus as CategoryStatus });

      toast.dismiss();
      if (!json.success) {
        toast.error(json.message || "Failed to update status");
        return;
      }

      toast.success(`Category marked as ${newStatus}`);
      router.refresh();
    } catch (e: unknown) {
      toast.dismiss();
      toast.error(e instanceof Error ? e.message : "Failed to update status");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleAdd = async (
    name: string,
    description: string,
    status: CategoryStatus,
    parentId?: number | null,
    imageUrl?: string | null,
  ) => {
    if (creating) return;
    setCreating(true);
    toast.loading("Creating category...");
    try {
      const json = await createCategory({
        name,
        description,
        status,
        parent_id: parentId,
        image_url: imageUrl,
      });

      console.log(json);

      toast.dismiss();
      if (!json.success) {
        const msg = "Failed to create category";
        toast.error(msg);
        return;
      }

      toast.success("Category created");
      router.refresh();
    } catch (e: unknown) {
      toast.dismiss();
      toast.error(e instanceof Error ? e.message : "Failed to create category");
    } finally {
      setCreating(false);
    }
  };

  const orderedCategories = React.useMemo(() => {
    const result: Category[] = [];
    const childrenMap = categories.reduce((acc, c) => {
      if (c.parent_id) {
        const pid = c.parent_id.toString();
        if (!acc[pid]) acc[pid] = [];
        acc[pid].push(c);
      }
      return acc;
    }, {} as Record<string, Category[]>);

    const traverse = (cat: Category, depth: number) => {
      (cat as Category & { _depth: number })._depth = depth;
      result.push(cat);
      const children = childrenMap[cat.id.toString()];
      if (children) {
        children.sort((a, b) => a.name.localeCompare(b.name));
        children.forEach((child) => traverse(child, depth + 1));
      }
    };

    const roots = categories.filter((c) => !c.parent_id);
    roots.sort((a, b) => a.name.localeCompare(b.name));
    roots.forEach((root) => traverse(root, 0));

    const processedIds = new Set(result.map((c) => c.id));
    categories.forEach((c) => {
      if (!processedIds.has(c.id)) {
        (c as Category & { _depth: number })._depth = 0;
        result.push(c);
      }
    });
    return result;
  }, [categories]);

  return (
    <div className="space-y-6">
      {showStandaloneHeader && (
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Categories</h1>
            <p className="text-sm text-muted-foreground">
              See available categories and manage them.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <AddCategoryModal
              triggerLabel="Add category"
              onAdd={handleAdd}
              categories={allCategories}
            />
            <Button variant="outline" onClick={() => router.push("/products")}>
              Back to products
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-xl border bg-card shadow-sm w-full overflow-hidden p-4">
        <div className="overflow-x-auto scrollbar-hide">
          <Table className="min-w-200">
            <TableHeader>
              <TableRow className="bg-gray-100 hover:bg-gray-100">
                <TableHead className="text-left uppercase font-bold text-gray-800 tracking-wider">Name</TableHead>
                <TableHead className="text-left uppercase font-bold text-gray-800 tracking-wider">Parent Category</TableHead>
                <TableHead className="text-left uppercase font-bold text-gray-800 tracking-wider">Description</TableHead>
                <TableHead className="text-left uppercase font-bold text-gray-800 tracking-wider">Status</TableHead>
                <TableHead className="text-left uppercase font-bold text-gray-800 tracking-wider">Update Status</TableHead>
                <TableHead className="w-30 text-right uppercase font-bold text-gray-800 tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderedCategories && orderedCategories.length > 0 ? (
                orderedCategories.map((c) => {
                  const depth = (c as Category & { _depth?: number })._depth || 0;
                  return (
                    <TableRow key={c.id}>
                      <TableCell 
                        className="font-medium truncate max-w-50"
                        style={{ paddingLeft: `${depth * 1.5 + 0.75}rem` }}
                      >
                        {depth > 0 && <span className="text-gray-400 mr-2 font-bold">↳</span>}
                        <span className={depth > 0 ? "text-muted-foreground font-normal" : ""}>{c.name}</span>
                      </TableCell>
                    <TableCell className="font-normal text-muted-foreground truncate max-w-50">
                      {c.parent?.name ? (
                        <Badge variant="outline" className="bg-blue-50/50 text-blue-700 border-blue-200">
                          {c.parent.name}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 font-light">-</span>
                      )}
                    </TableCell>
                    <TableCell className="truncate max-w-75">
                      {c.description || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={c.status === "active" ? "default" : "secondary"}
                        className={`font-normal text-[10px] ${c.status === "active"
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : c.status === "archived"
                            ? "bg-red-100 text-red-800 hover:bg-red-200"
                            : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                          }`}
                      >
                        {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        disabled={updatingStatusId === c.id}
                        value={c.status}
                        onValueChange={(value) => handleStatusChange(c.id, value)}
                      >
                        <SelectTrigger className="h-8 w-30">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Hidden</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <EditCategoryModal
                          category={c}
                          categories={allCategories}
                          onSaved={() => router.refresh()}
                          trigger={
                            <Button
                              variant="ghost"
                              className="p-2 h-auto hover:bg-gray-100 rounded"
                              aria-label="Update category"
                            >
                              <Edit size={16} />
                            </Button>
                          }
                        />

                        <DeleteCategoryDialog
                          category={c}
                          onDeleted={() => router.refresh()}
                          trigger={
                            <Button
                              variant="ghost"
                              className="p-2 h-auto hover:bg-gray-100 rounded text-red-600"
                              aria-label="Delete category"
                            >
                              <Trash2 size={16} />
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
                  <TableCell colSpan={5} className="px-4 py-6 text-sm text-muted-foreground text-center">
                    No categories found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
