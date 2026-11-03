// server/src/services/gamificationService.js
//
// Points earned automatically from everyday activity, streaks and the
// leaderboard. Everything is derived from the PointLedger:
// - a period's score is the sum of balance movements inside the period
//   (all time = the user's balance);
// - a streak is the run of consecutive days with an activity entry.

import { PointLedger } from "../models/PointLedger.js";
import { User } from "../models/User.js";
import { UserAchievement } from "../models/UserAchievement.js";
import { Achievement } from "../models/Achievement.js";
import env from "../config/env.js";
import logger from "../config/logger.js";
import { notifyOnce } from "./notify.js";

/** Points granted once per referenced record (see awardActivityPoints). */
export const ACTIVITY_POINTS = {
  assignment: 10,
  test: 10,
  attendance: 5,
};

/** Ledger sources that count as "showing up" for a streak. */
const STREAK_SOURCES = Object.keys(ACTIVITY_POINTS);

const DAY_MS = 24 * 60 * 60 * 1000;

/** "YYYY-MM-DD" of a date in the given IANA time zone. */
export const dayKey = (date, timeZone = env.DEFAULT_TIMEZONE) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

const dayNumber = (key) => Date.parse(`${key}T00:00:00Z`) / DAY_MS;

/**
 * Current and longest run of consecutive days. The current streak survives
 * until the end of today: a run that ended yesterday still counts.
 */
export const computeStreak = (dayKeys, todayKey) => {
  const days = [...new Set(dayKeys)].map(dayNumber).sort((a, b) => a - b);

  let longest = 0;
  let run = 0;

  for (let i = 0; i < days.length; i += 1) {
    run = i > 0 && days[i] === days[i - 1] + 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  const today = dayNumber(todayKey);
  const last = days[days.length - 1];

  const current =
    last === today || last === today - 1 ? run : 0;

  return {
    current,
    longest,
    lastActiveDay: days.length
      ? new Date(last * DAY_MS).toISOString().slice(0, 10)
      : null,
  };
};

/** Start of the leaderboard period, or null for all time. */
export const periodStart = (period, now = new Date()) => {
  if (period === "week") return new Date(now.getTime() - 7 * DAY_MS);
  if (period === "month") return new Date(now.getTime() - 30 * DAY_MS);
  return null;
};

/**
 * Grant the activity's points once per referenced record. Never throws:
 * a failed award must not fail the submission or check-in that caused it.
 */
export const awardActivityPoints = async ({
  instituteId,
  userId,
  source,
  referenceType,
  referenceId,
  description,
}) => {
  const points = ACTIVITY_POINTS[source];

  if (!points || !instituteId || !userId) return null;

  try {
    const already = await PointLedger.exists({
      userId,
      source,
      referenceType,
      referenceId,
    });

    if (already) return null;

    const last = await PointLedger.findOne({ userId })
      .sort({ createdAt: -1 })
      .select("balanceAfter");

    const balanceBefore = last?.balanceAfter ?? 0;

    const entry = await PointLedger.create({
      instituteId,
      userId,
      type: "earn",
      source,
      points,
      balanceBefore,
      balanceAfter: balanceBefore + points,
      referenceType,
      referenceId,
      description,
    });

    await checkAutoBadges({ _id: userId, instituteId });

    return entry;
  } catch (error) {
    logger.warn("Activity points not recorded", {
      source,
      referenceId: String(referenceId),
      error: error.message,
    });

    return null;
  }
};

/** Streak of one user from their activity entries of the last year. */
export const getStreak = async (userId, now = new Date()) => {
  const entries = await PointLedger.find({
    userId,
    source: { $in: STREAK_SOURCES },
    createdAt: { $gte: new Date(now.getTime() - 366 * DAY_MS) },
  })
    .select("createdAt")
    .lean();

  return computeStreak(
    entries.map((e) => dayKey(e.createdAt)),
    dayKey(now)
  );
};

/**
 * Users ranked by points earned in the period (all time = balance).
 * Returns the top `limit` rows and the caller's own row (ranked or not).
 */
export const getLeaderboard = async ({
  instituteId,
  period = "all",
  role,
  limit = 50,
  meId,
}) => {
  const match = {};

  if (instituteId) match.instituteId = instituteId;

  const since = periodStart(period);
  if (since) match.createdAt = { $gte: since };

  // Only active accounts are ranked (optionally one role).
  const userMatch = { "user.status": "active" };
  if (role) userMatch["user.role"] = role;

  const totals = await PointLedger.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$userId",
        points: {
          $sum: { $subtract: ["$balanceAfter", "$balanceBefore"] },
        },
      },
    },
    {
      $lookup: {
        from: User.collection.name,
        localField: "_id",
        foreignField: "_id",
        as: "user",
        pipeline: [{ $project: { publicId: 1, name: 1, userCode: 1, role: 1, status: 1 } }],
      },
    },
    { $unwind: "$user" },
    { $match: userMatch },
    { $sort: { points: -1, _id: 1 } },
  ]);

  const ranked = totals.map((row, index) => ({
    rank: index + 1,
    userId: row._id,
    publicId: row.user.publicId ?? null,
    name: row.user.name ?? "Unknown user",
    userCode: row.user.userCode ?? null,
    role: row.user.role ?? null,
    points: row.points,
  }));

  return {
    period: since ? period : "all",
    rows: ranked.slice(0, limit),
    me: meId
      ? ranked.find((row) => String(row.userId) === String(meId)) ?? null
      : null,
  };
};

