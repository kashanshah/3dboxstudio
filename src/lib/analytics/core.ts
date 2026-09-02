import { sendGAEvent } from "@next/third-parties/google";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
const DEBUG = process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === "true";
const IS_PRODUCTION = process.env.NODE_ENV === "production";

/** Send events in production; in development only when debug mode is explicitly enabled. */
export const GA_SHOULD_SEND = Boolean(GA_ID) && (IS_PRODUCTION || DEBUG);

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

/**
 * Core analytics wrapper. Never throws; safe when GA is blocked or unavailable.
 * Does not set source/medium/campaign — attribution is handled by GA4 + AttributionCapture.
 */
export function trackEvent(eventName: string, params: AnalyticsParams = {}): void {
  if (typeof window === "undefined") return;

  const payload = stripUndefined(params);

  if (DEBUG) {
    // eslint-disable-next-line no-console
    console.info(`[Analytics] ${eventName}`, payload);
  }

  if (!GA_SHOULD_SEND) return;

  try {
    sendGAEvent("event", eventName, payload);
  } catch {
    /* ad blockers, script failures */
  }
}

export function isAnalyticsDebugEnabled(): boolean {
  return DEBUG;
}
