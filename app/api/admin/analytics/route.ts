import { NextResponse } from "next/server";
import { requireAdminApi } from "@/server/admin/auth";
import { getAdminAnalytics } from "@/server/admin/analytics";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const denied = await requireAdminApi();
    if (denied) return denied;

    const { searchParams } = new URL(req.url);
    const granularity = searchParams.get("granularity");
    const analytics = await getAdminAnalytics(granularity);
    return NextResponse.json({ analytics });
  } catch (e) {
    console.error("GET /api/admin/analytics failed:", e);
    return NextResponse.json({ error: "Could not load admin analytics." }, { status: 500 });
  }
}
