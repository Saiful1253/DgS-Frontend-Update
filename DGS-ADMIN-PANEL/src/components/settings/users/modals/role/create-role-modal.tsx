"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Loader2 } from "lucide-react";
import { roleCreateSchema, RoleCreateInput } from "@/zod/admin/role.validation";
import { createRole } from "@/services/admin/role.service";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Props {
  onAdded?: () => void;
  disabled?: boolean;
}

export default function AddRoleModal({ onAdded, disabled = false }: Props) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const router = useRouter();

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setName("");
      setDescription("");
      setErrors({});
    }
  };

  const handleSave = async () => {
    setErrors({});
    const payload: Partial<RoleCreateInput> = { name, description };
    const parsed = roleCreateSchema.safeParse(payload);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors(Object.fromEntries(Object.entries(fieldErrors).map(([k, v]) => [k, v?.[0]])));
      return;
    }

    setSubmitting(true);
    try {
      const res = await createRole(parsed.data);
      if (res.success) {
        toast.success("Access role created successfully");
        setOpen(false);
        onAdded?.();
        router.refresh();
      } else {
        toast.error(res.message || "Failed to create role");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !disabled && handleOpenChange(v)}>
      <DialogTrigger asChild>
        <Button variant="default" className="h-11 px-5 font-semibold text-sm rounded-lg shadow-xs gap-2" disabled={disabled}>
          <PlusCircle size={16} /> New Role
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b shrink-0">
          <DialogTitle>Create Access Role</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="add-role-name" className="text-sm font-medium italic">Role Name :</Label>
              <Input
                id="add-role-name"
                placeholder="e.g. Sales Manager"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10"
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="add-role-desc" className="text-sm font-medium italic">Description :</Label>
              <Textarea
                id="add-role-desc"
                placeholder="Explain the responsibilities of this role..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px] resize-none p-3 shadow-none border-muted-foreground/20 focus:border-primary transition-colors"
              />
              {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 border-t bg-gray-50/50 shrink-0 gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting}>Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={submitting}
            className="font-bold px-8 ml-2 shadow-xs"
          >
            {submitting ? <Loader2 className="animate-spin size-4 mr-2" /> : null}
            {submitting ? "Creating..." : "Save Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
