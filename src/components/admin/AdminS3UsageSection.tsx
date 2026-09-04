import { formatBytes, formatUsd } from "@/lib/formatBytes";
import { SHARE_MAX_IMAGE_BYTES } from "@/server/env";
import type { AdminDbImageCounts, AdminS3Usage } from "@/server/admin/types";

type ActivityChartProps = {
  title: string;
  data: { date: string; count: number }[];
  formatValue?: (value: number) => string;
  emptyMessage?: string;
};

function ActivityChart({ title, data, formatValue, emptyMessage }: ActivityChartProps) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const format = formatValue ?? ((value: number) => value.toLocaleString());

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h2>{title}</h2>
      </div>
      <div style={{ padding: "0.75rem 1.1rem 1rem" }}>
        {data.every((point) => point.count === 0) ? (
          <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.85rem" }}>
            {emptyMessage ?? "No uploads in the last 30 days."}
          </p>
        ) : (
          <>
            <div className="admin-activity-bars" role="img" aria-label={`${title} chart`}>
              {data.map((point) => (
                <div
                  key={point.date}
                  className="admin-activity-bar"
                  style={{ height: `${point.count > 0 ? Math.max(4, (point.count / max) * 100) : 0}%` }}
                  title={`${point.date}: ${format(point.count)}`}
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

type BreakdownListProps = {
  title: string;
  data: { label: string; value: string }[];
};

function BreakdownList({ title, data }: BreakdownListProps) {
  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h2>{title}</h2>
      </div>
      <div style={{ padding: "0.75rem 1.1rem 1rem" }}>
        {data.length === 0 ? (
          <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.85rem" }}>No objects to show.</p>
        ) : (
          <ul className="admin-breakdown-list">
            {data.map((row) => (
              <li key={row.label}>
                <span>{row.label}</span>
                <strong>{row.value}</strong>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

type AdminS3UsageSectionProps = {
  s3: AdminS3Usage;
  images: AdminDbImageCounts;
};

const S3_STANDARD_USD_PER_GB_MONTH = 0.023;
const BYTES_PER_GB = 1024 ** 3;

export default function AdminS3UsageSection({ s3, images }: AdminS3UsageSectionProps) {
  const dbTotal = images.faceImages + images.ogImages;
  const maxStoredBytes = dbTotal * SHARE_MAX_IMAGE_BYTES;
  const maxMonthlyUsd = (maxStoredBytes / BYTES_PER_GB) * S3_STANDARD_USD_PER_GB_MONTH;
  const extraObjects = s3.available ? s3.objectCount - dbTotal : 0;
  const uploadSeries = s3.available ? s3.objectsByDay : images.imagesByDay;

  return (
    <section className="admin-analytics" aria-label="S3 storage">
      <div className="admin-analytics-toolbar">
        <div>
          <h2 className="admin-analytics-title">S3 storage</h2>
          <p className="admin-analytics-subtitle">
            {s3.bucket
              ? `Usage for ${s3.bucket}${s3.region ? ` · ${s3.region}` : ""} — image counts and an S3 Standard billing estimate.`
              : "Image counts and an S3 Standard billing estimate."}
          </p>
        </div>
      </div>

      <section className="admin-stats-grid admin-analytics-summary" aria-label="S3 usage metrics">
        <div className="admin-stat-card">
          <div className="admin-stat-label">{s3.available ? "Bucket size" : "Max stored size"}</div>
          <div className="admin-stat-value">{formatBytes(s3.available ? s3.totalBytes : maxStoredBytes)}</div>
          <div className="admin-stat-sub">
            {s3.available
              ? `${s3.totalBytes.toLocaleString()} bytes in the bucket`
              : `Ceiling at ${formatBytes(SHARE_MAX_IMAGE_BYTES)} per image`}
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">{s3.available ? "S3 objects" : "Images uploaded"}</div>
          <div className="admin-stat-value">
            {(s3.available ? s3.objectCount : dbTotal).toLocaleString()}
          </div>
          <div className="admin-stat-sub">
            {s3.available
              ? `${s3.faceImages.toLocaleString()} face · ${s3.ogImages.toLocaleString()} OG${s3.otherObjects > 0 ? ` · ${s3.otherObjects.toLocaleString()} other` : ""}`
              : `${images.faceImages.toLocaleString()} face · ${images.ogImages.toLocaleString()} OG`}
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Uploaded (7d)</div>
          <div className="admin-stat-value">
            {(s3.available ? s3.last7Days.objects : images.last7Days).toLocaleString()}
          </div>
          <div className="admin-stat-sub">
            {s3.available ? `${formatBytes(s3.last7Days.bytes)} written` : "From saved designs"}
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Uploaded (30d)</div>
          <div className="admin-stat-value">
            {(s3.available ? s3.last30Days.objects : images.last30Days).toLocaleString()}
          </div>
          <div className="admin-stat-sub">
            {s3.available ? `${formatBytes(s3.last30Days.bytes)} written` : "From saved designs"}
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">{s3.available ? "Average object" : "Avg / day (30d)"}</div>
          <div className="admin-stat-value">
            {s3.available ? formatBytes(s3.averageBytes) : (images.last30Days / 30).toLocaleString(undefined, { maximumFractionDigits: 1 })}
          </div>
          <div className="admin-stat-sub">
            {s3.available ? "Across all objects in the bucket" : `${images.last30Days.toLocaleString()} images in 30 days`}
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Est. monthly storage</div>
          <div className="admin-stat-value">
            {formatUsd(s3.available ? s3.estimatedMonthlyStorageUsd : maxMonthlyUsd)}
          </div>
          <div className="admin-stat-sub">
            {s3.available
              ? `S3 Standard · +${formatUsd(s3.estimatedMonthlyPutUsd)} PUTs (30d)`
              : "S3 Standard ceiling from 2 MB/image cap"}
          </div>
        </div>
      </section>

      <p className="admin-s3-note">
        {s3.available ? (
          <>
            {s3.truncated
              ? "Inventory stopped after 100,000 objects, so totals may be incomplete. "
              : ""}
            Database tracks {dbTotal.toLocaleString()} images ({images.faceImages.toLocaleString()} face
            {images.faceImages === 1 ? "" : "s"} + {images.ogImages.toLocaleString()} OG).
            {extraObjects > 0
              ? ` S3 has ${extraObjects.toLocaleString()} extra object${extraObjects === 1 ? "" : "s"} — likely leftovers from overwrites or deleted designs.`
              : extraObjects < 0
                ? ` Database is tracking ${Math.abs(extraObjects).toLocaleString()} more image${Math.abs(extraObjects) === 1 ? "" : "s"} than S3 currently lists.`
                : " Object count matches the database."}{" "}
            Estimate uses $0.023/GB-month (first 50 TB) and $0.005 per 1,000 PUTs. It excludes GET requests,
            data transfer, and non-Standard storage classes.
            {s3.prefix ? ` App uploads use the ${s3.prefix} prefix.` : ""}
          </>
        ) : (
          <>
            Showing database image counts and a maximum storage estimate (each image is capped at{" "}
            {formatBytes(SHARE_MAX_IMAGE_BYTES)}). Live bucket size needs{" "}
            <code>s3:ListBucket</code> on the AWS user that serves this app
            {s3.bucket ? ` for ${s3.bucket}` : ""}. {s3.error ?? ""}
          </>
        )}
      </p>

      <div className="admin-charts-grid">
        <ActivityChart
          title={s3.available ? "Images uploaded (last 30 days)" : "Images saved (last 30 days)"}
          data={uploadSeries}
        />
        {s3.available ? (
          <ActivityChart
            title="Bytes written (last 30 days)"
            data={s3.objectsByDay.map((point) => ({ date: point.date, count: point.bytes }))}
            formatValue={formatBytes}
          />
        ) : null}
        <BreakdownList
          title="Images by type"
          data={
            s3.available
              ? [
                  {
                    label: "Face images",
                    value: `${s3.faceImages.toLocaleString()} · ${shareOf(s3.faceImages, s3.objectCount)}`,
                  },
                  {
                    label: "OG previews",
                    value: `${s3.ogImages.toLocaleString()} · ${shareOf(s3.ogImages, s3.objectCount)}`,
                  },
                  ...(s3.otherObjects > 0
                    ? [
                        {
                          label: "Other objects",
                          value: `${s3.otherObjects.toLocaleString()} · ${shareOf(s3.otherObjects, s3.objectCount)}`,
                        },
                      ]
                    : []),
                ]
              : [
                  {
                    label: "Face images",
                    value: `${images.faceImages.toLocaleString()} · ${shareOf(images.faceImages, dbTotal)}`,
                  },
                  {
                    label: "OG previews",
                    value: `${images.ogImages.toLocaleString()} · ${shareOf(images.ogImages, dbTotal)}`,
                  },
                ]
          }
        />
        {s3.available ? (
          <BreakdownList
            title="Storage class"
            data={s3.storageClasses.map((row) => ({
              label: row.label,
              value: `${row.objects.toLocaleString()} · ${formatBytes(row.bytes)}`,
            }))}
          />
        ) : (
          <BreakdownList
            title="Billing ceiling"
            data={[
              { label: "Images tracked", value: dbTotal.toLocaleString() },
              { label: "Max bytes stored", value: formatBytes(maxStoredBytes) },
              { label: "Max monthly storage", value: formatUsd(maxMonthlyUsd) },
            ]}
          />
        )}
      </div>
    </section>
  );
}

function shareOf(part: number, total: number): string {
  if (total <= 0) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}
