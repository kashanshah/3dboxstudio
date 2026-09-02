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
export { trackPageView } from "./pageview";
export {
  buildPathKey,
  createRouteTrackerState,
  shouldEmitRouteEvents,
  markRouteEventsEmitted,
  clearRouteOnLeave,
} from "./routeTracking";
export { buildTemplateSelectedParams } from "./events";
export { shouldFireStudioOpen } from "./studioOpen";
export { getAnalyticsPathname, canSendAnalytics } from "./core";
export {
  GA_ENABLED,
  GA_DEBUG,
  GA_MEASUREMENT_ID,
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
  pathnameToPageType,
  pathnameToSourcePageType,
  slugFromPath,
  sanitizeTemplateType,
  sanitizeBoxType,
} from "./mappers";
export { resetDesignSession } from "./session";
