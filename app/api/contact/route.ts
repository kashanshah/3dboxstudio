import { NextResponse } from "next/server";
import { getSiteOrigin } from "@/lib/siteOrigin";
import { CONTACT_TOPICS, type ContactTopic } from "@/content/contact";
import { enforceRateLimit } from "@/server/rateLimit";
import { isValidEmail } from "@/server/auth/validation";

export const runtime = "nodejs";

const TEKNOBOARDS_SUBMIT_URL = "https://board.teknoffice.com/api/forms/submit";
const VALID_TOPICS = new Set<string>(CONTACT_TOPICS.map((t) => t.value));

type ContactBody = {
  name?: unknown;
  email?: unknown;
  topic?: unknown;
  subject?: unknown;
  message?: unknown;
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

  const apiKey = process.env.TEKNOBOARDS_API_KEY?.trim();
  const formId = process.env.TEKNOBOARDS_FORM_ID?.trim();
  if (!apiKey || !formId) {
    return NextResponse.json(
      { ok: false, error: "Contact form is not configured yet. Please try again later." },
      { status: 503 },
    );
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

    const origin = getSiteOrigin();
    const successUrl = `${origin}/contact?sent=1`;
    const failureUrl = `${origin}/contact?error=1`;

    const upstream = await fetch(TEKNOBOARDS_SUBMIT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey,
      },
      body: JSON.stringify({
        formId,
        origin,
        success_url: successUrl,
        failure_url: failureUrl,
        payload: {
          name,
          email,
          topic,
          subject,
          message,
        },
      }),
    });

    const data = (await upstream.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      message?: string;
      id?: string;
      redirectUrl?: string;
    };

    if (!upstream.ok || data.ok === false) {
      return NextResponse.json(
        {
          ok: false,
          error: data.error ?? "Could not send your message. Please try again.",
          redirectUrl: data.redirectUrl ?? null,
        },
        { status: upstream.status >= 400 ? upstream.status : 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      id: data.id ?? null,
      message: data.message ?? "Submission received",
      redirectUrl: data.redirectUrl ?? null,
    });
  } catch (e) {
    console.error("POST /api/contact failed:", e);
    return NextResponse.json(
      { ok: false, error: "Could not send your message. Please try again." },
      { status: 500 },
    );
  }
}
