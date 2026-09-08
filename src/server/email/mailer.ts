import { requireEnv, optionalEnv } from "../env";
import { getAdminSettings, isAdminNotificationEnabled } from "@/server/admin/settings";
import {
  renderAdminContactSubmissionTemplate,
  renderAdminRegistrationTemplate,
  renderContactReplyTemplate,
  renderEmailChangeTemplate,
  renderPasswordResetTemplate,
  renderVerificationTemplate,
} from "./templates";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
};

/** Sends an email via the Resend REST API. Throws if RESEND_API_KEY is missing or the call fails. */
export async function sendEmail({ to, subject, html, text, from, replyTo }: SendEmailInput): Promise<void> {
  const apiKey = requireEnv("RESEND_API_KEY");
  const defaultFrom = optionalEnv("EMAIL_FROM", "3D Box Studio <onboarding@resend.dev>");

  const res = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: from ?? defaultFrom,
      to,
      subject,
      html,
      text,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend request failed (${res.status}): ${detail}`);
  }
}

export async function sendVerificationEmail(to: string, name: string | null, verifyUrl: string): Promise<void> {
  const rendered = renderVerificationTemplate({ name, verifyUrl });
  await sendEmail({ to, ...rendered });
}

export async function sendEmailChangeVerificationEmail(
  to: string,
  name: string | null,
  verifyUrl: string
): Promise<void> {
  const rendered = renderEmailChangeTemplate({ name, verifyUrl });
  await sendEmail({ to, ...rendered });
}

export async function sendPasswordResetEmail(to: string, name: string | null, resetUrl: string): Promise<void> {
  const rendered = renderPasswordResetTemplate({ name, resetUrl });
  await sendEmail({ to, ...rendered });
}

/** Recipient for admin operational alerts (new registrations, etc.). */
export async function adminAlertEmail(): Promise<string> {
  const settings = await getAdminSettings().catch(() => null);
  return settings?.notificationEmail || optionalEnv("ADMIN_EMAIL", "kashanshah@hotmail.com");
}

async function shouldSendAdminNotification(kind: "signup" | "export" | "contactMessage" | "newsletterSubmission") {
  const settings = await getAdminSettings().catch(() => null);
  if (!settings) return true;
  return isAdminNotificationEnabled(settings, kind);
}

/** Notifies the admin that a new user just registered. */
export async function sendAdminNewRegistrationEmail(user: {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  attributionSummary?: string;
}): Promise<void> {
  if (!(await shouldSendAdminNotification("signup"))) return;
  const to = await adminAlertEmail();
  const rendered = renderAdminRegistrationTemplate(user);
  await sendEmail({
    to,
    ...rendered,
  });
}

export async function sendAdminContactSubmissionEmail(submission: {
  id: string;
  name: string | null;
  email: string;
  topic: string | null;
  subject: string | null;
  message: string | null;
  locale: string | null;
  pagePath: string | null;
  referrer: string | null;
  submittedAt: string;
  kind?: "contactMessage" | "newsletterSubmission";
}): Promise<void> {
  if (!(await shouldSendAdminNotification(submission.kind ?? "contactMessage"))) return;
  const to = await adminAlertEmail();
  const rendered = renderAdminContactSubmissionTemplate(submission);
  await sendEmail({
    to,
    ...rendered,
  });
}

export async function sendContactSubmissionReplyEmail(input: {
  to: string;
  from: string;
  recipientName: string | null;
  replySubject: string;
  replyHtml: string;
  replyText: string;
  submission: {
    id: string;
    topic: string | null;
    subject: string | null;
    message: string | null;
    submittedAt: string;
  };
}): Promise<void> {
  const rendered = renderContactReplyTemplate(input);
  await sendEmail({
    to: input.to,
    from: input.from,
    replyTo: input.from,
    ...rendered,
  });
}
