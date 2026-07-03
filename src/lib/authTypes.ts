/** Client-safe representation of the signed-in user (no secrets). */
export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
};

export type AuthActionResult = { ok: true } | { ok: false; error: string };
