"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Award, Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCertificates } from "@/services/certificate/certificate.service";
import { useDebounce } from "@/hooks/use-debounce";
import { CERTIFICATE_PAGE_SIZE, type CertificatePage } from "@/types/certificate";
import CertificateCard from "./CertificateCard";

/**
 * The certificates page grid (spec §4): five per row, twenty per load.
 *
 * Loading is *append*, not *replace* — each press or scroll adds one batch to
 * the rows already on screen. Replacing would throw away what the visitor just
 * scrolled past, and would restart the intersection observer's work.
 *
 * The auto-load observer and the Load-more button are both live, deliberately:
 * an observer alone traps a visitor who reached the bottom with the keyboard,
 * and a button alone makes scrolling feel broken.
 *
 * `compact` renders just the grid — the landing strip uses it to show the eight
 * featured certificates with no search box and no second page under them; the
 * full page links to `/certificates` for the rest.
 */
export default function CertificatesClientView({
  initialPage,
  compact = false,
}: {
  initialPage: CertificatePage;
  compact?: boolean;
}) {
  const [page, setPage] = useState<CertificatePage>(initialPage);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // One batch of typing must not fire one request per keystroke.
  const debouncedSearch = useDebounce(search, 400);

  const load = useCallback(
    async (opts: { offset: number; search: string; append: boolean }) => {
      setLoading(true);
      setError(null);
      try {
        const next = await getCertificates({
          limit: CERTIFICATE_PAGE_SIZE,
          offset: opts.offset,
          search: opts.search || undefined,
        });
        setPage((prev) =>
          opts.append
            ? { ...next, items: [...prev.items, ...next.items.filter((item) => !prev.items.some((p) => p.id === item.id))] }
            : next
        );
      } catch {
        setError("Could not load certificates. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // A new search term restarts from the first batch.
  useEffect(() => {
    if (compact) return;
    setPage((prev) => ({ ...prev, offset: 0 }));
    void load({ offset: 0, search: debouncedSearch, append: false });
  }, [compact, debouncedSearch, load]);

  const loadMore = useCallback(() => {
    if (compact || loading || !page.hasMore) return;
    void load({ offset: page.items.length, search: debouncedSearch, append: true });
  }, [compact, loading, page.hasMore, page.items.length, debouncedSearch, load]);

  // Infinite scroll: fetch the next batch when the sentinel scrolls into view.
  useEffect(() => {
    if (compact) return;
    const node = sentinelRef.current;
    if (!node || !page.hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "400px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [compact, loadMore, page.hasMore]);

  return (
    <div className="space-y-8">
      {/* ── Search ──────────────────────────────────────────────── */}
      {compact ? null : (
        <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search a certificate, authority or year…"
          className="pl-9"
          aria-label="Search certificates"
        />
        {search ? (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      )}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {/* ── Grid: 1 / 2 / 3 / 5 per row ─────────────────────────── */}
      {page.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-20 text-center">
          <Award className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-semibold text-foreground">
            {search ? "No certificate matches that search" : "No certificates published yet"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {search ? "Try a different keyword." : "Check back soon."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {page.items.map((certificate) => (
            <CertificateCard key={certificate.id} certificate={certificate} />
          ))}
        </div>
      )}

      {/* ── Load more ───────────────────────────────────────────── */}
      {compact ? null : (
        page.hasMore ? (
          <div ref={sentinelRef} className="flex justify-center pt-2">
            <Button
              variant="outline"
              onClick={loadMore}
              disabled={loading}
              className="gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? "Loading…" : "Load More Certificates"}
            </Button>
          </div>
        ) : page.items.length > 0 ? (
          <p className="text-center text-xs text-muted-foreground">
            — {page.total} certificate{page.total === 1 ? "" : "s"} —
          </p>
        ) : null
      )}
    </div>
  );
}