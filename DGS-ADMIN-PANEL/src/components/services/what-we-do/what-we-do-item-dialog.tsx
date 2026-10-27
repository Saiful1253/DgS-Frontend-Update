"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Check, ChevronDown, Loader2, Plus, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import type { WhatWeDoInput, WhatWeDoItem } from "@/types/what-we-do";
import { whatWeDoSchema } from "@/zod/what-we-do.validation";
import { saveWhatWeDo } from "@/services/what-we-do/what-we-do.service";

interface Props {
  open: boolean;
  item: WhatWeDoItem | null;
  categories: string[];
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const emptyDraft = (): WhatWeDoInput => ({
  category: "",
  is_available: true,
  problem: "",
  problem_desc: "",
  solution: "",
  solution_desc: "",
  sort_order: 0,
});

const fieldClass =
  "min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus-visible:border-[#00668a] focus-visible:ring-2 focus-visible:ring-[#00668a]/20";

export default function WhatWeDoItemDialog({
  open,
  item,
  categories,
  onOpenChange,
  onSuccess,
}: Props) {
  const [draft, setDraft] = useState<WhatWeDoInput>(emptyDraft);
  const [loading, setLoading] = useState(false);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");

  useEffect(() => {
    if (open) {
      setDraft(
        item
          ? {
              id: item.id,
              category: item.category,
              is_available: item.is_available,
              problem: item.problem,
              problem_desc: item.problem_desc,
              solution: item.solution,
              solution_desc: item.solution_desc,
              sort_order: item.sort_order,
            }
          : emptyDraft(),
      );
      setCategorySearch("");
      setCategoryPickerOpen(false);
    }
  }, [item, open]);

  const trimmedCategorySearch = categorySearch.trim();
  const filteredCategories = categories.filter((value) =>
    value.toLowerCase().includes(trimmedCategorySearch.toLowerCase()),
  );
  const hasExactCategory = categories.some(
    (value) => value.toLowerCase() === trimmedCategorySearch.toLowerCase(),
  );

  const setField = <K extends keyof WhatWeDoInput>(
    field: K,
    value: WhatWeDoInput[K],
  ) => setDraft((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = whatWeDoSchema.safeParse(draft);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Check the form fields.");
      return;
    }

    setLoading(true);
    try {
      const result = await saveWhatWeDo(parsed.data);
      if (!result.success) {
        toast.error(result.message || "Failed to save item.");
        return;
      }

      toast.success(result.message || "What We Do item saved.");
      onOpenChange(false);
      onSuccess();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save What We Do item.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !loading && onOpenChange(nextOpen)}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>{item ? "Edit challenge and solution" : "Add challenge and solution"}</DialogTitle>
          <DialogDescription>
            Manage the paired content shown under its service category.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
            <div className="space-y-1.5">
              <Label htmlFor="what-we-do-category">Category</Label>
              <Popover
                open={categoryPickerOpen}
                onOpenChange={(nextOpen) => {
                  setCategoryPickerOpen(nextOpen);
                  if (nextOpen) setCategorySearch("");
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    id="what-we-do-category"
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={categoryPickerOpen}
                    className="h-10 w-full justify-between rounded-lg px-3 font-normal"
                  >
                    <span
                      className={
                        draft.category ? "truncate text-slate-900" : "text-slate-500"
                      }
                    >
                      {draft.category || "Choose or add a category"}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-slate-500" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  className="w-[var(--radix-popover-trigger-width)] p-0"
                >
                  <Command shouldFilter={false}>
                    <CommandInput
                      value={categorySearch}
                      onValueChange={setCategorySearch}
                      placeholder="Search categories..."
                      aria-label="Search categories"
                    />
                    <CommandList>
                      {filteredCategories.length === 0 && !trimmedCategorySearch && (
                        <CommandEmpty>No categories yet.</CommandEmpty>
                      )}
                      {filteredCategories.map((value) => (
                        <CommandItem
                          key={value}
                          value={value}
                          onSelect={() => {
                            setField("category", value);
                            setCategoryPickerOpen(false);
                          }}
                        >
                          <Check
                            className={`h-4 w-4 ${
                              draft.category === value ? "opacity-100" : "opacity-0"
                            }`}
                          />
                          <span className="truncate">{value}</span>
                        </CommandItem>
                      ))}
                      {trimmedCategorySearch && !hasExactCategory && (
                        <CommandItem
                          value={`add-${trimmedCategorySearch}`}
                          onSelect={() => {
                            setField("category", trimmedCategorySearch);
                            setCategoryPickerOpen(false);
                          }}
                          className="border-t border-slate-100 text-[#00668a]"
                        >
                          <Plus className="h-4 w-4" />
                          <span className="truncate">
                            Add “{trimmedCategorySearch}” as a new category
                          </span>
                        </CommandItem>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <p className="text-xs text-slate-500">
                Search and select an existing category, or type to add one.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="what-we-do-order">Display order</Label>
              <Input
                id="what-we-do-order"
                type="number"
                min={0}
                step={1}
                value={draft.sort_order}
                onChange={(event) =>
                  setField("sort_order", Number(event.target.value))
                }
                className="h-10 rounded-lg"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <fieldset className="space-y-3 rounded-xl border border-rose-200 bg-rose-50/70 p-4">
              <legend className="px-1 text-sm font-semibold text-rose-950">
                The challenge
              </legend>
              <div className="space-y-1.5">
                <Label htmlFor="what-we-do-problem">Title</Label>
                <Input
                  id="what-we-do-problem"
                  value={draft.problem}
                  onChange={(event) => setField("problem", event.target.value)}
                  maxLength={255}
                  required
                  className="h-10 rounded-lg bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="what-we-do-problem-desc">Description</Label>
                <textarea
                  id="what-we-do-problem-desc"
                  value={draft.problem_desc}
                  onChange={(event) =>
                    setField("problem_desc", event.target.value)
                  }
                  required
                  rows={4}
                  className={fieldClass}
                />
              </div>
            </fieldset>

            <fieldset className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
              <legend className="px-1 text-sm font-semibold text-emerald-950">
                The DGS solution
              </legend>
              <div className="space-y-1.5">
                <Label htmlFor="what-we-do-solution">Title</Label>
                <Input
                  id="what-we-do-solution"
                  value={draft.solution}
                  onChange={(event) => setField("solution", event.target.value)}
                  maxLength={255}
                  required
                  className="h-10 rounded-lg bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="what-we-do-solution-desc">Description</Label>
                <textarea
                  id="what-we-do-solution-desc"
                  value={draft.solution_desc}
                  onChange={(event) =>
                    setField("solution_desc", event.target.value)
                  }
                  required
                  rows={4}
                  className={fieldClass}
                />
              </div>
            </fieldset>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
            <div>
              <Label htmlFor="what-we-do-available">Visible on website</Label>
              <p className="text-xs text-slate-500">
                Hidden items stay editable here.
              </p>
            </div>
            <Switch
              id="what-we-do-available"
              checked={draft.is_available}
              onCheckedChange={(checked) => setField("is_available", checked)}
              aria-label="Visible on website"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#00668a] text-white hover:bg-[#004c69]"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {loading ? "Saving..." : item ? "Save changes" : "Create item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
