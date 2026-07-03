import { NextResponse } from "next/server";
import { consumeVerificationToken } from "@/server/auth/verification";
import { createSession, setSessionCookie } from "@/server/auth/session";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json().catch(() => null);
    const token = (body as { token?: unknown })?.token;
    if (typeof token !== "string" || !token) {
      return NextResponse.json({ error: "Missing verification token." }, { status: 400 });
    }

    const result = await consumeVerificationToken(token);
    if (!result.ok) {
      const messages: Record<string, string> = {
        invalid: "This verification link is invalid.",
        expired: "This verification link has expired. Request a new one from the studio.",
        used: "This email is already verified. You can sign in.",
      };
      const status = result.reason === "used" ? 200 : 400;
      return NextResponse.json(
        { ok: result.reason === "used", error: result.reason === "used" ? undefined : messages[result.reason] },
        { status }
      );
    }

    // Sign the user in on this device so they land back in the studio ready to save.
    const sessionToken = await createSession(result.userId);
    await setSessionCookie(sessionToken);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/auth/verify failed:", e);
    return NextResponse.json({ error: "Could not verify your email. Please try again." }, { status: 500 });
  }
}
