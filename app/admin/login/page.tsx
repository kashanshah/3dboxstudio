import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AdminLoginForm from "@/components/admin/AdminLoginForm";
import { isAdminAuthenticated } from "@/server/admin/auth";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  if (await isAdminAuthenticated()) {
    redirect("/admin");
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
