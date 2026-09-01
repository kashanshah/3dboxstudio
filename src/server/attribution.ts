import { cookies } from "next/headers";
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

  const normalized = {
    utmSource: trim(input.utmSource, MAX_UTM),
    utmMedium: trim(input.utmMedium, MAX_UTM),
    utmCampaign: trim(input.utmCampaign, MAX_UTM),
    utmTerm: trim(input.utmTerm, MAX_UTM),
    utmContent: trim(input.utmContent, MAX_UTM),
    landingPage,
    referrerHost,
    clickIds,
  };

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

export async function saveUserSignupAttribution(
  userId: string,
  method: SignupMethod,
  attribution: StoredAttribution | null
): Promise<void> {
  const sql = getSql();
  const signupMeta = attribution
    ? {
        firstSeenAt: attribution.firstSeenAt,
        ...(Object.keys(attribution.clickIds).length > 0 ? { clickIds: attribution.clickIds } : {}),
      }
    : null;

  await sql`
    UPDATE users
    SET
      signup_method = ${method},
      utm_source = ${attribution?.utmSource ?? null},
      utm_medium = ${attribution?.utmMedium ?? null},
      utm_campaign = ${attribution?.utmCampaign ?? null},
      utm_term = ${attribution?.utmTerm ?? null},
      utm_content = ${attribution?.utmContent ?? null},
      signup_landing_page = ${attribution?.landingPage ?? null},
      signup_referrer = ${attribution?.referrerHost ?? null},
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
  if (attribution.landingPage) parts.push(`Landing: ${attribution.landingPage}`);
  if (attribution.referrerHost) parts.push(`Referrer: ${attribution.referrerHost}`);
  return parts.join(" · ");
}
