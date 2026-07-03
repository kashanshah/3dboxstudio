import { customAlphabet } from "nanoid";
import { getSql } from "../db";

const createToken = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  48
);

const RESET_TTL_MINUTES = 60;

/** Creates a fresh reset token, invalidating any earlier unconsumed ones for the user. */
export async function createPasswordResetToken(userId: string): Promise<string> {
  const sql = getSql();
  await sql`
    UPDATE password_reset_tokens
    SET consumed_at = NOW()
    WHERE user_id = ${userId} AND consumed_at IS NULL
  `;
  const token = createToken();
  await sql`
    INSERT INTO password_reset_tokens (token, user_id, expires_at)
    VALUES (${token}, ${userId}, NOW() + (${RESET_TTL_MINUTES} * INTERVAL '1 minute'))
  `;
  return token;
}

export type ResetTokenResult =
  | { ok: true; userId: string }
  | { ok: false; reason: "invalid" | "expired" | "used" };

/** Validates and consumes a reset token. Returns the owning user id on success. */
export async function consumePasswordResetToken(token: string): Promise<ResetTokenResult> {
  const sql = getSql();
  const rows = (await sql`
    SELECT token, user_id, expires_at, consumed_at
    FROM password_reset_tokens
    WHERE token = ${token}
    LIMIT 1
  `) as { token: string; user_id: string; expires_at: string; consumed_at: string | null }[];

  const row = rows[0];
  if (!row) return { ok: false, reason: "invalid" };
  if (row.consumed_at) return { ok: false, reason: "used" };
  if (new Date(row.expires_at).getTime() < Date.now()) return { ok: false, reason: "expired" };

  const consumed = (await sql`
    UPDATE password_reset_tokens
    SET consumed_at = NOW()
    WHERE token = ${token} AND consumed_at IS NULL
    RETURNING user_id
  `) as { user_id: string }[];

  if (!consumed[0]) return { ok: false, reason: "used" };
  return { ok: true, userId: consumed[0].user_id };
}
