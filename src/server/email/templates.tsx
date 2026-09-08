import { getSiteOrigin } from "@/lib/siteOrigin";

type EmailTemplateId =
  | "verification"
  | "email-change"
  | "password-reset"
  | "admin-registration"
  | "admin-contact-submission"
  | "contact-reply";

type RenderedEmail = {
  subject: string;
  html: string;
  text: string;
};

type VerificationProps = {
  name: string | null;
  verifyUrl: string;
};

type PasswordResetProps = {
  name: string | null;
  resetUrl: string;
};

type AdminRegistrationProps = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  attributionSummary?: string;
};

type AdminContactSubmissionProps = {
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
};

type ContactReplyProps = {
  replySubject: string;
  recipientName: string | null;
  replyHtml: string;
  replyText: string;
  submission: {
    id: string;
    topic: string | null;
    subject: string | null;
    message: string | null;
    submittedAt: string;
  };
};

type PreviewEntry = {
  id: EmailTemplateId;
  label: string;
  description: string;
  subject: string;
  html: string;
  text: string;
  sourcePath: string;
};

const SOURCE_PATH = "src/server/email/templates.tsx";

function stringifyValue(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function escapeHtml(value: unknown): string {
  const text = stringifyValue(value);
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function nl2br(value: unknown): string {
  return escapeHtml(value).replace(/\n/g, "<br />");
}

function greeting(name: string | null): string {
  return name ? `Hi ${name},` : "Hi,";
}

function renderShell(eyebrow: string, title: string, body: string): string {
  const origin = getSiteOrigin();
  const logoUrl = `${origin}/logo-mark.svg`;
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:32px 16px;background-color:#eef2ff;color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Helvetica,Arial,sans-serif;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse:collapse;">
      <tr>
        <td align="center">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="640" style="width:100%;max-width:640px;border-collapse:separate;background-color:#ffffff;border:1px solid #dbe4ff;border-radius:20px;overflow:hidden;box-shadow:0 20px 50px rgba(37,99,235,0.10);">
            <tr>
              <td style="padding:0;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse:collapse;">
                  <tr>
                    <td width="32%" height="8" bgcolor="#1d4ed8" style="font-size:0;line-height:0;">&nbsp;</td>
                    <td width="36%" height="8" bgcolor="#2563eb" style="font-size:0;line-height:0;">&nbsp;</td>
                    <td width="32%" height="8" bgcolor="#60a5fa" style="font-size:0;line-height:0;">&nbsp;</td>
                  </tr>
                  <tr>
                    <td colspan="3" bgcolor="#1d4ed8" style="padding:24px 32px;color:#ffffff;">
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse:collapse;">
                        <tr>
                          <td valign="top" style="padding:0 16px 0 0;">
                            <img src="${escapeHtml(logoUrl)}" alt="3D Box Studio" width="40" height="40" style="display:block;width:40px;height:40px;border:0;outline:none;text-decoration:none;" />
                          </td>
                          <td valign="top" style="padding:0;color:#ffffff;">
                            <div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.88;">${escapeHtml(eyebrow)}</div>
                            <div style="margin-top:8px;font-size:28px;line-height:1.2;font-weight:700;">${escapeHtml(title)}</div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px 20px;font-size:15px;line-height:1.65;">
                ${body}
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 28px;color:#64748b;font-size:12px;line-height:1.6;">3D Box Studio</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function renderButton(url: string, label: string): string {
  const safeUrl = escapeHtml(url);
  return `<a href="${safeUrl}" style="display:inline-block;padding:12px 18px;border-radius:12px;background-color:#2563eb;color:#ffffff;font-weight:700;text-decoration:none;">${escapeHtml(label)}</a>`;
}

function renderLink(url: string, label?: string): string {
  const safeUrl = escapeHtml(url);
  const safeLabel = escapeHtml(label ?? url);
  return `<a href="${safeUrl}" style="color:#2563eb;">${safeLabel}</a>`;
}

function renderInfoRow(label: string, value: string): string {
  return `<tr><td style="width:128px;color:#64748b;padding:8px 0;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:8px 0;vertical-align:top;">${value}</td></tr>`;
}

function renderInfoTable(rows: string[]): string {
  return `<table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:8px;"><tbody>${rows.join("")}</tbody></table>`;
}

function renderMono(value: unknown): string {
  return `<span style="font-family:ui-monospace,'SFMono-Regular',Menlo,monospace;">${escapeHtml(value)}</span>`;
}

export function renderVerificationTemplate({ name, verifyUrl }: VerificationProps): RenderedEmail {
  const subject = "Verify your email · 3D Box Studio";
  const text = `${greeting(name)}\n\nThanks for signing up for 3D Box Studio. Verify your email:\n${verifyUrl}\n\nThis link expires in 48 hours.`;
  const html = renderShell(
    "3D Box Studio",
    "Verify your email",
    `
      <p style="margin:0 0 14px;">${escapeHtml(greeting(name))}</p>
      <p style="margin:0 0 16px;">Thanks for signing up for <strong>3D Box Studio</strong>. Confirm your email address to start saving, sharing, and reopening designs.</p>
      <p style="margin:0 0 22px;">${renderButton(verifyUrl, "Verify email")}</p>
      <p style="margin:0 0 8px;color:#64748b;font-size:13px;">Or paste this link into your browser:</p>
      <p style="margin:0 0 16px;font-size:13px;word-break:break-all;">${renderLink(verifyUrl)}</p>
      <p style="margin:0;color:#64748b;font-size:13px;">This link expires in 48 hours. If you did not create an account, you can ignore this email.</p>
    `,
  );
  return { subject, html, text };
}

export function renderEmailChangeTemplate({ name, verifyUrl }: VerificationProps): RenderedEmail {
  const subject = "Confirm your new email · 3D Box Studio";
  const text = `${greeting(name)}\n\nConfirm your new email for 3D Box Studio:\n${verifyUrl}\n\nThis link expires in 48 hours.`;
  const html = renderShell(
    "Account Security",
    "Confirm your new email",
    `
      <p style="margin:0 0 14px;">${escapeHtml(greeting(name))}</p>
      <p style="margin:0 0 16px;">You requested to change the email on your <strong>3D Box Studio</strong> account. Confirm this address to finish the update and restore cloud-save access.</p>
      <p style="margin:0 0 22px;">${renderButton(verifyUrl, "Confirm new email")}</p>
      <p style="margin:0 0 8px;color:#64748b;font-size:13px;">Or paste this link into your browser:</p>
      <p style="margin:0 0 16px;font-size:13px;word-break:break-all;">${renderLink(verifyUrl)}</p>
      <p style="margin:0;color:#64748b;font-size:13px;">If you did not request this change, sign in and update your password right away.</p>
    `,
  );
  return { subject, html, text };
}

export function renderPasswordResetTemplate({ name, resetUrl }: PasswordResetProps): RenderedEmail {
  const subject = "Reset your password · 3D Box Studio";
  const text = `${greeting(name)}\n\nReset your 3D Box Studio password:\n${resetUrl}\n\nThis link expires in 1 hour.`;
  const html = renderShell(
    "Account Security",
    "Reset your password",
    `
      <p style="margin:0 0 14px;">${escapeHtml(greeting(name))}</p>
      <p style="margin:0 0 16px;">We received a request to reset the password for your <strong>3D Box Studio</strong> account. Use the button below to choose a new password.</p>
      <p style="margin:0 0 22px;">${renderButton(resetUrl, "Reset password")}</p>
      <p style="margin:0 0 8px;color:#64748b;font-size:13px;">Or paste this link into your browser:</p>
      <p style="margin:0 0 16px;font-size:13px;word-break:break-all;">${renderLink(resetUrl)}</p>
      <p style="margin:0;color:#64748b;font-size:13px;">This link expires in 1 hour. If you did not request a password reset, you can ignore this email.</p>
    `,
  );
  return { subject, html, text };
}

export function renderAdminRegistrationTemplate({
  id,
  email,
  name,
  createdAt,
  attributionSummary,
}: AdminRegistrationProps): RenderedEmail {
  const subject = `New registration · ${email}`;
  const text = `New registration on 3D Box Studio\n\nName: ${name ?? "—"}\nEmail: ${email}\nUser ID: ${id}\nCreated: ${createdAt}${
    attributionSummary ? `\nTraffic: ${attributionSummary}` : ""
  }`;
  const html = renderShell(
    "Admin Notification",
    "New registration",
    `
      <p style="margin:0 0 16px;">A new account was created on <strong>3D Box Studio</strong>.</p>
      ${renderInfoTable([
        renderInfoRow("Name", escapeHtml(name ?? "—")),
        renderInfoRow("Email", renderLink(`mailto:${email}`, email)),
        renderInfoRow("User ID", renderMono(id)),
        renderInfoRow("Created", escapeHtml(createdAt)),
        ...(attributionSummary ? [renderInfoRow("Traffic", escapeHtml(attributionSummary))] : []),
      ])}
    `,
  );
  return { subject, html, text };
}

export function renderAdminContactSubmissionTemplate({
  id,
  name,
  email,
  topic,
  subject,
  message,
  locale,
  pagePath,
  referrer,
  submittedAt,
}: AdminContactSubmissionProps): RenderedEmail {
  const emailSubject = subject?.trim() || topic?.trim() || "New contact message";
  const subjectLine = `New contact message · ${emailSubject}`;
  const text = `New contact message on 3D Box Studio\n\nName: ${name ?? "—"}\nEmail: ${email}\nTopic: ${topic ?? "—"}\nSubject: ${subject ?? "—"}\nLocale: ${locale ?? "—"}\nPage: ${pagePath ?? "—"}\nReferrer: ${referrer ?? "—"}\nSubmitted: ${submittedAt}\nSubmission ID: ${id}\n\n${message ?? ""}`;
  const html = renderShell(
    "Admin Notification",
    "New contact message",
    `
      <p style="margin:0 0 16px;">A visitor sent a new message through the <strong>3D Box Studio</strong> contact form.</p>
      ${renderInfoTable([
        renderInfoRow("Name", escapeHtml(name ?? "—")),
        renderInfoRow("Email", renderLink(`mailto:${email}`, email)),
        renderInfoRow("Topic", escapeHtml(topic ?? "—")),
        renderInfoRow("Subject", escapeHtml(subject ?? "—")),
        renderInfoRow("Locale", escapeHtml(locale ?? "—")),
        renderInfoRow("Page", escapeHtml(pagePath ?? "—")),
        renderInfoRow("Referrer", escapeHtml(referrer ?? "—")),
        renderInfoRow("Submitted", escapeHtml(submittedAt)),
        renderInfoRow("Submission ID", renderMono(id)),
      ])}
      <div style="margin-top:20px;padding:18px;border-radius:14px;background-color:#f8fafc;border:1px solid #e2e8f0;white-space:pre-wrap;">${nl2br(message ?? "—")}</div>
    `,
  );
  return { subject: subjectLine, html, text };
}

export function renderContactReplyTemplate({
  replySubject,
  recipientName,
  replyHtml,
  replyText,
  submission,
}: ContactReplyProps): RenderedEmail {
  const originalSubject = submission.subject?.trim() || submission.topic?.trim() || "Your message";
  const subject = replySubject.trim();
  const text =
    `${greeting(recipientName)}\n\n${replyText}\n\n` +
    `Original message reference\n` +
    `Subject: ${originalSubject}\n` +
    `Submitted: ${submission.submittedAt}\n` +
    `Message ID: ${submission.id}\n` +
    `${submission.message ? `\n${submission.message}` : ""}`;
  const html = renderShell(
    "3D Box Studio",
    subject,
    `
      <p style="margin:0 0 14px;">${escapeHtml(greeting(recipientName))}</p>
      <div style="margin:0 0 20px;">${replyHtml}</div>
      <div style="margin-top:24px;padding:18px;border-radius:14px;background-color:#f8fafc;border:1px solid #e2e8f0;">
        <p style="margin:0 0 12px;font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;">Message reference</p>
        ${renderInfoTable([
          renderInfoRow("Subject", escapeHtml(originalSubject)),
          renderInfoRow("Submitted", escapeHtml(submission.submittedAt)),
          renderInfoRow("Message ID", renderMono(submission.id)),
        ])}
        <div style="margin-top:14px;padding:14px;border-radius:12px;background-color:#ffffff;border:1px solid #e2e8f0;white-space:pre-wrap;">${nl2br(
          submission.message ?? "—",
        )}</div>
      </div>
    `,
  );
  return { subject, html, text };
}

export function getEmailTemplatePreviews(): PreviewEntry[] {
  return [
    {
      id: "verification",
      label: "Verify Email",
      description: "Transactional account verification email sent after signup or resend.",
      sourcePath: SOURCE_PATH,
      ...renderVerificationTemplate({
        name: "Alex",
        verifyUrl: "https://www.3dboxstudio.com/api/auth/verify?token=example-verification-token",
      }),
    },
    {
      id: "email-change",
      label: "Confirm New Email",
      description: "Security email sent when a user updates their account email.",
      sourcePath: SOURCE_PATH,
      ...renderEmailChangeTemplate({
        name: "Alex",
        verifyUrl: "https://www.3dboxstudio.com/api/auth/email/verify?token=example-email-change-token",
      }),
    },
    {
      id: "password-reset",
      label: "Reset Password",
      description: "Password reset email for existing users.",
      sourcePath: SOURCE_PATH,
      ...renderPasswordResetTemplate({
        name: "Alex",
        resetUrl: "https://www.3dboxstudio.com/reset-password?token=example-reset-token",
      }),
    },
    {
      id: "admin-registration",
      label: "Admin New Registration",
      description: "Operational alert sent to the configured admin notification inbox.",
      sourcePath: SOURCE_PATH,
      ...renderAdminRegistrationTemplate({
        id: "usr_9x2c4p7r1k",
        email: "alex@example.com",
        name: "Alex Mercer",
        createdAt: "2026-09-07 17:00 America/Toronto",
        attributionSummary: "google / cpc / packaging-mockup",
      }),
    },
    {
      id: "admin-contact-submission",
      label: "Admin Contact Notification",
      description: "Operational alert sent when the public contact form is submitted.",
      sourcePath: SOURCE_PATH,
      ...renderAdminContactSubmissionTemplate({
        id: "sub_2k4n5m8p1q",
        name: "Jamie Lee",
        email: "jamie@example.com",
        topic: "Pricing",
        subject: "Commercial use and client projects",
        message:
          "Hi,\n\nWe’re evaluating 3D Box Studio for client-facing packaging previews. Can you share commercial-use expectations and whether branded previews can be shared externally?\n\nThanks.",
        locale: "en",
        pagePath: "/contact",
        referrer: "https://www.google.com/",
        submittedAt: "2026-09-07 17:24 America/Toronto",
      }),
    },
    {
      id: "contact-reply",
      label: "Contact Reply",
      description: "Reply sent from the admin contacts workflow back to the original submitter.",
      sourcePath: SOURCE_PATH,
      ...renderContactReplyTemplate({
        replySubject: "Re: Commercial use and client projects",
        recipientName: "Jamie",
        replyText:
          "Thanks for reaching out.\n\nYes, branded previews can be shared externally with clients and stakeholders. If you need anything else, just reply to this email.",
        replyHtml:
          "<p>Thanks for reaching out.</p><p>Yes, branded previews can be shared externally with clients and stakeholders.</p><p>If you need anything else, just reply to this email.</p>",
        submission: {
          id: "sub_2k4n5m8p1q",
          topic: "Pricing",
          subject: "Commercial use and client projects",
          message:
            "Hi,\n\nWe’re evaluating 3D Box Studio for client-facing packaging previews. Can you share commercial-use expectations and whether branded previews can be shared externally?\n\nThanks.",
          submittedAt: "2026-09-07 17:24 America/Toronto",
        },
      }),
    },
  ];
}
