import { NextResponse } from "next/server";
import { requireAdminApi } from "@/server/admin/auth";
import { getAdminStats } from "@/server/admin/reports";

export const runtime = "nodejs";

export async function GET() {
  try {
    const denied = await requireAdminApi();
    if (denied) return denied;

    const stats = await getAdminStats();
    return NextResponse.json({ stats });
  } catch (e) {
    console.error("GET /api/admin/stats failed:", e);
    return NextResponse.json({ error: "Could not load admin stats." }, { status: 500 });
  }
}
