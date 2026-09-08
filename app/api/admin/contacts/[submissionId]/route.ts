import { NextResponse } from "next/server";
import { requireAdminApi } from "@/server/admin/auth";
import { deleteContactSubmission } from "@/server/contactSubmissions";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const denied = await requireAdminApi();
    if (denied) return denied;

    const { submissionId } = await params;
    const deleted = await deleteContactSubmission(submissionId);
    if (!deleted) {
      return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, submissionId });
  } catch (e) {
    console.error("DELETE /api/admin/contacts/[submissionId] failed:", e);
    return NextResponse.json({ error: "Could not delete submission." }, { status: 500 });
  }
}
