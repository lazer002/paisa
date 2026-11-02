import test from "node:test";
import assert from "node:assert/strict";

import {
  computeStreak,
  dayKey,
  periodStart,
} from "../src/services/gamificationService.js";

test("no activity means no streak", () => {
  assert.deepEqual(computeStreak([], "2026-11-02"), {
    current: 0,
    longest: 0,
    lastActiveDay: null,
  });
});

test("a run ending today or yesterday is current; duplicates count once", () => {
  const days = ["2026-10-30", "2026-10-31", "2026-10-31", "2026-11-01"];

  assert.equal(computeStreak(days, "2026-11-01").current, 3);
  assert.equal(computeStreak(days, "2026-11-02").current, 3);
  assert.equal(computeStreak(days, "2026-11-03").current, 0);
  assert.equal(computeStreak(days, "2026-11-03").longest, 3);
  assert.equal(computeStreak(days, "2026-11-03").lastActiveDay, "2026-11-01");
});

test("longest run is kept after a gap; order does not matter", () => {
  const days = ["2026-11-02", "2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04"];

  const streak = computeStreak(days, "2026-11-02");

  assert.equal(streak.current, 1);
  assert.equal(streak.longest, 4);
});

test("runs cross month and year boundaries", () => {
  const days = ["2025-12-30", "2025-12-31", "2026-01-01"];

  assert.equal(computeStreak(days, "2026-01-01").current, 3);
});

test("day keys follow the time zone", () => {
  // 20:00 UTC on 1 Nov is already 2 Nov in India.
  const instant = new Date("2026-11-01T20:00:00Z");

  assert.equal(dayKey(instant, "UTC"), "2026-11-01");
  assert.equal(dayKey(instant, "Asia/Kolkata"), "2026-11-02");
});

test("leaderboard periods", () => {
  const now = new Date("2026-11-02T00:00:00Z");

  assert.equal(periodStart("all", now), null);
  assert.equal(periodStart(undefined, now), null);
  assert.equal(periodStart("week", now).toISOString(), "2026-10-26T00:00:00.000Z");
  assert.equal(periodStart("month", now).toISOString(), "2026-10-03T00:00:00.000Z");
});
