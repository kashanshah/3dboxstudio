import { getSql } from "../db";
import { buildShareThumbnailUrl } from "../shareService";
import {
  ADMIN_DISPLAY_TIME_ZONE,
  addAdminPeriod,
  adminPeriodStartIso,
  listAdminDayKeys,
  startOfAdminPeriod,
} from "@/lib/adminTimeZone";
import type {
  DesignFilter,
  DesignSort,
  SortDir,
  UserMethodFilter,
  UserSort,
  UserVerifiedFilter,
} from "@/lib/adminListQuery";
import type { AdminDesignRow, AdminStats, AdminUserRow, PaginatedResult } from "./types";

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

type DesignDbRow = {
  id: string;
  name: string | null;
  preview_token: string | null;
  user_id: string | null;
  owner_email: string | null;
  owner_name: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  view_count: number;
  og_image_key: string | null;
  images: unknown;
  is_expired: boolean;
};

function clampPageSize(n: number): number {
  if (!Number.isFinite(n) || n < 1) return DEFAULT_PAGE_SIZE;
  return Math.min(Math.floor(n), MAX_PAGE_SIZE);
}

function clampPage(n: number): number {
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

type DailyCountRow = { day: string; count: number };

function mapDailyCounts(rows: DailyCountRow[]): { date: string; count: number }[] {
  const counts = new Map(rows.map((row) => [row.day, Number(row.count) || 0]));
  return listAdminDayKeys(30).map((date) => ({
    date,
    count: counts.get(date) ?? 0,
  }));
}

function countFaceImages(images: unknown): number {
  if (!images || typeof images !== "object") return 0;
  return Object.keys(images as Record<string, unknown>).length;
}

function mapDesignRow(row: DesignDbRow): AdminDesignRow {
  return {
    id: row.id,
    name: row.name,
    previewToken: row.preview_token,
    userId: row.user_id,
    ownerEmail: row.owner_email,
    ownerName: row.owner_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    expiresAt: row.expires_at,
    viewCount: row.view_count,
    isExpired: row.is_expired,
    isAnonymous: !row.user_id,
    hasOgImage: Boolean(row.og_image_key),
    faceImageCount: countFaceImages(row.images),
    thumbnailUrl: buildShareThumbnailUrl(row.og_image_key, row.updated_at),
  };
}

export async function getAdminStats(): Promise<AdminStats> {
  const sql = getSql();

  const [userStats] = (await sql`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE email_verified_at IS NOT NULL)::int AS verified,
      COUNT(*) FILTER (WHERE email_verified_at IS NULL)::int AS unverified,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::int AS last_7_days,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::int AS last_30_days
    FROM users
  `) as {
    total: number;
    verified: number;
    unverified: number;
    last_7_days: number;
    last_30_days: number;
  }[];

  const [designStats] = (await sql`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE user_id IS NOT NULL)::int AS owned,
      COUNT(*) FILTER (WHERE user_id IS NULL)::int AS anonymous,
      COUNT(*) FILTER (WHERE expires_at IS NOT NULL AND expires_at <= NOW())::int AS expired,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::int AS last_7_days,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::int AS last_30_days,
      COALESCE(SUM(view_count), 0)::int AS total_views
    FROM shared_designs
  `) as {
    total: number;
    owned: number;
    anonymous: number;
    expired: number;
    last_7_days: number;
    last_30_days: number;
    total_views: number;
  }[];

  const chartRangeStartIso = adminPeriodStartIso(
    addAdminPeriod(startOfAdminPeriod(new Date(), "day"), "day", -29),
  );

  const signupsByDay = (await sql`
    SELECT (timezone(${ADMIN_DISPLAY_TIME_ZONE}, created_at))::date::text AS day, COUNT(*)::int AS count
    FROM users
    WHERE created_at >= ${chartRangeStartIso}::timestamptz
    GROUP BY 1
    ORDER BY day ASC
  `) as DailyCountRow[];

  const designsByDay = (await sql`
    SELECT (timezone(${ADMIN_DISPLAY_TIME_ZONE}, created_at))::date::text AS day, COUNT(*)::int AS count
    FROM shared_designs
    WHERE created_at >= ${chartRangeStartIso}::timestamptz
    GROUP BY 1
    ORDER BY day ASC
  `) as DailyCountRow[];

  const signupsBySource = (await sql`
    SELECT COALESCE(NULLIF(TRIM(utm_source), ''), '(direct / unknown)') AS label, COUNT(*)::int AS count
    FROM users
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY 1
    ORDER BY count DESC, label ASC
    LIMIT 8
  `) as { label: string; count: number }[];

  const signupsByMethod = (await sql`
    SELECT COALESCE(NULLIF(TRIM(signup_method), ''), '(unknown)') AS label, COUNT(*)::int AS count
    FROM users
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY 1
    ORDER BY count DESC, label ASC
  `) as { label: string; count: number }[];

  const signupsByLandingType = (await sql`
    SELECT COALESCE(NULLIF(TRIM(signup_landing_type), ''), '(unknown)') AS label, COUNT(*)::int AS count
    FROM users
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY 1
    ORDER BY count DESC, label ASC
    LIMIT 10
  `) as { label: string; count: number }[];

  const signupsByConversionType = (await sql`
    SELECT
      CASE
        WHEN signup_conversion_page IS NULL OR TRIM(signup_conversion_page) = '' THEN '(unknown)'
        WHEN signup_conversion_page = '/studio' OR signup_conversion_page LIKE '/studio/%' THEN 'studio'
        WHEN signup_conversion_page = '/' THEN 'home'
        WHEN signup_conversion_page = '/blog' THEN 'blog_index'
        WHEN signup_conversion_page LIKE '/blog/%' THEN 'blog_post'
        WHEN signup_conversion_page = '/faq' THEN 'faq'
        WHEN signup_conversion_page = '/contact' THEN 'contact'
        ELSE 'other'
      END AS label,
      COUNT(*)::int AS count
    FROM users
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY 1
    ORDER BY count DESC, label ASC
  `) as { label: string; count: number }[];

  return {
    users: {
      total: userStats?.total ?? 0,
      verified: userStats?.verified ?? 0,
      unverified: userStats?.unverified ?? 0,
      last7Days: userStats?.last_7_days ?? 0,
      last30Days: userStats?.last_30_days ?? 0,
    },
    designs: {
      total: designStats?.total ?? 0,
      owned: designStats?.owned ?? 0,
      anonymous: designStats?.anonymous ?? 0,
      expired: designStats?.expired ?? 0,
      last7Days: designStats?.last_7_days ?? 0,
      last30Days: designStats?.last_30_days ?? 0,
      totalViews: designStats?.total_views ?? 0,
    },
    activity: {
      signupsByDay: mapDailyCounts(signupsByDay),
      designsByDay: mapDailyCounts(designsByDay),
      signupsBySource: signupsBySource.map((row) => ({
        label: row.label,
        count: Number(row.count) || 0,
      })),
      signupsByMethod: signupsByMethod.map((row) => ({
        label: row.label,
        count: Number(row.count) || 0,
      })),
      signupsByLandingType: signupsByLandingType.map((row) => ({
        label: row.label,
        count: Number(row.count) || 0,
      })),
      signupsByConversionType: signupsByConversionType.map((row) => ({
        label: row.label,
        count: Number(row.count) || 0,
      })),
    },
  };
}

function likePattern(search?: string): string {
  const q = search?.trim().toLowerCase() ?? "";
  if (!q) return "";
  return `%${q.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_")}%`;
}

type UserListRow = {
  id: string;
  email: string;
  name: string | null;
  email_verified_at: string | null;
  created_at: string;
  signup_method: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  signup_landing_page: string | null;
  signup_landing_type: string | null;
  signup_conversion_page: string | null;
  signup_referrer: string | null;
  design_count: number;
  total_views: number;
};

export async function listAdminUsers(options?: {
  page?: number;
  pageSize?: number;
  search?: string;
  sort?: UserSort;
  dir?: SortDir;
  verified?: UserVerifiedFilter;
  method?: UserMethodFilter;
}): Promise<PaginatedResult<AdminUserRow>> {
  const sql = getSql();
  const page = clampPage(options?.page ?? 1);
  const pageSize = clampPageSize(options?.pageSize ?? DEFAULT_PAGE_SIZE);
  const offset = (page - 1) * pageSize;
  const pattern = likePattern(options?.search);
  const applySearch = pattern ? 1 : 0;
  const sort = options?.sort ?? "created";
  const dir = options?.dir ?? "desc";
  const verified = options?.verified ?? "all";
  const method = options?.method ?? "all";

  const countRows = (await sql`
    SELECT COUNT(*)::int AS total
    FROM users u
    WHERE
      (
        ${applySearch} = 0
        OR LOWER(u.email) LIKE ${pattern} ESCAPE ${"\\"}
        OR LOWER(COALESCE(u.name, '')) LIKE ${pattern} ESCAPE ${"\\"}
        OR LOWER(COALESCE(u.utm_source, '')) LIKE ${pattern} ESCAPE ${"\\"}
        OR LOWER(COALESCE(u.utm_medium, '')) LIKE ${pattern} ESCAPE ${"\\"}
        OR LOWER(COALESCE(u.utm_campaign, '')) LIKE ${pattern} ESCAPE ${"\\"}
        OR LOWER(COALESCE(u.signup_referrer, '')) LIKE ${pattern} ESCAPE ${"\\"}
        OR LOWER(COALESCE(u.signup_method, '')) LIKE ${pattern} ESCAPE ${"\\"}
      )
      AND (
        ${verified} = 'all'
        OR (${verified} = 'verified' AND u.email_verified_at IS NOT NULL)
        OR (${verified} = 'pending' AND u.email_verified_at IS NULL)
      )
      AND (
        ${method} = 'all'
        OR (${method} = 'google' AND LOWER(COALESCE(u.signup_method, '')) = 'google')
        OR (
          ${method} = 'email'
          AND LOWER(COALESCE(NULLIF(TRIM(u.signup_method), ''), 'email')) <> 'google'
        )
      )
  `) as { total: number }[];

  const total = countRows[0]?.total ?? 0;

  const rows = (await sql`
    SELECT
      u.id,
      u.email,
      u.name,
      u.email_verified_at,
      u.created_at,
      u.signup_method,
      u.utm_source,
      u.utm_medium,
      u.utm_campaign,
      u.signup_landing_page,
      u.signup_landing_type,
      u.signup_conversion_page,
      u.signup_referrer,
      COUNT(sd.id)::int AS design_count,
      COALESCE(SUM(sd.view_count), 0)::int AS total_views
    FROM users u
    LEFT JOIN shared_designs sd ON sd.user_id = u.id
    WHERE
      (
        ${applySearch} = 0
        OR LOWER(u.email) LIKE ${pattern} ESCAPE ${"\\"}
        OR LOWER(COALESCE(u.name, '')) LIKE ${pattern} ESCAPE ${"\\"}
        OR LOWER(COALESCE(u.utm_source, '')) LIKE ${pattern} ESCAPE ${"\\"}
        OR LOWER(COALESCE(u.utm_medium, '')) LIKE ${pattern} ESCAPE ${"\\"}
        OR LOWER(COALESCE(u.utm_campaign, '')) LIKE ${pattern} ESCAPE ${"\\"}
        OR LOWER(COALESCE(u.signup_referrer, '')) LIKE ${pattern} ESCAPE ${"\\"}
        OR LOWER(COALESCE(u.signup_method, '')) LIKE ${pattern} ESCAPE ${"\\"}
      )
      AND (
        ${verified} = 'all'
        OR (${verified} = 'verified' AND u.email_verified_at IS NOT NULL)
        OR (${verified} = 'pending' AND u.email_verified_at IS NULL)
      )
      AND (
        ${method} = 'all'
        OR (${method} = 'google' AND LOWER(COALESCE(u.signup_method, '')) = 'google')
        OR (
          ${method} = 'email'
          AND LOWER(COALESCE(NULLIF(TRIM(u.signup_method), ''), 'email')) <> 'google'
        )
      )
    GROUP BY u.id
    ORDER BY
      CASE WHEN ${sort} = 'email' AND ${dir} = 'asc' THEN LOWER(u.email) END ASC NULLS LAST,
      CASE WHEN ${sort} = 'email' AND ${dir} = 'desc' THEN LOWER(u.email) END DESC NULLS LAST,
      CASE WHEN ${sort} = 'name' AND ${dir} = 'asc' THEN LOWER(COALESCE(u.name, '')) END ASC NULLS LAST,
      CASE WHEN ${sort} = 'name' AND ${dir} = 'desc' THEN LOWER(COALESCE(u.name, '')) END DESC NULLS LAST,
      CASE WHEN ${sort} = 'landing' AND ${dir} = 'asc' THEN LOWER(COALESCE(u.signup_landing_type, u.signup_landing_page, '')) END ASC NULLS LAST,
      CASE WHEN ${sort} = 'landing' AND ${dir} = 'desc' THEN LOWER(COALESCE(u.signup_landing_type, u.signup_landing_page, '')) END DESC NULLS LAST,
      CASE WHEN ${sort} = 'conversion' AND ${dir} = 'asc' THEN LOWER(COALESCE(u.signup_conversion_page, '')) END ASC NULLS LAST,
      CASE WHEN ${sort} = 'conversion' AND ${dir} = 'desc' THEN LOWER(COALESCE(u.signup_conversion_page, '')) END DESC NULLS LAST,
      CASE WHEN ${sort} = 'source' AND ${dir} = 'asc' THEN LOWER(COALESCE(u.utm_source, u.signup_referrer, '')) END ASC NULLS LAST,
      CASE WHEN ${sort} = 'source' AND ${dir} = 'desc' THEN LOWER(COALESCE(u.utm_source, u.signup_referrer, '')) END DESC NULLS LAST,
      CASE WHEN ${sort} = 'method' AND ${dir} = 'asc' THEN LOWER(COALESCE(u.signup_method, '')) END ASC NULLS LAST,
      CASE WHEN ${sort} = 'method' AND ${dir} = 'desc' THEN LOWER(COALESCE(u.signup_method, '')) END DESC NULLS LAST,
      CASE WHEN ${sort} = 'verified' AND ${dir} = 'asc' THEN (u.email_verified_at IS NOT NULL) END ASC NULLS LAST,
      CASE WHEN ${sort} = 'verified' AND ${dir} = 'desc' THEN (u.email_verified_at IS NOT NULL) END DESC NULLS LAST,
      CASE WHEN ${sort} = 'designs' AND ${dir} = 'asc' THEN COUNT(sd.id) END ASC NULLS LAST,
      CASE WHEN ${sort} = 'designs' AND ${dir} = 'desc' THEN COUNT(sd.id) END DESC NULLS LAST,
      CASE WHEN ${sort} = 'views' AND ${dir} = 'asc' THEN COALESCE(SUM(sd.view_count), 0) END ASC NULLS LAST,
      CASE WHEN ${sort} = 'views' AND ${dir} = 'desc' THEN COALESCE(SUM(sd.view_count), 0) END DESC NULLS LAST,
      CASE WHEN ${sort} = 'created' AND ${dir} = 'asc' THEN u.created_at END ASC NULLS LAST,
      CASE WHEN ${sort} = 'created' AND ${dir} = 'desc' THEN u.created_at END DESC NULLS LAST,
      u.created_at DESC,
      u.id DESC
    LIMIT ${pageSize} OFFSET ${offset}
  `) as UserListRow[];

  const items: AdminUserRow[] = rows.map((row) => ({
    id: row.id,
    email: row.email,
    name: row.name,
    emailVerified: Boolean(row.email_verified_at),
    createdAt: row.created_at,
    designCount: row.design_count,
    totalViews: row.total_views,
    signupMethod: row.signup_method,
    utmSource: row.utm_source,
    utmMedium: row.utm_medium,
    utmCampaign: row.utm_campaign,
    signupLandingPage: row.signup_landing_page,
    signupLandingType: row.signup_landing_type,
    signupConversionPage: row.signup_conversion_page,
    signupReferrer: row.signup_referrer,
  }));

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function listAdminDesigns(options?: {
  page?: number;
  pageSize?: number;
  search?: string;
  filter?: DesignFilter;
  sort?: DesignSort;
  dir?: SortDir;
}): Promise<PaginatedResult<AdminDesignRow>> {
  const sql = getSql();
  const page = clampPage(options?.page ?? 1);
  const pageSize = clampPageSize(options?.pageSize ?? DEFAULT_PAGE_SIZE);
  const offset = (page - 1) * pageSize;
  const pattern = likePattern(options?.search);
  const applySearch = pattern ? 1 : 0;
  const filter = options?.filter ?? "all";
  const sort = options?.sort ?? "created";
  const dir = options?.dir ?? "desc";

  const countRows = (await sql`
    SELECT COUNT(*)::int AS total
    FROM shared_designs sd
    LEFT JOIN users u ON u.id = sd.user_id
    WHERE
      (
        ${applySearch} = 0
        OR LOWER(COALESCE(sd.name, '')) LIKE ${pattern} ESCAPE ${"\\"}
        OR LOWER(sd.id) LIKE ${pattern} ESCAPE ${"\\"}
        OR LOWER(COALESCE(u.email, '')) LIKE ${pattern} ESCAPE ${"\\"}
        OR LOWER(COALESCE(u.name, '')) LIKE ${pattern} ESCAPE ${"\\"}
      )
      AND (
        ${filter} = 'all'
        OR (${filter} = 'owned' AND sd.user_id IS NOT NULL)
        OR (${filter} = 'anonymous' AND sd.user_id IS NULL)
        OR (${filter} = 'expired' AND sd.expires_at IS NOT NULL AND sd.expires_at <= NOW())
      )
  `) as { total: number }[];

  const total = countRows[0]?.total ?? 0;

  const rows = (await sql`
    SELECT
      sd.id, sd.name, sd.preview_token, sd.user_id,
      u.email AS owner_email, u.name AS owner_name,
      sd.created_at, sd.updated_at, sd.expires_at, sd.view_count,
      sd.og_image_key, sd.images,
      (sd.expires_at IS NOT NULL AND sd.expires_at <= NOW()) AS is_expired
    FROM shared_designs sd
    LEFT JOIN users u ON u.id = sd.user_id
    WHERE
      (
        ${applySearch} = 0
        OR LOWER(COALESCE(sd.name, '')) LIKE ${pattern} ESCAPE ${"\\"}
        OR LOWER(sd.id) LIKE ${pattern} ESCAPE ${"\\"}
        OR LOWER(COALESCE(u.email, '')) LIKE ${pattern} ESCAPE ${"\\"}
        OR LOWER(COALESCE(u.name, '')) LIKE ${pattern} ESCAPE ${"\\"}
      )
      AND (
        ${filter} = 'all'
        OR (${filter} = 'owned' AND sd.user_id IS NOT NULL)
        OR (${filter} = 'anonymous' AND sd.user_id IS NULL)
        OR (${filter} = 'expired' AND sd.expires_at IS NOT NULL AND sd.expires_at <= NOW())
      )
    ORDER BY
      CASE WHEN ${sort} = 'name' AND ${dir} = 'asc' THEN LOWER(COALESCE(NULLIF(TRIM(sd.name), ''), 'untitled')) END ASC NULLS LAST,
      CASE WHEN ${sort} = 'name' AND ${dir} = 'desc' THEN LOWER(COALESCE(NULLIF(TRIM(sd.name), ''), 'untitled')) END DESC NULLS LAST,
      CASE WHEN ${sort} = 'owner' AND ${dir} = 'asc' THEN LOWER(COALESCE(u.email, '')) END ASC NULLS LAST,
      CASE WHEN ${sort} = 'owner' AND ${dir} = 'desc' THEN LOWER(COALESCE(u.email, '')) END DESC NULLS LAST,
      CASE WHEN ${sort} = 'views' AND ${dir} = 'asc' THEN sd.view_count END ASC NULLS LAST,
      CASE WHEN ${sort} = 'views' AND ${dir} = 'desc' THEN sd.view_count END DESC NULLS LAST,
      CASE WHEN ${sort} = 'images' AND ${dir} = 'asc' THEN (
        CASE WHEN jsonb_typeof(sd.images) = 'object'
          THEN (SELECT COUNT(*)::int FROM jsonb_object_keys(sd.images))
          ELSE 0
        END + CASE WHEN sd.og_image_key IS NOT NULL AND sd.og_image_key <> '' THEN 1 ELSE 0 END
      ) END ASC NULLS LAST,
      CASE WHEN ${sort} = 'images' AND ${dir} = 'desc' THEN (
        CASE WHEN jsonb_typeof(sd.images) = 'object'
          THEN (SELECT COUNT(*)::int FROM jsonb_object_keys(sd.images))
          ELSE 0
        END + CASE WHEN sd.og_image_key IS NOT NULL AND sd.og_image_key <> '' THEN 1 ELSE 0 END
      ) END DESC NULLS LAST,
      CASE WHEN ${sort} = 'status' AND ${dir} = 'asc' THEN (
        CASE
          WHEN sd.expires_at IS NOT NULL AND sd.expires_at <= NOW() THEN 0
          WHEN sd.user_id IS NULL THEN 1
          ELSE 2
        END
      ) END ASC NULLS LAST,
      CASE WHEN ${sort} = 'status' AND ${dir} = 'desc' THEN (
        CASE
          WHEN sd.expires_at IS NOT NULL AND sd.expires_at <= NOW() THEN 0
          WHEN sd.user_id IS NULL THEN 1
          ELSE 2
        END
      ) END DESC NULLS LAST,
      CASE WHEN ${sort} = 'created' AND ${dir} = 'asc' THEN sd.created_at END ASC NULLS LAST,
      CASE WHEN ${sort} = 'created' AND ${dir} = 'desc' THEN sd.created_at END DESC NULLS LAST,
      sd.created_at DESC,
      sd.id DESC
    LIMIT ${pageSize} OFFSET ${offset}
  `) as DesignDbRow[];

  return {
    items: rows.map(mapDesignRow),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
