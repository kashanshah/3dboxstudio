/** Predefined analytics enums — never send user-generated text or PII. */

export type UserStatus = "guest" | "signed_in" | "signed_in_unverified";

export type StudioEntryPoint =
  | "homepage"
  | "template_page"
  | "blog"
  | "guide"
  | "direct"
  | "other";

export type SourcePageType =
  | "blog"
  | "guide"
  | "template"
  | "landing_page"
  | "homepage"
  | "other";

export type CtaLocation =
  | "hero"
  | "inline"
  | "sidebar"
  | "article_bottom"
  | "header"
  | "footer"
  | "other";

export type PageType =
  | "homepage"
  | "studio"
  | "blog"
  | "guide"
  | "template"
  | "pricing"
  | "landing"
  | "other";

export type TemplateType =
  | "custom"
  | "mailer"
  | "cube"
  | "shipping_carton"
  | "tuck_end"
  | "rigid_gift"
  | "shoe_box"
  | "wine_gift"
  | "card_sleeve"
  | "display_pdq";

export type BoxType = TemplateType;

export type UploadSurface =
  | "front"
  | "back"
  | "left"
  | "right"
  | "top"
  | "bottom"
  | "other";

export type CustomizationType =
  | "artwork"
  | "dimensions"
  | "material"
  | "background"
  | "camera"
  | "color"
  | "lighting"
  | "other";

export type ExportFormat = "png" | "json" | "mp4" | "webm";

export type ExportResolution = "viewport" | "standard";

export type FileSizeBucket = "under_100kb" | "100kb_500kb" | "500kb_1mb" | "1mb_4mb" | "over_4mb";

export type ExportFailureCategory =
  | "canvas_unavailable"
  | "recorder_unsupported"
  | "recorder_start_failed"
  | "serialization_failed"
  | "download_failed"
  | "unknown";

export type StudioErrorCategory =
  | "webgl_init_failed"
  | "file_validation_failed"
  | "file_read_failed"
  | "cloud_load_failed"
  | "cloud_save_failed"
  | "export_failed"
  | "unknown";

export type StudioErrorStage =
  | "studio_load"
  | "artwork_upload"
  | "rendering"
  | "template_load"
  | "export"
  | "other";

export type AuthMethod = "email" | "google" | "apple" | "other";

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

export type StudioCtaContext = {
  sourcePageType: SourcePageType;
  pagePath: string;
  pageSlug?: string | null;
  ctaLocation: CtaLocation;
  destination?: string;
};

export type StudioEntryContext = {
  entryPoint: StudioEntryPoint;
  sourcePageType?: SourcePageType;
  pagePath?: string;
  pageSlug?: string | null;
  ctaLocation?: CtaLocation;
};
