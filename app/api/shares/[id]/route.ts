import { NextResponse } from "next/server";
import { assertCanCreateShare } from "@/server/shareAuth";
import { ShareError, getShare, renameShare, updateShare } from "@/server/shareService";
import { parseShareSaveRequest } from "@/server/shareSaveRequest";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(req: Request, context: RouteContext) {
  try {
    await assertCanCreateShare(req);
    const { id } = await context.params;
    const rawBody = await req.text();
    if (!rawBody.trim()) {
      return NextResponse.json({ error: "Request body is empty." }, { status: 400 });
    }
    const { designJson, ogImage } = parseShareSaveRequest(req, rawBody);
    const result = await updateShare(id, designJson, ogImage);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof ShareError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("PUT /api/shares/[id] failed:", e);
    const message =
      e instanceof Error && e.message.includes("is not configured")
        ? "Share is not configured on this server."
        : "Could not update share.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request, context: RouteContext) {
  try {
    await assertCanCreateShare(req);
    const { id } = await context.params;
    const body: unknown = await req.json().catch(() => null);
    if (typeof body !== "object" || body === null || !("name" in body) || typeof (body as { name: unknown }).name !== "string") {
      return NextResponse.json({ error: "Expected JSON body with a name field." }, { status: 400 });
    }
    const result = await renameShare(id, (body as { name: string }).name);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof ShareError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("PATCH /api/shares/[id] failed:", e);
    const message =
      e instanceof Error && e.message.includes("is not configured")
        ? "Share is not configured on this server."
        : "Could not rename share.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(_req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const payload = await getShare(id);
    if (!payload) {
      return NextResponse.json({ error: "Share not found or expired." }, { status: 404 });
    }
    return NextResponse.json(payload);
  } catch (e) {
    console.error("GET /api/shares/[id] failed:", e);
    const message =
      e instanceof Error && e.message.includes("is not configured")
        ? "Share is not configured on this server."
        : "Could not load shared design.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
