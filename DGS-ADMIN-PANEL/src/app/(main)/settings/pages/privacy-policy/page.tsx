import React from "react";
import { getSiteConfigResult } from "@/services/settings/settings.service";
import SettingsPagesClient from "@/components/settings/settings-pages-client";
export const revalidate = 0;

export default async function PrivacyPolicyPage() {

  const siteConfigResult = await getSiteConfigResult();

  // The editor is seeded from the stored page. A failed fetch rendered an empty
  // editor, which looks exactly like "this page was never written" — and the
  // next save would publish the blank body.
  if (!siteConfigResult.ok) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-red-500/40 bg-red-500/10 p-6 text-red-200"
      >
        <h2 className="text-lg font-semibold text-red-100">
          Could not load the privacy policy
        </h2>
        <p className="mt-2 text-sm text-red-200/90">{siteConfigResult.message}</p>
        <p className="mt-3 text-xs text-red-200/70">
          This is a backend or network problem, not an unpublished page. Retry,
          and check the API service if it persists.
        </p>
      </div>
    );
  }

  const initialContent = siteConfigResult.data.privacy_policy || "";

  return (
    <SettingsPagesClient
      pageKey="privacy_policy"
      pageTitle="Privacy Policy"
      initialContent={initialContent}
    />
  );
}
