/** Shared GA enablement policy — loader and custom events must use the same rules. */

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? "";
export const GA_DEBUG = process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === "true";
const IS_PRODUCTION = process.env.NODE_ENV === "production";

/**
 * GA loads and sends only in production builds, or in any environment when
 * NEXT_PUBLIC_ANALYTICS_DEBUG=true (local DebugView / QA).
 */
export const GA_ENABLED = Boolean(GA_MEASUREMENT_ID) && (IS_PRODUCTION || GA_DEBUG);

export function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export function isStudioPath(pathname: string): boolean {
  const path = (pathname.split("?")[0] || "/").replace(/\/+$/, "") || "/";
  return path === "/studio" || path.startsWith("/studio/") || path.startsWith("/preview/");
}

/** GA must not record this route (admin panel). */
export function isAnalyticsBlockedPath(pathname: string): boolean {
  return isAdminPath(pathname);
}

/** Apply Google's per-property opt-out flag (works after gtag.js has loaded). */
export function setGaDisableFlag(disabled: boolean): void {
  if (typeof window === "undefined" || !GA_MEASUREMENT_ID) return;
  (window as unknown as Record<string, boolean>)[`ga-disable-${GA_MEASUREMENT_ID}`] = disabled;
}
