"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

export default function ScrollToFeatured() {
  const searchParams = useSearchParams();
  const isFirst = useRef(true);

  const featuredPage = searchParams.get("featuredPage");
  const prevFeaturedPage = useRef(featuredPage);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }

    if (prevFeaturedPage.current !== featuredPage && featuredPage) {
      const el = document.getElementById("featured-products");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    prevFeaturedPage.current = featuredPage;
  }, [featuredPage]);

  return null;
}
