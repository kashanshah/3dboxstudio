"use client";

import Script from "next/script";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { buildGtagInitScript } from "@/lib/analytics/gtag";
import {
  GA_ENABLED,
  GA_MEASUREMENT_ID,
  isAnalyticsBlockedPath,
  setGaDisableFlag,
} from "@/lib/analytics/policy";

/**
 * Single controlled gtag.js loader.
 * Automatic page_view is disabled at config time; explicit page_view events are sent by AnalyticsPageView.
 */
export default function GoogleAnalytics() {
  const pathname = usePathname() ?? "/";
  const blocked = isAnalyticsBlockedPath(pathname);

  useEffect(() => {
    setGaDisableFlag(blocked);
  }, [blocked]);

  if (!GA_ENABLED || blocked) return null;

  return (
    <>
      <Script
        id="_next-ga-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: buildGtagInitScript(GA_MEASUREMENT_ID) }}
      />
      <Script
        id="_next-ga"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
    </>
  );
}
