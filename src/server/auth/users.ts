import { customAlphabet } from "nanoid";
import { getSql } from "../db";
import { hashPassword } from "./password";

const createUserId = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 20);

export type UserRow = {
  id: string;
  email: string;
  name: string | null;
  password_hash: string;
  email_verified_at: string | null;
  created_at: string;
};

export type PublicUser = {
  id: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
};

export function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    emailVerified: Boolean(row.email_verified_at),
  };
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function getUserByEmail(email: string): Promise<UserRow | null> {
  const sql = getSql();
  const rows = (await sql`
    SELECT id, email, name, password_hash, email_verified_at, created_at
    FROM users
    WHERE email = ${normalizeEmail(email)}
    LIMIT 1
  `) as UserRow[];
  return rows[0] ?? null;
}

export async function getUserById(id: string): Promise<UserRow | null> {
  const sql = getSql();
  const rows = (await sql`
    SELECT id, email, name, password_hash, email_verified_at, created_at
    FROM users
    WHERE id = ${id}
    LIMIT 1
  `) as UserRow[];
  return rows[0] ?? null;
}

export async function createUser(email: string, password: string, name: string | null): Promise<UserRow> {
  const sql = getSql();
  const id = createUserId();
  const passwordHash = await hashPassword(password);
  const rows = (await sql`
    INSERT INTO users (id, email, name, password_hash)
    VALUES (${id}, ${normalizeEmail(email)}, ${name}, ${passwordHash})
    RETURNING id, email, name, password_hash, email_verified_at, created_at
  `) as UserRow[];
  return rows[0];
}

export async function markEmailVerified(userId: string): Promise<void> {
  const sql = getSql();
  await sql`
    UPDATE users
    SET email_verified_at = COALESCE(email_verified_at, NOW())
    WHERE id = ${userId}
  `;
}
