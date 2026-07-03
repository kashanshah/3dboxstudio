import { NextResponse } from "next/server";
import { getUserByEmail, toPublicUser } from "@/server/auth/users";
import { verifyPassword } from "@/server/auth/password";
import { createSession, setSessionCookie } from "@/server/auth/session";
import { isValidEmail } from "@/server/auth/validation";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json().catch(() => null);
    const email = (body as { email?: unknown })?.email;
    const password = (body as { password?: unknown })?.password;

    if (!isValidEmail(email) || typeof password !== "string" || !password) {
      return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
    }

    const user = await getUserByEmail(email as string);
    const ok = user ? await verifyPassword(password, user.password_hash) : false;
    if (!user || !ok) {
      return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
    }

    const token = await createSession(user.id);
    await setSessionCookie(token);

    return NextResponse.json({ user: toPublicUser(user) });
  } catch (e) {
    console.error("POST /api/auth/login failed:", e);
    return NextResponse.json({ error: "Could not sign you in. Please try again." }, { status: 500 });
  }
}
