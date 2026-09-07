import { customAlphabet } from "nanoid";
import { getSql } from "./db";
import { normalizeEmail } from "./auth/users";

export const CONTACT_SUBMISSION_KINDS = ["contact_message", "newsletter_subscription"] as const;
export type ContactSubmissionKind = (typeof CONTACT_SUBMISSION_KINDS)[number];

export const CONTACT_SUBMISSION_STATUSES = ["new", "reviewed", "archived"] as const;
export type ContactSubmissionStatus = (typeof CONTACT_SUBMISSION_STATUSES)[number];

export type CreateContactSubmissionInput = {
  kind: ContactSubmissionKind;
  source: string;
  status?: ContactSubmissionStatus;
  email: string;
  name?: string | null;
  topic?: string | null;
  subject?: string | null;
  message?: string | null;
  locale?: string | null;
  pagePath?: string | null;
  referrer?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  payload?: Record<string, unknown>;
};

const createSubmissionId = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 18);

export async function createContactSubmission(input: CreateContactSubmissionInput): Promise<{ id: string; createdAt: string }> {
  const sql = getSql();
  const id = createSubmissionId();
  const rows = (await sql`
    INSERT INTO contact_submissions (
      id,
      kind,
      source,
      status,
      email,
      name,
      topic,
      subject,
      message,
      locale,
      page_path,
      referrer,
      ip_address,
      user_agent,
      payload
    )
    VALUES (
      ${id},
      ${input.kind},
      ${input.source},
      ${input.status ?? "new"},
      ${normalizeEmail(input.email)},
      ${input.name ?? null},
      ${input.topic ?? null},
      ${input.subject ?? null},
      ${input.message ?? null},
      ${input.locale ?? null},
      ${input.pagePath ?? null},
      ${input.referrer ?? null},
      ${input.ipAddress ?? null},
      ${input.userAgent ?? null},
      ${JSON.stringify(input.payload ?? {})}::jsonb
    )
    RETURNING created_at
  `) as { created_at: string }[];
  return { id, createdAt: rows[0]?.created_at ?? new Date().toISOString() };
}
