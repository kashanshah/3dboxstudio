import { getSql } from "../db";
import {
  addAdminPeriod,
  ADMIN_DISPLAY_TIME_ZONE,
  adminPeriodKey,
  adminPeriodStartIso,
  formatAdminPeriodLabel,
  startOfAdminPeriod,
} from "@/lib/adminTimeZone";
import { bucketS3Inventory, getS3Inventory } from "../s3Stats";
import type { AdminAnalytics, AdminAnalyticsGranularity, AdminAnalyticsSeriesPoint } from "./types";

const GRANULARITY_CONFIG: Record<
  AdminAnalyticsGranularity,
  { buckets: number; trunc: "day" | "week" | "month" | "quarter" | "year" }
> = {
  daily: { buckets: 30, trunc: "day" },
  weekly: { buckets: 12, trunc: "week" },
  monthly: { buckets: 12, trunc: "month" },
  quarterly: { buckets: 8, trunc: "quarter" },
  yearly: { buckets: 5, trunc: "year" },
};

type CountRow = { period_key: string; count: number };
type SignupRow = {
  period_key: string;
  email: number;
  google: number;
  verified: number;
  unverified: number;
};

export function parseAnalyticsGranularity(value: string | null | undefined): AdminAnalyticsGranularity {
  if (value === "weekly" || value === "monthly" || value === "quarterly" || value === "yearly") {
    return value;
  }
  return "daily";
}

function buildPeriodSpine(granularity: AdminAnalyticsGranularity) {
  const { buckets, trunc } = GRANULARITY_CONFIG[granularity];
  const rangeEndYmd = startOfAdminPeriod(new Date(), trunc);
  const rangeStartYmd = addAdminPeriod(rangeEndYmd, trunc, -(buckets - 1));
  const periods: { periodStart: string; label: string; key: string }[] = [];

  for (let i = 0; i < buckets; i++) {
    const ymd = addAdminPeriod(rangeStartYmd, trunc, i);
    periods.push({
      periodStart: adminPeriodStartIso(ymd),
      label: formatAdminPeriodLabel(ymd, trunc),
      key: adminPeriodKey(ymd, trunc),
    });
  }

  return {
    buckets,
    trunc,
    periods,
    rangeStart: new Date(adminPeriodStartIso(rangeStartYmd)),
    rangeEnd: new Date(adminPeriodStartIso(rangeEndYmd)),
  };
}

function mapCountRows(rows: CountRow[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(row.period_key, Number(row.count) || 0);
  }
  return map;
}

function mapSignupRows(rows: SignupRow[]): Map<string, SignupRow> {
  const map = new Map<string, SignupRow>();
  for (const row of rows) {
    map.set(row.period_key, {
      period_key: row.period_key,
      email: Number(row.email) || 0,
      google: Number(row.google) || 0,
      verified: Number(row.verified) || 0,
      unverified: Number(row.unverified) || 0,
    });
  }
  return map;
}

