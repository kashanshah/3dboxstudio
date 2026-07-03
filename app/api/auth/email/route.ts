import { NextResponse } from "next/server";
import { verifyPassword } from "@/server/auth/password";
import { getCurrentUserRow } from "@/server/auth/session";
import { EmailInUseError, normalizeEmail, toPublicUser, updateUserEmail } from "@/server/auth/users";
import { createVerificationToken } from "@/server/auth/verification";
import { isValidEmail } from "@/server/auth/validation";
import { sendEmailChangeVerificationEmail } from "@/server/email/mailer";
import { originFromRequest } from "@/server/requestOrigin";

export const runtime = "nodejs";

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUserRow();
    if (!user) {
      return NextResponse.json({ error: "Sign in to update your email." }, { status: 401 });
    }

    const body: unknown = await req.json().catch(() => null);
    const newEmail = (body as { newEmail?: unknown })?.newEmail;
    const currentPassword = (body as { currentPassword?: unknown })?.currentPassword;

    if (!isValidEmail(newEmail)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    if (typeof currentPassword !== "string" || !currentPassword) {
      return NextResponse.json({ error: "Enter your current password to confirm this change." }, { status: 400 });
    }

    const normalized = normalizeEmail(newEmail as string);
    if (normalized === user.email) {
      return NextResponse.json({ error: "That is already your email address." }, { status: 400 });
    }

    const currentOk = await verifyPassword(currentPassword, user.password_hash);
    if (!currentOk) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
    }

    let updated;
    try {
      updated = await updateUserEmail(user.id, normalized);
    } catch (e) {
      if (e instanceof EmailInUseError) {
        return NextResponse.json(
          { error: "An account with this email already exists. Choose a different address." },
          { status: 409 }
        );
      }
      throw e;
    }

    try {
      const verifyToken = await createVerificationToken(updated.id, normalized);
      const verifyUrl = `${originFromRequest(req)}/verify?token=${encodeURIComponent(verifyToken)}`;
      await sendEmailChangeVerificationEmail(normalized, updated.name, verifyUrl);
    } catch (mailErr) {
      console.error("Failed to send email change verification:", mailErr);
      return NextResponse.json(
        {
          error: "Your email was updated, but we could not send the verification message. Use Resend verification from Account settings.",
          user: toPublicUser(updated),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      user: toPublicUser(updated),
      verificationSent: true,
    });
  } catch (e) {
    console.error("PATCH /api/auth/email failed:", e);
    return NextResponse.json({ error: "Could not update your email. Please try again." }, { status: 500 });
  }
}
