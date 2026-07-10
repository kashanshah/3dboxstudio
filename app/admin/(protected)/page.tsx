import type { Metadata } from "next";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { getAdminStats } from "@/server/admin/reports";

export const metadata: Metadata = {
  title: "Admin dashboard",
};

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();
  return <AdminDashboard stats={stats} />;
}
