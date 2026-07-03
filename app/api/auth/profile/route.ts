import { NextResponse } from "next/server";
import { getCurrentUserRow } from "@/server/auth/session";
import { normalizeName } from "@/server/auth/validation";
import { toPublicUser, updateUserName } from "@/server/auth/users";

export const runtime = "nodejs";

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUserRow();
    if (!user) {
      return NextResponse.json({ error: "Sign in to update your profile." }, { status: 401 });
    }

    const body: unknown = await req.json().catch(() => null);
    const name = normalizeName((body as { name?: unknown })?.name);

    const updated = await updateUserName(user.id, name);
    if (!updated) {
      return NextResponse.json({ error: "Could not update your profile." }, { status: 500 });
    }

    return NextResponse.json({ user: toPublicUser(updated) });
  } catch (e) {
    console.error("PATCH /api/auth/profile failed:", e);
    return NextResponse.json({ error: "Could not update your profile. Please try again." }, { status: 500 });
  }
}
