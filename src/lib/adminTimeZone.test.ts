import { describe, expect, it } from "vitest";
import {
  addAdminPeriod,
  adminPeriodKey,
  adminPeriodStartIso,
  listAdminDayKeys,
  startOfAdminPeriod,
} from "./adminTimeZone";

describe("admin period arithmetic", () => {
  it("adds calendar days without shifting for Toronto UTC offset", () => {
    const today = { year: 2026, month: 9, day: 3 };
    expect(addAdminPeriod(today, "day", 0)).toEqual(today);
    expect(addAdminPeriod(today, "day", -1)).toEqual({ year: 2026, month: 9, day: 2 });
    expect(addAdminPeriod(today, "day", -29)).toEqual({ year: 2026, month: 8, day: 5 });
  });

  it("starts daily buckets on the Toronto calendar date", () => {
    // 12:10 AM EDT on Sep 3, 2026
    const now = new Date("2026-09-03T04:10:00.000Z");
    expect(startOfAdminPeriod(now, "day")).toEqual({ year: 2026, month: 9, day: 3 });
    expect(startOfAdminPeriod(now, "week")).toEqual({ year: 2026, month: 8, day: 31 });
  });

  it("converts Toronto midnight to the correct UTC instant", () => {
    // EDT (UTC-4)
    expect(adminPeriodStartIso({ year: 2026, month: 9, day: 3 })).toBe("2026-09-03T04:00:00.000Z");
    // EST (UTC-5)
    expect(adminPeriodStartIso({ year: 2026, month: 1, day: 15 })).toBe("2026-01-15T05:00:00.000Z");
  });

  it("includes today as the last daily key", () => {
    const now = new Date("2026-09-03T04:10:00.000Z");
    const keys = listAdminDayKeys(30, now);
    expect(keys).toHaveLength(30);
    expect(keys[0]).toBe("2026-08-05");
    expect(keys[keys.length - 1]).toBe("2026-09-03");
  });

  it("keeps week keys on Mondays", () => {
    const monday = { year: 2026, month: 8, day: 31 };
    expect(adminPeriodKey(addAdminPeriod(monday, "week", 0), "week")).toBe("2026-08-31");
    expect(adminPeriodKey(addAdminPeriod(monday, "week", 1), "week")).toBe("2026-09-07");
  });
});
