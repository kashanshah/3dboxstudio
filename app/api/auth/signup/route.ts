import { NextResponse } from "next/server";
import { createUser, getUserByEmail, normalizeEmail, toPublicUser } from "@/server/auth/users";
import { createSession, setSessionCookie } from "@/server/auth/session";
import { createVerificationToken } from "@/server/auth/verification";
import { isValidEmail, normalizeName, passwordError, disposableEmailError } from "@/server/auth/validation";
import { sendAdminNewRegistrationEmail, sendVerificationEmail } from "@/server/email/mailer";
import { originFromRequest } from "@/server/requestOrigin";
import { enforceRateLimit } from "@/server/rateLimit";
import { attachSignupAttribution, attributionSummaryForEmail } from "@/server/auth/signupAttribution";
import { conversionPageFromReferer } from "@/server/attribution";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "auth:signup", { windowMs: 60 * 60 * 1000, max: 5 });
  if (limited) return limited;

  try {
    const body: unknown = await req.json().catch(() => null);
    const email = (body as { email?: unknown })?.email;
    const password = (body as { password?: unknown })?.password;
    const name = normalizeName((body as { name?: unknown })?.name);

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    const disposableError = disposableEmailError(email);
    if (disposableError) {
      return NextResponse.json({ error: disposableError }, { status: 400 });
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

    const conversionPageRaw = (body as { conversionPage?: unknown })?.conversionPage;
    const conversionPage =
      typeof conversionPageRaw === "string" && conversionPageRaw.startsWith("/")
        ? conversionPageRaw
        : conversionPageFromReferer(req.headers.get("referer"), originFromRequest(req));

    const user = await createUser(email as string, password as string, name);

    const { attribution, analytics } = await attachSignupAttribution(user.id, "email", {
      conversionPage,
    });

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
        attributionSummary: attributionSummaryForEmail("email", attribution, conversionPage),
      });
    } catch (adminMailErr) {
      console.error("Failed to send admin registration alert:", adminMailErr);
      // Signup must not fail if the admin alert cannot be delivered.
    }

    return NextResponse.json({ user: toPublicUser(user), signupAnalytics: analytics });
  } catch (e) {
    console.error("POST /api/auth/signup failed:", e);
    return NextResponse.json({ error: "Could not create your account. Please try again." }, { status: 500 });
  }
}
