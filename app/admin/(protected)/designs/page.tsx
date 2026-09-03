import type { Metadata } from "next";
import AdminDesignsTable from "@/components/admin/AdminDesignsTable";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { designsQueryIsFiltered, parseAdminDesignsQuery } from "@/lib/adminListQuery";
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
      <AdminPageHeader
        title="Designs"
        description="Search, filter, and sort cloud-saved box designs."
        count={result.total}
        itemName="design"
        filtered={designsQueryIsFiltered(query)}
      />
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
