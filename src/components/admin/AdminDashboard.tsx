import type { AdminStats } from "@/server/admin/types";
import { landingTypeLabel } from "@/lib/landingClassification";
import AdminActivityChart from "./AdminActivityChart";
import AdminAnalyticsCharts from "./AdminAnalyticsCharts";
import AdminS3UsageSection from "./AdminS3UsageSection";

type BreakdownListProps = {
  title: string;
  data: { label: string; count: number }[];
};

function BreakdownList({
  title,
  data,
  labelFormatter,
}: BreakdownListProps & { labelFormatter?: (label: string) => string }) {
  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h2>{title}</h2>
      </div>
      <div style={{ padding: "0.75rem 1.1rem 1rem" }}>
        {data.length === 0 ? (
          <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.85rem" }}>No signups in the last 30 days.</p>
        ) : (
          <ul className="admin-breakdown-list">
            {data.map((row) => (
              <li key={row.label}>
                <span>{labelFormatter ? labelFormatter(row.label) : row.label}</span>
                <strong>{row.count.toLocaleString()}</strong>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

type AdminDashboardProps = {
  stats: AdminStats;
};

export default function AdminDashboard({ stats }: AdminDashboardProps) {
  const verifiedPct =
    stats.users.total > 0 ? Math.round((stats.users.verified / stats.users.total) * 100) : 0;
  const dailyAvgSignups = stats.users.last30Days / 30;
  const dailyAvgDesigns = stats.designs.last30Days / 30;

  return (
    <>
      <header className="admin-page-header">
        <div className="admin-page-header-copy">
          <h1>Dashboard</h1>
          <p>Overview of signups, saved designs, S3 usage, and platform activity.</p>
        </div>
      </header>

      <section className="admin-stats-grid" aria-label="Key metrics">
        <div className="admin-stat-card">
          <div className="admin-stat-label">Total users</div>
          <div className="admin-stat-value">{stats.users.total.toLocaleString()}</div>
          <div className="admin-stat-sub">+{stats.users.last7Days} last 7 days</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Verified users</div>
          <div className="admin-stat-value">{stats.users.verified.toLocaleString()}</div>
          <div className="admin-stat-sub">{verifiedPct}% of all users</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Total designs</div>
          <div className="admin-stat-value">{stats.designs.total.toLocaleString()}</div>
          <div className="admin-stat-sub">+{stats.designs.last7Days} last 7 days</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">User-owned designs</div>
          <div className="admin-stat-value">{stats.designs.owned.toLocaleString()}</div>
          <div className="admin-stat-sub">{stats.designs.anonymous.toLocaleString()} anonymous</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Total views</div>
          <div className="admin-stat-value">{stats.designs.totalViews.toLocaleString()}</div>
          <div className="admin-stat-sub">Across all shared designs</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Signups (30d)</div>
          <div className="admin-stat-value">{stats.users.last30Days.toLocaleString()}</div>
          <div className="admin-stat-sub">{stats.designs.last30Days.toLocaleString()} designs created</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Daily Average Signup</div>
          <div className="admin-stat-value">
            {dailyAvgSignups.toLocaleString(undefined, { maximumFractionDigits: 1 })}
          </div>
          <div className="admin-stat-sub">
            {stats.users.last30Days.toLocaleString()} signups over last 30 days
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Daily Designs Created</div>
          <div className="admin-stat-value">
            {dailyAvgDesigns.toLocaleString(undefined, { maximumFractionDigits: 1 })}
          </div>
          <div className="admin-stat-sub">
            {stats.designs.last30Days.toLocaleString()} designs over last 30 days
          </div>
        </div>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
        <AdminActivityChart title="Signups (last 30 days)" data={stats.activity.signupsByDay} />
        <AdminActivityChart title="Designs created (last 30 days)" data={stats.activity.designsByDay} />
        <BreakdownList title="Signups by UTM source (30d)" data={stats.activity.signupsBySource} />
        <BreakdownList title="Signups by method (30d)" data={stats.activity.signupsByMethod} />
        <BreakdownList
          title="First landing page (30d)"
          data={stats.activity.signupsByLandingType}
          labelFormatter={(label) => (label === "(unknown)" ? label : landingTypeLabel(label))}
        />
        <BreakdownList
          title="Signup page (30d)"
          data={stats.activity.signupsByConversionType}
          labelFormatter={(label) => (label === "(unknown)" ? label : landingTypeLabel(label))}
        />
      </div>

      <AdminS3UsageSection s3={stats.s3} images={stats.images} />

      <AdminAnalyticsCharts />
    </>
  );
}
