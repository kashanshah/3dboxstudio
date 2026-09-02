import Link from "next/link";
import type { SortDir } from "@/lib/adminListQuery";

type AdminSortHeaderProps = {
  label: string;
  href: string;
  active: boolean;
  dir: SortDir;
  numeric?: boolean;
};

export default function AdminSortHeader({ label, href, active, dir, numeric }: AdminSortHeaderProps) {
  const ariaSort = active ? (dir === "asc" ? "ascending" : "descending") : "none";

  return (
    <th aria-sort={ariaSort} className={numeric ? "num" : undefined}>
      <Link className={`admin-sort${active ? " is-active" : ""}`} href={href} title={`Sort by ${label}`}>
        <span>{label}</span>
        <span className="admin-sort-icon" aria-hidden>
          {active ? (dir === "asc" ? "↑" : "↓") : "↕"}
        </span>
      </Link>
    </th>
  );
}
