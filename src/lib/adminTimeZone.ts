/** Admin dashboards and reports display timestamps in this IANA timezone. */
export const ADMIN_DISPLAY_TIME_ZONE =
  process.env.ADMIN_DISPLAY_TIMEZONE?.trim() || "America/Toronto";

export type AdminPeriodTrunc = "day" | "week" | "month" | "quarter" | "year";

type ZonedYmd = { year: number; month: number; day: number };

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function zonedParts(date: Date): ZonedYmd & { weekday: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: ADMIN_DISPLAY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    weekday: WEEKDAY_INDEX[get("weekday")] ?? 0,
  };
}

function addDaysYmd(ymd: ZonedYmd, days: number): ZonedYmd {
  const shifted = new Date(Date.UTC(ymd.year, ymd.month - 1, ymd.day + days));
  const parts = zonedParts(shifted);
  return { year: parts.year, month: parts.month, day: parts.day };
}

function addMonthsYmd(ymd: ZonedYmd, months: number): ZonedYmd {
  const shifted = new Date(Date.UTC(ymd.year, ymd.month - 1 + months, ymd.day));
  const parts = zonedParts(shifted);
  return { year: parts.year, month: parts.month, day: parts.day };
}

export function formatAdminDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ADMIN_DISPLAY_TIME_ZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  }).format(date);
}

export function startOfAdminPeriod(date: Date, trunc: AdminPeriodTrunc): ZonedYmd {
  const parts = zonedParts(date);
  if (trunc === "day") return { year: parts.year, month: parts.month, day: parts.day };
  if (trunc === "month") return { year: parts.year, month: parts.month, day: 1 };
  if (trunc === "quarter") {
    const month = Math.floor((parts.month - 1) / 3) * 3 + 1;
    return { year: parts.year, month, day: 1 };
  }
  if (trunc === "year") return { year: parts.year, month: 1, day: 1 };

  const diff = parts.weekday === 0 ? -6 : 1 - parts.weekday;
  return addDaysYmd({ year: parts.year, month: parts.month, day: parts.day }, diff);
}

export function addAdminPeriod(ymd: ZonedYmd, trunc: AdminPeriodTrunc, delta: number): ZonedYmd {
  if (trunc === "day") return addDaysYmd(ymd, delta);
  if (trunc === "week") return addDaysYmd(ymd, delta * 7);
  if (trunc === "month") return addMonthsYmd(ymd, delta);
  if (trunc === "quarter") return addMonthsYmd(ymd, delta * 3);
  return { year: ymd.year + delta, month: ymd.month, day: ymd.day };
}

export function adminPeriodKey(ymd: ZonedYmd, trunc: AdminPeriodTrunc): string {
  if (trunc === "year") return String(ymd.year);
  if (trunc === "quarter") {
    const quarter = Math.floor((ymd.month - 1) / 3) + 1;
    return `${ymd.year}-Q${quarter}`;
  }
  if (trunc === "month") {
    return `${ymd.year}-${String(ymd.month).padStart(2, "0")}`;
  }
  return `${ymd.year}-${String(ymd.month).padStart(2, "0")}-${String(ymd.day).padStart(2, "0")}`;
}

export function formatAdminPeriodLabel(ymd: ZonedYmd, trunc: AdminPeriodTrunc): string {
  const anchor = new Date(Date.UTC(ymd.year, ymd.month - 1, ymd.day, 12));
  if (trunc === "year") return String(ymd.year);
  if (trunc === "quarter") {
    const quarter = Math.floor((ymd.month - 1) / 3) + 1;
    return `Q${quarter} ${ymd.year}`;
  }
  if (trunc === "month") {
    return anchor.toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" });
  }
  return anchor.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

export function adminPeriodStartIso(ymd: ZonedYmd): string {
  return new Date(Date.UTC(ymd.year, ymd.month - 1, ymd.day)).toISOString();
}
