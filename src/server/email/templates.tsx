import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

type EmailTemplateId =
  | "verification"
  | "email-change"
  | "password-reset"
  | "admin-registration"
  | "admin-contact-submission";

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

const shellStyle: React.CSSProperties = {
  margin: 0,
  padding: "32px 16px",
  backgroundColor: "#eef2ff",
  color: "#0f172a",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Helvetica, Arial, sans-serif',
};

const cardStyle: React.CSSProperties = {
  maxWidth: 640,
  margin: "0 auto",
  backgroundColor: "#ffffff",
  borderRadius: 20,
  overflow: "hidden",
  border: "1px solid #dbe4ff",
  boxShadow: "0 20px 50px rgba(37, 99, 235, 0.10)",
};

const headerStyle: React.CSSProperties = {
  padding: "28px 32px",
  background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 55%, #60a5fa 100%)",
  color: "#ffffff",
};

const contentStyle: React.CSSProperties = {
  padding: "28px 32px 20px",
  fontSize: 15,
  lineHeight: 1.65,
};

const buttonStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "12px 18px",
  borderRadius: 12,
  backgroundColor: "#2563eb",
  color: "#ffffff",
  fontWeight: 700,
  textDecoration: "none",
};

const infoTableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 14,
  marginTop: 8,
};

const labelCellStyle: React.CSSProperties = {
  width: 128,
  color: "#64748b",
  padding: "8px 0",
  verticalAlign: "top",
};

const valueCellStyle: React.CSSProperties = {
  padding: "8px 0",
  verticalAlign: "top",
};

function EmailShell({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <html>
      <body style={shellStyle}>
        <div style={cardStyle}>
          <div style={headerStyle}>
            <div style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.88 }}>
              {eyebrow}
            </div>
            <h1 style={{ margin: "10px 0 0", fontSize: 28, lineHeight: 1.2 }}>{title}</h1>
          </div>
          <div style={contentStyle}>{children}</div>
          <div
            style={{
              padding: "0 32px 28px",
              color: "#64748b",
              fontSize: 12,
              lineHeight: 1.6,
            }}
          >
            3D Box Studio
          </div>
        </div>
      </body>
    </html>
  );
}

function renderDocument(node: React.ReactElement): string {
  return `<!DOCTYPE html>${renderToStaticMarkup(node)}`;
}

function greeting(name: string | null): string {
  return name ? `Hi ${name},` : "Hi,";
}

export function renderVerificationTemplate({ name, verifyUrl }: VerificationProps): RenderedEmail {
  const subject = "Verify your email · 3D Box Studio";
  const text = `${greeting(name)}\n\nThanks for signing up for 3D Box Studio. Verify your email:\n${verifyUrl}\n\nThis link expires in 48 hours.`;
  const html = renderDocument(
    <EmailShell eyebrow="3D Box Studio" title="Verify your email">
      <p style={{ margin: "0 0 14px" }}>{greeting(name)}</p>
      <p style={{ margin: "0 0 16px" }}>
        Thanks for signing up for <strong>3D Box Studio</strong>. Confirm your email address to start saving,
        sharing, and reopening designs.
      </p>
      <p style={{ margin: "0 0 22px" }}>
        <a href={verifyUrl} style={buttonStyle}>
          Verify email
        </a>
      </p>
      <p style={{ margin: "0 0 8px", color: "#64748b", fontSize: 13 }}>Or paste this link into your browser:</p>
      <p style={{ margin: "0 0 16px", fontSize: 13, wordBreak: "break-all" }}>
        <a href={verifyUrl} style={{ color: "#2563eb" }}>
          {verifyUrl}
        </a>
      </p>
      <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
        This link expires in 48 hours. If you did not create an account, you can ignore this email.
      </p>
    </EmailShell>
  );
  return { subject, html, text };
}

export function renderEmailChangeTemplate({ name, verifyUrl }: VerificationProps): RenderedEmail {
  const subject = "Confirm your new email · 3D Box Studio";
  const text = `${greeting(name)}\n\nConfirm your new email for 3D Box Studio:\n${verifyUrl}\n\nThis link expires in 48 hours.`;
  const html = renderDocument(
    <EmailShell eyebrow="Account Security" title="Confirm your new email">
      <p style={{ margin: "0 0 14px" }}>{greeting(name)}</p>
      <p style={{ margin: "0 0 16px" }}>
        You requested to change the email on your <strong>3D Box Studio</strong> account. Confirm this address to
        finish the update and restore cloud-save access.
      </p>
      <p style={{ margin: "0 0 22px" }}>
        <a href={verifyUrl} style={buttonStyle}>
          Confirm new email
        </a>
      </p>
      <p style={{ margin: "0 0 8px", color: "#64748b", fontSize: 13 }}>Or paste this link into your browser:</p>
      <p style={{ margin: "0 0 16px", fontSize: 13, wordBreak: "break-all" }}>
        <a href={verifyUrl} style={{ color: "#2563eb" }}>
          {verifyUrl}
        </a>
      </p>
      <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
        If you did not request this change, sign in and update your password right away.
      </p>
    </EmailShell>
  );
  return { subject, html, text };
}

