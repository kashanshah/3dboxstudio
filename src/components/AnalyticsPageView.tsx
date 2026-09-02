"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  pathnameToPageType,
  pathnameToSourcePageType,
  shouldTrackPageContext,
  slugFromPath,
  storeLastPageContext,
  trackPageContext,
} from "@/lib/analytics";

function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

/**
 * Fires a supplementary page_context event with page_type once per client navigation.
 * Native page_view events remain handled by @next/third-parties GoogleAnalytics.
 */
export default function AnalyticsPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname || isAdminPath(pathname)) return;

    const query = searchParams.toString();
    const pathKey = query ? `${pathname}?${query}` : pathname;
    if (!shouldTrackPageContext(pathKey)) return;

    const pageType = pathnameToPageType(pathname);
    const sourcePageType = pathnameToSourcePageType(pathname);
    const pageSlug = slugFromPath(pathname);

    storeLastPageContext(pathname, sourcePageType, pageSlug);
    trackPageContext(pathname, pageType);
  }, [pathname, searchParams]);

  return null;
}
