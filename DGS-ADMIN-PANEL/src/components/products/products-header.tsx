import React from "react";
import { List, LayoutGrid, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  view?: "list" | "card";
  onViewChange?: (v: "list" | "card") => void;
  rightActions?: React.ReactNode;
}

export default function ProductsHeader({
  view = "card",
  onViewChange,
  rightActions,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {/* custom split toggle */}
      <div className="flex items-center">
        <div className="inline-flex rounded-full border bg-muted/50 p-0.5">
          <button
            type="button"
            onClick={() => onViewChange?.("list")}
            className={cn(
              "flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
              view === "list"
                ? "bg-background text-primary shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {view === "list" && <Check size={12} className="stroke-[3px]" />}
            <List size={14} />
          </button>
          <button
            type="button"
            onClick={() => onViewChange?.("card")}
            className={cn(
              "flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
              view === "card"
                ? "bg-background text-primary shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {view === "card" && <Check size={12} className="stroke-[3px]" />}
            <LayoutGrid size={14} />
          </button>
        </div>
      </div>
      {rightActions && (
        <div className="flex flex-wrap items-center gap-2">
          {rightActions}
        </div>
      )}
    </div>
  );
}
