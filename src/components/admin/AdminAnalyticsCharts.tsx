"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminAnalytics, AdminAnalyticsGranularity } from "@/server/admin/types";

const GRANULARITY_OPTIONS: { id: AdminAnalyticsGranularity; label: string }[] = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "quarterly", label: "Quarterly" },
  { id: "yearly", label: "Yearly" },
];

type ChartSeries = {
  key: string;
  label: string;
  color: string;
  values: number[];
};

type StackedChartProps = {
  title: string;
  periods: string[];
  series: ChartSeries[];
  emptyMessage?: string;
};

function StackedBarChart({ title, periods, series, emptyMessage }: StackedChartProps) {
  const totals = periods.map((_, index) => series.reduce((sum, item) => sum + item.values[index], 0));
  const max = Math.max(1, ...totals);
  const hasData = totals.some((value) => value > 0);

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h2>{title}</h2>
      </div>
      <div className="admin-chart-body">
        {!hasData ? (
          <p className="admin-chart-empty">{emptyMessage ?? "No data for this period."}</p>
        ) : (
          <>
            <div className="admin-chart-legend" aria-hidden>
              {series.map((item) => (
                <span key={item.key} className="admin-chart-legend-item">
                  <span className="admin-chart-legend-swatch" style={{ background: item.color }} />
                  {item.label}
                </span>
              ))}
            </div>
            <div className="admin-stacked-chart" role="img" aria-label={`${title} chart`}>
              {periods.map((label, index) => {
                const total = totals[index];
                const heightPct = (total / max) * 100;
                return (
                  <div
                    key={`${label}-${index}`}
                    className="admin-stacked-bar-col"
                    title={`${label}: ${total.toLocaleString()}`}
                  >
                    <div
                      className="admin-stacked-bar-stack"
                      style={{ height: `${Math.max(total > 0 ? 6 : 0, heightPct)}%` }}
                    >
                      {series.map((item) =>
                        item.values[index] > 0 ? (
                          <div
                            key={item.key}
                            className="admin-stacked-segment"
                            style={{
                              flexGrow: item.values[index],
                              background: item.color,
                            }}
                            title={`${label} · ${item.label}: ${item.values[index].toLocaleString()}`}
                          />
                        ) : null
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="admin-activity-labels">
              <span>{periods[0]}</span>
              <span>{periods[periods.length - 1]}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

type SingleSeriesChartProps = {
  title: string;
  periods: string[];
  values: number[];
  color: string;
  emptyMessage?: string;
};

function SingleSeriesChart({ title, periods, values, color, emptyMessage }: SingleSeriesChartProps) {
  const max = Math.max(1, ...values);
  const hasData = values.some((value) => value > 0);

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h2>{title}</h2>
      </div>
      <div className="admin-chart-body">
        {!hasData ? (
          <p className="admin-chart-empty">{emptyMessage ?? "No data for this period."}</p>
        ) : (
          <>
            <div className="admin-activity-bars" role="img" aria-label={`${title} chart`}>
              {values.map((count, index) => (
                <div
                  key={`${periods[index]}-${index}`}
                  className="admin-activity-bar"
                  style={{
                    height: `${Math.max(count > 0 ? 6 : 0, (count / max) * 100)}%`,
                    background: color,
                  }}
                  title={`${periods[index]}: ${count.toLocaleString()}`}
                />
              ))}
            </div>
            <div className="admin-activity-labels">
              <span>{periods[0]}</span>
              <span>{periods[periods.length - 1]}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function granularityLabel(granularity: AdminAnalyticsGranularity): string {
  return GRANULARITY_OPTIONS.find((option) => option.id === granularity)?.label.toLowerCase() ?? granularity;
}

export default function AdminAnalyticsCharts() {
  const [granularity, setGranularity] = useState<AdminAnalyticsGranularity>("daily");
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async (nextGranularity: AdminAnalyticsGranularity) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/analytics?granularity=${nextGranularity}`, {
        cache: "no-store",
      });
      const body = (await res.json().catch(() => null)) as
        | { analytics?: AdminAnalytics; error?: string }
        | null;
      if (!res.ok) {
        throw new Error(body?.error ?? "Could not load analytics.");
      }
      if (!body?.analytics) {
        throw new Error("Analytics response was empty.");
      }
      setAnalytics(body.analytics);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load analytics.");
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAnalytics(granularity);
  }, [granularity, loadAnalytics]);

  const periods = analytics?.series.map((point) => point.label) ?? [];

  return (
    <section className="admin-analytics" aria-label="Analytics charts">
      <div className="admin-analytics-toolbar">
        <div>
          <h2 className="admin-analytics-title">Analytics</h2>
          <p className="admin-analytics-subtitle">
            Signup methods, verification, and design activation over time.
          </p>
        </div>
        <div className="admin-filter-tabs" role="tablist" aria-label="Chart period">
          {GRANULARITY_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className="admin-filter-tab"
              role="tab"
              aria-selected={granularity === option.id}
              onClick={() => setGranularity(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="admin-chart-status">Loading {granularityLabel(granularity)} analytics…</p>}
      {error && !loading && <p className="admin-error">{error}</p>}

      {analytics && !loading && (
        <>
          <section className="admin-stats-grid admin-analytics-summary" aria-label="Period summary">
            <div className="admin-stat-card">
              <div className="admin-stat-label">Signups</div>
              <div className="admin-stat-value">{analytics.summary.signups.toLocaleString()}</div>
              <div className="admin-stat-sub">
                {analytics.summary.signupsEmail.toLocaleString()} email ·{" "}
                {analytics.summary.signupsGoogle.toLocaleString()} Google
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-label">Verified signups</div>
              <div className="admin-stat-value">{analytics.summary.signupsVerified.toLocaleString()}</div>
              <div className="admin-stat-sub">
                {analytics.summary.signupsUnverified.toLocaleString()} still unverified
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-label">Email verifications</div>
              <div className="admin-stat-value">{analytics.summary.verifications.toLocaleString()}</div>
              <div className="admin-stat-sub">Completed in this range</div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-label">Users with 1+ design</div>
              <div className="admin-stat-value">{analytics.summary.usersWithDesignTotal.toLocaleString()}</div>
              <div className="admin-stat-sub">
                +{analytics.summary.usersWithFirstDesign.toLocaleString()} first saves in range ·{" "}
                {analytics.summary.usersWithoutDesignTotal.toLocaleString()} without a design
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-label">Designs created</div>
              <div className="admin-stat-value">{analytics.summary.designsCreated.toLocaleString()}</div>
              <div className="admin-stat-sub">In selected {granularityLabel(granularity)} range</div>
            </div>
          </section>

          <div className="admin-charts-grid">
            <StackedBarChart
              title={`Signups by method (${granularityLabel(granularity)})`}
              periods={periods}
              series={[
                {
                  key: "email",
                  label: "Email",
                  color: "#3d9eff",
                  values: analytics.series.map((point) => point.signupsEmail),
                },
                {
                  key: "google",
                  label: "Google",
                  color: "#34c759",
                  values: analytics.series.map((point) => point.signupsGoogle),
                },
              ]}
            />
            <StackedBarChart
              title={`Signup verification status (${granularityLabel(granularity)})`}
              periods={periods}
              series={[
                {
                  key: "verified",
                  label: "Verified",
                  color: "#34c759",
                  values: analytics.series.map((point) => point.signupsVerified),
                },
                {
                  key: "unverified",
                  label: "Unverified",
                  color: "#ff9f0a",
                  values: analytics.series.map((point) => point.signupsUnverified),
                },
              ]}
            />
            <SingleSeriesChart
              title={`Email verifications (${granularityLabel(granularity)})`}
              periods={periods}
              values={analytics.series.map((point) => point.verifications)}
              color="#5ac8fa"
            />
            <SingleSeriesChart
              title={`Users with first saved design (${granularityLabel(granularity)})`}
              periods={periods}
              values={analytics.series.map((point) => point.usersWithFirstDesign)}
              color="#bf5af2"
            />
            <SingleSeriesChart
              title={`Designs created (${granularityLabel(granularity)})`}
              periods={periods}
              values={analytics.series.map((point) => point.designsCreated)}
              color="#3d9eff"
            />
          </div>
        </>
      )}
    </section>
  );
}
