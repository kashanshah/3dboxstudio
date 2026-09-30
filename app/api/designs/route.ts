import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { listUserDesigns } from "@/server/shareService";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Please sign in to view your designs." }, { status: 401 });
    }
    const projectId = new URL(req.url).searchParams.get("projectId");
    const designs = await listUserDesigns(user.id, projectId);
    return NextResponse.json({ designs });
  } catch (e) {
    console.error("GET /api/designs failed:", e);
    return NextResponse.json({ error: "Could not load your designs." }, { status: 500 });
  }
}