async function fetchSignupSeries(
  trunc: (typeof GRANULARITY_CONFIG)[AdminAnalyticsGranularity]["trunc"],
  rangeStartIso: string
): Promise<SignupRow[]> {
  const sql = getSql();
  if (trunc === "day") {
    return (await sql`
      SELECT
        TO_CHAR(DATE_TRUNC('day', timezone(${ADMIN_DISPLAY_TIME_ZONE}, created_at)), 'YYYY-MM-DD') AS period_key,
        COUNT(*) FILTER (
          WHERE COALESCE(NULLIF(TRIM(signup_method), ''), 'email') <> 'google'
        )::int AS email,
        COUNT(*) FILTER (WHERE signup_method = 'google')::int AS google,
        COUNT(*) FILTER (WHERE email_verified_at IS NOT NULL)::int AS verified,
        COUNT(*) FILTER (WHERE email_verified_at IS NULL)::int AS unverified
      FROM users
      WHERE created_at >= ${rangeStartIso}::timestamptz
      GROUP BY 1
      ORDER BY 1 ASC
    `) as SignupRow[];
  }
  if (trunc === "week") {
    return (await sql`
      SELECT
        TO_CHAR(DATE_TRUNC('week', timezone(${ADMIN_DISPLAY_TIME_ZONE}, created_at)), 'YYYY-MM-DD') AS period_key,
        COUNT(*) FILTER (
          WHERE COALESCE(NULLIF(TRIM(signup_method), ''), 'email') <> 'google'
        )::int AS email,
        COUNT(*) FILTER (WHERE signup_method = 'google')::int AS google,
        COUNT(*) FILTER (WHERE email_verified_at IS NOT NULL)::int AS verified,
        COUNT(*) FILTER (WHERE email_verified_at IS NULL)::int AS unverified
      FROM users
      WHERE created_at >= ${rangeStartIso}::timestamptz
      GROUP BY 1
      ORDER BY 1 ASC
    `) as SignupRow[];
  }
  if (trunc === "month") {
    return (await sql`
      SELECT
        TO_CHAR(DATE_TRUNC('month', timezone(${ADMIN_DISPLAY_TIME_ZONE}, created_at)), 'YYYY-MM') AS period_key,
        COUNT(*) FILTER (
          WHERE COALESCE(NULLIF(TRIM(signup_method), ''), 'email') <> 'google'
        )::int AS email,
        COUNT(*) FILTER (WHERE signup_method = 'google')::int AS google,
        COUNT(*) FILTER (WHERE email_verified_at IS NOT NULL)::int AS verified,
        COUNT(*) FILTER (WHERE email_verified_at IS NULL)::int AS unverified
      FROM users
      WHERE created_at >= ${rangeStartIso}::timestamptz
      GROUP BY 1
      ORDER BY 1 ASC
    `) as SignupRow[];
  }
  if (trunc === "quarter") {
    return (await sql`
      SELECT
        TO_CHAR(DATE_TRUNC('quarter', timezone(${ADMIN_DISPLAY_TIME_ZONE}, created_at)), 'YYYY-"Q"Q') AS period_key,
        COUNT(*) FILTER (
          WHERE COALESCE(NULLIF(TRIM(signup_method), ''), 'email') <> 'google'
        )::int AS email,
        COUNT(*) FILTER (WHERE signup_method = 'google')::int AS google,
        COUNT(*) FILTER (WHERE email_verified_at IS NOT NULL)::int AS verified,
        COUNT(*) FILTER (WHERE email_verified_at IS NULL)::int AS unverified
      FROM users
      WHERE created_at >= ${rangeStartIso}::timestamptz
      GROUP BY 1
      ORDER BY 1 ASC
    `) as SignupRow[];
  }
  return (await sql`
    SELECT
      TO_CHAR(DATE_TRUNC('year', timezone(${ADMIN_DISPLAY_TIME_ZONE}, created_at)), 'YYYY') AS period_key,
      COUNT(*) FILTER (
        WHERE COALESCE(NULLIF(TRIM(signup_method), ''), 'email') <> 'google'
      )::int AS email,
      COUNT(*) FILTER (WHERE signup_method = 'google')::int AS google,
      COUNT(*) FILTER (WHERE email_verified_at IS NOT NULL)::int AS verified,
      COUNT(*) FILTER (WHERE email_verified_at IS NULL)::int AS unverified
    FROM users
    WHERE created_at >= ${rangeStartIso}::timestamptz
    GROUP BY 1
    ORDER BY 1 ASC
  `) as SignupRow[];
}

