import type { Metadata } from "next";
import AdminUsersTable from "@/components/admin/AdminUsersTable";
import { parseAdminUsersQuery } from "@/lib/adminListQuery";
import { listAdminUsers } from "@/server/admin/reports";

export const metadata: Metadata = {
  title: "Admin — Users",
};

type PageProps = {
  searchParams: Promise<{
    page?: string;
    search?: string;
    sort?: string;
    dir?: string;
    verified?: string;
    method?: string;
  }>;
};

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const query = parseAdminUsersQuery(await searchParams);
  const result = await listAdminUsers(query);

  return (
    <>
      <header className="admin-page-header">
        <h1>Users</h1>
        <p>Search, filter, and sort registered accounts.</p>
      </header>
      <AdminUsersTable
        users={result.items}
        page={result.page}
        pageSize={result.pageSize}
        totalPages={result.totalPages}
        total={result.total}
        query={query}
      />
    </>
  );
}
