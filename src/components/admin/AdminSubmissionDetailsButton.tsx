"use client";

import { useEffect, useState } from "react";
import type { AdminSubmissionReplyRow, AdminSubmissionRow } from "@/server/admin/types";
import { formatAdminDateTime } from "@/lib/adminTimeZone";
import AdminModal from "./AdminModal";

type AdminSubmissionDetailsButtonProps = {
  submission: AdminSubmissionRow;
};

function labelOrDash(value: string | null): string {
  return value?.trim() || "—";
}

export default function AdminSubmissionDetailsButton({ submission }: AdminSubmissionDetailsButtonProps) {
  const [open, setOpen] = useState(false);
  const [replies, setReplies] = useState<AdminSubmissionReplyRow[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [repliesError, setRepliesError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || submission.kind !== "contact_message") return;

    let active = true;
    setLoadingReplies(true);
    setRepliesError(null);

    fetch(`/api/admin/contacts/${submission.id}/replies`, { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
          replies?: AdminSubmissionReplyRow[];
        };
        if (!res.ok) {
          throw new Error(body.error ?? "Could not load replies.");
        }
        if (!active) return;
        setReplies(body.replies ?? []);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setRepliesError(error instanceof Error ? error.message : "Could not load replies.");
      })
      .finally(() => {
        if (active) setLoadingReplies(false);
      });

    return () => {
      active = false;
    };
  }, [open, submission.id, submission.kind]);

  return (
    <>
      <button type="button" className="admin-btn admin-btn--ghost admin-btn--small" onClick={() => setOpen(true)}>
        View details
      </button>

      <AdminModal
        open={open}
        onClose={() => setOpen(false)}
        eyebrow={submission.kind === "newsletter_subscription" ? "Newsletter submission" : "Contact submission"}
        title={submission.subject?.trim() || submission.topic?.trim() || submission.email}
        closeLabel="Close submission details"
        width={760}
      >
        <div className="admin-submission-details">
          <div className="admin-submission-grid">
            <div>
              <span className="admin-submission-label">Email</span>
              <p>{submission.email}</p>
            </div>
            <div>
              <span className="admin-submission-label">Name</span>
              <p>{labelOrDash(submission.name)}</p>
            </div>
            <div>
              <span className="admin-submission-label">Type</span>
              <p>{submission.kind === "newsletter_subscription" ? "Newsletter subscription" : "Contact message"}</p>
            </div>
            <div>
              <span className="admin-submission-label">Status</span>
              <p>{submission.status}</p>
            </div>
            <div>
              <span className="admin-submission-label">Topic</span>
              <p>{labelOrDash(submission.topic)}</p>
            </div>
            <div>
              <span className="admin-submission-label">Subject</span>
              <p>{labelOrDash(submission.subject)}</p>
            </div>
            <div>
              <span className="admin-submission-label">Locale</span>
              <p>{labelOrDash(submission.locale)}</p>
            </div>
            <div>
              <span className="admin-submission-label">Page</span>
              <p>{labelOrDash(submission.pagePath)}</p>
            </div>
            <div>
              <span className="admin-submission-label">Created</span>
              <p>{formatAdminDateTime(submission.createdAt)}</p>
            </div>
            <div>
              <span className="admin-submission-label">Updated</span>
              <p>{formatAdminDateTime(submission.updatedAt)}</p>
            </div>
            <div className="admin-submission-grid-span">
              <span className="admin-submission-label">Referrer</span>
              <p className="admin-submission-break">{labelOrDash(submission.referrer)}</p>
            </div>
            <div className="admin-submission-grid-span">
              <span className="admin-submission-label">User agent</span>
              <p className="admin-submission-break">{labelOrDash(submission.userAgent)}</p>
            </div>
            <div className="admin-submission-grid-span">
              <span className="admin-submission-label">IP address</span>
              <p>{labelOrDash(submission.ipAddress)}</p>
            </div>
            <div className="admin-submission-grid-span">
              <span className="admin-submission-label">Submission ID</span>
              <p className="admin-mono">{submission.id}</p>
            </div>
          </div>

          <div className="admin-submission-message-card">
            <span className="admin-submission-label">Message</span>
            <div className="admin-submission-message">{labelOrDash(submission.message)}</div>
          </div>

          {submission.kind === "contact_message" ? (
            <div className="admin-submission-replies-card">
              <div className="admin-submission-replies-header">
                <span className="admin-submission-label">Reply history</span>
                {loadingReplies ? <span className="admin-muted">Loading…</span> : null}
              </div>

              {repliesError ? <p className="admin-error">{repliesError}</p> : null}

              {!loadingReplies && !repliesError && replies.length === 0 ? (
                <p className="admin-muted">No replies have been sent for this submission yet.</p>
              ) : null}

              {replies.length > 0 ? (
                <div className="admin-submission-replies-list">
                  {replies.map((reply) => (
                    <article key={reply.id} className="admin-submission-reply-item">
                      <div className="admin-submission-reply-meta">
                        <div>
                          <strong>{reply.subject}</strong>
                          <div className="admin-muted">
                            Sent {formatAdminDateTime(reply.createdAt)} from {reply.fromEmail} to {reply.toEmail}
                          </div>
                        </div>
                        <span className="admin-mono">{reply.id}</span>
                      </div>

                      <div
                        className="admin-submission-reply-html"
                        dangerouslySetInnerHTML={{ __html: reply.bodyHtml }}
                      />
                    </article>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </AdminModal>
    </>
  );
}
