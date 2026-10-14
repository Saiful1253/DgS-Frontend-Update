"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { UserPlus, Eye, EyeOff, Loader2 } from "lucide-react";
import { adminUserCreateSchema, AdminUserCreateInput } from "@/zod/admin/user.validation";
import { createAdminUser } from "@/services/admin/user.service";
import { Role } from "@/types/admin/role";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Props {
  roles: Role[];
  disabled?: boolean;
}

export default function AddUserModal({ roles, disabled = false }: Props) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<Partial<AdminUserCreateInput>>({
    name: "",
    username: "",
    email: "",
    mobile_number: "",
    password: "",
    status: "active"
  });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const router = useRouter();

  React.useEffect(() => {
    if (!open) {
      setFormData({ status: "active" });
      setErrors({});
    }
  }, [open]);

  const handleAdd = async () => {
    setErrors({});
    const parsed = adminUserCreateSchema.safeParse(formData);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors(Object.fromEntries(Object.entries(fieldErrors).map(([k, v]) => [k, v?.[0]])));
      return;
    }

    setSubmitting(true);
    try {
      const createRes = await createAdminUser(parsed.data);
      if (!createRes.success) {
        toast.error(createRes.message || "Failed to create user");
        return;
      }

      toast.success("Admin user created successfully");
      setOpen(false);
      setFormData({ status: "active" });
      router.refresh();
    } catch {
      toast.error("An error occurred while creating user");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !disabled && setOpen(v)}>
      <DialogTrigger asChild>
        <Button variant="default" className="h-11 px-5 font-semibold text-sm rounded-lg shadow-xs gap-2" disabled={disabled}>
          <UserPlus size={16} /> New User
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-2rem)] sm:w-full max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <span>Add User</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          {/* User Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2 md:col-span-2">
              <Label className="text-sm font-medium italic">Full Name :</Label>
              <Input
                placeholder="Alice Admin"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-10"
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            </div>

            <div className="grid gap-2 md:col-span-1">
              <Label className="text-sm font-medium italic">Username :</Label>
              <Input
                placeholder="alice_admin"
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
                placeholder="alice@example.com"
                value={formData.email || ""}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-10"
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>

            <div className="grid gap-2">
              <Label className="text-sm font-medium italic">Mobile Number :</Label>
              <Input
                placeholder="01XXXXXXXXX"
                value={formData.mobile_number || ""}
                onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                className="h-10"
              />
              {errors.mobile_number && <p className="text-xs text-red-500">{errors.mobile_number}</p>}
            </div>

            <div className="grid gap-2">
              <Label className="text-sm font-medium italic">Password :</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password || ""}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="h-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
            </div>

            <div className="grid gap-2">
              <Label className="text-sm font-medium italic">Role Preset :</Label>
              <Select
                value={formData.role_id?.toString()}
                onValueChange={(v) => {
                  setFormData({ ...formData, role_id: parseInt(v) });
                }}
              >
                <SelectTrigger className="h-10 uppercase text-xs font-bold w-full">
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
            onClick={handleAdd}
            disabled={submitting}
            className="font-bold px-8 shadow-xs"
          >
            {submitting ? <Loader2 className="animate-spin size-4 mr-2" /> : null}
            {submitting ? "Sending..." : "Send Invite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
