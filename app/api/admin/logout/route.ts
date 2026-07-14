import { NextResponse } from "next/server";
import { clearAdminCookie } from "@/server/admin/auth";

export const runtime = "nodejs";

export async function POST() {
  try {
    await clearAdminCookie();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/admin/logout failed:", e);
    return NextResponse.json({ error: "Could not sign out." }, { status: 500 });
  }
}
