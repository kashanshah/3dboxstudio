import { NextResponse } from "next/server";
import { CONTACT_TOPICS, type ContactTopic } from "@/content/contact";
import { enforceRateLimit } from "@/server/rateLimit";
import { isValidEmail } from "@/server/auth/validation";
import { getClientIp } from "@/server/rateLimit";
import { createContactSubmission } from "@/server/contactSubmissions";
import { sendAdminContactSubmissionEmail } from "@/server/email/mailer";
import { turnstileConfigError, verifyTurnstileToken } from "@/server/turnstile";

export const runtime = "nodejs";

const VALID_TOPICS = new Set<string>(CONTACT_TOPICS.map((t) => t.value));

type ContactBody = {
  name?: unknown;
  email?: unknown;
  topic?: unknown;
  subject?: unknown;
  message?: unknown;
  locale?: unknown;
  pagePath?: unknown;
  turnstileToken?: unknown;
};

function cleanText(value: unknown, maxLen: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLen) return null;
  return trimmed;
}

export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "contact:submit", {
    windowMs: 15 * 60 * 1000,
    max: 5,
  });
  if (limited) return limited;

  const captchaError = turnstileConfigError();
  if (captchaError) {
    return NextResponse.json({ ok: false, error: captchaError }, { status: 503 });
  }

  try {
    const body = (await req.json().catch(() => null)) as ContactBody | null;
    const name = cleanText(body?.name, 120);
    const email = cleanText(body?.email, 254);
    const subject = cleanText(body?.subject, 200);
    const message = cleanText(body?.message, 5000);
    const topic =
      typeof body?.topic === "string" && VALID_TOPICS.has(body.topic)
        ? (body.topic as ContactTopic)
        : null;

    if (!name) {
      return NextResponse.json({ ok: false, error: "Enter your name." }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });
    }
    if (!topic) {
      return NextResponse.json({ ok: false, error: "Choose a topic." }, { status: 400 });
    }
    if (!subject) {
      return NextResponse.json({ ok: false, error: "Enter a subject." }, { status: 400 });
    }
    if (!message) {
      return NextResponse.json({ ok: false, error: "Enter a message." }, { status: 400 });
    }

    const captcha = await verifyTurnstileToken(body?.turnstileToken, req);
    if (!captcha.ok) {
      return NextResponse.json({ ok: false, error: captcha.error }, { status: 403 });
    }
    const locale = cleanText(body?.locale, 16);
    const pagePath = cleanText(body?.pagePath, 200);
    const submission = await createContactSubmission({
      kind: "contact_message",
      source: "website_contact_form",
      email,
      name,
      topic,
      subject,
      message,
      locale,
      pagePath,
      referrer: req.headers.get("referer")?.trim() || null,
      ipAddress: getClientIp(req),
      userAgent: req.headers.get("user-agent")?.trim() || null,
      payload: {
        topicLabel: CONTACT_TOPICS.find((item) => item.value === topic)?.label ?? topic,
      },
    });

    try {
      await sendAdminContactSubmissionEmail({
        id: submission.id,
        name,
        email,
        topic: CONTACT_TOPICS.find((item) => item.value === topic)?.label ?? topic,
        subject,
        message,
        locale,
        pagePath,
        referrer: req.headers.get("referer")?.trim() || null,
        submittedAt: submission.createdAt,
      });
    } catch (notifyError) {
      console.error("POST /api/contact notification failed:", notifyError);
    }

    return NextResponse.json({
      ok: true,
      id: submission.id,
      message: "Submission received",
    });
  } catch (e) {
    console.error("POST /api/contact failed:", e);
    return NextResponse.json(
      { ok: false, error: "Could not send your message. Please try again." },
      { status: 500 },
    );
  }
}
