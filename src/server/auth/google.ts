import { OAuth2Client } from "google-auth-library";
import { originFromRequest } from "../requestOrigin";
import type { GoogleProfile } from "./oauth";

export const OAUTH_STATE_COOKIE = "sb_oauth_state";

type GoogleOAuthConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

export function getGoogleOAuthConfig(req: Request): GoogleOAuthConfig | null {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;

  const origin = originFromRequest(req);
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI?.trim() || `${origin}/api/auth/google/callback`;

  return { clientId, clientSecret, redirectUri };
}

export function createGoogleOAuthClient(config: GoogleOAuthConfig): OAuth2Client {
  return new OAuth2Client(config.clientId, config.clientSecret, config.redirectUri);
}

export function getGoogleAuthUrl(client: OAuth2Client, state: string): string {
  return client.generateAuthUrl({
    access_type: "online",
    prompt: "select_account",
    scope: ["openid", "email", "profile"],
    state,
  });
}

export async function verifyGoogleIdToken(
  client: OAuth2Client,
  idToken: string,
  expectedClientId: string
): Promise<GoogleProfile> {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: expectedClientId,
  });
  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email) {
    throw new Error("Google profile is missing required fields.");
  }

  return {
    sub: payload.sub,
    email: payload.email,
    emailVerified: payload.email_verified === true,
    name: typeof payload.name === "string" ? payload.name : null,
  };
}

export async function exchangeGoogleCode(
  client: OAuth2Client,
  code: string,
  expectedClientId: string
): Promise<GoogleProfile> {
  const { tokens } = await client.getToken(code);
  if (!tokens.id_token) {
    throw new Error("Google did not return an ID token.");
  }
  return verifyGoogleIdToken(client, tokens.id_token, expectedClientId);
}
