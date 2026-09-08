import { NextResponse } from "next/server";
import { requireAdminApi } from "@/server/admin/auth";
import { isValidEmail } from "@/server/auth/validation";
import {
  DEFAULT_ADMIN_NOTIFICATION_PREFERENCES,
  getAdminSettings,
  setAdminSettings,
  type AdminNotificationPreferences,
} from "@/server/admin/settings";

export const runtime = "nodejs";

type SettingsBody = {
  notificationEmail?: unknown;
  notificationPreferences?: unknown;
};

function parseNotificationPreferences(value: unknown): AdminNotificationPreferences | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const next: AdminNotificationPreferences = { ...DEFAULT_ADMIN_NOTIFICATION_PREFERENCES };
  for (const key of Object.keys(DEFAULT_ADMIN_NOTIFICATION_PREFERENCES) as (keyof AdminNotificationPreferences)[]) {
    if (typeof raw[key] !== "boolean") return null;
    next[key] = raw[key] as boolean;
  }
  return next;
}

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
    const notificationPreferences = parseNotificationPreferences(body?.notificationPreferences);

    if (!isValidEmail(notificationEmail)) {
      return NextResponse.json({ error: "Enter a valid notification email address." }, { status: 400 });
    }
    if (!notificationPreferences) {
      return NextResponse.json({ error: "Invalid notification preferences." }, { status: 400 });
    }

    await setAdminSettings({ notificationEmail, notificationPreferences });
    return NextResponse.json({ ok: true, notificationEmail, notificationPreferences });
  } catch (e) {
    console.error("PUT /api/admin/settings failed:", e);
    return NextResponse.json({ error: "Could not save settings." }, { status: 500 });
  }
}
