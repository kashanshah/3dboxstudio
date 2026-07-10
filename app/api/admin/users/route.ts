import { NextResponse } from "next/server";
import { requireAdminApi } from "@/server/admin/auth";
import { listAdminUsers } from "@/server/admin/reports";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const denied = await requireAdminApi();
    if (denied) return denied;

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") ?? "1");
    const pageSize = Number(searchParams.get("pageSize") ?? "25");
    const search = searchParams.get("search") ?? undefined;

    const result = await listAdminUsers({ page, pageSize, search });
    return NextResponse.json(result);
  } catch (e) {
    console.error("GET /api/admin/users failed:", e);
    return NextResponse.json({ error: "Could not load users." }, { status: 500 });
  }
}
