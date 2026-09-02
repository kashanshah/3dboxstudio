"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  pathnameToPageType,
  pathnameToSourcePageType,
  slugFromPath,
  storeLastPageContext,
  trackPageContext,
} from "@/lib/analytics";
import { GA_ENABLED, isAnalyticsBlockedPath } from "@/lib/analytics/policy";

/**
 * Fires a supplementary page_context event with page_type once per client navigation.
 * Native page_view events are handled by gtag.js (initial load + GA4 enhanced measurement).
 *
 * Dedupes only React Strict Mode / hydration double-invoke for the same navigation —
 * repeat visits to the same URL after navigating away are tracked again.
 */
export default function AnalyticsPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastEmittedKeyRef = useRef<string | null>(null);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!GA_ENABLED || !pathname || isAnalyticsBlockedPath(pathname)) return;

    const query = searchParams.toString();
    const pathKey = query ? `${pathname}?${query}` : pathname;

    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }

    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      if (lastEmittedKeyRef.current === pathKey) return;

      lastEmittedKeyRef.current = pathKey;

      const pageType = pathnameToPageType(pathname);
      const sourcePageType = pathnameToSourcePageType(pathname);
      const pageSlug = slugFromPath(pathname);

      storeLastPageContext(pathname, sourcePageType, pageSlug);
      trackPageContext(pathname, pageType);
    });

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      // Leaving this route allows a future return visit to emit page_context again.
      if (lastEmittedKeyRef.current === pathKey) {
        lastEmittedKeyRef.current = null;
      }
    };
  }, [pathname, searchParams]);

  return null;
}