async function fetchVerificationSeries(
  trunc: (typeof GRANULARITY_CONFIG)[AdminAnalyticsGranularity]["trunc"],
  rangeStartIso: string
): Promise<CountRow[]> {
  const sql = getSql();
  if (trunc === "day") {
    return (await sql`
      SELECT TO_CHAR(DATE_TRUNC('day', timezone(${ADMIN_DISPLAY_TIME_ZONE}, email_verified_at)), 'YYYY-MM-DD') AS period_key, COUNT(*)::int AS count
      FROM users
      WHERE email_verified_at IS NOT NULL AND email_verified_at >= ${rangeStartIso}::timestamptz
      GROUP BY 1 ORDER BY 1 ASC
    `) as CountRow[];
  }
  if (trunc === "week") {
    return (await sql`
      SELECT TO_CHAR(DATE_TRUNC('week', timezone(${ADMIN_DISPLAY_TIME_ZONE}, email_verified_at)), 'YYYY-MM-DD') AS period_key, COUNT(*)::int AS count
      FROM users
      WHERE email_verified_at IS NOT NULL AND email_verified_at >= ${rangeStartIso}::timestamptz
      GROUP BY 1 ORDER BY 1 ASC
    `) as CountRow[];
  }
  if (trunc === "month") {
    return (await sql`
      SELECT TO_CHAR(DATE_TRUNC('month', timezone(${ADMIN_DISPLAY_TIME_ZONE}, email_verified_at)), 'YYYY-MM') AS period_key, COUNT(*)::int AS count
      FROM users
      WHERE email_verified_at IS NOT NULL AND email_verified_at >= ${rangeStartIso}::timestamptz
      GROUP BY 1 ORDER BY 1 ASC
    `) as CountRow[];
  }
  if (trunc === "quarter") {
    return (await sql`
      SELECT TO_CHAR(DATE_TRUNC('quarter', timezone(${ADMIN_DISPLAY_TIME_ZONE}, email_verified_at)), 'YYYY-"Q"Q') AS period_key, COUNT(*)::int AS count
      FROM users
      WHERE email_verified_at IS NOT NULL AND email_verified_at >= ${rangeStartIso}::timestamptz
      GROUP BY 1 ORDER BY 1 ASC
    `) as CountRow[];
  }
  return (await sql`
    SELECT TO_CHAR(DATE_TRUNC('year', timezone(${ADMIN_DISPLAY_TIME_ZONE}, email_verified_at)), 'YYYY') AS period_key, COUNT(*)::int AS count
    FROM users
    WHERE email_verified_at IS NOT NULL AND email_verified_at >= ${rangeStartIso}::timestamptz
    GROUP BY 1 ORDER BY 1 ASC
  `) as CountRow[];
}

async function fetchFirstDesignSeries(
  trunc: (typeof GRANULARITY_CONFIG)[AdminAnalyticsGranularity]["trunc"],
  rangeStartIso: string
): Promise<CountRow[]> {
  const sql = getSql();
  if (trunc === "day") {
    return (await sql`
      WITH first_design AS (
        SELECT user_id, MIN(created_at) AS first_at
        FROM shared_designs
        WHERE user_id IS NOT NULL
        GROUP BY user_id
      )
      SELECT TO_CHAR(DATE_TRUNC('day', timezone(${ADMIN_DISPLAY_TIME_ZONE}, first_at)), 'YYYY-MM-DD') AS period_key, COUNT(*)::int AS count
      FROM first_design
      WHERE first_at >= ${rangeStartIso}::timestamptz
      GROUP BY 1 ORDER BY 1 ASC
    `) as CountRow[];
  }
  if (trunc === "week") {
    return (await sql`
      WITH first_design AS (
        SELECT user_id, MIN(created_at) AS first_at
        FROM shared_designs
        WHERE user_id IS NOT NULL
        GROUP BY user_id
      )
      SELECT TO_CHAR(DATE_TRUNC('week', timezone(${ADMIN_DISPLAY_TIME_ZONE}, first_at)), 'YYYY-MM-DD') AS period_key, COUNT(*)::int AS count
      FROM first_design
      WHERE first_at >= ${rangeStartIso}::timestamptz
      GROUP BY 1 ORDER BY 1 ASC
    `) as CountRow[];
  }
  if (trunc === "month") {
    return (await sql`
      WITH first_design AS (
        SELECT user_id, MIN(created_at) AS first_at
        FROM shared_designs
        WHERE user_id IS NOT NULL
        GROUP BY user_id
      )
      SELECT TO_CHAR(DATE_TRUNC('month', timezone(${ADMIN_DISPLAY_TIME_ZONE}, first_at)), 'YYYY-MM') AS period_key, COUNT(*)::int AS count
      FROM first_design
      WHERE first_at >= ${rangeStartIso}::timestamptz
      GROUP BY 1 ORDER BY 1 ASC
    `) as CountRow[];
  }
  if (trunc === "quarter") {
    return (await sql`
      WITH first_design AS (
        SELECT user_id, MIN(created_at) AS first_at
        FROM shared_designs
        WHERE user_id IS NOT NULL
        GROUP BY user_id
      )
      SELECT TO_CHAR(DATE_TRUNC('quarter', timezone(${ADMIN_DISPLAY_TIME_ZONE}, first_at)), 'YYYY-"Q"Q') AS period_key, COUNT(*)::int AS count
      FROM first_design
      WHERE first_at >= ${rangeStartIso}::timestamptz
      GROUP BY 1 ORDER BY 1 ASC
    `) as CountRow[];
  }
  return (await sql`
    WITH first_design AS (
      SELECT user_id, MIN(created_at) AS first_at
      FROM shared_designs
      WHERE user_id IS NOT NULL
      GROUP BY user_id
    )
    SELECT TO_CHAR(DATE_TRUNC('year', timezone(${ADMIN_DISPLAY_TIME_ZONE}, first_at)), 'YYYY') AS period_key, COUNT(*)::int AS count
    FROM first_design
    WHERE first_at >= ${rangeStartIso}::timestamptz
    GROUP BY 1 ORDER BY 1 ASC
  `) as CountRow[];
}

