import { sendGAEvent } from "@next/third-parties/google";

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

const GA_ENABLED = Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim());

/** GA4 recommended sign_up event with optional campaign context. */
export function trackSignup(params: SignupAnalyticsParams): void {
  if (!GA_ENABLED || typeof window === "undefined") return;

  sendGAEvent("event", "sign_up", {
    method: params.method,
    ...(params.utmSource ? { campaign_source: params.utmSource } : {}),
    ...(params.utmMedium ? { campaign_medium: params.utmMedium } : {}),
    ...(params.utmCampaign ? { campaign_name: params.utmCampaign } : {}),
    ...(params.landingType ? { landing_type: params.landingType } : {}),
    ...(params.landingPage ? { landing_page: params.landingPage } : {}),
    ...(params.conversionPage ? { conversion_page: params.conversionPage } : {}),
  });
}

/** Fired when a signed-in user opens the studio for the first time after account creation. */
export function trackStudioActivated(method: "email" | "google"): void {
  if (!GA_ENABLED || typeof window === "undefined") return;
  sendGAEvent("event", "studio_activated", { method });
}