export function renderPasswordResetTemplate({ name, resetUrl }: PasswordResetProps): RenderedEmail {
  const subject = "Reset your password · 3D Box Studio";
  const text = `${greeting(name)}\n\nReset your 3D Box Studio password:\n${resetUrl}\n\nThis link expires in 1 hour.`;
  const html = renderDocument(
    <EmailShell eyebrow="Account Security" title="Reset your password">
      <p style={{ margin: "0 0 14px" }}>{greeting(name)}</p>
      <p style={{ margin: "0 0 16px" }}>
        We received a request to reset the password for your <strong>3D Box Studio</strong> account. Use the button
        below to choose a new password.
      </p>
      <p style={{ margin: "0 0 22px" }}>
        <a href={resetUrl} style={buttonStyle}>
          Reset password
        </a>
      </p>
      <p style={{ margin: "0 0 8px", color: "#64748b", fontSize: 13 }}>Or paste this link into your browser:</p>
      <p style={{ margin: "0 0 16px", fontSize: 13, wordBreak: "break-all" }}>
        <a href={resetUrl} style={{ color: "#2563eb" }}>
          {resetUrl}
        </a>
      </p>
      <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
        This link expires in 1 hour. If you did not request a password reset, you can ignore this email.
      </p>
    </EmailShell>
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
  const html = renderDocument(
    <EmailShell eyebrow="Admin Notification" title="New registration">
      <p style={{ margin: "0 0 16px" }}>A new account was created on <strong>3D Box Studio</strong>.</p>
      <table style={infoTableStyle}>
        <tbody>
          <tr>
            <td style={labelCellStyle}>Name</td>
            <td style={valueCellStyle}>{name ?? "—"}</td>
          </tr>
          <tr>
            <td style={labelCellStyle}>Email</td>
            <td style={valueCellStyle}>
              <a href={`mailto:${email}`} style={{ color: "#2563eb" }}>
                {email}
              </a>
            </td>
          </tr>
          <tr>
            <td style={labelCellStyle}>User ID</td>
            <td style={{ ...valueCellStyle, fontFamily: 'ui-monospace, "SFMono-Regular", Menlo, monospace' }}>{id}</td>
          </tr>
          <tr>
            <td style={labelCellStyle}>Created</td>
            <td style={valueCellStyle}>{createdAt}</td>
          </tr>
          {attributionSummary ? (
            <tr>
              <td style={labelCellStyle}>Traffic</td>
              <td style={valueCellStyle}>{attributionSummary}</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </EmailShell>
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
  const html = renderDocument(
    <EmailShell eyebrow="Admin Notification" title="New contact message">
      <p style={{ margin: "0 0 16px" }}>
        A visitor sent a new message through the <strong>3D Box Studio</strong> contact form.
      </p>
      <table style={infoTableStyle}>
        <tbody>
          <tr>
            <td style={labelCellStyle}>Name</td>
            <td style={valueCellStyle}>{name ?? "—"}</td>
          </tr>
          <tr>
            <td style={labelCellStyle}>Email</td>
            <td style={valueCellStyle}>
              <a href={`mailto:${email}`} style={{ color: "#2563eb" }}>
                {email}
              </a>
            </td>
          </tr>
          <tr>
            <td style={labelCellStyle}>Topic</td>
            <td style={valueCellStyle}>{topic ?? "—"}</td>
          </tr>
          <tr>
            <td style={labelCellStyle}>Subject</td>
            <td style={valueCellStyle}>{subject ?? "—"}</td>
          </tr>
          <tr>
            <td style={labelCellStyle}>Locale</td>
            <td style={valueCellStyle}>{locale ?? "—"}</td>
          </tr>
          <tr>
            <td style={labelCellStyle}>Page</td>
            <td style={valueCellStyle}>{pagePath ?? "—"}</td>
          </tr>
          <tr>
            <td style={labelCellStyle}>Referrer</td>
            <td style={valueCellStyle}>{referrer ?? "—"}</td>
          </tr>
          <tr>
            <td style={labelCellStyle}>Submitted</td>
            <td style={valueCellStyle}>{submittedAt}</td>
          </tr>
          <tr>
            <td style={labelCellStyle}>Submission ID</td>
            <td style={{ ...valueCellStyle, fontFamily: 'ui-monospace, "SFMono-Regular", Menlo, monospace' }}>{id}</td>
          </tr>
        </tbody>
      </table>
      <div
        style={{
          marginTop: 20,
          padding: 18,
          borderRadius: 14,
          backgroundColor: "#f8fafc",
          border: "1px solid #e2e8f0",
          whiteSpace: "pre-wrap",
        }}
      >
        {message ?? "—"}
      </div>
    </EmailShell>
  );
  return { subject: subjectLine, html, text };
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
  ];
}
