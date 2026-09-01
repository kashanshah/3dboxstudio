import { getSql } from "../db";
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

function startOfPeriod(date: Date, trunc: (typeof GRANULARITY_CONFIG)[AdminAnalyticsGranularity]["trunc"]): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  if (trunc === "day") return d;
  if (trunc === "week") {
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d;
  }
  if (trunc === "month") {
    d.setDate(1);
    return d;
  }
  if (trunc === "quarter") {
    d.setDate(1);
    d.setMonth(Math.floor(d.getMonth() / 3) * 3);
    return d;
  }
  d.setMonth(0, 1);
  return d;
}

function addPeriod(date: Date, trunc: (typeof GRANULARITY_CONFIG)[AdminAnalyticsGranularity]["trunc"], delta: number): Date {
  const d = new Date(date);
  if (trunc === "day") {
    d.setDate(d.getDate() + delta);
    return d;
  }
  if (trunc === "week") {
    d.setDate(d.getDate() + delta * 7);
    return d;
  }
  if (trunc === "month") {
    d.setMonth(d.getMonth() + delta);
    return d;
  }
  if (trunc === "quarter") {
    d.setMonth(d.getMonth() + delta * 3);
    return d;
  }
  d.setFullYear(d.getFullYear() + delta);
  return d;
}

function periodKey(date: Date, trunc: (typeof GRANULARITY_CONFIG)[AdminAnalyticsGranularity]["trunc"]): string {
  const start = startOfPeriod(date, trunc);
  if (trunc === "year") return String(start.getFullYear());
  if (trunc === "quarter") {
    const q = Math.floor(start.getMonth() / 3) + 1;
    return `${start.getFullYear()}-Q${q}`;
  }
  if (trunc === "month") {
    const month = String(start.getMonth() + 1).padStart(2, "0");
    return `${start.getFullYear()}-${month}`;
  }
  return start.toISOString().slice(0, 10);
}

