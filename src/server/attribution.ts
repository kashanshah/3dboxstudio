import { cookies } from "next/headers";
import { enrichLandingAttribution, formatLandingSummary, classifyLandingPath, landingTypeLabel } from "@/lib/landingClassification";
import { getSql } from "./db";

export const ATTRIBUTION_COOKIE = "sb_attribution";
const ATTRIBUTION_TTL_DAYS = 30;

export type StoredAttribution = {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
  landingPage: string | null;
  landingType: string | null;
  landingLabel: string | null;
  blogSlug: string | null;
  referrerHost: string | null;
  firstSeenAt: string;
  clickIds: Record<string, string>;
};

export type SignupMethod = "email" | "google";

const MAX_UTM = 120;
const MAX_LANDING = 500;
const MAX_REFERRER = 200;
const MAX_CLICK_ID = 200;

function trim(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function trimLandingPath(value: unknown): string | null {
  const path = trim(value, MAX_LANDING);
  if (!path || !path.startsWith("/")) return null;
  return path;
}

function trimConversionPath(value: unknown): string | null {
  return trimLandingPath(value);
}

function sanitizeClickIds(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") return {};
  const out: Record<string, string> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!["gclid", "fbclid", "msclkid"].includes(key)) continue;
    const cleaned = trim(raw, MAX_CLICK_ID);
    if (cleaned) out[key] = cleaned;
  }
  return out;
}

export function normalizeAttributionInput(body: unknown): Omit<StoredAttribution, "firstSeenAt"> | null {
  if (!body || typeof body !== "object") return null;

  const input = body as Record<string, unknown>;
  const landingPage = trimLandingPath(input.landingPage);
  const referrerHost = trim(input.referrerHost, MAX_REFERRER);
  const clickIds = sanitizeClickIds(input.clickIds);

  const normalized = enrichLandingAttribution({
    utmSource: trim(input.utmSource, MAX_UTM),
    utmMedium: trim(input.utmMedium, MAX_UTM),
    utmCampaign: trim(input.utmCampaign, MAX_UTM),
    utmTerm: trim(input.utmTerm, MAX_UTM),
    utmContent: trim(input.utmContent, MAX_UTM),
    landingPage,
    landingType: trim(input.landingType, 40),
    landingLabel: trim(input.landingLabel, 200),
    blogSlug: trim(input.blogSlug, 120),
    referrerHost,
    clickIds,
  });

  const hasData =
    normalized.utmSource ||
    normalized.utmMedium ||
    normalized.utmCampaign ||
    normalized.utmTerm ||
    normalized.utmContent ||
    normalized.landingPage ||
    normalized.referrerHost ||
    Object.keys(normalized.clickIds).length > 0;

  return hasData ? normalized : null;
}

export function parseAttributionCookie(raw: string | undefined): StoredAttribution | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Record<string, unknown>;
    const normalized = normalizeAttributionInput({
      utmSource: data.utmSource,
      utmMedium: data.utmMedium,
      utmCampaign: data.utmCampaign,
      utmTerm: data.utmTerm,
      utmContent: data.utmContent,
      landingPage: data.landingPage,
      landingType: data.landingType,
      landingLabel: data.landingLabel,
      blogSlug: data.blogSlug,
      referrerHost: data.referrerHost,
      clickIds: data.clickIds,
    });
    if (!normalized) return null;
    const firstSeenAt =
      typeof data.firstSeenAt === "string" && data.firstSeenAt ? data.firstSeenAt : new Date().toISOString();
    return { ...normalized, firstSeenAt };
  } catch {
    return null;
  }
}

export async function getAttributionFromCookies(): Promise<StoredAttribution | null> {
  const store = await cookies();
  return parseAttributionCookie(store.get(ATTRIBUTION_COOKIE)?.value);
}

