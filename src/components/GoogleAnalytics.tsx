"use client";

import { GoogleAnalytics as NextGoogleAnalytics } from "@next/third-parties/google";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  GA_DEBUG,
  GA_ENABLED,
  GA_MEASUREMENT_ID,
  isAnalyticsBlockedPath,
  setGaDisableFlag,
} from "@/lib/analytics/policy";

export default function GoogleAnalytics() {
  const pathname = usePathname() ?? "/";
  const blocked = isAnalyticsBlockedPath(pathname);

  useEffect(() => {
    setGaDisableFlag(blocked);
  }, [blocked]);

  if (!GA_ENABLED || blocked) return null;

  return <NextGoogleAnalytics gaId={GA_MEASUREMENT_ID} debugMode={GA_DEBUG} />;
}
