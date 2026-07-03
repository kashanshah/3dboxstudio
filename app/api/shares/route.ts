import { NextResponse } from "next/server";
import { assertCanCreateShare } from "@/server/shareAuth";
import { ShareError, createShare } from "@/server/shareService";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const createdBy = await assertCanCreateShare(req);
    const designJson = await req.text();
    if (!designJson.trim()) {
      return NextResponse.json({ error: "Request body is empty." }, { status: 400 });
    }

    const name = req.headers.get("X-Share-Name");
    const result = await createShare(designJson, createdBy, name);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof ShareError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("POST /api/shares failed:", e);
    const message =
      e instanceof Error && e.message.includes("is not configured")
        ? "Share is not configured on this server."
        : "Could not create share link.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
