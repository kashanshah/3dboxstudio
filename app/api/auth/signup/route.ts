import { NextResponse } from "next/server";
import { createUser, getUserByEmail, normalizeEmail, toPublicUser } from "@/server/auth/users";
import { createSession, setSessionCookie } from "@/server/auth/session";
import { createVerificationToken } from "@/server/auth/verification";
import { isValidEmail, normalizeName, passwordError } from "@/server/auth/validation";
import { sendAdminNewRegistrationEmail, sendVerificationEmail } from "@/server/email/mailer";
import { originFromRequest } from "@/server/requestOrigin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json().catch(() => null);
    const email = (body as { email?: unknown })?.email;
    const password = (body as { password?: unknown })?.password;
    const name = normalizeName((body as { name?: unknown })?.name);

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    const pwError = passwordError(password);
    if (pwError) {
      return NextResponse.json({ error: pwError }, { status: 400 });
    }

    const existing = await getUserByEmail(email as string);
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists. Try signing in instead." },
        { status: 409 }
      );
    }

    const user = await createUser(email as string, password as string, name);

    const token = await createSession(user.id);
    await setSessionCookie(token);

    try {
      const verifyToken = await createVerificationToken(user.id, normalizeEmail(email as string));
      const verifyUrl = `${originFromRequest(req)}/verify?token=${encodeURIComponent(verifyToken)}`;
      await sendVerificationEmail(normalizeEmail(email as string), name, verifyUrl);
    } catch (mailErr) {
      console.error("Failed to send verification email:", mailErr);
      // Account + session still created; user can request a resend from the studio.
    }

    try {
      await sendAdminNewRegistrationEmail({
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.created_at,
      });
    } catch (adminMailErr) {
      console.error("Failed to send admin registration alert:", adminMailErr);
      // Signup must not fail if the admin alert cannot be delivered.
    }

    return NextResponse.json({ user: toPublicUser(user) });
  } catch (e) {
    console.error("POST /api/auth/signup failed:", e);
    return NextResponse.json({ error: "Could not create your account. Please try again." }, { status: 500 });
  }
}
