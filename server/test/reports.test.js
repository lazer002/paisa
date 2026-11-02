import test from "node:test";
import assert from "node:assert/strict";

import { parseRange } from "../src/controllers/reportController.js";

const NOW = new Date("2026-11-02T06:00:00Z");

test("defaults to the last 30 local days, bucketed by day", () => {
  const range = parseRange({}, "Asia/Kolkata", NOW);

  assert.equal(range.from, "2026-10-04");
  assert.equal(range.to, "2026-11-02");
  assert.equal(range.unit, "day");
  assert.equal(range.keys.length, 30);
  assert.equal(range.keys[0], "2026-10-04");
  assert.equal(range.keys.at(-1), "2026-11-02");
});

test("boundaries are local midnights in the time zone", () => {
  const range = parseRange({ from: "2026-11-01", to: "2026-11-01" }, "Asia/Kolkata", NOW);

  // Midnight in India is 18:30 UTC the day before.
  assert.equal(range.start.toISOString(), "2026-10-31T18:30:00.000Z");
  assert.equal(range.end.toISOString(), "2026-11-01T18:30:00.000Z");
  assert.deepEqual(range.keys, ["2026-11-01"]);
});

test("ranges over 62 days are bucketed by month", () => {
  const range = parseRange({ from: "2026-01-15", to: "2026-06-10" }, "UTC", NOW);

  assert.equal(range.unit, "month");
  assert.deepEqual(range.keys, ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06"]);
});

test("rejects bad, reversed and over-long ranges", () => {
  const code = (fn) => {
    try {
      fn();
    } catch (error) {
      return error.code;
    }
    return null;
  };

  assert.equal(code(() => parseRange({ from: "nope" }, "UTC", NOW)), "INVALID_RANGE");
  assert.equal(code(() => parseRange({ from: "2026-11-02", to: "2026-11-01" }, "UTC", NOW)), "INVALID_RANGE");
  assert.equal(code(() => parseRange({ from: "2023-01-01", to: "2026-01-01" }, "UTC", NOW)), "INVALID_RANGE");
});
