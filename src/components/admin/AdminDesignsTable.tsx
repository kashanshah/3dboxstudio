import Link from "next/link";
import type { AdminDesignRow } from "@/server/admin/types";
import { studioSharePath, studioPreviewPath } from "@/lib/shareUrl";
import { formatAdminDateTime } from "@/lib/adminTimeZone";
import {
  designsListHref,
  designsQueryIsFiltered,
  nextDesignSortDir,
  resultRange,
  type AdminDesignsQuery,
  type DesignFilter,
  type DesignSort,
} from "@/lib/adminListQuery";
import AdminListToolbar from "./AdminListToolbar";
import AdminSortHeader from "./AdminSortHeader";

type AdminDesignsTableProps = {
  designs: AdminDesignRow[];
  page: number;
  pageSize: number;
  totalPages: number;
  total: number;
  query: AdminDesignsQuery;
};

const FILTERS: { value: DesignFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "owned", label: "User-owned" },
  { value: "anonymous", label: "Anonymous" },
  { value: "expired", label: "Expired" },
];

export default function AdminDesignsTable({
  designs,
  page,
  pageSize,
  totalPages,
  total,
  query,
}: AdminDesignsTableProps) {
  const range = resultRange(page, pageSize, total);
  const filtered = designsQueryIsFiltered(query);

  function sortHref(column: DesignSort) {
    return designsListHref({
      ...query,
      page: 1,
      sort: column,
      dir: nextDesignSortDir(query, column),
    });
  }

  const hidden = [
    ...(query.filter !== "all" ? [{ name: "filter", value: query.filter }] : []),
    ...(query.sort !== "created" ? [{ name: "sort", value: query.sort }] : []),
    ...(query.sort !== "created" || query.dir !== "desc" ? [{ name: "dir", value: query.dir }] : []),
  ];

  return (
    <>
      <div className="admin-toolbar-stack">
        <AdminListToolbar
          key={`${query.search ?? ""}|${query.filter}|${query.sort}|${query.dir}`}
          action="/admin/designs"
          search={query.search}
          searchPlaceholder="Search by name, id, or owner email…"
          searchAriaLabel="Search designs"
          hidden={hidden}
          clearHref={filtered ? designsListHref({ sort: query.sort, dir: query.dir }) : null}
        />

        <div className="admin-filter-tabs" role="tablist" aria-label="Design filters">
          {FILTERS.map((f) => (
            <Link
              key={f.value}
              className="admin-filter-tab"
              href={designsListHref({ ...query, page: 1, filter: f.value })}
              aria-current={query.filter === f.value ? "true" : undefined}
            >
              {f.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="admin-panel">
        <div className="admin-panel-header">
          <h2>Designs</h2>
          <p className="admin-panel-meta">
            {total === 0
              ? "No matching designs"
              : `Showing ${range.from.toLocaleString()}–${range.to.toLocaleString()} of ${total.toLocaleString()}`}
          </p>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Preview</th>
                <AdminSortHeader
                  label="Name"
                  href={sortHref("name")}
                  active={query.sort === "name"}
                  dir={query.dir}
                />
                <AdminSortHeader
                  label="Owner"
                  href={sortHref("owner")}
                  active={query.sort === "owner"}
                  dir={query.dir}
                />
                <AdminSortHeader
                  label="Views"
                  href={sortHref("views")}
                  active={query.sort === "views"}
                  dir={query.dir}
                  numeric
                />
                <AdminSortHeader
                  label="Images"
                  href={sortHref("images")}
                  active={query.sort === "images"}
                  dir={query.dir}
                  numeric
                />
                <AdminSortHeader
                  label="Status"
                  href={sortHref("status")}
                  active={query.sort === "status"}
                  dir={query.dir}
                />
                <AdminSortHeader
                  label="Created"
                  href={sortHref("created")}
                  active={query.sort === "created"}
                  dir={query.dir}
                />
                <th>Links</th>
              </tr>
            </thead>
            <tbody>
              {designs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="admin-empty">
                    No designs found.
                  </td>
                </tr>
              ) : (
                designs.map((design) => (
                  <tr key={design.id}>
                    <td>
                      <a
                        className="admin-design-thumb"
                        href={studioSharePath(design.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Open ${design.name ?? "Untitled"} in studio`}
                      >
                        {design.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={design.thumbnailUrl} alt="" loading="lazy" />
                        ) : (
                          <span className="admin-design-thumb-empty" aria-hidden>
                            3D
                          </span>
                        )}
                      </a>
                    </td>
                    <td>
                      <div>{design.name ?? "Untitled"}</div>
                      <div className="admin-mono admin-muted">{design.id}</div>
                    </td>
                    <td>
                      {design.ownerEmail ? (
                        <>
                          <div>{design.ownerEmail}</div>
                          {design.ownerName ? (
                            <div className="admin-muted admin-sub">{design.ownerName}</div>
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
                    <td>{formatAdminDateTime(design.createdAt)}</td>
                    <td>
                      <div className="admin-link-stack">
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
              {page > 1 ? <Link href={designsListHref({ ...query, page: page - 1 })}>Previous</Link> : null}
              <span aria-current="page">{page}</span>
              {page < totalPages ? <Link href={designsListHref({ ...query, page: page + 1 })}>Next</Link> : null}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
