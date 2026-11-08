import { describe, expect, it } from "vitest";
import { formatDay, formatDayTime, formatNumber, formatTimeAgo } from "./format";

const now = new Date(2026, 10, 5, 15, 30);

describe("formatNumber", () => {
  it("groups digits with a space", () => {
    expect(formatNumber(265000).replace(/\s/gu, " ")).toBe("265 000");
  });
});

describe("formatDay", () => {
  it("names today and yesterday", () => {
    expect(formatDay("2026-11-05", "en", now)).toBe("Today");
    expect(formatDay("2026-11-04", "en", now)).toBe("Yesterday");
  });

  it("shows the day and month for older dates this year", () => {
    expect(formatDay("2026-10-03", "en", now)).toBe("Oct 3");
  });

  it("adds the year for other years", () => {
    expect(formatDay("2025-10-03", "en", now)).toBe("Oct 3, 2025");
  });

  it("uses Latin digits in Arabic", () => {
    expect(formatDay("2026-10-03", "ar", now)).toMatch(/3/u);
  });
});

describe("formatTimeAgo", () => {
  const at = (hours: number, minutes: number, day = 5) => new Date(2026, 10, day, hours, minutes).toISOString();

  it("counts minutes, then hours, within a day", () => {
    expect(formatTimeAgo(at(14, 55), "en", now)).toBe("35 min. ago");
    expect(formatTimeAgo(at(13, 10), "en", now)).toBe("2 hr. ago");
  });

  it("names the day after a day", () => {
    expect(formatTimeAgo(at(9, 0, 4), "en", now)).toBe("Yesterday");
  });

  it("uses Latin digits in Arabic", () => {
    expect(formatTimeAgo(at(14, 55), "ar", now)).toMatch(/35/u);
  });
});

describe("formatDayTime", () => {
  it("adds the time to the day", () => {
    expect(formatDayTime(new Date(2026, 10, 5, 18, 40).toISOString(), "en", now)).toBe("Today 18:40");
  });
});
