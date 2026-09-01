import { getSql } from "../db";
import { buildShareThumbnailUrl } from "../shareService";
import type { AdminDesignRow, AdminStats, AdminUserRow, PaginatedResult } from "./types";

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

type DesignFilter = "all" | "owned" | "anonymous" | "expired";

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
  return rows.map((row) => ({
    date: row.day,
    count: Number(row.count) || 0,
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

  const signupsByDay = (await sql`
    SELECT DATE(created_at)::text AS day, COUNT(*)::int AS count
    FROM users
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(created_at)
    ORDER BY day ASC
  `) as DailyCountRow[];

  const designsByDay = (await sql`
    SELECT DATE(created_at)::text AS day, COUNT(*)::int AS count
    FROM shared_designs
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(created_at)
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

export async function listAdminUsers(options?: {
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<PaginatedResult<AdminUserRow>> {
  const sql = getSql();
  const page = clampPage(options?.page ?? 1);
  const pageSize = clampPageSize(options?.pageSize ?? DEFAULT_PAGE_SIZE);
  const offset = (page - 1) * pageSize;
  const search = options?.search?.trim().toLowerCase() ?? "";
  const searchPattern = search ? `%${search}%` : null;

  const countRows = searchPattern
    ? ((await sql`
        SELECT COUNT(*)::int AS total
        FROM users u
        WHERE LOWER(u.email) LIKE ${searchPattern}
           OR LOWER(COALESCE(u.name, '')) LIKE ${searchPattern}
      `) as { total: number }[])
    : ((await sql`SELECT COUNT(*)::int AS total FROM users`) as { total: number }[]);

  const total = countRows[0]?.total ?? 0;

  const rows = searchPattern
    ? ((await sql`
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
        WHERE LOWER(u.email) LIKE ${searchPattern}
           OR LOWER(COALESCE(u.name, '')) LIKE ${searchPattern}
           OR LOWER(COALESCE(u.utm_source, '')) LIKE ${searchPattern}
           OR LOWER(COALESCE(u.utm_campaign, '')) LIKE ${searchPattern}
        GROUP BY u.id
        ORDER BY u.created_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `) as {
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
      }[])
    : ((await sql`
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
        GROUP BY u.id
        ORDER BY u.created_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `) as {
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
      }[]);

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

async function countDesigns(filter: DesignFilter, searchPattern: string | null): Promise<number> {
  const sql = getSql();

  if (searchPattern) {
    if (filter === "owned") {
      const rows = (await sql`
        SELECT COUNT(*)::int AS total
        FROM shared_designs sd
        LEFT JOIN users u ON u.id = sd.user_id
        WHERE sd.user_id IS NOT NULL
          AND (
            LOWER(COALESCE(sd.name, '')) LIKE ${searchPattern}
            OR LOWER(sd.id) LIKE ${searchPattern}
            OR LOWER(COALESCE(u.email, '')) LIKE ${searchPattern}
          )
      `) as { total: number }[];
      return rows[0]?.total ?? 0;
    }
    if (filter === "anonymous") {
      const rows = (await sql`
        SELECT COUNT(*)::int AS total
        FROM shared_designs sd
        WHERE sd.user_id IS NULL
          AND (
            LOWER(COALESCE(sd.name, '')) LIKE ${searchPattern}
            OR LOWER(sd.id) LIKE ${searchPattern}
          )
      `) as { total: number }[];
      return rows[0]?.total ?? 0;
    }
    if (filter === "expired") {
      const rows = (await sql`
        SELECT COUNT(*)::int AS total
        FROM shared_designs sd
        LEFT JOIN users u ON u.id = sd.user_id
        WHERE sd.expires_at IS NOT NULL AND sd.expires_at <= NOW()
          AND (
            LOWER(COALESCE(sd.name, '')) LIKE ${searchPattern}
            OR LOWER(sd.id) LIKE ${searchPattern}
            OR LOWER(COALESCE(u.email, '')) LIKE ${searchPattern}
          )
      `) as { total: number }[];
      return rows[0]?.total ?? 0;
    }
    const rows = (await sql`
      SELECT COUNT(*)::int AS total
      FROM shared_designs sd
      LEFT JOIN users u ON u.id = sd.user_id
      WHERE
        LOWER(COALESCE(sd.name, '')) LIKE ${searchPattern}
        OR LOWER(sd.id) LIKE ${searchPattern}
        OR LOWER(COALESCE(u.email, '')) LIKE ${searchPattern}
    `) as { total: number }[];
    return rows[0]?.total ?? 0;
  }

  if (filter === "owned") {
    const rows = (await sql`
      SELECT COUNT(*)::int AS total FROM shared_designs WHERE user_id IS NOT NULL
    `) as { total: number }[];
    return rows[0]?.total ?? 0;
  }
  if (filter === "anonymous") {
    const rows = (await sql`
      SELECT COUNT(*)::int AS total FROM shared_designs WHERE user_id IS NULL
    `) as { total: number }[];
    return rows[0]?.total ?? 0;
  }
  if (filter === "expired") {
    const rows = (await sql`
      SELECT COUNT(*)::int AS total
      FROM shared_designs
      WHERE expires_at IS NOT NULL AND expires_at <= NOW()
    `) as { total: number }[];
    return rows[0]?.total ?? 0;
  }
  const rows = (await sql`SELECT COUNT(*)::int AS total FROM shared_designs`) as { total: number }[];
  return rows[0]?.total ?? 0;
}

async function fetchDesigns(
  filter: DesignFilter,
  searchPattern: string | null,
  pageSize: number,
  offset: number
): Promise<DesignDbRow[]> {
  const sql = getSql();

  if (searchPattern) {
    if (filter === "owned") {
      return (await sql`
        SELECT
          sd.id, sd.name, sd.preview_token, sd.user_id,
          u.email AS owner_email, u.name AS owner_name,
          sd.created_at, sd.updated_at, sd.expires_at, sd.view_count,
          sd.og_image_key, sd.images,
          (sd.expires_at IS NOT NULL AND sd.expires_at <= NOW()) AS is_expired
        FROM shared_designs sd
        LEFT JOIN users u ON u.id = sd.user_id
        WHERE sd.user_id IS NOT NULL
          AND (
            LOWER(COALESCE(sd.name, '')) LIKE ${searchPattern}
            OR LOWER(sd.id) LIKE ${searchPattern}
            OR LOWER(COALESCE(u.email, '')) LIKE ${searchPattern}
          )
        ORDER BY sd.created_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `) as DesignDbRow[];
    }
    if (filter === "anonymous") {
      return (await sql`
        SELECT
          sd.id, sd.name, sd.preview_token, sd.user_id,
          u.email AS owner_email, u.name AS owner_name,
          sd.created_at, sd.updated_at, sd.expires_at, sd.view_count,
          sd.og_image_key, sd.images,
          (sd.expires_at IS NOT NULL AND sd.expires_at <= NOW()) AS is_expired
        FROM shared_designs sd
        LEFT JOIN users u ON u.id = sd.user_id
        WHERE sd.user_id IS NULL
          AND (
            LOWER(COALESCE(sd.name, '')) LIKE ${searchPattern}
            OR LOWER(sd.id) LIKE ${searchPattern}
          )
        ORDER BY sd.created_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `) as DesignDbRow[];
    }
    if (filter === "expired") {
      return (await sql`
        SELECT
          sd.id, sd.name, sd.preview_token, sd.user_id,
          u.email AS owner_email, u.name AS owner_name,
          sd.created_at, sd.updated_at, sd.expires_at, sd.view_count,
          sd.og_image_key, sd.images,
          (sd.expires_at IS NOT NULL AND sd.expires_at <= NOW()) AS is_expired
        FROM shared_designs sd
        LEFT JOIN users u ON u.id = sd.user_id
        WHERE sd.expires_at IS NOT NULL AND sd.expires_at <= NOW()
          AND (
            LOWER(COALESCE(sd.name, '')) LIKE ${searchPattern}
            OR LOWER(sd.id) LIKE ${searchPattern}
            OR LOWER(COALESCE(u.email, '')) LIKE ${searchPattern}
          )
        ORDER BY sd.created_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `) as DesignDbRow[];
    }
    return (await sql`
      SELECT
        sd.id, sd.name, sd.preview_token, sd.user_id,
        u.email AS owner_email, u.name AS owner_name,
        sd.created_at, sd.updated_at, sd.expires_at, sd.view_count,
        sd.og_image_key, sd.images,
        (sd.expires_at IS NOT NULL AND sd.expires_at <= NOW()) AS is_expired
      FROM shared_designs sd
      LEFT JOIN users u ON u.id = sd.user_id
      WHERE
        LOWER(COALESCE(sd.name, '')) LIKE ${searchPattern}
        OR LOWER(sd.id) LIKE ${searchPattern}
        OR LOWER(COALESCE(u.email, '')) LIKE ${searchPattern}
      ORDER BY sd.created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `) as DesignDbRow[];
  }

  if (filter === "owned") {
    return (await sql`
      SELECT
        sd.id, sd.name, sd.preview_token, sd.user_id,
        u.email AS owner_email, u.name AS owner_name,
        sd.created_at, sd.updated_at, sd.expires_at, sd.view_count,
        sd.og_image_key, sd.images,
        (sd.expires_at IS NOT NULL AND sd.expires_at <= NOW()) AS is_expired
      FROM shared_designs sd
      LEFT JOIN users u ON u.id = sd.user_id
      WHERE sd.user_id IS NOT NULL
      ORDER BY sd.created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `) as DesignDbRow[];
  }
  if (filter === "anonymous") {
    return (await sql`
      SELECT
        sd.id, sd.name, sd.preview_token, sd.user_id,
        u.email AS owner_email, u.name AS owner_name,
        sd.created_at, sd.updated_at, sd.expires_at, sd.view_count,
        sd.og_image_key, sd.images,
        (sd.expires_at IS NOT NULL AND sd.expires_at <= NOW()) AS is_expired
      FROM shared_designs sd
      LEFT JOIN users u ON u.id = sd.user_id
      WHERE sd.user_id IS NULL
      ORDER BY sd.created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `) as DesignDbRow[];
  }
  if (filter === "expired") {
    return (await sql`
      SELECT
        sd.id, sd.name, sd.preview_token, sd.user_id,
        u.email AS owner_email, u.name AS owner_name,
        sd.created_at, sd.updated_at, sd.expires_at, sd.view_count,
        sd.og_image_key, sd.images,
        (sd.expires_at IS NOT NULL AND sd.expires_at <= NOW()) AS is_expired
      FROM shared_designs sd
      LEFT JOIN users u ON u.id = sd.user_id
      WHERE sd.expires_at IS NOT NULL AND sd.expires_at <= NOW()
      ORDER BY sd.created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `) as DesignDbRow[];
  }
  return (await sql`
    SELECT
      sd.id, sd.name, sd.preview_token, sd.user_id,
      u.email AS owner_email, u.name AS owner_name,
      sd.created_at, sd.updated_at, sd.expires_at, sd.view_count,
      sd.og_image_key, sd.images,
      (sd.expires_at IS NOT NULL AND sd.expires_at <= NOW()) AS is_expired
    FROM shared_designs sd
    LEFT JOIN users u ON u.id = sd.user_id
    ORDER BY sd.created_at DESC
    LIMIT ${pageSize} OFFSET ${offset}
  `) as DesignDbRow[];
}

export async function listAdminDesigns(options?: {
  page?: number;
  pageSize?: number;
  search?: string;
  filter?: DesignFilter;
}): Promise<PaginatedResult<AdminDesignRow>> {
  const page = clampPage(options?.page ?? 1);
  const pageSize = clampPageSize(options?.pageSize ?? DEFAULT_PAGE_SIZE);
  const offset = (page - 1) * pageSize;
  const search = options?.search?.trim().toLowerCase() ?? "";
  const searchPattern = search ? `%${search}%` : null;
  const filter = options?.filter ?? "all";

  const total = await countDesigns(filter, searchPattern);
  const rows = await fetchDesigns(filter, searchPattern, pageSize, offset);

  return {
    items: rows.map(mapDesignRow),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
