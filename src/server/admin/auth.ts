import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { optionalEnv } from "../env";

export const ADMIN_COOKIE = "sb_admin";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

/** Server-only admin password. Set ADMIN_PASSWORD in production. */
export function adminPassword(): string {
  return optionalEnv("ADMIN_PASSWORD", "3dboxstudio-admin");
}

function adminSecret(): string {
  return `admin:${adminPassword()}`;
}

function signPayload(payload: string): string {
  return createHmac("sha256", adminSecret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function verifyAdminPassword(password: string): boolean {
  if (typeof password !== "string" || !password) return false;
  return safeEqual(password, adminPassword());
}

export function createAdminSessionToken(): string {
  const exp = String(Date.now() + SESSION_TTL_MS);
  const sig = signPayload(exp);
  return `${exp}.${sig}`;
}

export function verifyAdminSessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const exp = Number(payload);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const expected = signPayload(payload);
  return safeEqual(sig, expected);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  return verifyAdminSessionToken(token);
}

export async function setAdminCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

export async function clearAdminCookie(): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/** Returns a 401 JSON response if the request is not from an authenticated admin. */
export async function requireAdminApi(): Promise<NextResponse | null> {
  if (await isAdminAuthenticated()) return null;
  return NextResponse.json({ error: "Admin authentication required." }, { status: 401 });
}
