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

export {
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
  trackStudioError,
  trackPageContext,
  storeStudioCtaContext,
  storeLastPageContext,
  buildCtaContextFromPath,
  resetDesignSession,
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
