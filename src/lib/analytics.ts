export type SignupAnalyticsParams = {
  method: "email" | "google";
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  landingType?: string | null;
  landingPage?: string | null;
  conversionPage?: string | null;
};

export type SignupAnalytics = SignupAnalyticsParams;

// `@/lib/analytics` resolves to this file, which shadows `analytics/index.ts`.
// New public helpers must be re-exported here or TypeScript will not see them.
export {
  identifyPostHog,
  resetPostHog,
  trackEvent,
  trackSignup,
  trackLogin,
  trackStudioActivated,
  trackStudioCtaClicked,
  trackStudioOpen,
  trackDesignStarted,
  trackTemplateSelected,
  trackArtworkUploaded,
  trackDesignCustomized,
  trackExportClicked,
  trackExportCompleted,
  trackExportFailed,
  trackProjectSaved,
  trackProjectReopened,
  beginTrackedDesignSession,
  beginReopenedDesignSession,
  trackStudioError,
  trackPageContext,
  trackContactFormStarted,
  trackContactFormValidationError,
  trackContactFormCaptchaMissing,
  trackContactFormSubmitAttempt,
  trackContactFormSubmitSuccess,
  trackContactFormSubmitError,
  storeStudioCtaContext,
  storeLastPageContext,
  buildCtaContextFromPath,
  resetDesignSession,
  resetExistingDesignSession,
  pathnameToLocale,
  pathnameToPageType,
  pathnameToSourcePageType,
  slugFromPath,
  userStatusFromAuth,
  GA_ENABLED,
  GA_DEBUG,
  GA_SHOULD_SEND,
  isAnalyticsDebugEnabled,
} from "./analytics/index";

export type {
  UserStatus,
  StudioEntryPoint,
  SourcePageType,
  CtaLocation,
  PageType,
  TemplateType,
  BoxType,
  UploadSurface,
  CustomizationType,
  ExportFormat,
  ExportResolution,
  StudioCtaContext,
  AuthMethod,
} from "./analytics/types";
