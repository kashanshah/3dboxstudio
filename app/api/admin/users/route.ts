import { NextResponse } from "next/server";
import { requireAdminApi } from "@/server/admin/auth";
import { parseAdminUsersQuery } from "@/lib/adminListQuery";
import { listAdminUsers } from "@/server/admin/reports";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const denied = await requireAdminApi();
    if (denied) return denied;

    const { searchParams } = new URL(req.url);
    const query = parseAdminUsersQuery({
      page: searchParams.get("page") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      sort: searchParams.get("sort") ?? undefined,
      dir: searchParams.get("dir") ?? undefined,
      verified: searchParams.get("verified") ?? undefined,
      method: searchParams.get("method") ?? undefined,
    });
    const pageSize = Number(searchParams.get("pageSize") ?? "25");

    const result = await listAdminUsers({ ...query, pageSize });
    return NextResponse.json(result);
  } catch (e) {
    console.error("GET /api/admin/users failed:", e);
    return NextResponse.json({ error: "Could not load users." }, { status: 500 });
  }
}
