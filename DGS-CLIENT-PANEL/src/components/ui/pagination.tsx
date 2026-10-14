import React from "react";
import { Button } from "./button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
  buildPageUrl?: (page: number) => string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  buildPageUrl,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 3) {
        end = 4;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
      }

      if (start > 2) {
        pages.push("ellipsis-start");
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push("ellipsis-end");
      }

      pages.push(totalPages);
    }

    return pages;
  };

  const renderButton = (
    page: number | string,
    content: React.ReactNode,
    variant: "default" | "outline" | "ghost" = "outline",
    className = ""
  ) => {
    if (page === "ellipsis-start" || page === "ellipsis-end") {
      return (
        <span
          key={page}
          className="w-9 h-9 flex items-center justify-center text-zinc-400 text-sm font-medium"
        >
          ...
        </span>
      );
    }

    const numericPage = page as number;
    const isActive = numericPage === currentPage;
    const buttonClass = `min-w-9 h-9 rounded-md transition-all duration-300 ${
      isActive
        ? "bg-brand-accent hover:bg-brand-accent-hover text-white font-bold border-none"
        : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"
    } ${className}`;

    if (buildPageUrl) {
      return (
        <Button
          key={numericPage}
          variant={isActive ? "default" : variant}
          size={typeof content === "number" ? "xs" : "sm"}
          className={buttonClass}
          asChild
        >
          <Link href={buildPageUrl(numericPage)} scroll={false}>
            {content}
          </Link>
        </Button>
      );
    }

    return (
      <Button
        key={numericPage}
        variant={isActive ? "default" : variant}
        size={typeof content === "number" ? "xs" : "sm"}
        className={buttonClass}
        onClick={() => onPageChange?.(numericPage)}
      >
        {content}
      </Button>
    );
  };

  return (
    <div className="flex items-center justify-center gap-6 pt-8 border-t border-zinc-100">
      {currentPage > 1 &&
        renderButton(
          currentPage - 1,
          <>
            <ChevronLeft className="w-4 h-4 mr-1.5" /> Previous
          </>,
          "outline"
        )}
      <div className="flex items-center gap-1.5">
        {getPageNumbers().map((page) =>
          renderButton(page, page, "outline")
        )}
      </div>

      {currentPage < totalPages &&
        renderButton(
          currentPage + 1,
          <>
            Next <ChevronRight className="w-4 h-4 ml-1.5" />
          </>,
          "outline"
        )}
    </div>
  );
}
