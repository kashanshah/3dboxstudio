import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { customAlphabet } from "nanoid";
import {
  OAUTH_STATE_COOKIE,
  createGoogleOAuthClient,
  getGoogleAuthUrl,
  getGoogleOAuthConfig,
} from "@/server/auth/google";
import { enforceRateLimit } from "@/server/rateLimit";

export const runtime = "nodejs";

const createState = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", 32);

export async function GET(req: Request) {
  const limited = enforceRateLimit(req, "auth:google", { windowMs: 15 * 60 * 1000, max: 20 });
  if (limited) return limited;

  const config = getGoogleOAuthConfig(req);
  if (!config) {
    return NextResponse.json({ error: "Google sign-in is not configured." }, { status: 503 });
  }

  const state = createState();
  const client = createGoogleOAuthClient(config);
  const url = getGoogleAuthUrl(client, state);

  const store = await cookies();
  store.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });

  return NextResponse.redirect(url);
}
