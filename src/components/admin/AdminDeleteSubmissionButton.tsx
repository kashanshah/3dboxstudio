"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminSubmissionRow } from "@/server/admin/types";
import AdminModal from "./AdminModal";

type AdminDeleteSubmissionButtonProps = {
  submission: AdminSubmissionRow;
};

export default function AdminDeleteSubmissionButton({ submission }: AdminDeleteSubmissionButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    setDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/contacts/${submission.id}`, {
        method: "DELETE",
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(body.error ?? "Could not delete submission.");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Could not delete submission.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <button type="button" className="admin-btn admin-btn--danger admin-btn--small" onClick={() => setOpen(true)}>
        Delete
      </button>

      <AdminModal
        open={open}
        onClose={() => {
          if (deleting) return;
          setOpen(false);
          setError(null);
        }}
        eyebrow="Delete submission"
        title="Delete this contact message?"
        closeLabel="Close delete confirmation"
        width={520}
      >
        <div className="admin-delete-dialog">
          {error ? <p className="admin-error">{error}</p> : null}
          <p>
            Delete the submission from <strong>{submission.email}</strong>?
          </p>
          <p className="admin-muted">
            This permanently removes the submission record. Any stored reply history linked to it will also be removed.
          </p>
          <p className="admin-muted admin-mono">{submission.id}</p>

          <div className="admin-delete-actions">
            <button type="button" className="admin-btn admin-btn--danger" onClick={onDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete submission"}
            </button>
            <button
              type="button"
              className="admin-btn admin-btn--ghost"
              disabled={deleting}
              onClick={() => {
                setOpen(false);
                setError(null);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </AdminModal>
    </>
  );
}
