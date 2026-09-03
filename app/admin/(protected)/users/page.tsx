import type { Metadata } from "next";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminUsersTable from "@/components/admin/AdminUsersTable";
import { parseAdminUsersQuery, usersQueryIsFiltered } from "@/lib/adminListQuery";
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
      <AdminPageHeader
        title="Users"
        description="Search, filter, and sort registered accounts."
        count={result.total}
        itemName="user"
        filtered={usersQueryIsFiltered(query)}
      />
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
