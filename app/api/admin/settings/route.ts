import { NextResponse } from "next/server";
import { requireAdminApi } from "@/server/admin/auth";
import { isValidEmail } from "@/server/auth/validation";
import { getAdminSettings, setAdminNotificationEmail } from "@/server/admin/settings";

export const runtime = "nodejs";

type SettingsBody = {
  notificationEmail?: unknown;
};

export async function GET() {
  try {
    const denied = await requireAdminApi();
    if (denied) return denied;

    const settings = await getAdminSettings();
    return NextResponse.json(settings);
  } catch (e) {
    console.error("GET /api/admin/settings failed:", e);
    return NextResponse.json({ error: "Could not load admin settings." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const denied = await requireAdminApi();
    if (denied) return denied;

    const body = (await req.json().catch(() => null)) as SettingsBody | null;
    const notificationEmail =
      typeof body?.notificationEmail === "string" ? body.notificationEmail.trim().toLowerCase() : "";

    if (!isValidEmail(notificationEmail)) {
      return NextResponse.json({ error: "Enter a valid notification email address." }, { status: 400 });
    }

    await setAdminNotificationEmail(notificationEmail);
    return NextResponse.json({ ok: true, notificationEmail });
  } catch (e) {
    console.error("PUT /api/admin/settings failed:", e);
    return NextResponse.json({ error: "Could not save admin settings." }, { status: 500 });
  }
}
