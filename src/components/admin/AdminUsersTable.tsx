import Link from "next/link";
import type { AdminUserRow } from "@/server/admin/types";
import { formatStoredLandingDisplay } from "@/lib/landingClassification";
import { formatAdminDateTime } from "@/lib/adminTimeZone";
import {
  nextUserSortDir,
  resultRange,
  usersListHref,
  usersQueryIsFiltered,
  type AdminUsersQuery,
  type UserSort,
} from "@/lib/adminListQuery";
import AdminListToolbar from "./AdminListToolbar";
import AdminSortHeader from "./AdminSortHeader";

type AdminUsersTableProps = {
  users: AdminUserRow[];
  page: number;
  pageSize: number;
  totalPages: number;
  total: number;
  query: AdminUsersQuery;
};

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

export default function AdminUsersTable({
  users,
  page,
  pageSize,
  totalPages,
  total,
  query,
}: AdminUsersTableProps) {
  const range = resultRange(page, pageSize, total);
  const filtered = usersQueryIsFiltered(query);

  function sortHref(column: UserSort) {
    return usersListHref({
      ...query,
      page: 1,
      sort: column,
      dir: nextUserSortDir(query, column),
    });
  }

  const hidden = [
    ...(query.sort !== "created" ? [{ name: "sort", value: query.sort }] : []),
    ...(query.sort !== "created" || query.dir !== "desc" ? [{ name: "dir", value: query.dir }] : []),
  ];

  return (
    <>
      <AdminListToolbar
        key={`${query.search ?? ""}|${query.verified}|${query.method}|${query.sort}|${query.dir}`}
        action="/admin/users"
        search={query.search}
        searchPlaceholder="Search email, name, source, or campaign…"
        searchAriaLabel="Search users"
        hidden={hidden}
        filters={[
          {
            name: "verified",
            label: "Verification",
            value: query.verified,
            options: [
              { value: "all", label: "All statuses" },
              { value: "verified", label: "Verified" },
              { value: "pending", label: "Pending" },
            ],
          },
          {
            name: "method",
            label: "Signup method",
            value: query.method,
            options: [
              { value: "all", label: "All methods" },
              { value: "email", label: "Email" },
              { value: "google", label: "Google" },
            ],
          },
        ]}
        clearHref={filtered ? usersListHref({ sort: query.sort, dir: query.dir }) : null}
      />

      <div className="admin-panel">
        <div className="admin-panel-header">
          <h2>Users</h2>
          <p className="admin-panel-meta">
            {total === 0
              ? "No matching users"
              : `Showing ${range.from.toLocaleString()}–${range.to.toLocaleString()} of ${total.toLocaleString()}`}
          </p>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <AdminSortHeader
                  label="Email"
                  href={sortHref("email")}
                  active={query.sort === "email"}
                  dir={query.dir}
                />
                <AdminSortHeader
                  label="Name"
                  href={sortHref("name")}
                  active={query.sort === "name"}
                  dir={query.dir}
                />
                <AdminSortHeader
                  label="First landed"
                  href={sortHref("landing")}
                  active={query.sort === "landing"}
                  dir={query.dir}
                />
                <AdminSortHeader
                  label="Converted on"
                  href={sortHref("conversion")}
                  active={query.sort === "conversion"}
                  dir={query.dir}
                />
                <AdminSortHeader
                  label="Traffic source"
                  href={sortHref("source")}
                  active={query.sort === "source"}
                  dir={query.dir}
                />
                <AdminSortHeader
                  label="Signup"
                  href={sortHref("method")}
                  active={query.sort === "method"}
                  dir={query.dir}
                />
                <AdminSortHeader
                  label="Verified"
                  href={sortHref("verified")}
                  active={query.sort === "verified"}
                  dir={query.dir}
                />
                <AdminSortHeader
                  label="Designs"
                  href={sortHref("designs")}
                  active={query.sort === "designs"}
                  dir={query.dir}
                  numeric
                />
                <AdminSortHeader
                  label="Views"
                  href={sortHref("views")}
                  active={query.sort === "views"}
                  dir={query.dir}
                  numeric
                />
                <AdminSortHeader
                  label="Signed up"
                  href={sortHref("created")}
                  active={query.sort === "created"}
                  dir={query.dir}
                />
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={10} className="admin-empty">
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
              {page > 1 ? <Link href={usersListHref({ ...query, page: page - 1 })}>Previous</Link> : null}
              <span aria-current="page">{page}</span>
              {page < totalPages ? <Link href={usersListHref({ ...query, page: page + 1 })}>Next</Link> : null}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
