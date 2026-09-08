"use client";

import { useId, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { AdminSubmissionRow } from "@/server/admin/types";
import AdminModal from "./AdminModal";
import AdminRichTextEditor from "./AdminRichTextEditor";

type AdminContactReplyComposerProps = {
  submission: AdminSubmissionRow;
};

function defaultSubject(submission: AdminSubmissionRow): string {
  const base = submission.subject?.trim() || submission.topic?.trim() || "Your message to 3D Box Studio";
  return /^re:/i.test(base) ? base : `Re: ${base}`;
}

function defaultBody(submission: AdminSubmissionRow): string {
  const greeting = submission.name?.trim() ? `Hi ${submission.name.trim()},` : "Hi,";
  return `<p>${greeting}</p><p></p><p>Best regards,<br />3D Box Studio</p>`;
}

export default function AdminContactReplyComposer({ submission }: AdminContactReplyComposerProps) {
  const router = useRouter();
  const editorId = useId();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState(() => defaultSubject(submission));
  const [html, setHtml] = useState(() => defaultBody(submission));
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const referenceLine = useMemo(
    () => [submission.topic, submission.subject].filter(Boolean).join(" / ") || "Original message",
    [submission.subject, submission.topic],
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/admin/contacts/${submission.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, html }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        fromEmail?: string;
      };

      if (!res.ok) {
        setError(body.error ?? "Could not send reply.");
        return;
      }

      setSuccess(body.fromEmail ? `Reply sent from ${body.fromEmail}.` : "Reply sent.");
      setOpen(false);
      router.refresh();
    } catch {
      setError("Could not send reply.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="admin-reply-box">
      <button
        type="button"
        className="admin-btn admin-btn--ghost admin-btn--small"
        onClick={() => {
          setOpen(true);
          setError(null);
          setSuccess(null);
        }}
      >
        Reply
      </button>

      {success ? <p className="admin-success admin-reply-feedback">{success}</p> : null}

      {open ? (
        <AdminModal
          open={open}
          onClose={() => setOpen(false)}
          eyebrow="Reply to contact message"
          title={`Reply to ${submission.email}`}
          closeLabel="Close reply modal"
        >
          <form className="admin-reply-form" onSubmit={onSubmit}>
            {error ? <p className="admin-error admin-reply-feedback">{error}</p> : null}

            <p className="admin-muted admin-reply-reference">
              Replying to <strong>{submission.email}</strong> about {referenceLine}.
            </p>

            <div className="admin-reply-reference-card">
              <div className="admin-reply-reference-meta">
                <strong>Original message</strong>
                <span>{submission.id}</span>
              </div>
              {submission.message ? <div className="admin-message-preview">{submission.message}</div> : "—"}
            </div>

            <label className="admin-settings-field" htmlFor={`${editorId}-subject`}>
              <span>Subject</span>
              <input
                id={`${editorId}-subject`}
                type="text"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                maxLength={200}
                placeholder="Re: Your message"
                required
              />
            </label>

            <AdminRichTextEditor
              id={`${editorId}-body`}
              label="Reply"
              value={html}
              onChange={setHtml}
              placeholder="Write your reply. You can add headings, bold text, lists, links, and line breaks."
            />

            <div className="admin-reply-actions">
              <button className="admin-btn" type="submit" disabled={sending}>
                {sending ? "Sending..." : "Send reply"}
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--ghost"
                disabled={sending}
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <p className="admin-muted">
                The email includes a reference to the original message and sends to {submission.email}.
              </p>
            </div>
          </form>
        </AdminModal>
      ) : null}
    </div>
  );
}