/* =========================================================
   AUTOMATIC BADGES
========================================================= */

/**
 * Badges the system awards on its own (worth 0 points, so awarding one can
 * never trigger another). Created per organization on first use.
 */
export const AUTO_BADGES = [
  { slug: "auto-first-steps", name: "First steps", shortDescription: "Earned your first activity points", type: "participation", rarity: "common", test: (s) => s.points > 0 },
  { slug: "auto-century", name: "Century", shortDescription: "Earned 100 points", type: "academic", rarity: "uncommon", test: (s) => s.points >= 100 },
  { slug: "auto-high-achiever", name: "High achiever", shortDescription: "Earned 500 points", type: "academic", rarity: "rare", test: (s) => s.points >= 500 },
  { slug: "auto-streak-7", name: "On a roll", shortDescription: "Active 7 days in a row", type: "streak", rarity: "rare", test: (s) => s.streak >= 7 },
  { slug: "auto-streak-30", name: "Unstoppable", shortDescription: "Active 30 days in a row", type: "streak", rarity: "epic", test: (s) => s.streak >= 30 },
];

/** The copy of an achievement kept on each award (required by UserAchievement). */
export const achievementSnapshotOf = (achievement) => ({
  achievementId: achievement._id,
  code: achievement.slug ?? null,
  name: achievement.name ?? null,
  description: achievement.shortDescription ?? achievement.description ?? null,
  type: achievement.type ?? null,
  rarity: achievement.rarity ?? null,
});

/** Points earned (sum of balance moves) by one user. */
export const pointsOf = async (userId) => {
  const [row] = await PointLedger.aggregate([
    { $match: { userId } },
    { $group: { _id: null, points: { $sum: { $subtract: ["$balanceAfter", "$balanceBefore"] } } } },
  ]);
  return row?.points ?? 0;
};

/** Award any automatic badge the user now qualifies for. Never throws. */
export const checkAutoBadges = async (user) => {
  try {
    if (!user.instituteId) return [];

    const [points, streak] = await Promise.all([pointsOf(user._id), getStreak(user._id)]);
    const stats = { points, streak: streak.current };
    const awarded = [];

    for (const badge of AUTO_BADGES.filter((b) => b.test(stats))) {
      const achievement = await Achievement.findOneAndUpdate(
        { instituteId: user.instituteId, slug: badge.slug },
        {
          $setOnInsert: {
            instituteId: user.instituteId,
            slug: badge.slug,
            name: badge.name,
            shortDescription: badge.shortDescription,
            type: badge.type,
            rarity: badge.rarity,
            points: 0,
            status: "active",
          },
        },
        { upsert: true, new: true }
      );

      const held = await UserAchievement.exists({
        userId: user._id,
        achievementId: achievement._id,
        status: { $in: ["earned", "claimed"] },
      });
      if (held) continue;

      await UserAchievement.create({
        instituteId: user.instituteId,
        userId: user._id,
        achievementId: achievement._id,
        achievementSnapshot: achievementSnapshotOf(achievement),
        status: "earned",
        awardSource: "rule",
        awardedAt: new Date(),
        reason: badge.shortDescription,
      });

      await notifyOnce({
        instituteId: user.instituteId,
        userIds: [user._id],
        type: "achievement",
        title: `New badge: ${badge.name}`,
        body: badge.shortDescription,
        link: "/dashboard/gamification",
        reference: { kind: "auto_badge", id: achievement._id, publicId: achievement.publicId },
      });

      awarded.push(badge.slug);
    }

    return awarded;
  } catch (error) {
    logger.warn("Automatic badges not checked", { userId: String(user._id), error: error.message });
    return [];
  }
};

/* =========================================================
   SPENDING POINTS
========================================================= */

/**
 * Move points out of (negative) or back into (positive) a user's balance.
 * Refuses to go below zero.
 */
export const movePoints = async ({ instituteId, userId, delta, source = "other", type, description, createdBy = null }) => {
  const last = await PointLedger.findOne({ userId }).sort({ createdAt: -1 }).select("balanceAfter");
  const balanceBefore = last?.balanceAfter ?? 0;

  if (balanceBefore + delta < 0) {
    return { ok: false, balance: balanceBefore };
  }

  const entry = await PointLedger.create({
    instituteId,
    userId,
    type: type ?? (delta < 0 ? "redeem" : "refund"),
    source,
    points: Math.abs(delta),
    balanceBefore,
    balanceAfter: balanceBefore + delta,
    description,
    createdBy,
  });

  return { ok: true, balance: entry.balanceAfter, entry };
};

/** Balance, rank, streak and badge count of one user. */
export const getMySummary = async (user) => {
  // Catches up badges earned before automatic badges existed.
  await checkAutoBadges(user);

  const [board, weekBoard, streak, achievements] = await Promise.all([
    getLeaderboard({
      instituteId: user.instituteId,
      period: "all",
      limit: 0,
      meId: user._id,
    }),
    getLeaderboard({
      instituteId: user.instituteId,
      period: "week",
      limit: 0,
      meId: user._id,
    }),
    getStreak(user._id),
    UserAchievement.countDocuments({
      userId: user._id,
      status: { $in: ["earned", "claimed"] },
    }),
  ]);

  return {
    points: board.me?.points ?? 0,
    rank: board.me?.rank ?? null,
    pointsThisWeek: weekBoard.me?.points ?? 0,
    streak,
    achievements,
    pointRules: ACTIVITY_POINTS,
  };
};
