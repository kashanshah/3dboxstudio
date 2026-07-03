import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getCurrentUser();
    return NextResponse.json({ user });
  } catch (e) {
    console.error("GET /api/auth/me failed:", e);
    return NextResponse.json({ user: null });
  }
}
