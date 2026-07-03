import { customAlphabet } from "nanoid";
import { getSql } from "../db";
import { markEmailVerified } from "./users";

const createToken = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  48
);

const VERIFICATION_TTL_HOURS = 48;

/** Creates a fresh verification token, invalidating any earlier unconsumed ones for the user. */
export async function createVerificationToken(userId: string, email: string): Promise<string> {
  const sql = getSql();
  await sql`
    UPDATE email_verification_tokens
    SET consumed_at = NOW()
    WHERE user_id = ${userId} AND consumed_at IS NULL
  `;
  const token = createToken();
  await sql`
    INSERT INTO email_verification_tokens (token, user_id, email, expires_at)
    VALUES (${token}, ${userId}, ${email}, NOW() + (${VERIFICATION_TTL_HOURS} * INTERVAL '1 hour'))
  `;
  return token;
}

export type VerificationResult =
  | { ok: true; userId: string }
  | { ok: false; reason: "invalid" | "expired" | "used" };

/** Consumes a verification token and marks the user's email as verified. */
export async function consumeVerificationToken(token: string): Promise<VerificationResult> {
  const sql = getSql();
  const rows = (await sql`
    SELECT token, user_id, expires_at, consumed_at
    FROM email_verification_tokens
    WHERE token = ${token}
    LIMIT 1
  `) as { token: string; user_id: string; expires_at: string; consumed_at: string | null }[];

  const row = rows[0];
  if (!row) return { ok: false, reason: "invalid" };
  if (row.consumed_at) return { ok: false, reason: "used" };
  if (new Date(row.expires_at).getTime() < Date.now()) return { ok: false, reason: "expired" };

  await sql`
    UPDATE email_verification_tokens
    SET consumed_at = NOW()
    WHERE token = ${token} AND consumed_at IS NULL
  `;
  await markEmailVerified(row.user_id);
  return { ok: true, userId: row.user_id };
}
