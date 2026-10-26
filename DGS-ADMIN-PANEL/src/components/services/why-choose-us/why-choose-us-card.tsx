/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import type { WhyChooseUs } from "@/types/why-choose-us";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Edit2,
  Trash2,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  BadgeCheck,
  Users,
  Asterisk,
  Flame,
  Wrench,
  Award,
} from "lucide-react";
import { toggleWhyChooseUsStatus } from "@/services/why-choose-us/why-choose-us.service";

interface Props {
  item: WhyChooseUs;
  activeCount: number;
  requiredActiveCount?: number;
  onEdit: (item: WhyChooseUs) => void;
  onDelete: (item: WhyChooseUs) => void;
  onStatusChanged: (id: number, newStatus: boolean) => void;
}

const ICON_MAP: Record<string, any> = {
  "shield-check": ShieldCheck,
  shield: ShieldCheck,
  "badge-check": BadgeCheck,
  badge: BadgeCheck,
  users: Users,
  asterisk: Asterisk,
  flame: Flame,
  wrench: Wrench,
  award: Award,
  check: CheckCircle2,
};

function getPropositionStyle(item: WhyChooseUs, id: number = 0) {
  if (item.badge_color || item.icon_color || item.icon_name) {
    const IconComponent =
      (item.icon_name && ICON_MAP[item.icon_name.toLowerCase()]) || ShieldCheck;
    return {
      bgStyle: item.badge_color ? { backgroundColor: item.badge_color } : undefined,
      bgClass: !item.badge_color ? "bg-[#043e2d]" : "",
      iconStyle: item.icon_color ? { color: item.icon_color } : undefined,
      iconClass: !item.icon_color ? "text-emerald-400" : "",
      icon: IconComponent,
    };
  }

  const lower = (item.title || "").toLowerCase();
  if (lower.includes("safety") || lower.includes("guarantee")) {
    return {
      bgStyle: undefined,
      bgClass: "bg-[#043e2d]",
      iconStyle: undefined,
      iconClass: "text-emerald-400",
      icon: ShieldCheck,
    };
  }
  if (lower.includes("titas") || lower.includes("enlisted") || lower.includes("class")) {
    return {
      bgStyle: undefined,
      bgClass: "bg-[#1c355e]",
      iconStyle: undefined,
      iconClass: "text-white",
      icon: BadgeCheck,
    };
  }
  if (lower.includes("team") || lower.includes("engineer") || lower.includes("expert")) {
    return {
      bgStyle: undefined,
      bgClass: "bg-[#e0eaff]",
      iconStyle: undefined,
      iconClass: "text-[#f95700]",
      icon: Users,
    };
  }
  if (lower.includes("emergency") || lower.includes("24/7") || lower.includes("response")) {
    return {
      bgStyle: undefined,
      bgClass: "bg-[#ffe8dc]",
      iconStyle: undefined,
      iconClass: "text-[#8b1e1e]",
      icon: Asterisk,
    };
  }

  const fallbackList = [
    { bgStyle: undefined, bgClass: "bg-[#043e2d]", iconStyle: undefined, iconClass: "text-emerald-400", icon: ShieldCheck },
    { bgStyle: undefined, bgClass: "bg-[#1c355e]", iconStyle: undefined, iconClass: "text-white", icon: BadgeCheck },
    { bgStyle: undefined, bgClass: "bg-[#e0eaff]", iconStyle: undefined, iconClass: "text-[#f95700]", icon: Users },
    { bgStyle: undefined, bgClass: "bg-[#ffe8dc]", iconStyle: undefined, iconClass: "text-[#8b1e1e]", icon: Asterisk },
  ];
  return fallbackList[id % fallbackList.length];
}

export default function WhyChooseUsCard({
  item,
  activeCount,
  requiredActiveCount = 3,
  onEdit,
  onDelete,
  onStatusChanged,
}: Props) {
  const [toggling, setToggling] = useState(false);

  const isActive = Boolean(item.is_active);
  const canActivate = isActive || activeCount < (requiredActiveCount || 3);
  const style = getPropositionStyle(item, item.id);
  const IconComponent = style.icon;

  const handleToggle = async (checked: boolean) => {
    if (checked && !canActivate) {
      toast.error(
        `At most ${requiredActiveCount || 3} items can be active at a time. Deactivate another item first.`
      );
      return;
    }

    setToggling(true);
    try {
      const res = await toggleWhyChooseUsStatus(item.id, checked);
      if (res.success) {
        toast.success(
          typeof res.message === "string" ? res.message : `Status updated to ${checked ? "Active" : "Inactive"}`
        );
        onStatusChanged(item.id, checked);
      } else {
        toast.error(typeof res.message === "string" ? res.message : "Failed to update status");
      }
    } catch (err: any) {
      toast.error(typeof err?.message === "string" ? err.message : "An unexpected error occurred");
    } finally {
      setToggling(false);
    }
  };

  return (
    <div
      className={`rounded-2xl border bg-white p-6 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between ${
        isActive
          ? "border-emerald-200 ring-2 ring-emerald-50"
          : "border-slate-200 opacity-90 hover:opacity-100"
      }`}
    >
      <div>
        {/* Top Header: Icon on Left, Status Badge on Right */}
        <div className="flex items-start justify-between gap-3">
          <div
            style={style.bgStyle}
            className={`w-12 h-12 rounded-xl ${style.bgClass || ""} flex items-center justify-center shadow-xs shrink-0 overflow-hidden`}
          >
            {item.icon_url ? (
              <img src={item.icon_url} alt="" className="w-6 h-6 object-contain" />
            ) : (
              <IconComponent
                style={style.iconStyle}
                className={`w-6 h-6 ${style.iconClass || ""}`}
                strokeWidth={2.2}
              />
            )}
          </div>

          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              isActive
                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                : "bg-slate-100 text-slate-600 border border-slate-200"
            }`}
          >
            {isActive ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Live (Active)
              </>
            ) : (
              "Hidden (Draft)"
            )}
          </span>
        </div>

        {/* Content */}
        <div className="mt-5">
          <h3 className="text-lg font-bold text-[#0c1a30] leading-snug tracking-tight">
            {item.title}
          </h3>

          <p className="mt-3 text-xs sm:text-[13px] text-slate-500 leading-relaxed line-clamp-3">
            {item.description}
          </p>
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          {toggling ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#00668a]" />
          ) : (
            <Switch
              id={`switch-${item.id}`}
              checked={isActive}
              onCheckedChange={handleToggle}
              disabled={!isActive && !canActivate}
              className="data-[state=checked]:bg-emerald-600"
            />
          )}
          <label
            htmlFor={`switch-${item.id}`}
            className="text-xs font-bold text-slate-700 cursor-pointer select-none"
          >
            {isActive ? "Published" : "Draft"}
          </label>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(item)}
            className="h-8 px-2.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
          >
            <Edit2 className="w-3.5 h-3.5 mr-1" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(item)}
            className="h-8 px-2.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
