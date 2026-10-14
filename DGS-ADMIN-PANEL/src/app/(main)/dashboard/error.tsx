"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error("Dashboard Error:", error);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-6 text-center p-6">
      <div className="flex items-center gap-3 text-red-500">
        <AlertTriangle className="h-8 w-8" />
        <h2 className="text-2xl font-bold">Something went wrong</h2>
      </div>

      <p className="text-muted-foreground max-w-md">
        We couldn&apos;t load the dashboard data. Please try again.
      </p>

      <Button onClick={() => reset()}>
        Try Again
      </Button>
    </div>
  );
}