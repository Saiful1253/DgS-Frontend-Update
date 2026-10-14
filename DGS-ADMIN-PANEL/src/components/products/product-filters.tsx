"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProductCategoryOption {
  id: string;
  name: string;
  parent_id?: string | number | null;
}

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  categoryId: string;
  onCategoryIdChange: (v: string) => void;
  categoryOptions: ProductCategoryOption[];
  status: string;
  onStatusChange: (v: string) => void;
  sortKey: string;
  onSortKeyChange: (v: string) => void;
  onClear?: () => void;
  onSearch?: () => void;
}

export default function ProductFilters({
  search,
  onSearchChange,
  categoryId,
  onCategoryIdChange,
  categoryOptions,
  status,
  onStatusChange,
  sortKey,
  onSortKeyChange,
  onClear,
  onSearch,
}: Props) {
  const [categoryOpen, setCategoryOpen] = React.useState(false);

  return (
    <div className="w-full bg-transparent">
      <div className="flex flex-wrap gap-3 items-start">

        {/* Search */}
        <div className="w-full md:w-1/2 md:flex-1">
          <label className="text-sm font-medium italic mb-1 block">
            Search Products :
          </label>
          <Input
            placeholder="Search Products By Products Name"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full"
            aria-label="Search products"
            onKeyDown={(e) => {
              if (e.key === "Enter") onSearch?.();
            }}
          />
        </div>

        {/* Category */}
        <div className="w-full md:w-auto flex flex-col">
          <label className="text-sm font-medium italic mb-1 block">
            Category :
          </label>
          {(() => {
            const getCategoryPath = (c: ProductCategoryOption): string => {
              const parts = [c.name];
              let curr = c;
              while (curr.parent_id) {
                const p = categoryOptions.find((x) => String(x.id) === String(curr.parent_id));
                if (!p) break;
                parts.unshift(p.name);
                curr = p;
              }
              return parts.join(" → ");
            };

            const mappedCategories = categoryOptions.map((c) => ({
              ...c,
              displayName: getCategoryPath(c),
            })).sort((a, b) => a.displayName.localeCompare(b.displayName));

            const selectedCat = categoryOptions.find(c => String(c.id) === String(categoryId));
            const selectedDisplayName = selectedCat ? getCategoryPath(selectedCat) : "All categories";

            return (
              <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={categoryOpen}
                    className="w-[280px] justify-between text-left font-normal bg-white"
                  >
                    <span className="truncate">{selectedDisplayName}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[380px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search category..." className="h-9" />
                    <CommandList className="max-h-[250px] overflow-y-auto">
                      <CommandEmpty>No category found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="All categories"
                          onSelect={() => {
                            onCategoryIdChange("all");
                            setCategoryOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              categoryId === "all" ? "opacity-100" : "opacity-0"
                            )}
                          />
                          All categories
                        </CommandItem>
                        {mappedCategories.map((cat) => (
                          <CommandItem
                            key={cat.id}
                            value={cat.displayName}
                            onSelect={() => {
                              onCategoryIdChange(String(cat.id));
                              setCategoryOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                String(categoryId) === String(cat.id) ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {cat.displayName}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            );
          })()}
        </div>

        {/* Status */}
        <div className="w-full md:w-auto">
          <label className="text-sm font-medium italic mb-1 block">
            Status :
          </label>
          <Select value={status} onValueChange={onStatusChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Hidden</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort */}
        <div className="w-full md:w-auto">
          <label className="text-sm font-medium italic mb-1 block">
            Sort :
          </label>
          <Select value={sortKey} onValueChange={onSortKeyChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="name|asc">Name (A–Z)</SelectItem>
              <SelectItem value="name|desc">Name (Z–A)</SelectItem>
              <SelectItem value="created_at|desc">Newest first</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center gap-2 w-full md:w-auto">
        <Button type="button" onClick={() => onSearch?.()} className="w-full md:w-auto flex-1 md:flex-initial whitespace-nowrap shadow-xs font-semibold">
          Search
        </Button>
        {(!!search || categoryId !== "all" || status !== "all" || sortKey !== "default") && (
          <Button type="button" variant="outline" onClick={() => onClear?.()} className="bg-gray-100 hover:bg-gray-200 border-transparent text-gray-700 shrink-0 whitespace-nowrap">
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}

export { ProductFilters };