"use client";
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Edit } from "lucide-react";
import { adminUserUpdateSchema, AdminUserUpdateInput } from "@/zod/admin/user.validation";
import { updateAdminUser } from "@/services/admin/user.service";
import { AdminUser } from "@/types/admin/user";
import { Role } from "@/types/admin/role";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Props {
  user: AdminUser;
  roles: Role[];
  disabled?: boolean;
}

export default function EditUserModal({ user, roles, disabled = false }: Props) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<AdminUserUpdateInput>>({
    name: user.name,
    username: user.username,
    email: user.email,
    mobile_number: user.mobile_number || user.phone,
    role_id: user.role_id ? parseInt(user.role_id.toString()) : undefined,
    status: user.status,
  });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const router = useRouter();

  const handleUpdate = async () => {
    setErrors({});
    const parsed = adminUserUpdateSchema.safeParse(formData);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors(Object.fromEntries(Object.entries(fieldErrors).map(([k, v]) => [k, v?.[0]])));
      return;
    }

    setSubmitting(true);
    try {
      const res = await updateAdminUser(user.id, parsed.data);
      if (!res.success) {
        toast.error(res.message || "Failed to update user");
        return;
      }

      toast.success("Admin user updated successfully");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("An error occurred");
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
      <DialogContent className="w-[calc(100vw-2rem)] sm:w-full max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b shrink-0">
          <DialogTitle>Edit Admin User</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2 md:col-span-2">
              <Label className="text-sm font-medium italic">Full Name :</Label>
              <Input
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-10"
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            </div>

            <div className="grid gap-2 md:col-span-1">
              <Label className="text-sm font-medium italic">Username :</Label>
              <Input
                value={formData.username || ""}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="h-10"
              />
              {errors.username && <p className="text-xs text-red-500">{errors.username}</p>}
            </div>

            <div className="grid gap-2 md:col-span-1">
              <Label className="text-sm font-medium italic">Email Address :</Label>
              <Input
                type="email"
                value={formData.email || ""}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-10"
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>

            <div className="grid gap-2 md:col-span-2">
              <Label className="text-sm font-medium italic">Mobile Number :</Label>
              <Input
                value={formData.mobile_number || ""}
                onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                className="h-10"
              />
              {errors.mobile_number && <p className="text-xs text-red-500">{errors.mobile_number}</p>}
            </div>

            <div className="grid gap-2">
              <Label className="text-sm font-medium italic">Assigned Role :</Label>
              <Select
                value={formData.role_id?.toString()}
                onValueChange={(v) => {
                  setFormData({ ...formData, role_id: parseInt(v) });
                }}
              >
                <SelectTrigger className="h-10 text-xs font-bold uppercase w-full">
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id.toString()} className="text-xs font-bold uppercase">
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.role_id && <p className="text-xs text-red-500">{errors.role_id}</p>}
            </div>

            <div className="grid gap-2">
              <Label className="text-sm font-medium italic">Active Account :</Label>
              <div className="h-10 flex items-center justify-between px-3 border rounded-md bg-background">
                <span className="text-xs font-bold uppercase text-muted-foreground">Account Status</span>
                <Switch
                  checked={formData.status === "active"}
                  onCheckedChange={(c) => setFormData({ ...formData, status: c ? "active" : "inactive" })}
                  className="scale-90"
                />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="p-6 border-t bg-gray-50/50 shrink-0 gap-3">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
          <Button
            onClick={handleUpdate}
            disabled={submitting}
            className="font-bold px-8 shadow-xs"
          >
            {submitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
