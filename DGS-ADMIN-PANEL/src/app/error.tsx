"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error("Application error:", error);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-6 text-center p-6">
      <div className="flex items-center gap-3 text-red-500">
        <AlertTriangle className="h-8 w-8" />
        <h2 className="text-2xl font-bold">Something went wrong</h2>
      </div>

      <p className="text-muted-foreground max-w-md">
        An unexpected error occurred. You can try again or return to the home page.
      </p>

      <div className="flex gap-2">
        <Button onClick={() => reset()}>Try Again</Button>
        <Button asChild>
          <Link href="/">Home</Link>
        </Button>
      </div>
    </div>
  );
}