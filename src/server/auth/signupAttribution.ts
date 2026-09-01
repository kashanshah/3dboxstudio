import {
  clearAttributionCookie,
  formatAttributionSummary,
  getAttributionFromCookies,
  saveUserSignupAttribution,
  type SignupMethod,
  type StoredAttribution,
} from "@/server/attribution";

import type { SignupAnalytics } from "@/lib/analytics";

export type { SignupAnalytics };

export function toSignupAnalytics(method: SignupMethod, attribution: StoredAttribution | null): SignupAnalytics {
  return {
    method,
    utmSource: attribution?.utmSource ?? null,
    utmMedium: attribution?.utmMedium ?? null,
    utmCampaign: attribution?.utmCampaign ?? null,
  };
}

/** Persists first-touch attribution on a new account and clears the capture cookie. */
export async function attachSignupAttribution(
  userId: string,
  method: SignupMethod
): Promise<{ attribution: StoredAttribution | null; analytics: SignupAnalytics }> {
  const attribution = await getAttributionFromCookies();
  await saveUserSignupAttribution(userId, method, attribution);
  await clearAttributionCookie();
  return {
    attribution,
    analytics: toSignupAnalytics(method, attribution),
  };
}

export function attributionSummaryForEmail(
  method: SignupMethod,
  attribution: StoredAttribution | null
): string {
  return formatAttributionSummary(attribution, method);
}
