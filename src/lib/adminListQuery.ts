export const SORT_DIRS = ["asc", "desc"] as const;
export type SortDir = (typeof SORT_DIRS)[number];

export const USER_SORTS = [
  "email",
  "name",
  "landing",
  "conversion",
  "source",
  "method",
  "verified",
  "designs",
  "views",
  "created",
] as const;
export type UserSort = (typeof USER_SORTS)[number];

export const USER_VERIFIED_FILTERS = ["all", "verified", "pending"] as const;
export type UserVerifiedFilter = (typeof USER_VERIFIED_FILTERS)[number];

export const USER_METHOD_FILTERS = ["all", "email", "google"] as const;
export type UserMethodFilter = (typeof USER_METHOD_FILTERS)[number];

export const DESIGN_SORTS = ["name", "owner", "views", "images", "status", "created"] as const;
export type DesignSort = (typeof DESIGN_SORTS)[number];

export const DESIGN_FILTERS = ["all", "owned", "anonymous", "expired"] as const;
export type DesignFilter = (typeof DESIGN_FILTERS)[number];

export const DEFAULT_USER_SORT: UserSort = "created";
export const DEFAULT_DESIGN_SORT: DesignSort = "created";
export const DEFAULT_SORT_DIR: SortDir = "desc";

const USER_SORT_DEFAULT_DIR: Record<UserSort, SortDir> = {
  email: "asc",
  name: "asc",
  landing: "asc",
  conversion: "asc",
  source: "asc",
  method: "asc",
  verified: "desc",
  designs: "desc",
  views: "desc",
  created: "desc",
};

const DESIGN_SORT_DEFAULT_DIR: Record<DesignSort, SortDir> = {
  name: "asc",
  owner: "asc",
  views: "desc",
  images: "desc",
  status: "asc",
  created: "desc",
};

export type AdminUsersQuery = {
  page: number;
  search?: string;
  sort: UserSort;
  dir: SortDir;
  verified: UserVerifiedFilter;
  method: UserMethodFilter;
};

export type AdminDesignsQuery = {
  page: number;
  search?: string;
  sort: DesignSort;
  dir: SortDir;
  filter: DesignFilter;
};

function parseOneOf<T extends string>(
  value: string | undefined | null,
  allowed: readonly T[],
  fallback: T,
): T {
  if (value && (allowed as readonly string[]).includes(value)) return value as T;
  return fallback;
}

function optionalSearch(value: string | undefined | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

export function parseSortDir(value: string | undefined | null): SortDir {
  return parseOneOf(value, SORT_DIRS, DEFAULT_SORT_DIR);
}

export function parseAdminUsersQuery(params: {
  page?: string;
  search?: string;
  sort?: string;
  dir?: string;
  verified?: string;
  method?: string;
}): AdminUsersQuery {
  const page = Number(params.page ?? "1");
  return {
    page: Number.isFinite(page) && page > 1 ? Math.floor(page) : 1,
    search: optionalSearch(params.search),
    sort: parseOneOf(params.sort, USER_SORTS, DEFAULT_USER_SORT),
    dir: parseSortDir(params.dir),
    verified: parseOneOf(params.verified, USER_VERIFIED_FILTERS, "all"),
    method: parseOneOf(params.method, USER_METHOD_FILTERS, "all"),
  };
}

export function parseAdminDesignsQuery(params: {
  page?: string;
  search?: string;
  sort?: string;
  dir?: string;
  filter?: string;
}): AdminDesignsQuery {
  const page = Number(params.page ?? "1");
  return {
    page: Number.isFinite(page) && page > 1 ? Math.floor(page) : 1,
    search: optionalSearch(params.search),
    sort: parseOneOf(params.sort, DESIGN_SORTS, DEFAULT_DESIGN_SORT),
    dir: parseSortDir(params.dir),
    filter: parseOneOf(params.filter, DESIGN_FILTERS, "all"),
  };
}

export function nextUserSortDir(current: AdminUsersQuery, column: UserSort): SortDir {
  if (current.sort === column) return current.dir === "asc" ? "desc" : "asc";
  return USER_SORT_DEFAULT_DIR[column];
}

export function nextDesignSortDir(current: AdminDesignsQuery, column: DesignSort): SortDir {
  if (current.sort === column) return current.dir === "asc" ? "desc" : "asc";
  return DESIGN_SORT_DEFAULT_DIR[column];
}

function appendIfSet(params: URLSearchParams, key: string, value: string | undefined, skip?: string) {
  if (!value || value === skip) return;
  params.set(key, value);
}

function appendSort(
  params: URLSearchParams,
  sort: string | undefined,
  dir: SortDir | undefined,
  defaultSort: string,
) {
  const resolvedSort = sort ?? defaultSort;
  const resolvedDir = dir ?? DEFAULT_SORT_DIR;
  if (resolvedSort !== defaultSort) params.set("sort", resolvedSort);
  if (resolvedSort !== defaultSort || resolvedDir !== DEFAULT_SORT_DIR) {
    params.set("dir", resolvedDir);
  }
}

export function usersListHref(query: Partial<AdminUsersQuery>): string {
  const params = new URLSearchParams();
  appendIfSet(params, "search", query.search);
  appendSort(params, query.sort, query.dir, DEFAULT_USER_SORT);
  appendIfSet(params, "verified", query.verified, "all");
  appendIfSet(params, "method", query.method, "all");
  if (query.page && query.page > 1) params.set("page", String(query.page));
  const qs = params.toString();
  return qs ? `/admin/users?${qs}` : "/admin/users";
}

export function designsListHref(query: Partial<AdminDesignsQuery>): string {
  const params = new URLSearchParams();
  appendIfSet(params, "search", query.search);
  appendSort(params, query.sort, query.dir, DEFAULT_DESIGN_SORT);
  appendIfSet(params, "filter", query.filter, "all");
  if (query.page && query.page > 1) params.set("page", String(query.page));
  const qs = params.toString();
  return qs ? `/admin/designs?${qs}` : "/admin/designs";
}

export function usersQueryIsFiltered(query: AdminUsersQuery): boolean {
  return Boolean(query.search) || query.verified !== "all" || query.method !== "all";
}

export function designsQueryIsFiltered(query: AdminDesignsQuery): boolean {
  return Boolean(query.search) || query.filter !== "all";
}

export function resultRange(page: number, pageSize: number, total: number): { from: number; to: number } {
  if (total === 0) return { from: 0, to: 0 };
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return { from, to };
}
