import { requireEnv, optionalEnv } from "../env";

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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendVerificationEmail(to: string, name: string | null, verifyUrl: string): Promise<void> {
  const greeting = name ? `Hi ${escapeHtml(name)},` : "Hi,";
  const safeUrl = escapeHtml(verifyUrl);
  const html = `
    <div style="font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #0f172a;">
      <h1 style="font-size: 20px; margin: 0 0 16px;">Verify your email</h1>
      <p style="margin: 0 0 12px;">${greeting}</p>
      <p style="margin: 0 0 16px;">Thanks for signing up for <strong>3D Box Studio</strong>. Confirm your email address to start saving and sharing your projects.</p>
      <p style="margin: 0 0 24px;">
        <a href="${safeUrl}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 11px 20px; border-radius: 8px; font-weight: 600;">Verify email</a>
      </p>
      <p style="margin: 0 0 8px; font-size: 13px; color: #64748b;">Or paste this link into your browser:</p>
      <p style="margin: 0 0 24px; font-size: 13px; word-break: break-all;"><a href="${safeUrl}" style="color: #2563eb;">${safeUrl}</a></p>
      <p style="margin: 0; font-size: 12px; color: #94a3b8;">This link expires in 48 hours. If you didn't create an account, you can ignore this email.</p>
    </div>
  `;
  const text = `${name ? `Hi ${name},` : "Hi,"}\n\nVerify your email for 3D Box Studio:\n${verifyUrl}\n\nThis link expires in 48 hours.`;
  await sendEmail({ to, subject: "Verify your email · 3D Box Studio", html, text });
}

export async function sendEmailChangeVerificationEmail(
  to: string,
  name: string | null,
  verifyUrl: string
): Promise<void> {
  const greeting = name ? `Hi ${escapeHtml(name)},` : "Hi,";
  const safeUrl = escapeHtml(verifyUrl);
  const html = `
    <div style="font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #0f172a;">
      <h1 style="font-size: 20px; margin: 0 0 16px;">Confirm your new email</h1>
      <p style="margin: 0 0 12px;">${greeting}</p>
      <p style="margin: 0 0 16px;">You requested to change the email address on your <strong>3D Box Studio</strong> account. Confirm this address to finish the update and restore cloud save access.</p>
      <p style="margin: 0 0 24px;">
        <a href="${safeUrl}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 11px 20px; border-radius: 8px; font-weight: 600;">Confirm new email</a>
      </p>
      <p style="margin: 0 0 8px; font-size: 13px; color: #64748b;">Or paste this link into your browser:</p>
      <p style="margin: 0 0 24px; font-size: 13px; word-break: break-all;"><a href="${safeUrl}" style="color: #2563eb;">${safeUrl}</a></p>
      <p style="margin: 0; font-size: 12px; color: #94a3b8;">This link expires in 48 hours. If you didn't request this change, sign in and update your password right away.</p>
    </div>
  `;
  const text = `${name ? `Hi ${name},` : "Hi,"}\n\nConfirm your new email for 3D Box Studio:\n${verifyUrl}\n\nThis link expires in 48 hours.`;
  await sendEmail({ to, subject: "Confirm your new email · 3D Box Studio", html, text });
}

export async function sendPasswordResetEmail(to: string, name: string | null, resetUrl: string): Promise<void> {
  const greeting = name ? `Hi ${escapeHtml(name)},` : "Hi,";
  const safeUrl = escapeHtml(resetUrl);
  const html = `
    <div style="font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #0f172a;">
      <h1 style="font-size: 20px; margin: 0 0 16px;">Reset your password</h1>
      <p style="margin: 0 0 12px;">${greeting}</p>
      <p style="margin: 0 0 16px;">We received a request to reset the password for your <strong>3D Box Studio</strong> account. Click below to choose a new password.</p>
      <p style="margin: 0 0 24px;">
        <a href="${safeUrl}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 11px 20px; border-radius: 8px; font-weight: 600;">Reset password</a>
      </p>
      <p style="margin: 0 0 8px; font-size: 13px; color: #64748b;">Or paste this link into your browser:</p>
      <p style="margin: 0 0 24px; font-size: 13px; word-break: break-all;"><a href="${safeUrl}" style="color: #2563eb;">${safeUrl}</a></p>
      <p style="margin: 0; font-size: 12px; color: #94a3b8;">This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email — your password won't change.</p>
    </div>
  `;
  const text = `${name ? `Hi ${name},` : "Hi,"}\n\nReset your 3D Box Studio password:\n${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`;
  await sendEmail({ to, subject: "Reset your password · 3D Box Studio", html, text });
}
