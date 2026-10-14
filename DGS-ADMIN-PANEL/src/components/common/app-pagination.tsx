import React from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AppPaginationProps {
  page: number | string;
  totalPages: number;
  total: number;
  appliedPath: (p: number) => string;
  onPageChange?: (p: number) => void;
  /** Label used in "Showing X to Y of Z <label>" */
  itemLabel?: string;
  /** Provide to render the "Per page" selector */
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  scroll?: boolean;
  className?: string;
}

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

/**
 * Centralized bottom-bar pagination for the Admin Panel.
 * Design matches the portfolio page bar: "Showing X to Y of Z <label>",
 * optional per-page selector, and First/Prev/numbers/Next/Last navigation.
 */
export function AppPagination({
  page,
  totalPages,
  total,
  appliedPath,
  onPageChange,
  itemLabel = "items",
  pageSize,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  scroll = true,
  className,
}: AppPaginationProps) {
  const currentPage = Number(page) || 1;
  const displayTotalPages = Math.max(1, totalPages);
  const displayTotal = Math.max(0, total);

  const resolvedPageSize =
    pageSize ||
    (displayTotal > 0 ? Math.ceil(displayTotal / displayTotalPages) : pageSizeOptions[0]);

  const startIndex = displayTotal === 0 ? 0 : (currentPage - 1) * resolvedPageSize + 1;
  const endIndex = Math.min(currentPage * resolvedPageSize, displayTotal);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, p: number) => {
    if (onPageChange) {
      e.preventDefault();
      onPageChange(p);
    }
  };

  const pageNumbers = Array.from({ length: displayTotalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === displayTotalPages || Math.abs(p - currentPage) <= 1
  );

  const navBtn = cn(
    buttonVariants({ variant: "outline", size: "icon" }),
    "h-8 w-8 p-0 border-slate-200 text-slate-700"
  );
  const navBtnDisabled = cn(navBtn, "pointer-events-none opacity-40");

  return (
    <nav
      className={cn(
        "mt-4 bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4",
        className
      )}
      aria-label="Pagination"
    >
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
        <span>
          Showing{" "}
          <span className="font-bold text-slate-900">{startIndex}</span>
          {" to "}
          <span className="font-bold text-slate-900">{endIndex}</span>
          {" of "}
          <span className="font-bold text-slate-900">{displayTotal}</span>{" "}
          {itemLabel}
        </span>

        {pageSize !== undefined && onPageSizeChange && (
          <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
            <Select
              value={String(pageSize)}
              onValueChange={(v) => onPageSizeChange(Number(v))}
            >
              <SelectTrigger className="h-8 w-18 text-xs font-semibold bg-white border-slate-200">
                <SelectValue placeholder={`${pageSize}`} />
              </SelectTrigger>
              <SelectContent align="start">
                {pageSizeOptions.map((n) => (
                  <SelectItem key={n} value={String(n)} className="text-xs font-semibold">
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {currentPage > 1 ? (
          <Link
            href={appliedPath(1)}
            scroll={scroll}
            onClick={(e) => handleLinkClick(e, 1)}
            className={navBtn}
            title="First page"
          >
            <ChevronsLeft className="w-4 h-4" />
          </Link>
        ) : (
          <span className={navBtnDisabled} title="First page">
            <ChevronsLeft className="w-4 h-4" />
          </span>
        )}

        {currentPage > 1 ? (
          <Link
            href={appliedPath(currentPage - 1)}
            scroll={scroll}
            onClick={(e) => handleLinkClick(e, currentPage - 1)}
            className={cn(
              buttonVariants({ variant: "outline", size: "default" }),
              "h-8 px-2.5 text-xs font-semibold border-slate-200 text-slate-700 gap-1"
            )}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Prev</span>
          </Link>
        ) : (
          <span
            className={cn(
              buttonVariants({ variant: "outline", size: "default" }),
              "pointer-events-none h-8 px-2.5 text-xs font-semibold border-slate-200 text-slate-700 gap-1 opacity-40"
            )}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Prev</span>
          </span>
        )}

        <div className="flex items-center gap-1">
          {pageNumbers.map((p, idx, arr) => {
            const prevVal = arr[idx - 1];
            const showEllipsis = prevVal && p - prevVal > 1;
            const isActive = p === currentPage;

            return (
              <React.Fragment key={p}>
                {showEllipsis && (
                  <span className="px-1 text-xs text-slate-400 font-semibold select-none">
                    ...
                  </span>
                )}
                {isActive ? (
                  <span
                    className={cn(
                      buttonVariants({ variant: "default", size: "icon" }),
                      "h-8 w-8 p-0 text-xs font-bold bg-primary text-white hover:bg-primary/90 shadow-2xs"
                    )}
                  >
                    {p}
                  </span>
                ) : (
                  <Link
                    href={appliedPath(p)}
                    scroll={scroll}
                    onClick={(e) => handleLinkClick(e, p)}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "icon" }),
                      "h-8 w-8 p-0 text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    {p}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {currentPage < displayTotalPages ? (
          <Link
            href={appliedPath(currentPage + 1)}
            scroll={scroll}
            onClick={(e) => handleLinkClick(e, currentPage + 1)}
            className={cn(
              buttonVariants({ variant: "outline", size: "default" }),
              "h-8 px-2.5 text-xs font-semibold border-slate-200 text-slate-700 gap-1"
            )}
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <span
            className={cn(
              buttonVariants({ variant: "outline", size: "default" }),
              "pointer-events-none h-8 px-2.5 text-xs font-semibold border-slate-200 text-slate-700 gap-1 opacity-40"
            )}
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        )}

        {currentPage < displayTotalPages ? (
          <Link
            href={appliedPath(displayTotalPages)}
            scroll={scroll}
            onClick={(e) => handleLinkClick(e, displayTotalPages)}
            className={navBtn}
            title="Last page"
          >
            <ChevronsRight className="w-4 h-4" />
          </Link>
        ) : (
          <span className={navBtnDisabled} title="Last page">
            <ChevronsRight className="w-4 h-4" />
          </span>
        )}
      </div>
    </nav>
  );
}