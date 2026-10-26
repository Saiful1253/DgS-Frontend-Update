"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TestimonialsFiltersProps {
  searchDraft: string;
  onSearchDraftChange: (val: string) => void;
  statusDraft: string;
  onStatusDraftChange: (val: string) => void;
  typeDraft: string;
  onTypeDraftChange: (val: string) => void;
  sortDraft: string;
  onSortDraftChange: (val: string) => void;
  orderDraft: "asc" | "desc";
  onOrderDraftToggle: () => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  isFilterPending?: boolean;
}

export function TestimonialsFilters({
  searchDraft,
  onSearchDraftChange,
  statusDraft,
  onStatusDraftChange,
  typeDraft,
  onTypeDraftChange,
  sortDraft,
  onSortDraftChange,
  orderDraft,
  onOrderDraftToggle,
  onApplyFilters,
  onClearFilters,
  hasActiveFilters,
  isFilterPending = false,
}: TestimonialsFiltersProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-end gap-3 flex-wrap">
        {/* Type / Format Filter */}
        <div className="w-full sm:w-48 shrink-0 space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center h-4">
            Type Filter :
          </label>
          <div className="relative">
            <select
              value={typeDraft}
              onChange={(e) => onTypeDraftChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onApplyFilters();
                }
              }}
              className="w-full h-10 pl-3 pr-8 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 shadow-2xs appearance-none focus:outline-hidden focus:ring-2 focus:ring-[#00668a]/20 focus:border-[#00668a] transition-all cursor-pointer truncate"
            >
              <option value="all">All Formats</option>
              <option value="text">Text Only</option>
              <option value="image">With Photo / Image</option>
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>
        </div>

        {/* Status Filter */}
        <div className="w-full sm:w-36 shrink-0 space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center h-4">
            Status Filter :
          </label>
          <div className="relative">
            <select
              value={statusDraft}
              onChange={(e) => onStatusDraftChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onApplyFilters();
                }
              }}
              className="w-full h-10 pl-3 pr-8 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 shadow-2xs appearance-none focus:outline-hidden focus:ring-2 focus:ring-[#00668a]/20 focus:border-[#00668a] transition-all cursor-pointer truncate"
            >
              <option value="all">All Status</option>
              <option value="approved">Approved (Live)</option>
              <option value="pending">Pending Moderation</option>
              <option value="rejected">Rejected</option>
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>
        </div>

        {/* Sort By Filter with ASC/DESC toggle */}
        <div className="w-full sm:w-56 shrink-0 space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center h-4">
            Sort By :
          </label>
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <select
                value={sortDraft}
                onChange={(e) => onSortDraftChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onApplyFilters();
                  }
                }}
                className="w-full h-10 pl-3 pr-8 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 shadow-2xs appearance-none focus:outline-hidden focus:ring-2 focus:ring-[#00668a]/20 focus:border-[#00668a] transition-all cursor-pointer truncate"
              >
                <option value="created_at">Creation Date</option>
                <option value="rating">Rating (Stars)</option>
                <option value="author_name">Client / Author Name</option>
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={onOrderDraftToggle}
              className="h-10 px-2.5 border-slate-200 text-xs font-bold text-slate-700 font-mono shadow-2xs bg-white"
              title="Toggle sort order (ASC / DESC)"
            >
              {orderDraft.toUpperCase()}
            </Button>
          </div>
        </div>

        {/* Search Input */}
        <div className="flex-1 min-w-[220px] space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 h-4">
            <Search className="w-3.5 h-3.5 text-[#00668a]" />
            <span>Search Testimonials :</span>
          </label>
          <div className="relative">
            <Input
              value={searchDraft}
              onChange={(e) => onSearchDraftChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onApplyFilters();
                }
              }}
              placeholder="Search by name, company, quote..."
              className="h-10 text-xs font-semibold pl-3.5 pr-8 border-slate-200 w-full bg-white shadow-2xs"
            />
            {searchDraft && (
              <button
                type="button"
                onClick={() => onSearchDraftChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full cursor-pointer"
                title="Clear search input"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full lg:w-auto flex items-center gap-2 shrink-0">
          <div className="hidden lg:block h-4" />
          <div className="flex items-center gap-2 w-full">
            <Button
              type="button"
              onClick={onApplyFilters}
              className={cn(
                "h-10 px-4 bg-[#00668a] text-white hover:bg-[#004c69] text-xs font-bold gap-1.5 shadow-xs transition-all w-full lg:w-auto justify-center flex-1 lg:flex-initial cursor-pointer",
                isFilterPending && "ring-2 ring-[#00668a]/40 ring-offset-1"
              )}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
            </Button>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="outline"
                onClick={onClearFilters}
                className="h-10 px-3 text-xs font-semibold bg-slate-100 hover:bg-slate-200 border-transparent text-slate-700 gap-1 transition-colors shrink-0 whitespace-nowrap cursor-pointer"
                title="Reset all filters"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
