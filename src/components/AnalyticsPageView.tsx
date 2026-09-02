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
import { trackPageView } from "@/lib/analytics/pageview";
import { GA_ENABLED, isAnalyticsBlockedPath } from "@/lib/analytics/policy";
import {
  buildPathKey,
  clearRouteOnLeave,
  createRouteTrackerState,
  markRouteEventsEmitted,
  shouldEmitRouteEvents,
  type RouteTrackerState,
} from "@/lib/analytics/routeTracking";

function emitRouteEvents(pathname: string, pathKey: string): void {
  const pageType = pathnameToPageType(pathname);
  const sourcePageType = pathnameToSourcePageType(pathname);
  const pageSlug = slugFromPath(pathname);

  storeLastPageContext(pathname, sourcePageType, pageSlug);
  trackPageView(pathKey);
  trackPageContext(pathname, pageType);
}

/**
 * Sends explicit page_view + page_context once per permitted client navigation.
 * gtag is initialized with send_page_view:false — this component owns SPA pageviews.
 */
export default function AnalyticsPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const trackerRef = useRef<RouteTrackerState>(createRouteTrackerState());
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!GA_ENABLED || !pathname || isAnalyticsBlockedPath(pathname)) return;

    const pathKey = buildPathKey(pathname, searchParams.toString());

    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }

    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      const state = trackerRef.current;
      if (!shouldEmitRouteEvents(state, pathKey)) return;

      trackerRef.current = markRouteEventsEmitted(state, pathKey);
      emitRouteEvents(pathname, pathKey);
    });

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      trackerRef.current = clearRouteOnLeave(trackerRef.current, pathKey);
    };
  }, [pathname, searchParams]);

  return null;
}
