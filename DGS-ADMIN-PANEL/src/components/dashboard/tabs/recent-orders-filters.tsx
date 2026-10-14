"use client";

import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface RecentOrdersFiltersProps {
  limit: number;
  onLimitChange: (val: string) => void;
  onClear: () => void;
  showClear: boolean;
}

export function RecentOrdersFilters({
  limit,
  onLimitChange,
  onClear,
  showClear
}: RecentOrdersFiltersProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-bold italic tracking-widest uppercase">Show:</span>
      <Select value={String(limit)} onValueChange={onLimitChange}>
        <SelectTrigger className="h-7 w-20 text-[11px] font-semibold bg-white border-gray-200">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="10">10</SelectItem>
          <SelectItem value="20">20</SelectItem>
          <SelectItem value="50">50</SelectItem>
          <SelectItem value="100">100</SelectItem>
        </SelectContent>
      </Select>
      {showClear && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 text-[10px] font-bold hover:bg-gray-100 border border-gray-200 flex items-center gap-1"
          onClick={onClear}
        >
          <X className="h-3 w-3" />
          Clear
        </Button>
      )}
    </div>
  );
}