async function fetchImageSeries(
  trunc: (typeof GRANULARITY_CONFIG)[AdminAnalyticsGranularity]["trunc"],
  rangeStartIso: string
): Promise<CountRow[]> {
  const sql = getSql();
  if (trunc === "day") {
    return (await sql`
      SELECT
        TO_CHAR(DATE_TRUNC('day', timezone(${ADMIN_DISPLAY_TIME_ZONE}, created_at)), 'YYYY-MM-DD') AS period_key,
        COALESCE(SUM(
          CASE
            WHEN jsonb_typeof(images) = 'object'
              THEN (SELECT COUNT(*) FROM jsonb_object_keys(images))
            ELSE 0
          END
          + CASE
            WHEN og_image_key IS NOT NULL AND og_image_key <> '' THEN 1
            ELSE 0
          END
        ), 0)::int AS count
      FROM shared_designs
      WHERE created_at >= ${rangeStartIso}::timestamptz
      GROUP BY 1 ORDER BY 1 ASC
    `) as CountRow[];
  }
  if (trunc === "week") {
    return (await sql`
      SELECT
        TO_CHAR(DATE_TRUNC('week', timezone(${ADMIN_DISPLAY_TIME_ZONE}, created_at)), 'YYYY-MM-DD') AS period_key,
        COALESCE(SUM(
          CASE
            WHEN jsonb_typeof(images) = 'object'
              THEN (SELECT COUNT(*) FROM jsonb_object_keys(images))
            ELSE 0
          END
          + CASE
            WHEN og_image_key IS NOT NULL AND og_image_key <> '' THEN 1
            ELSE 0
          END
        ), 0)::int AS count
      FROM shared_designs
      WHERE created_at >= ${rangeStartIso}::timestamptz
      GROUP BY 1 ORDER BY 1 ASC
    `) as CountRow[];
  }
  if (trunc === "month") {
    return (await sql`
      SELECT
        TO_CHAR(DATE_TRUNC('month', timezone(${ADMIN_DISPLAY_TIME_ZONE}, created_at)), 'YYYY-MM') AS period_key,
        COALESCE(SUM(
          CASE
            WHEN jsonb_typeof(images) = 'object'
              THEN (SELECT COUNT(*) FROM jsonb_object_keys(images))
            ELSE 0
          END
          + CASE
            WHEN og_image_key IS NOT NULL AND og_image_key <> '' THEN 1
            ELSE 0
          END
        ), 0)::int AS count
      FROM shared_designs
      WHERE created_at >= ${rangeStartIso}::timestamptz
      GROUP BY 1 ORDER BY 1 ASC
    `) as CountRow[];
  }
  if (trunc === "quarter") {
    return (await sql`
      SELECT
        TO_CHAR(DATE_TRUNC('quarter', timezone(${ADMIN_DISPLAY_TIME_ZONE}, created_at)), 'YYYY-"Q"Q') AS period_key,
        COALESCE(SUM(
          CASE
            WHEN jsonb_typeof(images) = 'object'
              THEN (SELECT COUNT(*) FROM jsonb_object_keys(images))
            ELSE 0
          END
          + CASE
            WHEN og_image_key IS NOT NULL AND og_image_key <> '' THEN 1
            ELSE 0
          END
        ), 0)::int AS count
      FROM shared_designs
      WHERE created_at >= ${rangeStartIso}::timestamptz
      GROUP BY 1 ORDER BY 1 ASC
    `) as CountRow[];
  }
  return (await sql`
    SELECT
      TO_CHAR(DATE_TRUNC('year', timezone(${ADMIN_DISPLAY_TIME_ZONE}, created_at)), 'YYYY') AS period_key,
      COALESCE(SUM(
        CASE
          WHEN jsonb_typeof(images) = 'object'
            THEN (SELECT COUNT(*) FROM jsonb_object_keys(images))
          ELSE 0
        END
        + CASE
          WHEN og_image_key IS NOT NULL AND og_image_key <> '' THEN 1
          ELSE 0
        END
      ), 0)::int AS count
    FROM shared_designs
    WHERE created_at >= ${rangeStartIso}::timestamptz
    GROUP BY 1 ORDER BY 1 ASC
  `) as CountRow[];
}

