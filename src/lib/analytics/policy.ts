/** Shared analytics enablement policy — loaders and custom events use the same rules. */

import { stripLocalePrefix } from "@/i18n/pathname";

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? "";
export const POSTHOG_PROJECT_TOKEN = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN?.trim() ?? "";
export const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://us.i.posthog.com";
export const GA_DEBUG = process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === "true";
const IS_PRODUCTION = process.env.NODE_ENV === "production";

/**
 * Analytics vendors load and send only in production builds, or in any environment when
 * NEXT_PUBLIC_ANALYTICS_DEBUG=true (local DebugView / QA).
 */
export const GA_ENABLED = Boolean(GA_MEASUREMENT_ID) && (IS_PRODUCTION || GA_DEBUG);
export const POSTHOG_ENABLED = Boolean(POSTHOG_PROJECT_TOKEN) && (IS_PRODUCTION || GA_DEBUG);
export const ANALYTICS_ENABLED = GA_ENABLED || POSTHOG_ENABLED;

export function isAdminPath(pathname: string): boolean {
  const path = stripLocalePrefix(pathname);
  return path === "/admin" || path.startsWith("/admin/");
}

export function isStudioPath(pathname: string): boolean {
  const path = stripLocalePrefix(pathname).replace(/\/+$/, "") || "/";
  return path === "/studio" || path.startsWith("/studio/") || path.startsWith("/preview/");
}

/** Product analytics must not record this route (admin panel). */
export function isAnalyticsBlockedPath(pathname: string): boolean {
  return isAdminPath(pathname);
}

/** Apply Google's per-property opt-out flag (works after gtag.js has loaded). */
export function setGaDisableFlag(disabled: boolean): void {
  if (typeof window === "undefined" || !GA_MEASUREMENT_ID) return;
  (window as unknown as Record<string, boolean>)[`ga-disable-${GA_MEASUREMENT_ID}`] = disabled;
}
