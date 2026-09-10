"use client";

import {
  AdminChartBarHit,
  AdminChartReadout,
  useChartHover,
} from "./AdminChartReadout";

type ActivityChartProps = {
  title: string;
  data: { date: string; count: number }[];
  formatValue?: (value: number) => string;
  emptyMessage?: string;
};

export default function AdminActivityChart({
  title,
  data,
  formatValue,
  emptyMessage,
}: ActivityChartProps) {
  const [hover, setHover] = useChartHover();
  const max = Math.max(1, ...data.map((d) => d.count));
  const format = formatValue ?? ((value: number) => value.toLocaleString());
  const hasData = data.some((point) => point.count > 0);

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h2>{title}</h2>
      </div>
      <div className="admin-chart-body">
        {!hasData ? (
          <p className="admin-chart-empty">{emptyMessage ?? "No activity in the last 30 days."}</p>
        ) : (
          <>
            <AdminChartReadout value={hover} />
            <div className="admin-activity-bars" role="img" aria-label={`${title} chart`}>
              {data.map((point) => {
                const tooltip = `${point.date}: ${format(point.count)}`;
                return (
                  <AdminChartBarHit
                    key={point.date}
                    className="admin-activity-bar-hit"
                    tooltip={tooltip}
                    onHoverChange={setHover}
                  >
                    <div
                      className="admin-activity-bar"
                      style={{
                        height: `${point.count > 0 ? Math.max(4, (point.count / max) * 100) : 0}%`,
                      }}
                    />
                  </AdminChartBarHit>
                );
              })}
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
