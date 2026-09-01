/** Standard UTM and click-id query parameters we capture for signup attribution. */
export const UTM_PARAM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

export const CLICK_ID_PARAM_KEYS = ["gclid", "fbclid", "msclkid"] as const;

export type AttributionPayload = {
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;
  landingPage?: string | null;
  referrerHost?: string | null;
  clickIds?: Partial<Record<(typeof CLICK_ID_PARAM_KEYS)[number], string>>;
};

export function extractReferrerHost(referrer: string): string | null {
  if (!referrer.trim()) return null;
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    if (!host || host === "localhost") return null;
    return host.slice(0, 200);
  } catch {
    return null;
  }
}

export function attributionFromSearchParams(params: URLSearchParams): AttributionPayload {
  const read = (key: string) => params.get(key)?.trim() || null;

  const clickIds: AttributionPayload["clickIds"] = {};
  for (const key of CLICK_ID_PARAM_KEYS) {
    const value = read(key);
    if (value) clickIds[key] = value;
  }

  return {
    utmSource: read("utm_source"),
    utmMedium: read("utm_medium"),
    utmCampaign: read("utm_campaign"),
    utmTerm: read("utm_term"),
    utmContent: read("utm_content"),
    clickIds: Object.keys(clickIds).length > 0 ? clickIds : undefined,
  };
}

export function hasMarketingSignals(payload: AttributionPayload): boolean {
  return Boolean(
    payload.utmSource ||
      payload.utmMedium ||
      payload.utmCampaign ||
      payload.utmTerm ||
      payload.utmContent ||
      (payload.clickIds && Object.keys(payload.clickIds).length > 0)
  );
}
