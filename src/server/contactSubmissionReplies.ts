import { customAlphabet } from "nanoid";
import { normalizeEmail } from "./auth/users";
import { getSql } from "./db";
import type { ContactSubmissionStatus } from "./contactSubmissions";
import type { AdminSubmissionReplyRow } from "./admin/types";

const createReplyId = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 18);

export type ContactSubmissionReplyRecord = {
  id: string;
  submissionId: string;
  toEmail: string;
  fromEmail: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  createdAt: string;
};

export type ContactSubmissionReplyTarget = {
  id: string;
  kind: "contact_message" | "newsletter_subscription";
  status: ContactSubmissionStatus;
  name: string | null;
  email: string;
  topic: string | null;
  subject: string | null;
  message: string | null;
  locale: string | null;
  pagePath: string | null;
  referrer: string | null;
  createdAt: string;
};

export async function getContactSubmissionReplyTarget(id: string): Promise<ContactSubmissionReplyTarget | null> {
  const sql = getSql();
  const rows = (await sql`
    SELECT
      cs.id,
      cs.kind,
      cs.status,
      cs.name,
      cs.email,
      cs.topic,
      cs.subject,
      cs.message,
      cs.locale,
      cs.page_path,
      cs.referrer,
      cs.created_at
    FROM contact_submissions cs
    WHERE cs.id = ${id}
    LIMIT 1
  `) as {
    id: string;
    kind: "contact_message" | "newsletter_subscription";
    status: ContactSubmissionStatus;
    name: string | null;
    email: string;
    topic: string | null;
    subject: string | null;
    message: string | null;
    locale: string | null;
    page_path: string | null;
    referrer: string | null;
    created_at: string;
  }[];

  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    kind: row.kind,
    status: row.status,
    name: row.name,
    email: row.email,
    topic: row.topic,
    subject: row.subject,
    message: row.message,
    locale: row.locale,
    pagePath: row.page_path,
    referrer: row.referrer,
    createdAt: row.created_at,
  };
}

export async function createContactSubmissionReply(input: {
  submissionId: string;
  toEmail: string;
  fromEmail: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
}): Promise<ContactSubmissionReplyRecord> {
  const sql = getSql();
  const id = createReplyId();
  const rows = (await sql`
    INSERT INTO contact_submission_replies (
      id,
      submission_id,
      to_email,
      from_email,
      subject,
      body_html,
      body_text
    )
    VALUES (
      ${id},
      ${input.submissionId},
      ${normalizeEmail(input.toEmail)},
      ${normalizeEmail(input.fromEmail)},
      ${input.subject},
      ${input.bodyHtml},
      ${input.bodyText}
    )
    RETURNING created_at
  `) as { created_at: string }[];

  await sql`
    UPDATE contact_submissions
    SET status = 'reviewed', updated_at = NOW()
    WHERE id = ${input.submissionId}
  `;

  return {
    id,
    submissionId: input.submissionId,
    toEmail: normalizeEmail(input.toEmail),
    fromEmail: normalizeEmail(input.fromEmail),
    subject: input.subject,
    bodyHtml: input.bodyHtml,
    bodyText: input.bodyText,
    createdAt: rows[0]?.created_at ?? new Date().toISOString(),
  };
}

export async function listContactSubmissionReplies(submissionId: string): Promise<AdminSubmissionReplyRow[]> {
  const sql = getSql();
  const rows = (await sql`
    SELECT
      id,
      submission_id,
      to_email,
      from_email,
      subject,
      body_html,
      body_text,
      created_at
    FROM contact_submission_replies
    WHERE submission_id = ${submissionId}
    ORDER BY created_at DESC
  `) as {
    id: string;
    submission_id: string;
    to_email: string;
    from_email: string;
    subject: string;
    body_html: string;
    body_text: string;
    created_at: string;
  }[];

  return rows.map((row) => ({
    id: row.id,
    submissionId: row.submission_id,
    toEmail: row.to_email,
    fromEmail: row.from_email,
    subject: row.subject,
    bodyHtml: row.body_html,
    bodyText: row.body_text,
    createdAt: row.created_at,
  }));
}
