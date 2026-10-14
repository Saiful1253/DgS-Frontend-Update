"use client";

import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface TopProductsFiltersProps {
  days: number;
  onDaysChange: (val: string) => void;
  onClear: () => void;
  showClear: boolean;
}

export function TopProductsFilters({
  days,
  onDaysChange,
  onClear,
  showClear
}: TopProductsFiltersProps) {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <span className="text-xs font-medium text-muted-foreground whitespace-nowrap hidden xs:inline-block">Timeframe:</span>
      <Select value={String(days)} onValueChange={onDaysChange}>
        <SelectTrigger className="h-8 w-28 sm:w-32 text-xs font-medium bg-background border-input">
          <SelectValue placeholder="Select timeframe" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="30">1 Month</SelectItem>
          <SelectItem value="60">2 Months</SelectItem>
          <SelectItem value="90">3 Months</SelectItem>
          <SelectItem value="120">4 Months</SelectItem>
          <SelectItem value="150">5 Months</SelectItem>
          <SelectItem value="180">6 Months</SelectItem>
          <SelectItem value="210">7 Months</SelectItem>
          <SelectItem value="240">8 Months</SelectItem>
          <SelectItem value="270">9 Months</SelectItem>
          <SelectItem value="300">10 Months</SelectItem>
          <SelectItem value="330">11 Months</SelectItem>
          <SelectItem value="360">12 Months</SelectItem>
          <SelectItem value="730">2 Years</SelectItem>
          <SelectItem value="1095">3 Years</SelectItem>
          <SelectItem value="1460">4 Years</SelectItem>
          <SelectItem value="1825">5 Years</SelectItem>
          <SelectItem value="2190">6 Years</SelectItem>
          <SelectItem value="2555">7 Years</SelectItem>
          <SelectItem value="2920">8 Years</SelectItem>
          <SelectItem value="3285">9 Years</SelectItem>
          <SelectItem value="3650">10 Years</SelectItem>
        </SelectContent>
      </Select>
      {showClear && (
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2 text-xs font-medium flex items-center gap-1"
          onClick={onClear}
        >
          <X className="h-3 w-3" />
          <span className="hidden sm:inline">Clear</span>
        </Button>
      )}
    </div>
  );
}
