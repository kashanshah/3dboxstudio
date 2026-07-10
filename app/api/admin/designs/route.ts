import { NextResponse } from "next/server";
import { requireAdminApi } from "@/server/admin/auth";
import { listAdminDesigns } from "@/server/admin/reports";

export const runtime = "nodejs";

const VALID_FILTERS = new Set(["all", "owned", "anonymous", "expired"]);

export async function GET(req: Request) {
  try {
    const denied = await requireAdminApi();
    if (denied) return denied;

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") ?? "1");
    const pageSize = Number(searchParams.get("pageSize") ?? "25");
    const search = searchParams.get("search") ?? undefined;
    const rawFilter = searchParams.get("filter") ?? "all";
    const filter = VALID_FILTERS.has(rawFilter)
      ? (rawFilter as "all" | "owned" | "anonymous" | "expired")
      : "all";

    const result = await listAdminDesigns({ page, pageSize, search, filter });
    return NextResponse.json(result);
  } catch (e) {
    console.error("GET /api/admin/designs failed:", e);
    return NextResponse.json({ error: "Could not load designs." }, { status: 500 });
  }
}
