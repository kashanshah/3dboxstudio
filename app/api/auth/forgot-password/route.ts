import { NextResponse } from "next/server";
import { getUserByEmail } from "@/server/auth/users";
import { createPasswordResetToken } from "@/server/auth/passwordReset";
import { sendPasswordResetEmail } from "@/server/email/mailer";
import { isValidEmail } from "@/server/auth/validation";
import { originFromRequest } from "@/server/requestOrigin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json().catch(() => null);
    const email = (body as { email?: unknown })?.email;

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    // Always respond the same way to avoid revealing whether an account exists.
    const user = await getUserByEmail(email as string);
    if (user) {
      try {
        const token = await createPasswordResetToken(user.id);
        const resetUrl = `${originFromRequest(req)}/reset-password?token=${encodeURIComponent(token)}`;
        await sendPasswordResetEmail(user.email, user.name, resetUrl);
      } catch (mailErr) {
        console.error("Failed to send password reset email:", mailErr);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/auth/forgot-password failed:", e);
    return NextResponse.json({ error: "Could not process the request. Please try again." }, { status: 500 });
  }
}
