import { NextResponse } from "next/server";
import { endCurrentSession } from "@/server/auth/session";

export const runtime = "nodejs";

export async function POST() {
  try {
    await endCurrentSession();
  } catch (e) {
    console.error("POST /api/auth/logout failed:", e);
  }
  return NextResponse.json({ ok: true });
}
