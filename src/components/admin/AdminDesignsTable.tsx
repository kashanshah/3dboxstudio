import Link from "next/link";
import type { AdminDesignRow } from "@/server/admin/types";
import { studioSharePath, studioPreviewPath } from "@/lib/shareUrl";

type DesignFilter = "all" | "owned" | "anonymous" | "expired";

type AdminDesignsTableProps = {
  designs: AdminDesignRow[];
  page: number;
  totalPages: number;
  total: number;
  search?: string;
  filter: DesignFilter;
};

const FILTERS: { value: DesignFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "owned", label: "User-owned" },
  { value: "anonymous", label: "Anonymous" },
  { value: "expired", label: "Expired" },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function listHref(options: { page?: number; search?: string; filter: DesignFilter }): string {
  const params = new URLSearchParams();
  if (options.search) params.set("search", options.search);
  if (options.filter !== "all") params.set("filter", options.filter);
  if (options.page && options.page > 1) params.set("page", String(options.page));
  const qs = params.toString();
  return qs ? `/admin/designs?${qs}` : "/admin/designs";
}

export default function AdminDesignsTable({
  designs,
  page,
  totalPages,
  total,
  search,
  filter,
}: AdminDesignsTableProps) {
  return (
    <>
      <div className="admin-toolbar">
        <form method="get" style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap" }}>
          <input type="hidden" name="filter" value={filter} />
          <input
            type="search"
            name="search"
            placeholder="Search by name, id, or owner email…"
            defaultValue={search ?? ""}
            aria-label="Search designs"
          />
          <button className="admin-btn" type="submit">
            Search
          </button>
        </form>

        <div className="admin-filter-tabs" role="tablist" aria-label="Design filters">
          {FILTERS.map((f) => (
            <Link
              key={f.value}
              className="admin-filter-tab"
              href={listHref({ search, filter: f.value })}
              aria-current={filter === f.value ? "true" : undefined}
            >
              {f.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="admin-panel">
        <div className="admin-panel-header">
          <h2>Designs ({total.toLocaleString()})</h2>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Owner</th>
                <th>Views</th>
                <th>Images</th>
                <th>Status</th>
                <th>Created</th>
                <th>Links</th>
              </tr>
            </thead>
            <tbody>
              {designs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ color: "var(--muted)" }}>
                    No designs found.
                  </td>
                </tr>
              ) : (
                designs.map((design) => (
                  <tr key={design.id}>
                    <td>
                      <div>{design.name ?? "Untitled"}</div>
                      <div className="admin-mono" style={{ color: "var(--muted)", marginTop: "0.2rem" }}>
                        {design.id}
                      </div>
                    </td>
                    <td>
                      {design.ownerEmail ? (
                        <>
                          <div>{design.ownerEmail}</div>
                          {design.ownerName ? (
                            <div style={{ color: "var(--muted)", fontSize: "0.8rem" }}>{design.ownerName}</div>
                          ) : null}
                        </>
                      ) : (
                        <span className="admin-badge admin-badge--muted">Anonymous</span>
                      )}
                    </td>
                    <td className="num">{design.viewCount.toLocaleString()}</td>
                    <td className="num">
                      {design.faceImageCount}
                      {design.hasOgImage ? " + OG" : ""}
                    </td>
                    <td>
                      {design.isExpired ? (
                        <span className="admin-badge admin-badge--warn">Expired</span>
                      ) : design.isAnonymous ? (
                        <span className="admin-badge admin-badge--muted">Anonymous</span>
                      ) : (
                        <span className="admin-badge admin-badge--ok">Active</span>
                      )}
                    </td>
                    <td>{formatDate(design.createdAt)}</td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <a className="admin-link" href={studioSharePath(design.id)} target="_blank" rel="noopener noreferrer">
                          Studio
                        </a>
                        {design.previewToken ? (
                          <a
                            className="admin-link"
                            href={studioPreviewPath(design.previewToken)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Preview
                          </a>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 ? (
          <div className="admin-pagination">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="admin-pagination-links">
              {page > 1 ? <Link href={listHref({ page: page - 1, search, filter })}>Previous</Link> : null}
              <span aria-current="page">{page}</span>
              {page < totalPages ? <Link href={listHref({ page: page + 1, search, filter })}>Next</Link> : null}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
