import { NextResponse } from "next/server";
import {
  getAttributionFromCookies,
  normalizeAttributionInput,
  setAttributionCookie,
  type StoredAttribution,
} from "@/server/attribution";
import { enforceRateLimit } from "@/server/rateLimit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "attribution:capture", { windowMs: 60 * 1000, max: 30 });
  if (limited) return limited;

  try {
    const existing = await getAttributionFromCookies();
    if (existing) {
      return NextResponse.json({ ok: true, stored: false, reason: "first_touch_exists" });
    }

    const body: unknown = await req.json().catch(() => null);
    const normalized = normalizeAttributionInput(body);
    if (!normalized) {
      return NextResponse.json({ ok: true, stored: false, reason: "no_data" });
    }

    const attribution: StoredAttribution = {
      ...normalized,
      firstSeenAt: new Date().toISOString(),
    };

    await setAttributionCookie(attribution);
    return NextResponse.json({ ok: true, stored: true });
  } catch (e) {
    console.error("POST /api/attribution/capture failed:", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
