 
"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePortfolioCategory } from "@/services/portfolio/portfolio.service";
import { PortfolioCategory } from "@/types/portfolio";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface EditCategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: PortfolioCategory | null;
  onSuccess?: () => void;
}

export default function EditCategoryModal({
  open,
  onOpenChange,
  category,
  onSuccess,
}: EditCategoryModalProps) {
  const router = useRouter();
  const [name, setName] = useState(category?.name || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (category && open) {
      setName(category.name || "");
    }
  }, [category, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) return;
    if (!name.trim()) {
      toast.error("Category name is required");
      return;
    }
    setLoading(true);

    try {
      const res = await updatePortfolioCategory(category.id, name.trim());
      if (res.success) {
        toast.success(res.message || "Category updated successfully");
        onOpenChange(false);
        onSuccess?.();
        router.refresh();
      } else {
        toast.error(res.message || "Failed to update category");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Edit Portfolio Category</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase">Category Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Web Development"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim()} className="bg-primary text-white">
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