function formatLabel(date: Date, trunc: (typeof GRANULARITY_CONFIG)[AdminAnalyticsGranularity]["trunc"]): string {
  const start = startOfPeriod(date, trunc);
  if (trunc === "year") return String(start.getFullYear());
  if (trunc === "quarter") {
    const q = Math.floor(start.getMonth() / 3) + 1;
    return `Q${q} ${start.getFullYear()}`;
  }
  if (trunc === "month") {
    return start.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  }
  if (trunc === "week") {
    return start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function buildPeriodSpine(granularity: AdminAnalyticsGranularity) {
  const { buckets, trunc } = GRANULARITY_CONFIG[granularity];
  const rangeEnd = startOfPeriod(new Date(), trunc);
  const rangeStart = addPeriod(rangeEnd, trunc, -(buckets - 1));
  const periods: { periodStart: string; label: string; key: string }[] = [];

  for (let i = 0; i < buckets; i++) {
    const date = addPeriod(rangeStart, trunc, i);
    periods.push({
      periodStart: startOfPeriod(date, trunc).toISOString(),
      label: formatLabel(date, trunc),
      key: periodKey(date, trunc),
    });
  }

  return { buckets, trunc, periods, rangeStart, rangeEnd };
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
        TO_CHAR(DATE_TRUNC('day', created_at), 'YYYY-MM-DD') AS period_key,
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
        TO_CHAR(DATE_TRUNC('week', created_at), 'YYYY-MM-DD') AS period_key,
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
        TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS period_key,
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
        TO_CHAR(DATE_TRUNC('quarter', created_at), 'YYYY-"Q"Q') AS period_key,
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
      TO_CHAR(DATE_TRUNC('year', created_at), 'YYYY') AS period_key,
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
      SELECT TO_CHAR(DATE_TRUNC('day', email_verified_at), 'YYYY-MM-DD') AS period_key, COUNT(*)::int AS count
      FROM users
      WHERE email_verified_at IS NOT NULL AND email_verified_at >= ${rangeStartIso}::timestamptz
      GROUP BY 1 ORDER BY 1 ASC
    `) as CountRow[];
  }
  if (trunc === "week") {
    return (await sql`
      SELECT TO_CHAR(DATE_TRUNC('week', email_verified_at), 'YYYY-MM-DD') AS period_key, COUNT(*)::int AS count
      FROM users
      WHERE email_verified_at IS NOT NULL AND email_verified_at >= ${rangeStartIso}::timestamptz
      GROUP BY 1 ORDER BY 1 ASC
    `) as CountRow[];
  }
  if (trunc === "month") {
    return (await sql`
      SELECT TO_CHAR(DATE_TRUNC('month', email_verified_at), 'YYYY-MM') AS period_key, COUNT(*)::int AS count
      FROM users
      WHERE email_verified_at IS NOT NULL AND email_verified_at >= ${rangeStartIso}::timestamptz
      GROUP BY 1 ORDER BY 1 ASC
    `) as CountRow[];
  }
  if (trunc === "quarter") {
    return (await sql`
      SELECT TO_CHAR(DATE_TRUNC('quarter', email_verified_at), 'YYYY-"Q"Q') AS period_key, COUNT(*)::int AS count
      FROM users
      WHERE email_verified_at IS NOT NULL AND email_verified_at >= ${rangeStartIso}::timestamptz
      GROUP BY 1 ORDER BY 1 ASC
    `) as CountRow[];
  }
  return (await sql`
    SELECT TO_CHAR(DATE_TRUNC('year', email_verified_at), 'YYYY') AS period_key, COUNT(*)::int AS count
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
      SELECT TO_CHAR(DATE_TRUNC('day', first_at), 'YYYY-MM-DD') AS period_key, COUNT(*)::int AS count
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
      SELECT TO_CHAR(DATE_TRUNC('week', first_at), 'YYYY-MM-DD') AS period_key, COUNT(*)::int AS count
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
      SELECT TO_CHAR(DATE_TRUNC('month', first_at), 'YYYY-MM') AS period_key, COUNT(*)::int AS count
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
      SELECT TO_CHAR(DATE_TRUNC('quarter', first_at), 'YYYY-"Q"Q') AS period_key, COUNT(*)::int AS count
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
    SELECT TO_CHAR(DATE_TRUNC('year', first_at), 'YYYY') AS period_key, COUNT(*)::int AS count
    FROM first_design
    WHERE first_at >= ${rangeStartIso}::timestamptz
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
      SELECT TO_CHAR(DATE_TRUNC('day', created_at), 'YYYY-MM-DD') AS period_key, COUNT(*)::int AS count
      FROM shared_designs
      WHERE created_at >= ${rangeStartIso}::timestamptz
      GROUP BY 1 ORDER BY 1 ASC
    `) as CountRow[];
  }
  if (trunc === "week") {
    return (await sql`
      SELECT TO_CHAR(DATE_TRUNC('week', created_at), 'YYYY-MM-DD') AS period_key, COUNT(*)::int AS count
      FROM shared_designs
      WHERE created_at >= ${rangeStartIso}::timestamptz
      GROUP BY 1 ORDER BY 1 ASC
    `) as CountRow[];
  }
  if (trunc === "month") {
    return (await sql`
      SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS period_key, COUNT(*)::int AS count
      FROM shared_designs
      WHERE created_at >= ${rangeStartIso}::timestamptz
      GROUP BY 1 ORDER BY 1 ASC
    `) as CountRow[];
  }
  if (trunc === "quarter") {
    return (await sql`
      SELECT TO_CHAR(DATE_TRUNC('quarter', created_at), 'YYYY-"Q"Q') AS period_key, COUNT(*)::int AS count
      FROM shared_designs
      WHERE created_at >= ${rangeStartIso}::timestamptz
      GROUP BY 1 ORDER BY 1 ASC
    `) as CountRow[];
  }
  return (await sql`
    SELECT TO_CHAR(DATE_TRUNC('year', created_at), 'YYYY') AS period_key, COUNT(*)::int AS count
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

  const [signupRows, verificationRows, firstDesignRows, designRows, userDesignTotals] =
    await Promise.all([
      fetchSignupSeries(trunc, rangeStartIso),
      fetchVerificationSeries(trunc, rangeStartIso),
      fetchFirstDesignSeries(trunc, rangeStartIso),
      fetchDesignSeries(trunc, rangeStartIso),
      sql`
        SELECT
          COUNT(DISTINCT u.id) FILTER (WHERE sd.id IS NOT NULL)::int AS with_design,
          COUNT(DISTINCT u.id) FILTER (WHERE sd.id IS NULL)::int AS without_design
        FROM users u
        LEFT JOIN shared_designs sd ON sd.user_id = u.id
      `,
    ]);

  const designTotals = userDesignTotals as { with_design: number; without_design: number }[];

  const signupsMap = mapSignupRows(signupRows);
  const verificationsMap = mapCountRows(verificationRows);
  const firstDesignMap = mapCountRows(firstDesignRows);
  const designsMap = mapCountRows(designRows);

  const series: AdminAnalyticsSeriesPoint[] = periods.map((period) => {
    const signup = signupsMap.get(period.key);
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
    series,
  };
}
