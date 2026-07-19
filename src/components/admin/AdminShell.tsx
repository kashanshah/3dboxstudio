"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type AdminShellProps = {
  children: React.ReactNode;
};

const NAV = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/designs", label: "Designs" },
];

export default function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/admin">
          <img src="/logo-mark.svg" width={28} height={28} alt="" decoding="async" />
          <span>Admin</span>
        </Link>

        <nav className="admin-nav" aria-label="Admin">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined}>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <button type="button" className="admin-logout-btn" onClick={() => void logout()}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="admin-main">{children}</main>
    </div>
  );
}
