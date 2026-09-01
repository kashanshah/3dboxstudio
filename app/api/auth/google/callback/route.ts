import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  OAUTH_STATE_COOKIE,
  createGoogleOAuthClient,
  exchangeGoogleCode,
  getGoogleOAuthConfig,
} from "@/server/auth/google";
import { createSession, setSessionCookie } from "@/server/auth/session";
import { findOrCreateGoogleUser } from "@/server/auth/oauth";
import { attachSignupAttribution, attributionSummaryForEmail } from "@/server/auth/signupAttribution";
import { sendAdminNewRegistrationEmail } from "@/server/email/mailer";
import { originFromRequest } from "@/server/requestOrigin";

export const runtime = "nodejs";

function redirectWithError(req: Request, code: string): NextResponse {
  const origin = originFromRequest(req);
  return NextResponse.redirect(`${origin}/studio?auth_error=${encodeURIComponent(code)}`);
}

export async function GET(req: Request) {
  const config = getGoogleOAuthConfig(req);
  if (!config) {
    return redirectWithError(req, "google_not_configured");
  }

  const url = new URL(req.url);
  const error = url.searchParams.get("error");
  if (error) {
    return redirectWithError(req, error === "access_denied" ? "google_denied" : "google_failed");
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) {
    return redirectWithError(req, "google_invalid");
  }

  const store = await cookies();
  const expectedState = store.get(OAUTH_STATE_COOKIE)?.value;
  store.set(OAUTH_STATE_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  if (!expectedState || expectedState !== state) {
    return redirectWithError(req, "google_state");
  }

  try {
    const client = createGoogleOAuthClient(config);
    const profile = await exchangeGoogleCode(client, code, config.clientId);
    const { user, isNew } = await findOrCreateGoogleUser(profile);

    let signupAttribution = null;
    let signupAnalytics = null;
    if (isNew) {
      const attached = await attachSignupAttribution(user.id, "google", { conversionPage: "/studio" });
      signupAttribution = attached.attribution;
      signupAnalytics = attached.analytics;
    }

    const token = await createSession(user.id);
    await setSessionCookie(token);

    if (isNew) {
      try {
        await sendAdminNewRegistrationEmail({
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.created_at,
          attributionSummary: attributionSummaryForEmail("google", signupAttribution, "/studio"),
        });
      } catch (adminMailErr) {
        console.error("Failed to send admin registration alert for Google signup:", adminMailErr);
      }
    }

    const origin = originFromRequest(req);
    const redirectUrl = new URL("/studio", origin);
    redirectUrl.searchParams.set("auth", "google");
    if (isNew) {
      redirectUrl.searchParams.set("welcome", "1");
      if (signupAnalytics?.utmSource) redirectUrl.searchParams.set("sa_source", signupAnalytics.utmSource);
      if (signupAnalytics?.utmMedium) redirectUrl.searchParams.set("sa_medium", signupAnalytics.utmMedium);
      if (signupAnalytics?.utmCampaign) redirectUrl.searchParams.set("sa_campaign", signupAnalytics.utmCampaign);
      if (signupAnalytics?.landingType) redirectUrl.searchParams.set("sa_landing_type", signupAnalytics.landingType);
      if (signupAnalytics?.landingPage) redirectUrl.searchParams.set("sa_landing_page", signupAnalytics.landingPage);
    }
    return NextResponse.redirect(redirectUrl.toString());
  } catch (e) {
    console.error("GET /api/auth/google/callback failed:", e);
    return redirectWithError(req, "google_failed");
  }
}
