import test from "node:test";
import assert from "node:assert/strict";

import { JOBS, isDue, findJob } from "../src/jobs/scheduler.js";

test("every job has a unique name, an interval, a description and a runner", () => {
  const names = JOBS.map((job) => job.name);

  assert.equal(new Set(names).size, names.length);

  for (const job of JOBS) {
    assert.match(job.name, /^[a-z-]+$/);
    assert.ok(job.everyMinutes >= 1, job.name);
    assert.ok(job.description.length > 10, job.name);
    assert.equal(typeof job.run, "function", job.name);
  }
});

test("a job is due when it never ran or its interval has passed", () => {
  const job = { everyMinutes: 60 };
  const now = new Date("2026-11-02T12:00:00Z");

  assert.equal(isDue(job, undefined, now), true);
  assert.equal(isDue(job, { lastStartedAt: null }, now), true);
  assert.equal(isDue(job, { lastStartedAt: new Date("2026-11-02T11:30:00Z") }, now), false);
  assert.equal(isDue(job, { lastStartedAt: new Date("2026-11-02T11:00:00Z") }, now), true);
});

test("a run that died mid-way is retried once its lock expires", () => {
  const job = { everyMinutes: 24 * 60 };
  const now = new Date("2026-11-02T12:00:00Z");
  const started = new Date("2026-11-02T11:00:00Z");

  assert.equal(
    isDue(job, { lastStartedAt: started, lastStatus: "running", lockedUntil: new Date("2026-11-02T11:10:00Z") }, now),
    true
  );
  // Still locked: someone is running it.
  assert.equal(
    isDue(job, { lastStartedAt: started, lastStatus: "running", lockedUntil: new Date("2026-11-02T12:05:00Z") }, now),
    false
  );
  assert.equal(isDue(job, { lastStartedAt: started, lastStatus: "success", lockedUntil: null }, now), false);
});

test("findJob looks jobs up by name", () => {
  assert.equal(findJob("invoice-overdue")?.name, "invoice-overdue");
  assert.equal(findJob("nope"), null);
});
