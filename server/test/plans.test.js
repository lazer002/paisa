import test from "node:test";
import assert from "node:assert/strict";

import {
  PLAN_KEYS,
  PAID_PLAN_KEYS,
  addCycle,
  effectiveLimits,
  findLimitViolations,
  getPlan,
  nextPeriod,
  priceFor,
  reconcileStatus,
} from "../src/config/plans.js";

const DAY = 24 * 60 * 60 * 1000;

test("catalog: free is unpaid, every paid plan has monthly and yearly prices", () => {
  assert.deepEqual(PLAN_KEYS, ["free", "starter", "pro", "enterprise"]);
  assert.ok(!PAID_PLAN_KEYS.includes("free"));
  for (const key of PAID_PLAN_KEYS) {
    assert.ok(priceFor(key, "monthly") > 0);
    assert.ok(priceFor(key, "yearly") > priceFor(key, "monthly"));
  }
  assert.equal(getPlan("nope").key, "free");
});

test("effectiveLimits applies per-org overrides and ignores blanks", () => {
  assert.deepEqual(effectiveLimits("free"), getPlan("free").limits);
  assert.equal(effectiveLimits("pro", { maxStudents: 5 }).maxStudents, 5);
  assert.equal(effectiveLimits("pro", { maxStudents: "" }).maxStudents, getPlan("pro").limits.maxStudents);
  assert.equal(effectiveLimits("enterprise").maxUsers, null);
});

test("findLimitViolations reports only exceeded limits; null means unlimited", () => {
  const limits = { maxUsers: 10, maxStudents: 5, storageGb: 1 };
  assert.deepEqual(findLimitViolations({ users: 10, students: 5, storageGb: 1 }, limits), []);

  const over = findLimitViolations({ users: 11, students: 2, storageGb: 3 }, limits);
  assert.deepEqual(over.map((v) => v.limit), ["maxUsers", "storageGb"]);
  assert.match(over[0].message, /11 active users in use, the plan allows 10/);

  assert.deepEqual(
    findLimitViolations({ users: 99999, students: 99999, storageGb: 0 }, effectiveLimits("enterprise")),
    []
  );
});

test("addCycle adds a calendar month or year", () => {
  assert.equal(addCycle(new Date("2026-01-15T00:00:00Z"), "monthly").toISOString(), "2026-02-15T00:00:00.000Z");
  assert.equal(addCycle(new Date("2026-01-15T00:00:00Z"), "yearly").toISOString(), "2027-01-15T00:00:00.000Z");
});

test("nextPeriod extends a running period of the same plan, otherwise starts now", () => {
  const now = new Date("2026-11-01T00:00:00Z");
  const end = new Date("2026-11-20T00:00:00Z");

  const renew = nextPeriod({ now, currentPlan: "pro", currentPeriodEnd: end, newPlan: "pro", cycle: "monthly" });
  assert.equal(renew.start.toISOString(), end.toISOString());
  assert.equal(renew.end.toISOString(), "2026-12-20T00:00:00.000Z");

  const upgrade = nextPeriod({ now, currentPlan: "starter", currentPeriodEnd: end, newPlan: "pro", cycle: "yearly" });
  assert.equal(upgrade.start.toISOString(), now.toISOString());
  assert.equal(upgrade.end.toISOString(), "2027-11-01T00:00:00.000Z");

  const lapsed = nextPeriod({ now, currentPlan: "pro", currentPeriodEnd: new Date(now - DAY), newPlan: "pro", cycle: "monthly" });
  assert.equal(lapsed.start.toISOString(), now.toISOString());
});

test("reconcileStatus: running stays, ended goes past_due then expired; cancelled-at-end expires", () => {
  const now = new Date("2026-11-01T00:00:00Z");
  const base = { plan: "pro", status: "active", cancelAtPeriodEnd: false };

  assert.equal(reconcileStatus({ ...base, currentPeriodEnd: new Date(+now + DAY) }, now), "active");
  assert.equal(reconcileStatus({ ...base, currentPeriodEnd: new Date(+now - DAY) }, now), "past_due");
  assert.equal(reconcileStatus({ ...base, currentPeriodEnd: new Date(+now - 8 * DAY) }, now), "expired");
  assert.equal(
    reconcileStatus({ ...base, cancelAtPeriodEnd: true, currentPeriodEnd: new Date(+now - 1000) }, now),
    "expired"
  );
  assert.equal(reconcileStatus({ ...base, plan: "free", currentPeriodEnd: null }, now), "active");
  assert.equal(reconcileStatus({ ...base, status: "cancelled", currentPeriodEnd: new Date(+now - DAY) }, now), "cancelled");
});
