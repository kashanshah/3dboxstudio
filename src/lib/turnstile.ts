export const TURNSTILE_CONTACT_ACTION = "contact";
export const TURNSTILE_TOKEN_MAX_LEN = 2048;
export const TURNSTILE_SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export function turnstileSiteKey(): string | null {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || null;
}
