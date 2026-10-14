"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Loader2 } from "lucide-react";
import { roleUpdateSchema, RoleUpdateInput } from "@/zod/admin/role.validation";
import { updateRole } from "@/services/admin/role.service";
import { Role } from "@/types/admin/role";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Props {
  role: Role;
  disabled?: boolean;
}

export default function EditRoleModal({ role, disabled = false }: Props) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<RoleUpdateInput>>({
    name: role.name,
    description: role.description || "",
  });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const router = useRouter();

  const handleUpdate = async () => {
    setErrors({});
    const parsed = roleUpdateSchema.safeParse(formData);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors(Object.fromEntries(Object.entries(fieldErrors).map(([k, v]) => [k, v?.[0]])));
      return;
    }

    setSubmitting(true);
    try {
      const res = await updateRole(role.id, parsed.data);
      if (!res.success) {
        toast.error(res.message || "Failed to update role");
        return;
      }
      toast.success("Role updated successfully");
      setOpen(false);
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !disabled && setOpen(v)}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8 text-blue-600 hover:bg-blue-50" disabled={disabled}>
          <Edit size={14} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 uppercase tracking-tight">
            Edit Access Role: <span className="text-blue-600">{role.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name" className="text-sm font-medium italic">Role Name :</Label>
              <Input
                id="edit-name"
                placeholder="e.g. Sales Manager"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-10"
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-description" className="text-sm font-medium italic">Description :</Label>
              <Textarea
                id="edit-description"
                placeholder="Briefly describe what this role can do..."
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="min-h-[100px] resize-none p-3 shadow-none border-muted-foreground/20 focus:border-primary transition-colors"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 border-t bg-gray-50/50 shrink-0 gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
          <Button
            onClick={handleUpdate}
            disabled={submitting}
            className="font-bold px-8 ml-2 shadow-xs"
          >
            {submitting ? <Loader2 className="animate-spin size-4 mr-2" /> : null}
            {submitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
