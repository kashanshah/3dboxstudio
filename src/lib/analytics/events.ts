import { trackEvent } from "./core";
import { consumeStudioEntryContext, storeStudioCtaContext } from "./entryContext";
import {
  fileSizeBucket,
  fileTypeFromMime,
  sanitizeBoxType,
  sanitizeTemplateType,
  videoFormatFromMime,
} from "./mappers";
import {
  markCustomization,
  markDesignCompleted,
  markDesignStarted,
  markFirstExport,
  markStudioOpen,
  hasExportedBefore,
} from "./session";
import type {
  AuthMethod,
  BoxType,
  CustomizationType,
  ExportFailureCategory,
  ExportFormat,
  ExportResolution,
  SignupAnalyticsParams,
  StudioCtaContext,
  StudioErrorCategory,
  StudioErrorStage,
  TemplateType,
  UploadSurface,
  UserStatus,
} from "./types";
import type { AuthUser } from "@/lib/authTypes";
import type { FaceId } from "@/types";
import { faceToUploadSurface } from "./mappers";
import { BOX_TEMPLATES } from "@/boxTemplates";

export function userStatusFromAuth(user: AuthUser | null | undefined): UserStatus {
  if (!user) return "guest";
  return user.emailVerified ? "signed_in" : "signed_in_unverified";
}

type StudioContextParams = {
  templateType?: TemplateType | string;
  boxType?: BoxType | string;
  user?: AuthUser | null;
  userStatus?: UserStatus;
};

function studioParams(ctx: StudioContextParams = {}): Record<string, string> {
  const out: Record<string, string> = {};
  if (ctx.templateType) out.template_type = sanitizeTemplateType(String(ctx.templateType));
  if (ctx.boxType) out.box_type = sanitizeBoxType(String(ctx.boxType));
  const status = ctx.userStatus ?? userStatusFromAuth(ctx.user);
  out.user_status = status;
  return out;
}

/** GA4 recommended sign_up with optional first-touch campaign context (not UTM override). */
export function trackSignup(params: SignupAnalyticsParams): void {
  trackEvent("sign_up", {
    method: params.method,
    ...(params.utmSource ? { campaign_source: params.utmSource } : {}),
    ...(params.utmMedium ? { campaign_medium: params.utmMedium } : {}),
    ...(params.utmCampaign ? { campaign_name: params.utmCampaign } : {}),
    ...(params.landingType ? { landing_type: params.landingType } : {}),
    ...(params.landingPage ? { landing_page: params.landingPage } : {}),
    ...(params.conversionPage ? { conversion_page: params.conversionPage } : {}),
  });
}

/** GA4 recommended login event. */
export function trackLogin(method: AuthMethod): void {
  trackEvent("login", { method });
}

/**
 * Legacy event kept for backward compatibility with existing GA4 reports.
 * Fired after sign_up when a new user reaches the studio.
 */
export function trackStudioActivated(method: "email" | "google"): void {
  trackEvent("studio_activated", { method });
}

export function trackStudioCtaClicked(context: StudioCtaContext): void {
  storeStudioCtaContext(context);
  trackEvent("studio_cta_clicked", {
    source_page_type: context.sourcePageType,
    page_path: context.pagePath,
    ...(context.pageSlug ? { page_slug: context.pageSlug } : {}),
    cta_location: context.ctaLocation,
    destination: context.destination ?? "/studio",
  });
}

export function trackStudioOpen(ctx: StudioContextParams = {}): void {
  if (!markStudioOpen()) return;
  const entry = consumeStudioEntryContext();
  trackEvent("studio_open", {
    entry_point: entry.entryPoint,
    ...studioParams(ctx),
  });
}

export function trackDesignStarted(ctx: StudioContextParams = {}): void {
  if (!markDesignStarted()) return;
  trackEvent("design_started", studioParams(ctx));
}

export function trackTemplateSelected(templateId: string, ctx: StudioContextParams = {}): void {
  if (templateId === "custom") return;
  const template = BOX_TEMPLATES.find((t) => t.id === templateId);
  if (!template) return;
  trackEvent("template_selected", {
    template_type: sanitizeTemplateType(templateId),
    template_name: templateId,
    template_category: "box_preset",
    box_type: sanitizeBoxType(templateId),
    ...studioParams(ctx),
  });
}

export function trackArtworkUploaded(
  face: FaceId,
  file: File,
  uploadSurface: UploadSurface | undefined,
  ctx: StudioContextParams = {}
): void {
  trackEvent("artwork_uploaded", {
    ...studioParams(ctx),
    file_type: fileTypeFromMime(file.type || "application/octet-stream"),
    file_size_bucket: fileSizeBucket(file.size),
    upload_surface: uploadSurface ?? faceToUploadSurface(face),
  });
}

export function trackDesignCustomized(customizationType: CustomizationType, ctx: StudioContextParams = {}): void {
  if (!markCustomization(customizationType)) return;
  trackEvent("design_customized", {
    customization_type: customizationType,
    ...studioParams(ctx),
  });
}

/**
 * Fires once per design session when the design is first successfully saved to the cloud
 * (manual Save, Save As, or auto-save after artwork upload).
 */
export function trackDesignCompleted(ctx: StudioContextParams = {}): void {
  if (!markDesignCompleted()) return;
  trackEvent("design_completed", studioParams(ctx));
}

export function trackExportClicked(
  exportFormat: ExportFormat,
  exportResolution: ExportResolution = "viewport",
  ctx: StudioContextParams = {}
): void {
  trackEvent("export_clicked", {
    export_format: exportFormat,
    export_resolution: exportResolution,
    ...studioParams(ctx),
  });
}

export function trackExportCompleted(
  exportFormat: ExportFormat,
  exportResolution: ExportResolution = "viewport",
  ctx: StudioContextParams = {}
): void {
  const isFirst = markFirstExport();
  trackEvent("export_completed", {
    export_format: exportFormat,
    export_resolution: exportResolution,
    is_first_export: isFirst,
    ...studioParams(ctx),
  });
}

export function trackExportFailed(
  exportFormat: ExportFormat,
  failureCategory: ExportFailureCategory,
  ctx: StudioContextParams = {}
): void {
  trackEvent("export_failed", {
    export_format: exportFormat,
    failure_category: failureCategory,
    ...studioParams(ctx),
  });
}

export function trackProjectSaved(ctx: StudioContextParams = {}): void {
  trackEvent("project_saved", studioParams(ctx));
  trackDesignCompleted(ctx);
}

export function trackProjectReopened(ctx: StudioContextParams = {}): void {
  trackEvent("project_reopened", studioParams(ctx));
}

export function trackStudioError(errorCategory: StudioErrorCategory, stage: StudioErrorStage): void {
  trackEvent("studio_error", {
    error_category: errorCategory,
    stage,
  });
}

/** Supplementary route context — does not replace native GA4 page_view from @next/third-parties. */
export function trackPageContext(pagePath: string, pageType: string): void {
  trackEvent("page_context", {
    page_path: pagePath,
    page_type: pageType,
  });
}

export { hasExportedBefore, videoFormatFromMime };
