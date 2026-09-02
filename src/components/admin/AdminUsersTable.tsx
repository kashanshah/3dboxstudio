import Link from "next/link";
import type { AdminUserRow } from "@/server/admin/types";
import { formatStoredLandingDisplay } from "@/lib/landingClassification";
import { formatAdminDateTime } from "@/lib/adminTimeZone";

type AdminUsersTableProps = {
  users: AdminUserRow[];
  page: number;
  totalPages: number;
  total: number;
  search?: string;
};

function pageHref(page: number, search?: string): string {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/admin/users?${qs}` : "/admin/users";
}

function formatSourceLabel(user: AdminUserRow): string {
  if (user.utmSource) {
    const medium = user.utmMedium ? ` / ${user.utmMedium}` : "";
    return `${user.utmSource}${medium}`;
  }
  if (user.signupReferrer) return user.signupReferrer;
  return "—";
}

function formatFirstLanding(user: AdminUserRow): string {
  return formatStoredLandingDisplay(user.signupLandingType, user.signupLandingPage);
}

function formatConversionPage(user: AdminUserRow): string {
  if (!user.signupConversionPage) return "—";
  const classified = user.signupConversionPage;
  if (classified === "/studio" || classified.startsWith("/studio/")) return "Studio";
  return classified;
}

export default function AdminUsersTable({ users, page, totalPages, total, search }: AdminUsersTableProps) {
  return (
    <>
      <form className="admin-toolbar" method="get">
        <input
          type="search"
          name="search"
          placeholder="Search by email, name, UTM source, or campaign…"
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
                <th>First landed</th>
                <th>Converted on</th>
                <th>Traffic source</th>
                <th>Signup</th>
                <th>Verified</th>
                <th>Designs</th>
                <th>Views</th>
                <th>Signed up</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ color: "var(--muted)" }}>
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.email}</td>
                    <td>{user.name ?? "—"}</td>
                    <td title={user.signupLandingPage ?? undefined}>{formatFirstLanding(user)}</td>
                    <td title={user.signupConversionPage ?? undefined}>{formatConversionPage(user)}</td>
                    <td>{formatSourceLabel(user)}</td>
                    <td>{user.signupMethod ?? "—"}</td>
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
                    <td>{formatAdminDateTime(user.createdAt)}</td>
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
