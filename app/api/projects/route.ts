import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { listUserProjects } from "@/server/shareService";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Please sign in to view your projects." }, { status: 401 });
    }
    const projects = await listUserProjects(user.id);
    return NextResponse.json({ projects });
  } catch (e) {
    console.error("GET /api/projects failed:", e);
    return NextResponse.json({ error: "Could not load your projects." }, { status: 500 });
  }
}
