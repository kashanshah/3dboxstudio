import { NextResponse } from "next/server";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { getCurrentUserRow } from "@/server/auth/session";
import { passwordError } from "@/server/auth/validation";
import { updateUserPassword } from "@/server/auth/users";

export const runtime = "nodejs";

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUserRow();
    if (!user) {
      return NextResponse.json({ error: "Sign in to change your password." }, { status: 401 });
    }

    const body: unknown = await req.json().catch(() => null);
    const currentPassword = (body as { currentPassword?: unknown })?.currentPassword;
    const newPassword = (body as { newPassword?: unknown })?.newPassword;

    if (typeof currentPassword !== "string" || !currentPassword) {
      return NextResponse.json({ error: "Enter your current password." }, { status: 400 });
    }

    const newPasswordError = passwordError(newPassword);
    if (newPasswordError) {
      return NextResponse.json({ error: newPasswordError }, { status: 400 });
    }

    const currentOk = await verifyPassword(currentPassword, user.password_hash);
    if (!currentOk) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
    }

    const passwordHash = await hashPassword(newPassword as string);
    const updated = await updateUserPassword(user.id, passwordHash);
    if (!updated) {
      return NextResponse.json({ error: "Could not change your password." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("PATCH /api/auth/password failed:", e);
    return NextResponse.json({ error: "Could not change your password. Please try again." }, { status: 500 });
  }
}
