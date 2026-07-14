import type { AdminStats } from "@/server/admin/types";

type ActivityChartProps = {
  title: string;
  data: { date: string; count: number }[];
};

function ActivityChart({ title, data }: ActivityChartProps) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h2>{title}</h2>
      </div>
      <div style={{ padding: "0.75rem 1.1rem 1rem" }}>
        {data.length === 0 ? (
          <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.85rem" }}>No activity in the last 30 days.</p>
        ) : (
          <>
            <div className="admin-activity-bars" role="img" aria-label={`${title} chart`}>
              {data.map((point) => (
                <div
                  key={point.date}
                  className="admin-activity-bar"
                  style={{ height: `${Math.max(4, (point.count / max) * 100)}%` }}
                  title={`${point.date}: ${point.count}`}
                />
              ))}
            </div>
            <div className="admin-activity-labels">
              <span>{data[0]?.date}</span>
              <span>{data[data.length - 1]?.date}</span>
            </div>
          </>
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

  return (
    <>
      <header className="admin-page-header">
        <h1>Dashboard</h1>
        <p>Overview of signups, saved designs, and platform activity.</p>
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
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
        <ActivityChart title="Signups (last 30 days)" data={stats.activity.signupsByDay} />
        <ActivityChart title="Designs created (last 30 days)" data={stats.activity.designsByDay} />
      </div>
    </>
  );
}
