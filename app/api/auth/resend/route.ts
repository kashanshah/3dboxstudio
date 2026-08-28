import { NextResponse } from "next/server";
import { getCurrentUserRow } from "@/server/auth/session";
import { createVerificationToken } from "@/server/auth/verification";
import { sendVerificationEmail } from "@/server/email/mailer";
import { originFromRequest } from "@/server/requestOrigin";
import { enforceRateLimit } from "@/server/rateLimit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "auth:resend", { windowMs: 60 * 60 * 1000, max: 5 });
  if (limited) return limited;

  try {
    const user = await getCurrentUserRow();
    if (!user) {
      return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
    }
    if (user.email_verified_at) {
      return NextResponse.json({ ok: true, alreadyVerified: true });
    }

    const token = await createVerificationToken(user.id, user.email);
    const verifyUrl = `${originFromRequest(req)}/verify?token=${encodeURIComponent(token)}`;
    await sendVerificationEmail(user.email, user.name, verifyUrl);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/auth/resend failed:", e);
    return NextResponse.json({ error: "Could not send the verification email. Please try again." }, { status: 500 });
  }
}
