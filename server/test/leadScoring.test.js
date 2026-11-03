import test from "node:test";
import assert from "node:assert/strict";

import { scoreLead, temperatureFor } from "../src/services/leadScoring.js";

const NOW = new Date("2026-11-03T10:00:00Z");
const daysAgo = (n) => new Date(NOW.getTime() - n * 86400000);

test("a strong referral lead is hot, with every reason listed", () => {
  const r = scoreLead(
    { source: "referral", email: "a@b.c", phone: "999", interestedPrograms: ["MBA"], status: "qualified", lastActivityAt: daysAgo(2) },
    { recentActivities: 3, now: NOW }
  );
  // 25 + 10 + 10 + 5 + 15 (3 interactions) + 15 (this week) + 15 (qualified) = 95
  assert.equal(r.score, 95);
  assert.equal(r.temperature, "hot");
  assert.ok(r.factors.some((f) => f.label === "Source: referral" && f.points === 25));
  assert.ok(r.factors.some((f) => f.label === "3 interactions in 30 days" && f.points === 15));
});

test("engagement is capped and stale leads lose points", () => {
  const busy = scoreLead({ source: "website", status: "new", lastActivityAt: daysAgo(1) }, { recentActivities: 20, now: NOW });
  assert.ok(busy.factors.some((f) => f.points === 25 && f.label.startsWith("20 interactions")));

  const stale = scoreLead({ source: "website", status: "contacted", createdAt: daysAgo(90) }, { now: NOW });
  // 15 − 10 (stale) + 5 (contacted) = 10
  assert.equal(stale.score, 10);
  assert.equal(stale.temperature, "cold");
});

test("score stays within 0–100", () => {
  const r = scoreLead({ source: "other", status: "unqualified", createdAt: daysAgo(120) }, { now: NOW });
  assert.equal(r.score, 0);
});

test("closed leads record their outcome", () => {
  assert.equal(scoreLead({ status: "converted" }, { now: NOW }).score, 100);
  assert.equal(scoreLead({ status: "lost", source: "referral" }, { now: NOW }).score, 0);
});

test("temperature bands", () => {
  assert.equal(temperatureFor(70), "hot");
  assert.equal(temperatureFor(69), "warm");
  assert.equal(temperatureFor(40), "warm");
  assert.equal(temperatureFor(39), "cold");
});
