import { NextResponse } from "next/server";
import { requireAdminApi } from "@/server/admin/auth";
import { getEmailTemplatePreviews } from "@/server/email/templates";

export const runtime = "nodejs";

export async function GET() {
  try {
    const denied = await requireAdminApi();
    if (denied) return denied;

    return NextResponse.json({ items: getEmailTemplatePreviews() });
  } catch (e) {
    console.error("GET /api/admin/email-templates failed:", e);
    return NextResponse.json({ error: "Could not load email templates." }, { status: 500 });
  }
}
