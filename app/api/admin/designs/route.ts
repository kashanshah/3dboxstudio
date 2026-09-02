import { NextResponse } from "next/server";
import { requireAdminApi } from "@/server/admin/auth";
import { parseAdminDesignsQuery } from "@/lib/adminListQuery";
import { listAdminDesigns } from "@/server/admin/reports";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const denied = await requireAdminApi();
    if (denied) return denied;

    const { searchParams } = new URL(req.url);
    const query = parseAdminDesignsQuery({
      page: searchParams.get("page") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      sort: searchParams.get("sort") ?? undefined,
      dir: searchParams.get("dir") ?? undefined,
      filter: searchParams.get("filter") ?? undefined,
    });
    const pageSize = Number(searchParams.get("pageSize") ?? "25");

    const result = await listAdminDesigns({ ...query, pageSize });
    return NextResponse.json(result);
  } catch (e) {
    console.error("GET /api/admin/designs failed:", e);
    return NextResponse.json({ error: "Could not load designs." }, { status: 500 });
  }
}
