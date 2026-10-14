"use client";

import React, { createContext, useContext } from "react";
import { SiteConfig } from "@/types/settings";

// ── Context ──────────────────────────────────────────────────────────────────

const SiteConfigContext = createContext<SiteConfig>({});

export function SiteConfigProvider({
  config,
  children,
}: {
  config: SiteConfig;
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    if (!config.company_logo) return;
    const icons = document.querySelectorAll("link[rel*='icon']");
    if (icons.length > 0) {
      icons.forEach((icon) => {
        (icon as HTMLLinkElement).href = config.company_logo!;
      });
    } else {
      const link = document.createElement("link");
      link.rel = "shortcut icon";
      link.href = config.company_logo;
      document.getElementsByTagName("head")[0].appendChild(link);
    }
  }, [config.company_logo]);

  return (
    <SiteConfigContext.Provider value={config}>
      {children}
    </SiteConfigContext.Provider>
  );
}

export function useSiteConfig(): SiteConfig {
  return useContext(SiteConfigContext);
}
