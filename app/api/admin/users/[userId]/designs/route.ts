import { NextResponse } from "next/server";
import { requireAdminApi } from "@/server/admin/auth";
import { listAdminDesignsForUser } from "@/server/admin/reports";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ userId: string }>;
};

export async function GET(req: Request, context: RouteContext) {
  try {
    const denied = await requireAdminApi();
    if (denied) return denied;

    const { userId } = await context.params;
    if (!userId?.trim()) {
      return NextResponse.json({ error: "User id is required." }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") ?? "1");
    const pageSize = Number(searchParams.get("pageSize") ?? "100");

    const result = await listAdminDesignsForUser(userId, { page, pageSize });
    return NextResponse.json(result);
  } catch (e) {
    console.error("GET /api/admin/users/[userId]/designs failed:", e);
    return NextResponse.json({ error: "Could not load user designs." }, { status: 500 });
  }
}
