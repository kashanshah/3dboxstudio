import type { Metadata } from "next";
import AdminContactsTable from "@/components/admin/AdminContactsTable";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { parseAdminSubmissionsQuery, submissionsQueryIsFiltered } from "@/lib/adminListQuery";
import { listAdminSubmissions } from "@/server/admin/reports";

export const metadata: Metadata = {
  title: "Admin — Contacts",
};

type PageProps = {
  searchParams: Promise<{
    page?: string;
    search?: string;
    sort?: string;
    dir?: string;
    kind?: string;
    status?: string;
  }>;
};

export default async function AdminContactsPage({ searchParams }: PageProps) {
  const query = parseAdminSubmissionsQuery(await searchParams);
  const result = await listAdminSubmissions(query);

  return (
    <>
      <AdminPageHeader
        title="Contacts"
        description="Review contact messages now, and newsletter subscriptions later, from one shared intake."
        count={result.total}
        itemName="submission"
        filtered={submissionsQueryIsFiltered(query)}
      />
      <AdminContactsTable
        submissions={result.items}
        page={result.page}
        pageSize={result.pageSize}
        totalPages={result.totalPages}
        total={result.total}
        query={query}
      />
    </>
  );
}
