"use client";

import React, { useRef } from "react";
import { Label } from "@/components/ui/label";
import {
  ShieldCheck,
  BadgeCheck,
  Users,
  Asterisk,
  Flame,
  Wrench,
  Award,
  CheckCircle2,
  Upload,
  X,
} from "lucide-react";

export interface IconStyleValues {
  icon_name: string;
  icon_color: string;
  badge_color: string;
}

interface Props {
  iconName: string;
  iconColor: string;
  badgeColor: string;
  previewImageUrl?: string;
  onSelectIcon: (iconId: string) => void;
  onFileSelect: (file: File | null) => void;
  onChangeColors: (values: { icon_color?: string; badge_color?: string }) => void;
  onApplyPreset?: (preset: { icon_name: string; icon_color: string; badge_color: string }) => void;
}

export const AVAILABLE_ICONS = [
  { id: "shield-check", label: "Shield", component: ShieldCheck },
  { id: "badge-check", label: "Badge", component: BadgeCheck },
  { id: "users", label: "Users", component: Users },
  { id: "asterisk", label: "Asterisk", component: Asterisk },
  { id: "flame", label: "Flame", component: Flame },
  { id: "wrench", label: "Wrench", component: Wrench },
  { id: "award", label: "Award", component: Award },
  { id: "check", label: "Check", component: CheckCircle2 },
];

export const THEME_PRESETS = [
  {
    id: "safety",
    name: "Safety Green",
    icon_name: "shield-check",
    icon_color: "#10b981",
    badge_color: "#043e2d",
  },
  {
    id: "certified",
    name: "Class-1 Navy",
    icon_name: "badge-check",
    icon_color: "#ffffff",
    badge_color: "#1c355e",
  },
  {
    id: "team",
    name: "Engineers Orange",
    icon_name: "users",
    icon_color: "#f95700",
    badge_color: "#e0eaff",
  },
  {
    id: "emergency",
    name: "24/7 Response",
    icon_name: "asterisk",
    icon_color: "#8b1e1e",
    badge_color: "#ffe8dc",
  },
  {
    id: "gas",
    name: "Gas Amber",
    icon_name: "flame",
    icon_color: "#f59e0b",
    badge_color: "#451a03",
  },
  {
    id: "service",
    name: "Service Teal",
    icon_name: "wrench",
    icon_color: "#14b8a6",
    badge_color: "#134e4a",
  },
];