async function fetchDesignSeries(
  trunc: (typeof GRANULARITY_CONFIG)[AdminAnalyticsGranularity]["trunc"],
  rangeStartIso: string
): Promise<CountRow[]> {
  const sql = getSql();
  if (trunc === "day") {
    return (await sql`
      SELECT TO_CHAR(DATE_TRUNC('day', timezone(${ADMIN_DISPLAY_TIME_ZONE}, created_at)), 'YYYY-MM-DD') AS period_key, COUNT(*)::int AS count
      FROM shared_designs
      WHERE created_at >= ${rangeStartIso}::timestamptz
      GROUP BY 1 ORDER BY 1 ASC
    `) as CountRow[];
  }
  if (trunc === "week") {
    return (await sql`
      SELECT TO_CHAR(DATE_TRUNC('week', timezone(${ADMIN_DISPLAY_TIME_ZONE}, created_at)), 'YYYY-MM-DD') AS period_key, COUNT(*)::int AS count
      FROM shared_designs
      WHERE created_at >= ${rangeStartIso}::timestamptz
      GROUP BY 1 ORDER BY 1 ASC
    `) as CountRow[];
  }
  if (trunc === "month") {
    return (await sql`
      SELECT TO_CHAR(DATE_TRUNC('month', timezone(${ADMIN_DISPLAY_TIME_ZONE}, created_at)), 'YYYY-MM') AS period_key, COUNT(*)::int AS count
      FROM shared_designs
      WHERE created_at >= ${rangeStartIso}::timestamptz
      GROUP BY 1 ORDER BY 1 ASC
    `) as CountRow[];
  }
  if (trunc === "quarter") {
    return (await sql`
      SELECT TO_CHAR(DATE_TRUNC('quarter', timezone(${ADMIN_DISPLAY_TIME_ZONE}, created_at)), 'YYYY-"Q"Q') AS period_key, COUNT(*)::int AS count
      FROM shared_designs
      WHERE created_at >= ${rangeStartIso}::timestamptz
      GROUP BY 1 ORDER BY 1 ASC
    `) as CountRow[];
  }
  return (await sql`
    SELECT TO_CHAR(DATE_TRUNC('year', timezone(${ADMIN_DISPLAY_TIME_ZONE}, created_at)), 'YYYY') AS period_key, COUNT(*)::int AS count
    FROM shared_designs
    WHERE created_at >= ${rangeStartIso}::timestamptz
    GROUP BY 1 ORDER BY 1 ASC
  `) as CountRow[];
}

