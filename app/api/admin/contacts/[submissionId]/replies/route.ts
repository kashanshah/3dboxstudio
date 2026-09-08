import { NextResponse } from "next/server";
import { requireAdminApi } from "@/server/admin/auth";
import { getContactSubmissionReplyTarget, listContactSubmissionReplies } from "@/server/contactSubmissionReplies";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const denied = await requireAdminApi();
    if (denied) return denied;

    const { submissionId } = await params;
    const submission = await getContactSubmissionReplyTarget(submissionId);
    if (!submission) {
      return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    }

    const replies = await listContactSubmissionReplies(submissionId);
    return NextResponse.json({ ok: true, replies });
  } catch (e) {
    console.error("GET /api/admin/contacts/[submissionId]/replies failed:", e);
    return NextResponse.json({ error: "Could not load replies." }, { status: 500 });
  }
}
