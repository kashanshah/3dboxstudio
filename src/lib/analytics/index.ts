export { trackEvent, GA_SHOULD_SEND, isAnalyticsDebugEnabled } from "./core";
export type { AnalyticsParams } from "./core";
export {
  buildGtagInitScript,
  buildGtagConfigOptions,
  ensureGtagInitialized,
  installGtagStub,
  pushGtag,
  isGtagInitialized,
  resetGtagForTesting,
  GA_DATA_LAYER,
} from "./gtag";
export { capturePostHog } from "./posthog";
export { trackPageView } from "./pageview";
export {
  buildPathKey,
  createRouteTrackerState,
  shouldEmitRouteEvents,
  markRouteEventsEmitted,
  clearRouteOnLeave,
} from "./routeTracking";
export { buildTemplateSelectedParams, beginTrackedDesignSession, beginReopenedDesignSession } from "./events";
export { shouldFireStudioOpen } from "./studioOpen";
export { getAnalyticsPathname, canSendAnalytics } from "./core";
export {
  ANALYTICS_ENABLED,
  GA_ENABLED,
  GA_DEBUG,
  GA_MEASUREMENT_ID,
  POSTHOG_ENABLED,
  POSTHOG_PROJECT_TOKEN,
  POSTHOG_HOST,
  isAdminPath,
  isStudioPath,
  isAnalyticsBlockedPath,
  setGaDisableFlag,
} from "./policy";

export * from "./types";
export * from "./events";
export {
  storeStudioCtaContext,
  storeLastPageContext,
  buildCtaContextFromPath,
} from "./entryContext";
export {
  pathnameToLocale,
  pathnameToPageType,
  pathnameToSourcePageType,
  slugFromPath,
  sanitizeTemplateType,
  sanitizeBoxType,
} from "./mappers";
export { resetDesignSession, resetExistingDesignSession, resetAnalyticsDedupeForTesting } from "./session";
