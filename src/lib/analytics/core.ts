import { GA_DEBUG, GA_ENABLED, isAnalyticsBlockedPath } from "./policy";
import { pushGtag } from "./gtag";

/** @deprecated Use GA_ENABLED — kept for existing imports. */
export const GA_SHOULD_SEND = GA_ENABLED;

export type AnalyticsParams = Record<string, string | number | boolean | null | undefined>;

function stripUndefined(params: AnalyticsParams): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      out[key] = value;
    }
  }
  return out;
}

export function getAnalyticsPathname(): string {
  if (typeof window === "undefined") return "/";
  return window.location.pathname;
}

export function canSendAnalytics(pathname: string = getAnalyticsPathname()): boolean {
  if (!GA_ENABLED) return false;
  if (isAnalyticsBlockedPath(pathname)) return false;
  return true;
}

/**
 * Core analytics wrapper. Never throws; safe when GA is blocked or unavailable.
 * Does not set source/medium/campaign — attribution is handled by GA4 + AttributionCapture.
 */
export function trackEvent(eventName: string, params: AnalyticsParams = {}): void {
  if (typeof window === "undefined") return;

  const pathname = getAnalyticsPathname();
  if (isAnalyticsBlockedPath(pathname)) return;

  const payload = stripUndefined(params);

  if (GA_DEBUG) {
    // eslint-disable-next-line no-console
    console.info(`[Analytics] ${eventName}`, payload);
  }

  if (!GA_ENABLED) return;

  try {
    pushGtag("event", eventName, payload);
  } catch {
    /* ad blockers, script failures */
  }
}

export function isAnalyticsDebugEnabled(): boolean {
  return GA_DEBUG;
}