export async function setAttributionCookie(attribution: StoredAttribution): Promise<void> {
  const store = await cookies();
  store.set(ATTRIBUTION_COOKIE, JSON.stringify(attribution), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ATTRIBUTION_TTL_DAYS * 24 * 60 * 60,
  });
}

export async function clearAttributionCookie(): Promise<void> {
  const store = await cookies();
  store.set(ATTRIBUTION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export type SignupAttributionOptions = {
  conversionPage?: string | null;
};

export async function saveUserSignupAttribution(
  userId: string,
  method: SignupMethod,
  attribution: StoredAttribution | null,
  options?: SignupAttributionOptions
): Promise<void> {
  const sql = getSql();
  const conversionPage = trimConversionPath(options?.conversionPage);
  const conversionClass = conversionPage ? classifyLandingPath(conversionPage) : null;

  const enriched = attribution?.landingPage
    ? enrichLandingAttribution(attribution)
    : attribution;

  const minutesToSignup =
    attribution?.firstSeenAt
      ? Math.max(0, Math.round((Date.now() - new Date(attribution.firstSeenAt).getTime()) / 60_000))
      : null;

  const signupMeta =
    enriched || conversionPage
      ? {
          ...(attribution?.firstSeenAt ? { firstSeenAt: attribution.firstSeenAt } : {}),
          ...(enriched?.landingType ? { landingType: enriched.landingType } : {}),
          ...(enriched?.landingLabel ? { landingLabel: enriched.landingLabel } : {}),
          ...(enriched?.blogSlug ? { blogSlug: enriched.blogSlug } : {}),
          ...(conversionPage ? { conversionPage } : {}),
          ...(conversionClass ? { conversionType: conversionClass.type, conversionLabel: conversionClass.label } : {}),
          ...(minutesToSignup !== null ? { minutesToSignup } : {}),
          ...(attribution && Object.keys(attribution.clickIds).length > 0
            ? { clickIds: attribution.clickIds }
            : {}),
        }
      : null;

  await sql`
    UPDATE users
    SET
      signup_method = ${method},
      utm_source = ${enriched?.utmSource ?? null},
      utm_medium = ${enriched?.utmMedium ?? null},
      utm_campaign = ${enriched?.utmCampaign ?? null},
      utm_term = ${enriched?.utmTerm ?? null},
      utm_content = ${enriched?.utmContent ?? null},
      signup_landing_page = ${enriched?.landingPage ?? null},
      signup_landing_type = ${enriched?.landingType ?? null},
      signup_conversion_page = ${conversionPage},
      signup_referrer = ${enriched?.referrerHost ?? null},
      signup_meta = ${signupMeta ? JSON.stringify(signupMeta) : null}::jsonb
    WHERE id = ${userId}
  `;
}

export function formatAttributionSummary(attribution: StoredAttribution | null, method: SignupMethod): string {
  if (!attribution) return `Method: ${method}`;
  const parts = [`Method: ${method}`];
  if (attribution.utmSource) parts.push(`Source: ${attribution.utmSource}`);
  if (attribution.utmMedium) parts.push(`Medium: ${attribution.utmMedium}`);
  if (attribution.utmCampaign) parts.push(`Campaign: ${attribution.utmCampaign}`);
  parts.push(
    `First landed: ${formatLandingSummary(attribution.landingType, attribution.landingPage, attribution.landingLabel)}`
  );
  if (attribution.landingPage && attribution.landingPage !== "/") {
    parts.push(`Path: ${attribution.landingPage}`);
  }
  if (attribution.referrerHost) parts.push(`Referrer: ${attribution.referrerHost}`);
  return parts.join(" · ");
}

export function conversionPageFromReferer(referer: string | null, origin: string): string | null {
  if (!referer) return null;
  try {
    const url = new URL(referer);
    const site = new URL(origin);
    if (url.origin !== site.origin) return null;
    return trimLandingPath(url.pathname);
  } catch {
    return null;
  }
}

export { landingTypeLabel };
