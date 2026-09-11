"use client";

import { useEffect, useState } from "react";
import type { AdminDesignRow, PaginatedResult } from "@/server/admin/types";
import { formatAdminDateTime } from "@/lib/adminTimeZone";
import { studioPreviewPath } from "@/lib/shareUrl";
import AdminModal from "./AdminModal";

type AdminUserDesignsButtonProps = {
  userId: string;
  userEmail: string;
  userName: string | null;
  designCount: number;
};

export default function AdminUserDesignsButton({
  userId,
  userEmail,
  userName,
  designCount,
}: AdminUserDesignsButtonProps) {
  const [open, setOpen] = useState(false);
  const [designs, setDesigns] = useState<AdminDesignRow[]>([]);
  const [total, setTotal] = useState(designCount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    let active = true;
    setLoading(true);
    setError(null);

    fetch(`/api/admin/users/${encodeURIComponent(userId)}/designs?pageSize=100`, {
      cache: "no-store",
    })
      .then(async (res) => {
        const body = (await res.json().catch(() => ({}))) as PaginatedResult<AdminDesignRow> & {
          error?: string;
        };
        if (!res.ok) {
          throw new Error(body.error ?? "Could not load designs.");
        }
        if (!active) return;
        setDesigns(body.items ?? []);
        setTotal(body.total ?? designCount);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Could not load designs.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, userId, designCount]);

  return (
    <>
      <button
        type="button"
        className="admin-link admin-designs-count-btn"
        onClick={() => setOpen(true)}
        title={`View designs for ${userEmail}`}
      >
        {designCount.toLocaleString()}
      </button>

      <AdminModal
        open={open}
        onClose={() => setOpen(false)}
        eyebrow="User designs"
        title={userName?.trim() || userEmail}
        closeLabel="Close user designs"
        width={720}
      >
        <div className="admin-user-designs">
          <p className="admin-user-designs-meta">
            {userEmail}
            {" · "}
            {total.toLocaleString()} design{total === 1 ? "" : "s"}
          </p>

          {loading ? <p className="admin-muted">Loading designs…</p> : null}
          {error ? <p className="admin-error">{error}</p> : null}

          {!loading && !error && designs.length === 0 ? (
            <p className="admin-muted">This user has no saved designs.</p>
          ) : null}

          {!loading && !error && designs.length > 0 ? (
            <ul className="admin-user-designs-list">
              {designs.map((design) => (
                <li key={design.id}>
                  <div className="admin-user-designs-preview">
                    {design.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={design.thumbnailUrl} alt="" loading="lazy" />
                    ) : (
                      <span aria-hidden>3D</span>
                    )}
                  </div>
                  <div className="admin-user-designs-copy">
                    <div className="admin-user-designs-name">{design.name ?? "Untitled"}</div>
                    <div className="admin-mono admin-muted">{design.id}</div>
                    <div className="admin-muted admin-sub">
                      {formatAdminDateTime(design.createdAt)}
                      {" · "}
                      {design.viewCount.toLocaleString()} view{design.viewCount === 1 ? "" : "s"}
                      {design.isExpired ? " · Expired" : ""}
                    </div>
                  </div>
                  <div className="admin-user-designs-actions">
                    {design.previewToken ? (
                      <a
                        className="admin-link"
                        href={studioPreviewPath(design.previewToken)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Preview
                      </a>
                    ) : (
                      <span className="admin-muted">No preview</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          {!loading && !error && total > designs.length ? (
            <p className="admin-muted admin-user-designs-more">
              Showing {designs.length.toLocaleString()} of {total.toLocaleString()} designs.
            </p>
          ) : null}
        </div>
      </AdminModal>
    </>
  );
}
