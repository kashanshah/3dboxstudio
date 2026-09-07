import { requireEnv, optionalEnv } from "../env";
import { getAdminSettings } from "@/server/admin/settings";
import {
  renderAdminContactSubmissionTemplate,
  renderAdminRegistrationTemplate,
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
};

/** Sends an email via the Resend REST API. Throws if RESEND_API_KEY is missing or the call fails. */
export async function sendEmail({ to, subject, html, text }: SendEmailInput): Promise<void> {
  const apiKey = requireEnv("RESEND_API_KEY");
  const from = optionalEnv("EMAIL_FROM", "3D Box Studio <onboarding@resend.dev>");

  const res = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html, text }),
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

/** Notifies the admin that a new user just registered. */
export async function sendAdminNewRegistrationEmail(user: {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  attributionSummary?: string;
}): Promise<void> {
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
}): Promise<void> {
  const to = await adminAlertEmail();
  const rendered = renderAdminContactSubmissionTemplate(submission);
  await sendEmail({
    to,
    ...rendered,
  });
}
