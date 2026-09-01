import {
  clearAttributionCookie,
  formatAttributionSummary,
  getAttributionFromCookies,
  saveUserSignupAttribution,
  type SignupAttributionOptions,
  type SignupMethod,
  type StoredAttribution,
} from "@/server/attribution";

import type { SignupAnalytics } from "@/lib/analytics";

export type { SignupAnalytics };

export function toSignupAnalytics(
  method: SignupMethod,
  attribution: StoredAttribution | null,
  conversionPage?: string | null
): SignupAnalytics {
  return {
    method,
    utmSource: attribution?.utmSource ?? null,
    utmMedium: attribution?.utmMedium ?? null,
    utmCampaign: attribution?.utmCampaign ?? null,
    landingType: attribution?.landingType ?? null,
    landingPage: attribution?.landingPage ?? null,
    conversionPage: conversionPage ?? null,
  };
}

/** Persists first-touch attribution on a new account and clears the capture cookie. */
export async function attachSignupAttribution(
  userId: string,
  method: SignupMethod,
  options?: SignupAttributionOptions
): Promise<{ attribution: StoredAttribution | null; analytics: SignupAnalytics }> {
  const attribution = await getAttributionFromCookies();
  const conversionPage = options?.conversionPage ?? null;
  await saveUserSignupAttribution(userId, method, attribution, { conversionPage });
  await clearAttributionCookie();
  return {
    attribution,
    analytics: toSignupAnalytics(method, attribution, conversionPage),
  };
}

export function attributionSummaryForEmail(
  method: SignupMethod,
  attribution: StoredAttribution | null,
  conversionPage?: string | null
): string {
  const base = formatAttributionSummary(attribution, method);
  if (!conversionPage) return base;
  return `${base} · Converted on: ${conversionPage}`;
}
