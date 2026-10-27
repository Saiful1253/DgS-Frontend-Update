"use client";

import React, { useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCertificates } from "@/services/certificate/certificate.service";
import type { Certificate, CertificatePage } from "@/types/certificate";
import CertificationCard from "./CertificationCard";
import { motion } from "framer-motion";

/**
 * Paginated certification grid for the home page.
 *
 * Paging is client-side over server-paged batches, not over one big list: the
 * home page stays statically renderable (no `searchParams` on `/`, which would
 * force the route dynamic and opt the whole landing page out of its revalidate
 * window), while each batch still comes from the paginated API.
 *
 * The page size is a multiple of three so a page break never leaves one or two
 * orphaned cards above the footer.
 */
export default function CertificationsGrid({
  initialPage,
  pageSize,
  featured = true,
}: {
  initialPage: CertificatePage;
  pageSize: number;
  featured?: boolean;
}) {
  const [items, setItems] = useState<Certificate[]>(initialPage.items);
  const [total, setTotal] = useState(initialPage.total);
  const [page, setPage] = useState(1);
  const [pending, startTransition] = useTransition();

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const goTo = (next: number) => {
    if (next < 1 || next > totalPages || next === page) return;

    startTransition(async () => {
      const result = await getCertificates({
        limit: pageSize,
        offset: (next - 1) * pageSize,
        featured: featured || undefined,
      });

      setItems(result.items);
      setTotal(result.total);
      setPage(next);

      // A page swap is not a navigation — scroll it back to the grid, or the
      // visitor lands at the bottom of a page whose cards are above them.
      document.getElementById("certifications")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  if (items.length === 0) return null;

  return (
    <div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((certificate , index) => (
          <motion.span
            key={certificate.id}
            initial={{ opacity: 0, x: index !== 0 ? 20*index : 10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <CertificationCard certificate={certificate} />
          </motion.span>
        ))}
      </div>

      {totalPages > 1 ? (
        <nav className="mt-10 flex items-center justify-center gap-3" aria-label="Certification pages">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goTo(page - 1)}
            disabled={pending || page === 1}
            className="gap-1.5"
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </Button>

          <span className="text-sm font-semibold text-slate-500">
            {pending ? (
              <Loader2 className="inline h-4 w-4 animate-spin" />
            ) : (
              <>
                Page {page} of {totalPages}
              </>
            )}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => goTo(page + 1)}
            disabled={pending || page === totalPages}
            className="gap-1.5"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </nav>
      ) : (
        <p className="mt-8 text-center text-xs text-slate-400">
          {total} certification{total === 1 ? "" : "s"} published
        </p>
      )}
    </div>
  );
}