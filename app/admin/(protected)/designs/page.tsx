import type { Metadata } from "next";
import AdminDesignsTable from "@/components/admin/AdminDesignsTable";
import { listAdminDesigns } from "@/server/admin/reports";

export const metadata: Metadata = {
  title: "Admin — Designs",
};

const VALID_FILTERS = new Set(["all", "owned", "anonymous", "expired"]);

type PageProps = {
  searchParams: Promise<{ page?: string; search?: string; filter?: string }>;
};

export default async function AdminDesignsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number(params.page ?? "1");
  const search = params.search?.trim() || undefined;
  const rawFilter = params.filter ?? "all";
  const filter = VALID_FILTERS.has(rawFilter)
    ? (rawFilter as "all" | "owned" | "anonymous" | "expired")
    : "all";

  const result = await listAdminDesigns({ page, search, filter });

  return (
    <>
      <header className="admin-page-header">
        <h1>Designs</h1>
        <p>All cloud-saved box designs across the platform.</p>
      </header>
      <AdminDesignsTable
        designs={result.items}
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
        search={search}
        filter={filter}
      />
    </>
  );
}
