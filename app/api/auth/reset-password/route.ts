import { NextResponse } from "next/server";
import { updatePassword } from "@/server/auth/users";
import { consumePasswordResetToken } from "@/server/auth/passwordReset";
import { createSession, deleteUserSessions, setSessionCookie } from "@/server/auth/session";
import { passwordError } from "@/server/auth/validation";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json().catch(() => null);
    const token = (body as { token?: unknown })?.token;
    const password = (body as { password?: unknown })?.password;

    if (typeof token !== "string" || !token) {
      return NextResponse.json({ error: "Missing reset token." }, { status: 400 });
    }
    const pwError = passwordError(password);
    if (pwError) {
      return NextResponse.json({ error: pwError }, { status: 400 });
    }

    const result = await consumePasswordResetToken(token);
    if (!result.ok) {
      const messages: Record<string, string> = {
        invalid: "This reset link is invalid.",
        expired: "This reset link has expired. Request a new one.",
        used: "This reset link has already been used. Request a new one.",
      };
      return NextResponse.json({ error: messages[result.reason] }, { status: 400 });
    }

    await updatePassword(result.userId, password as string);

    // Revoke existing sessions (any device) then sign this device in fresh.
    await deleteUserSessions(result.userId);
    const sessionToken = await createSession(result.userId);
    await setSessionCookie(sessionToken);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/auth/reset-password failed:", e);
    return NextResponse.json({ error: "Could not reset your password. Please try again." }, { status: 500 });
  }
}
