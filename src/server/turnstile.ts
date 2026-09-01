import { getClientIp } from "@/server/rateLimit";
import { TURNSTILE_CONTACT_ACTION, TURNSTILE_TOKEN_MAX_LEN } from "@/lib/turnstile";

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const USER_ERROR = "Please complete the verification and try again.";

export function turnstileSecretKey(): string | null {
  return process.env.TURNSTILE_SECRET_KEY?.trim() || null;
}

export function turnstileConfigError(): string | null {
  if (turnstileSecretKey()) return null;
  if (process.env.NODE_ENV === "development") {
    return "Contact form misconfigured: set TURNSTILE_SECRET_KEY in .env.local, then restart the dev server.";
  }
  return "Contact form is not configured yet. Please try again later.";
}

export type TurnstileVerifyResult = { ok: true } | { ok: false; error: string };

export async function verifyTurnstileToken(
  token: unknown,
  req: Request,
  expectedAction = TURNSTILE_CONTACT_ACTION,
): Promise<TurnstileVerifyResult> {
  const secret = turnstileSecretKey();
  if (!secret) {
    return { ok: false, error: turnstileConfigError() ?? USER_ERROR };
  }

  if (typeof token !== "string") return { ok: false, error: USER_ERROR };
  const trimmed = token.trim();
  if (!trimmed || trimmed.length > TURNSTILE_TOKEN_MAX_LEN) {
    return { ok: false, error: USER_ERROR };
  }

  try {
    const remoteip = getClientIp(req);
    const body: Record<string, string> = {
      secret,
      response: trimmed,
    };
    if (remoteip !== "unknown") body.remoteip = remoteip;

    const res = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = (await res.json().catch(() => null)) as {
      success?: boolean;
      action?: string;
      "error-codes"?: string[];
    } | null;

    if (!res.ok || !data || data.success !== true) {
      if (process.env.NODE_ENV === "development") {
        console.error("Turnstile siteverify failed:", data);
      }
      return { ok: false, error: USER_ERROR };
    }

    if (data.action && data.action !== expectedAction) {
      if (process.env.NODE_ENV === "development") {
        console.error("Turnstile action mismatch:", data.action, expectedAction);
      }
      return { ok: false, error: USER_ERROR };
    }

    return { ok: true };
  } catch (e) {
    console.error("Turnstile siteverify error:", e);
    return { ok: false, error: USER_ERROR };
  }
}
