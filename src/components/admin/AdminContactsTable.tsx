import Link from "next/link";
import type { AdminSubmissionRow } from "@/server/admin/types";
import { formatAdminDateTime } from "@/lib/adminTimeZone";
import {
  nextSubmissionSortDir,
  resultRange,
  submissionsListHref,
  submissionsQueryIsFiltered,
  type AdminSubmissionsQuery,
  type SubmissionSort,
} from "@/lib/adminListQuery";
import AdminListToolbar from "./AdminListToolbar";
import AdminSortHeader from "./AdminSortHeader";

type AdminContactsTableProps = {
  submissions: AdminSubmissionRow[];
  page: number;
  pageSize: number;
  totalPages: number;
  total: number;
  query: AdminSubmissionsQuery;
};

function kindLabel(kind: AdminSubmissionRow["kind"]): string {
  if (kind === "newsletter_subscription") return "Newsletter";
  return "Contact";
}

export default function AdminContactsTable({
  submissions,
  page,
  pageSize,
  totalPages,
  total,
  query,
}: AdminContactsTableProps) {
  const range = resultRange(page, pageSize, total);
  const filtered = submissionsQueryIsFiltered(query);

  function sortHref(column: SubmissionSort) {
    return submissionsListHref({
      ...query,
      page: 1,
      sort: column,
      dir: nextSubmissionSortDir(query, column),
    });
  }

  const hidden = [
    ...(query.sort !== "created" ? [{ name: "sort", value: query.sort }] : []),
    ...(query.sort !== "created" || query.dir !== "desc" ? [{ name: "dir", value: query.dir }] : []),
  ];

  return (
    <>
      <AdminListToolbar
        key={`${query.search ?? ""}|${query.kind}|${query.status}|${query.sort}|${query.dir}`}
        action="/admin/contacts"
        search={query.search}
        searchPlaceholder="Search email, name, topic, subject, or message…"
        searchAriaLabel="Search submissions"
        hidden={hidden}
        filters={[
          {
            name: "kind",
            label: "Type",
            value: query.kind,
            options: [
              { value: "all", label: "All types" },
              { value: "contact_message", label: "Contact messages" },
              { value: "newsletter_subscription", label: "Newsletter subscriptions" },
            ],
          },
          {
            name: "status",
            label: "Status",
            value: query.status,
            options: [
              { value: "all", label: "All statuses" },
              { value: "new", label: "New" },
              { value: "reviewed", label: "Reviewed" },
              { value: "archived", label: "Archived" },
            ],
          },
        ]}
        clearHref={filtered ? submissionsListHref({ sort: query.sort, dir: query.dir }) : null}
      />

      <div className="admin-panel">
        <div className="admin-panel-header">
          <h2>Submissions</h2>
          <p className="admin-panel-meta">
            {total === 0
              ? "No matching submissions"
              : `Showing ${range.from.toLocaleString()}–${range.to.toLocaleString()} of ${total.toLocaleString()}`}
          </p>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Type</th>
                <AdminSortHeader label="Email" href={sortHref("email")} active={query.sort === "email"} dir={query.dir} />
                <th>Name</th>
                <AdminSortHeader label="Topic / Subject" href={sortHref("topic")} active={query.sort === "topic"} dir={query.dir} />
                <th>Message</th>
                <AdminSortHeader label="Status" href={sortHref("status")} active={query.sort === "status"} dir={query.dir} />
                <AdminSortHeader label="Created" href={sortHref("created")} active={query.sort === "created"} dir={query.dir} />
              </tr>
            </thead>
            <tbody>
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="admin-empty">
                    No submissions found.
                  </td>
                </tr>
              ) : (
                submissions.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span
                        className={`admin-badge ${
                          item.kind === "newsletter_subscription" ? "admin-badge--ok" : "admin-badge--muted"
                        }`}
                      >
                        {kindLabel(item.kind)}
                      </span>
                    </td>
                    <td>
                      <div>{item.email}</div>
                      <div className="admin-muted admin-mono">{item.id}</div>
                    </td>
                    <td>{item.name ?? "—"}</td>
                    <td>
                      <div>{item.topic ?? item.subject ?? "—"}</div>
                      {item.subject && item.topic && item.subject !== item.topic ? (
                        <div className="admin-muted admin-sub">{item.subject}</div>
                      ) : null}
                      {item.locale || item.pagePath ? (
                        <div className="admin-muted admin-sub">
                          {[item.locale, item.pagePath].filter(Boolean).join(" • ")}
                        </div>
                      ) : null}
                    </td>
                    <td>
                      {item.message ? <div className="admin-message-preview">{item.message}</div> : "—"}
                      {item.referrer ? <div className="admin-muted admin-sub">{item.referrer}</div> : null}
                    </td>
                    <td>
                      <span
                        className={`admin-badge ${
                          item.status === "new"
                            ? "admin-badge--warn"
                            : item.status === "reviewed"
                              ? "admin-badge--ok"
                              : "admin-badge--muted"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td>{formatAdminDateTime(item.createdAt)}</td>
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
              {page > 1 ? <Link href={submissionsListHref({ ...query, page: page - 1 })}>Previous</Link> : null}
              <span aria-current="page">{page}</span>
              {page < totalPages ? <Link href={submissionsListHref({ ...query, page: page + 1 })}>Next</Link> : null}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
