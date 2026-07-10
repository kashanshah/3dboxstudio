import type { Metadata } from "next";
import AdminUsersTable from "@/components/admin/AdminUsersTable";
import { listAdminUsers } from "@/server/admin/reports";

export const metadata: Metadata = {
  title: "Admin — Users",
};

type PageProps = {
  searchParams: Promise<{ page?: string; search?: string }>;
};

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number(params.page ?? "1");
  const search = params.search?.trim() || undefined;

  const result = await listAdminUsers({ page, search });

  return (
    <>
      <header className="admin-page-header">
        <h1>Users</h1>
        <p>All registered accounts with design counts and view totals.</p>
      </header>
      <AdminUsersTable
        users={result.items}
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
        search={search}
      />
    </>
  );
}
