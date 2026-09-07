import { NextResponse } from "next/server";
import { requireAdminApi } from "@/server/admin/auth";
import { parseAdminSubmissionsQuery } from "@/lib/adminListQuery";
import { listAdminSubmissions } from "@/server/admin/reports";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const denied = await requireAdminApi();
    if (denied) return denied;

    const { searchParams } = new URL(req.url);
    const query = parseAdminSubmissionsQuery({
      page: searchParams.get("page") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      sort: searchParams.get("sort") ?? undefined,
      dir: searchParams.get("dir") ?? undefined,
      kind: searchParams.get("kind") ?? undefined,
      status: searchParams.get("status") ?? undefined,
    });
    const pageSize = Number(searchParams.get("pageSize") ?? "25");

    const result = await listAdminSubmissions({ ...query, pageSize });
    return NextResponse.json(result);
  } catch (e) {
    console.error("GET /api/admin/contacts failed:", e);
    return NextResponse.json({ error: "Could not load submissions." }, { status: 500 });
  }
}
