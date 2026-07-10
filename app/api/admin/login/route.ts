import { NextResponse } from "next/server";
import {
  createAdminSessionToken,
  setAdminCookie,
  verifyAdminPassword,
} from "@/server/admin/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json().catch(() => null);
    const password = (body as { password?: unknown })?.password;

    if (typeof password !== "string" || !password) {
      return NextResponse.json({ error: "Enter the admin password." }, { status: 400 });
    }

    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ error: "Incorrect admin password." }, { status: 401 });
    }

    const token = createAdminSessionToken();
    await setAdminCookie(token);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/admin/login failed:", e);
    return NextResponse.json({ error: "Could not sign in. Please try again." }, { status: 500 });
  }
}
