import React from "react";

/**
 * Error state for a server page whose read failed.
 *
 * A failed read must not render as an empty table: an API outage and a table with
 * no rows have to look different, or a broken integration sits unnoticed until
 * somebody notices the numbers are zero.
 *
 * Declared at module level, not inside a page render — a component created during
 * render resets its state on every pass and trips
 * `react-hooks/static-components`.
 */
export default function LoadErrorPanel({
  message,
  subject = "this list",
}: {
  message: string;
  subject?: string;
}) {
  return (
    <div role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 p-6 text-red-200">
      <h2 className="text-lg font-semibold text-red-100">Could not load {subject}</h2>
      <p className="mt-2 text-sm text-red-200/90">{message}</p>
      <p className="mt-3 text-xs text-red-200/70">
        This is a backend or network problem, not an empty list. Retry, and check the
        API service if it persists.
      </p>
    </div>
  );
}
