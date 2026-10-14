"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="text-center">
        <p className="text-sm font-semibold text-muted-foreground">500</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
          Something went wrong
        </h1>
        <p className="mt-4 text-muted-foreground">
          An unexpected error occurred. Please try again later.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Button variant="outline" className="rounded-full" asChild>
            <Link href="/">
              <ArrowLeft /> Go home
            </Link>
          </Button>
          <Button className="rounded-full" onClick={reset}>
            <RotateCcw /> Try again
          </Button>
        </div>
      </div>
    </div>
  );
}
