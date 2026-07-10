import Link from "next/link";
import type { AdminUserRow } from "@/server/admin/types";

type AdminUsersTableProps = {
  users: AdminUserRow[];
  page: number;
  totalPages: number;
  total: number;
  search?: string;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function pageHref(page: number, search?: string): string {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/admin/users?${qs}` : "/admin/users";
}

export default function AdminUsersTable({ users, page, totalPages, total, search }: AdminUsersTableProps) {
  return (
    <>
      <form className="admin-toolbar" method="get">
        <input
          type="search"
          name="search"
          placeholder="Search by email or name…"
          defaultValue={search ?? ""}
          aria-label="Search users"
        />
        <button className="admin-btn" type="submit">
          Search
        </button>
      </form>

      <div className="admin-panel">
        <div className="admin-panel-header">
          <h2>Users ({total.toLocaleString()})</h2>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Verified</th>
                <th>Designs</th>
                <th>Views</th>
                <th>Signed up</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ color: "var(--muted)" }}>
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.email}</td>
                    <td>{user.name ?? "—"}</td>
                    <td>
                      <span className={`admin-badge ${user.emailVerified ? "admin-badge--ok" : "admin-badge--warn"}`}>
                        {user.emailVerified ? "Verified" : "Pending"}
                      </span>
                    </td>
                    <td className="num">
                      <Link className="admin-link" href={`/admin/designs?search=${encodeURIComponent(user.email)}`}>
                        {user.designCount}
                      </Link>
                    </td>
                    <td className="num">{user.totalViews.toLocaleString()}</td>
                    <td>{formatDate(user.createdAt)}</td>
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
              {page > 1 ? <Link href={pageHref(page - 1, search)}>Previous</Link> : null}
              <span aria-current="page">{page}</span>
              {page < totalPages ? <Link href={pageHref(page + 1, search)}>Next</Link> : null}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
