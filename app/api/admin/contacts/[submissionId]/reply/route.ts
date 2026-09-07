import { NextResponse } from "next/server";
import { requireAdminApi } from "@/server/admin/auth";
import { getContactSubmissionReplyTarget, createContactSubmissionReply } from "@/server/contactSubmissionReplies";
import { sanitizeEmailRichText, richTextHtmlToText } from "@/server/email/richText";
import { adminAlertEmail, sendContactSubmissionReplyEmail } from "@/server/email/mailer";

export const runtime = "nodejs";

type ReplyBody = {
  subject?: unknown;
  html?: unknown;
};

function cleanText(value: unknown, maxLen: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLen) return null;
  return trimmed;
}

export async function POST(
  req: Request,
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
    if (submission.kind !== "contact_message") {
      return NextResponse.json({ error: "Replies are only supported for contact messages." }, { status: 400 });
    }

    const body = (await req.json().catch(() => null)) as ReplyBody | null;
    const subject = cleanText(body?.subject, 200);
    const html = typeof body?.html === "string" ? body.html : "";
    const sanitizedHtml = sanitizeEmailRichText(html);
    const replyText = richTextHtmlToText(sanitizedHtml);

    if (!subject) {
      return NextResponse.json({ error: "Enter a reply subject." }, { status: 400 });
    }
    if (!sanitizedHtml || !replyText) {
      return NextResponse.json({ error: "Enter a reply message." }, { status: 400 });
    }

    const fromEmail = await adminAlertEmail();

    await sendContactSubmissionReplyEmail({
      to: submission.email,
      from: fromEmail,
      recipientName: submission.name,
      replySubject: subject,
      replyHtml: sanitizedHtml,
      replyText,
      submission: {
        id: submission.id,
        topic: submission.topic,
        subject: submission.subject,
        message: submission.message,
        submittedAt: submission.createdAt,
      },
    });

    const reply = await createContactSubmissionReply({
      submissionId: submission.id,
      toEmail: submission.email,
      fromEmail,
      subject,
      bodyHtml: sanitizedHtml,
      bodyText: replyText,
    });

    return NextResponse.json({
      ok: true,
      replyId: reply.id,
      createdAt: reply.createdAt,
      fromEmail,
      status: "reviewed",
    });
  } catch (e) {
    console.error("POST /api/admin/contacts/[submissionId]/reply failed:", e);
    return NextResponse.json({ error: "Could not send reply." }, { status: 500 });
  }
}
