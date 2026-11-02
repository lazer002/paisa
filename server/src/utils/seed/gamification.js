// server/src/utils/seed/gamification.js
//
// Activity points for demo students and staff so the leaderboard, streaks and
// "my stats" card have something to show. Each user gets a run of daily
// activity ending yesterday (a live streak) plus a few older entries.
// Entries are keyed by transactionCode, so re-running creates nothing new.

import { ROLES } from "../../config/constants.js";
import { PointLedger } from "../../models/PointLedger.js";
import { ACTIVITY_POINTS } from "../../services/gamificationService.js";
import { dayOffset } from "./helpers.js";

const STUDENT_SOURCES = ["attendance", "assignment", "attendance", "test"];
const STAFF_SOURCES = ["attendance"];

/** Days ago on which user number `index` was active (oldest first). */
const activeDaysAgo = (index) => {
  const runLength = 2 + (index % 5);
  const run = Array.from({ length: runLength }, (_, i) => runLength - i);
  const older = [12 + index, 20 + index, 26];

  return [...older, ...run];
};

const seedUserPoints = async (seeder, org, user, index, sources) => {
  let balance = 0;

  for (const [k, daysAgo] of activeDaysAgo(index).entries()) {
    const source = sources[k % sources.length];
    const points = ACTIVITY_POINTS[source];

    // Mid-morning in India on that day.
    const when = new Date(dayOffset(-daysAgo).getTime() + 4.5 * 60 * 60 * 1000);

    await seeder.ensure(
      PointLedger,
      { instituteId: org._id, transactionCode: `SEED-PTS-${user.userCode}-${k + 1}` },
      {
        userId: user._id,
        type: "earn",
        source,
        points,
        balanceBefore: balance,
        balanceAfter: balance + points,
        description: `Demo ${source} activity`,
        createdAt: when,
        updatedAt: when,
      }
    );

    balance += points;
  }
};

export const seedGamification = async (seeder, ctx) => {
  const { org, users } = ctx;

  const students = ctx.students.map((s) => s.user);
  const staff = [ROLES.TEACHER, ROLES.EMPLOYEE, ROLES.COUNSELOR, ROLES.SUPPORT]
    .map((role) => users[role])
    .filter(Boolean);

  for (const [index, user] of students.entries()) {
    await seedUserPoints(seeder, org, user, index, STUDENT_SOURCES);
  }

  for (const [index, user] of staff.entries()) {
    await seedUserPoints(seeder, org, user, index + 1, STAFF_SOURCES);
  }
};
