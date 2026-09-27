import { POSTHOG_ENABLED, isAnalyticsBlockedPath } from "./policy";

type PostHogProperties = Record<string, string | number | boolean>;

type PostHogClient = {
  capture?: (eventName: string, properties?: PostHogProperties) => void;
  identify?: (distinctId: string, properties?: PostHogProperties) => void;
  reset?: () => void;
};

type PostHogWindow = Window & {
  posthog?: PostHogClient;
  __posthogCaptureQueue?: Array<[string, PostHogProperties]>;
};

function getPostHogWindow(): PostHogWindow | undefined {
  if (typeof window === "undefined") return undefined;
  return window as PostHogWindow;
}

/**
 * Capture a curated product event in PostHog.
 * If the SDK is still loading, queue the event; PostHogAnalytics flushes it after init.
 */
export function capturePostHog(
  eventName: string,
  properties: PostHogProperties = {},
): void {
  if (!POSTHOG_ENABLED) return;

  const w = getPostHogWindow();
  if (!w || isAnalyticsBlockedPath(w.location.pathname)) return;

  if (typeof w.posthog?.capture === "function") {
    w.posthog.capture(eventName, properties);
    return;
  }

  w.__posthogCaptureQueue = w.__posthogCaptureQueue ?? [];
  w.__posthogCaptureQueue.push([eventName, properties]);
}