export async function getAdminAnalytics(
  granularityInput?: string | null
): Promise<AdminAnalytics> {
  const granularity = parseAnalyticsGranularity(granularityInput);
  const sql = getSql();
  const { buckets, trunc, periods, rangeStart, rangeEnd } = buildPeriodSpine(granularity);
  const rangeStartIso = rangeStart.toISOString();

  const [signupRows, verificationRows, firstDesignRows, designRows, imageRows, userDesignTotals, s3Inventory] =
    await Promise.all([
      fetchSignupSeries(trunc, rangeStartIso),
      fetchVerificationSeries(trunc, rangeStartIso),
      fetchFirstDesignSeries(trunc, rangeStartIso),
      fetchDesignSeries(trunc, rangeStartIso),
      fetchImageSeries(trunc, rangeStartIso),
      sql`
        SELECT
          COUNT(DISTINCT u.id) FILTER (WHERE sd.id IS NOT NULL)::int AS with_design,
          COUNT(DISTINCT u.id) FILTER (WHERE sd.id IS NULL)::int AS without_design
        FROM users u
        LEFT JOIN shared_designs sd ON sd.user_id = u.id
      `,
      getS3Inventory(),
    ]);

  const designTotals = userDesignTotals as { with_design: number; without_design: number }[];

  const signupsMap = mapSignupRows(signupRows);
  const verificationsMap = mapCountRows(verificationRows);
  const firstDesignMap = mapCountRows(firstDesignRows);
  const designsMap = mapCountRows(designRows);
  const imagesMap = mapCountRows(imageRows);
  const s3Series = s3Inventory.ok ? bucketS3Inventory(s3Inventory.objects, periods, trunc) : [];

  const series: AdminAnalyticsSeriesPoint[] = periods.map((period, index) => {
    const signup = signupsMap.get(period.key);
    const s3Point = s3Series[index];
    return {
      periodStart: period.periodStart,
      label: period.label,
      signupsEmail: signup?.email ?? 0,
      signupsGoogle: signup?.google ?? 0,
      signupsVerified: signup?.verified ?? 0,
      signupsUnverified: signup?.unverified ?? 0,
      verifications: verificationsMap.get(period.key) ?? 0,
      usersWithFirstDesign: firstDesignMap.get(period.key) ?? 0,
      designsCreated: designsMap.get(period.key) ?? 0,
      imagesUploaded: s3Point?.imagesUploaded ?? imagesMap.get(period.key) ?? 0,
      bytesUploaded: s3Point?.bytesUploaded ?? 0,
    };
  });

  const summary = series.reduce(
    (acc, point) => {
      acc.signupsEmail += point.signupsEmail;
      acc.signupsGoogle += point.signupsGoogle;
      acc.signupsVerified += point.signupsVerified;
      acc.signupsUnverified += point.signupsUnverified;
      acc.verifications += point.verifications;
      acc.usersWithFirstDesign += point.usersWithFirstDesign;
      acc.designsCreated += point.designsCreated;
      acc.imagesUploaded += point.imagesUploaded;
      acc.bytesUploaded += point.bytesUploaded;
      return acc;
    },
    {
      signups: 0,
      signupsEmail: 0,
      signupsGoogle: 0,
      signupsVerified: 0,
      signupsUnverified: 0,
      verifications: 0,
      usersWithFirstDesign: 0,
      designsCreated: 0,
      imagesUploaded: 0,
      bytesUploaded: 0,
      usersWithDesignTotal: designTotals[0]?.with_design ?? 0,
      usersWithoutDesignTotal: designTotals[0]?.without_design ?? 0,
    }
  );
  summary.signups = summary.signupsEmail + summary.signupsGoogle;

  return {
    granularity,
    buckets,
    rangeStart: rangeStart.toISOString(),
    rangeEnd: rangeEnd.toISOString(),
    summary,
    s3Available: s3Inventory.ok,
    s3Error: s3Inventory.ok ? undefined : s3Inventory.error,
    series,
  };
}
