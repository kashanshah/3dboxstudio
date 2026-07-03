import { cookies } from "next/headers";
import { customAlphabet } from "nanoid";
import { getSql } from "../db";
import { toPublicUser, type PublicUser, type UserRow } from "./users";

export const SESSION_COOKIE = "sb_session";
const SESSION_TTL_DAYS = 30;

const createSessionToken = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  40
);

export async function createSession(userId: string): Promise<string> {
  const sql = getSql();
  const token = createSessionToken();
  await sql`
    INSERT INTO sessions (token, user_id, expires_at)
    VALUES (${token}, ${userId}, NOW() + (${SESSION_TTL_DAYS} * INTERVAL '1 day'))
  `;
  return token;
}

export async function deleteSession(token: string): Promise<void> {
  const sql = getSql();
  await sql`DELETE FROM sessions WHERE token = ${token}`;
}

async function getUserForSession(token: string): Promise<UserRow | null> {
  const sql = getSql();
  const rows = (await sql`
    SELECT u.id, u.email, u.name, u.password_hash, u.email_verified_at, u.created_at
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ${token} AND s.expires_at > NOW()
    LIMIT 1
  `) as UserRow[];
  return rows[0] ?? null;
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/** Reads the session cookie and returns the signed-in user, or null. */
export async function getCurrentUser(): Promise<PublicUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const row = await getUserForSession(token);
    return row ? toPublicUser(row) : null;
  } catch {
    return null;
  }
}

/** Reads the session cookie and returns the full user row (server-only). */
export async function getCurrentUserRow(): Promise<UserRow | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    return await getUserForSession(token);
  } catch {
    return null;
  }
}

export async function endCurrentSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await deleteSession(token);
  await clearSessionCookie();
}
