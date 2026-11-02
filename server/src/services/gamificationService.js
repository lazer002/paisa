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
import env from "../config/env.js";
import logger from "../config/logger.js";

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

    return await PointLedger.create({
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

/** Balance, rank, streak and badge count of one user. */
export const getMySummary = async (user) => {
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
