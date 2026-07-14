import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { isAdminAuthenticated } from "@/server/admin/auth";

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const authed = await isAdminAuthenticated();
  if (!authed) {
    redirect("/admin/login");
  }

  return <AdminShell>{children}</AdminShell>;
}
