import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminLoginForm from "@/components/admin/AdminLoginForm";
import AdminShell from "@/components/admin/AdminShell";
import { isAdminAuthenticated } from "@/server/admin/auth";
import { getAdminStats } from "@/server/admin/reports";

type PageProps = {
  searchParams: Promise<{ login?: string }>;
};

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  if (params.login === "true") {
    return { title: "Admin sign in" };
  }
  return { title: "Admin dashboard" };
}

export default async function AdminPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const authed = await isAdminAuthenticated();

  if (authed) {
    if (params.login === "true") {
      redirect("/admin");
    }
    const stats = await getAdminStats();
    return (
      <AdminShell>
        <AdminDashboard stats={stats} />
      </AdminShell>
    );
  }

  if (params.login !== "true") {
    notFound();
  }

  return (
    <div className="admin-login">
      <div className="admin-login-card">
        <h1>Admin sign in</h1>
        <p>Enter the admin password to view reporting data.</p>
        <AdminLoginForm />
      </div>
    </div>
  );
}
