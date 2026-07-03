import { NextResponse } from "next/server";
import { getShareByPreviewToken } from "@/server/shareService";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(_req: Request, context: RouteContext) {
  try {
    const { token } = await context.params;
    const payload = await getShareByPreviewToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Preview not found or expired." }, { status: 404 });
    }
    return NextResponse.json(payload);
  } catch (e) {
    console.error("GET /api/shares/preview/[token] failed:", e);
    const message =
      e instanceof Error && e.message.includes("is not configured")
        ? "Share is not configured on this server."
        : "Could not load preview.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
