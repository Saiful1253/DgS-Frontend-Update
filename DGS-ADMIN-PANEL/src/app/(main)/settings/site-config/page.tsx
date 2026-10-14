import React from "react";
import { getSiteConfigResult } from "@/services/settings/settings.service";
import SettingsSiteConfigClient from "@/components/settings/settings-site-config-client";
export const revalidate = 0;

export default async function SiteConfigPage() {

  const siteConfigResult = await getSiteConfigResult();

  // A failed fetch must not render as an empty settings form: every field would
  // read as "Not set", and saving over it would wipe the stored configuration.
  if (!siteConfigResult.ok) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-red-500/40 bg-red-500/10 p-6 text-red-200"
      >
        <h2 className="text-lg font-semibold text-red-100">
          Could not load site configuration
        </h2>
        <p className="mt-2 text-sm text-red-200/90">{siteConfigResult.message}</p>
        <p className="mt-3 text-xs text-red-200/70">
          This is a backend or network problem, not empty settings. Retry, and
          check the API service if it persists.
        </p>
      </div>
    );
  }

  return (
    <SettingsSiteConfigClient
      initialConfig={siteConfigResult.data}
    />
  );
}
