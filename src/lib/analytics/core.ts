import { sendGAEvent } from "@next/third-parties/google";
import { GA_DEBUG, GA_ENABLED } from "./policy";

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

/**
 * Core analytics wrapper. Never throws; safe when GA is blocked or unavailable.
 * Does not set source/medium/campaign — attribution is handled by GA4 + AttributionCapture.
 */
export function trackEvent(eventName: string, params: AnalyticsParams = {}): void {
  if (typeof window === "undefined") return;

  const payload = stripUndefined(params);

  if (GA_DEBUG) {
    // eslint-disable-next-line no-console
    console.info(`[Analytics] ${eventName}`, payload);
  }

  if (!GA_ENABLED) return;

  try {
    sendGAEvent("event", eventName, payload);
  } catch {
    /* ad blockers, script failures */
  }
}

export function isAnalyticsDebugEnabled(): boolean {
  return GA_DEBUG;
}
