import type { Metadata } from "next";
import AdminDesignsTable from "@/components/admin/AdminDesignsTable";
import { parseAdminDesignsQuery } from "@/lib/adminListQuery";
import { listAdminDesigns } from "@/server/admin/reports";

export const metadata: Metadata = {
  title: "Admin — Designs",
};

type PageProps = {
  searchParams: Promise<{
    page?: string;
    search?: string;
    sort?: string;
    dir?: string;
    filter?: string;
  }>;
};

export default async function AdminDesignsPage({ searchParams }: PageProps) {
  const query = parseAdminDesignsQuery(await searchParams);
  const result = await listAdminDesigns(query);

  return (
    <>
      <header className="admin-page-header">
        <h1>Designs</h1>
        <p>Search, filter, and sort cloud-saved box designs.</p>
      </header>
      <AdminDesignsTable
        designs={result.items}
        page={result.page}
        pageSize={result.pageSize}
        totalPages={result.totalPages}
        total={result.total}
        query={query}
      />
    </>
  );
}
