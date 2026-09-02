import { trackEvent } from "./core";

/** Explicit GA4 page_view — SPA navigations are never auto-sent by gtag config. */
export function trackPageView(pagePath: string): void {
  if (typeof window === "undefined") return;

  trackEvent("page_view", {
    page_path: pagePath,
    page_location: window.location.href,
  });
}
