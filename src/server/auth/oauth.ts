import { customAlphabet } from "nanoid";
import { getSql } from "../db";
import { normalizeEmail, type UserRow } from "./users";

export const GOOGLE_PROVIDER = "google";

const createUserId = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 20);

export type GoogleProfile = {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
};

export async function getOAuthUserId(provider: string, providerAccountId: string): Promise<string | null> {
  const sql = getSql();
  const rows = (await sql`
    SELECT user_id
    FROM oauth_accounts
    WHERE provider = ${provider} AND provider_account_id = ${providerAccountId}
    LIMIT 1
  `) as { user_id: string }[];
  return rows[0]?.user_id ?? null;
}

export async function linkOAuthAccount(
  provider: string,
  providerAccountId: string,
  userId: string
): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO oauth_accounts (provider, provider_account_id, user_id)
    VALUES (${provider}, ${providerAccountId}, ${userId})
    ON CONFLICT (provider, provider_account_id) DO UPDATE SET user_id = EXCLUDED.user_id
  `;
}

export async function createOAuthUser(profile: GoogleProfile): Promise<UserRow> {
  const sql = getSql();
  const id = createUserId();
  const email = normalizeEmail(profile.email);
  const rows = (await sql`
    INSERT INTO users (id, email, name, password_hash, email_verified_at)
    VALUES (
      ${id},
      ${email},
      ${profile.name},
      NULL,
      ${profile.emailVerified ? new Date().toISOString() : null}
    )
    RETURNING id, email, name, password_hash, email_verified_at, created_at
  `) as UserRow[];
  return rows[0];
}

export async function findOrCreateGoogleUser(profile: GoogleProfile): Promise<{ user: UserRow; isNew: boolean }> {
  const linkedUserId = await getOAuthUserId(GOOGLE_PROVIDER, profile.sub);
  if (linkedUserId) {
    const sql = getSql();
    const rows = (await sql`
      SELECT id, email, name, password_hash, email_verified_at, created_at
      FROM users
      WHERE id = ${linkedUserId}
      LIMIT 1
    `) as UserRow[];
    if (rows[0]) return { user: rows[0], isNew: false };
  }

  const { getUserByEmail } = await import("./users");
  const existing = await getUserByEmail(profile.email);
  if (existing) {
    await linkOAuthAccount(GOOGLE_PROVIDER, profile.sub, existing.id);
    if (profile.emailVerified && !existing.email_verified_at) {
      const sql = getSql();
      const rows = (await sql`
        UPDATE users
        SET email_verified_at = COALESCE(email_verified_at, NOW())
        WHERE id = ${existing.id}
        RETURNING id, email, name, password_hash, email_verified_at, created_at
      `) as UserRow[];
      return { user: rows[0] ?? existing, isNew: false };
    }
    return { user: existing, isNew: false };
  }

  const user = await createOAuthUser(profile);
  await linkOAuthAccount(GOOGLE_PROVIDER, profile.sub, user.id);
  return { user, isNew: true };
}