export default function IconStylePicker({
  iconName,
  iconColor,
  badgeColor,
  previewImageUrl,
  onSelectIcon,
  onFileSelect,
  onChangeColors,
  onApplyPreset,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCustomActive = Boolean(previewImageUrl);
  const currentIconEntry =
    AVAILABLE_ICONS.find((i) => i.id === (iconName || "shield-check").toLowerCase()) ||
    AVAILABLE_ICONS[0];
  const CurrentIcon = currentIconEntry.component;

  const currentIconColor = iconColor || "#10b981";
  const currentBadgeColor = badgeColor || "#043e2d";

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      {/* Hidden Native File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            onFileSelect(file);
          }
          e.target.value = "";
        }}
      />

      {/* Header with Live Preview */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <Label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Icon Badge & Colors
          </Label>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Pick a preset, choose an icon, or upload an image.
          </p>
        </div>

        {/* Live Preview Box */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Preview:
          </span>
          <div
            style={{ backgroundColor: currentBadgeColor }}
            className="w-11 h-11 rounded-xl flex items-center justify-center shadow-xs transition-colors overflow-hidden"
          >
            {isCustomActive ? (
              <img
                src={previewImageUrl}
                alt="Custom icon"
                className="w-6 h-6 object-contain"
              />
            ) : (
              <CurrentIcon
                style={{ color: currentIconColor }}
                className="w-6 h-6 transition-colors"
                strokeWidth={2.2}
              />
            )}
          </div>
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold text-slate-600">Quick Presets</span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {THEME_PRESETS.map((p) => {
            const isMatch =
              !isCustomActive &&
              iconColor === p.icon_color &&
              badgeColor === p.badge_color &&
              iconName === p.icon_name;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onFileSelect(null);
                  if (onApplyPreset) {
                    onApplyPreset({
                      icon_name: p.icon_name,
                      icon_color: p.icon_color,
                      badge_color: p.badge_color,
                    });
                  } else {
                    onSelectIcon(p.icon_name);
                    onChangeColors({
                      icon_color: p.icon_color,
                      badge_color: p.badge_color,
                    });
                  }
                }}
                className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition-all ${
                  isMatch
                    ? "border-sky-500 bg-white shadow-xs font-semibold text-slate-900 ring-1 ring-sky-400/40"
                    : "border-slate-200 bg-white/70 hover:bg-white text-slate-700"
                }`}
              >
                <div
                  style={{ backgroundColor: p.badge_color }}
                  className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                >
                  <div
                    style={{ backgroundColor: p.icon_color }}
                    className="w-2.5 h-2.5 rounded-full"
                  />
                </div>
                <span className="truncate text-[11px]">{p.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Icon Picker Grid with Upload Tile Beside */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-600">Select Icon</span>
          {isCustomActive && (
            <button
              type="button"
              onClick={() => onFileSelect(null)}
              className="text-[11px] text-red-600 hover:text-red-700 font-semibold inline-flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3 h-3" />
              <span>Clear custom image</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
          {AVAILABLE_ICONS.map((ic) => {
            const Comp = ic.component;
            const isSelected = !isCustomActive && (iconName || "shield-check").toLowerCase() === ic.id;
            return (
              <button
                key={ic.id}
                type="button"
                onClick={() => {
                  onFileSelect(null);
                  onSelectIcon(ic.id);
                }}
                title={ic.label}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                  isSelected
                    ? "border-sky-500 bg-sky-50 text-sky-700 font-semibold shadow-2xs ring-1 ring-sky-400/40"
                    : "border-slate-200 bg-white hover:bg-slate-100 text-slate-600"
                }`}
              >
                <Comp className="w-5 h-5" />
                <span className="text-[9px] mt-1 truncate max-w-full">{ic.label}</span>
              </button>
            );
          })}

          {/* 9th Tile: Custom Upload Icon Button Beside */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title={isCustomActive ? "Click to change custom image" : "Upload custom icon"}
            className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all relative ${
              isCustomActive
                ? "border-sky-500 bg-sky-50 text-sky-700 font-semibold shadow-2xs ring-1 ring-sky-400/40"
                : "border-dashed border-slate-300 bg-white hover:bg-slate-100 hover:border-slate-400 text-slate-600"
            }`}
          >
            {isCustomActive ? (
              <img
                src={previewImageUrl}
                alt="Custom"
                className="w-5 h-5 object-contain rounded"
              />
            ) : (
              <Upload className="w-5 h-5 text-slate-500" />
            )}
            <span className="text-[9px] mt-1 truncate max-w-full font-medium">
              {isCustomActive ? "Custom" : "Upload"}
            </span>
          </button>
        </div>
      </div>

      {/* Color Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* Icon Color */}
        <div className="space-y-1">
          <Label className="text-[11px] font-semibold text-slate-600">Icon Color</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={currentIconColor}
              onChange={(e) => onChangeColors({ icon_color: e.target.value })}
              className="w-9 h-9 p-0.5 rounded-lg border border-slate-200 cursor-pointer bg-white"
            />
            <input
              type="text"
              value={iconColor}
              placeholder="#10b981"
              onChange={(e) => onChangeColors({ icon_color: e.target.value })}
              className="h-9 px-3 text-xs rounded-lg border border-slate-200 bg-white flex-1 font-mono uppercase focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Badge Background Color */}
        <div className="space-y-1">
          <Label className="text-[11px] font-semibold text-slate-600">Badge Background</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={currentBadgeColor}
              onChange={(e) => onChangeColors({ badge_color: e.target.value })}
              className="w-9 h-9 p-0.5 rounded-lg border border-slate-200 cursor-pointer bg-white"
            />
            <input
              type="text"
              value={badgeColor}
              placeholder="#043e2d"
              onChange={(e) => onChangeColors({ badge_color: e.target.value })}
              className="h-9 px-3 text-xs rounded-lg border border-slate-200 bg-white flex-1 font-mono uppercase focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
