// server/src/controllers/gamificationController.js
//
// Gamification module: Achievements (badge catalog),
// awarding to users, and the Points ledger.
// Leaderboards are computed from PointLedger aggregates.

import { Achievement } from "../models/Achievement.js";
import { UserAchievement } from "../models/UserAchievement.js";
import { PointLedger } from "../models/PointLedger.js";
import { User } from "../models/User.js";

import { asyncHandler } from "../utils/errorHandler.js";

import { resolveRef } from "../utils/resolveRef.js";

import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendForbidden,
  sendError,
} from "../utils/response.js";

const scoped = (req, extra = {}) => {
  if (req.user.role === "super_admin") {
    return { ...extra };
  }

  return {
    instituteId: req.user.instituteId,
    ...extra,
  };
};

/* =========================================================
   ACHIEVEMENT CATALOG
========================================================= */

export const createAchievement = asyncHandler(
  async (req, res) => {
    const {
      name,
      shortDescription,
      description,
      type,
      rarity,
      points,
      icon,
      badge,
    } = req.body;

    if (!name) {
      return sendError(res, 400, "Name is required");
    }

    const achievement = await Achievement.create({
      instituteId: req.user.instituteId,

      createdBy: req.user._id,

      name,

      slug: String(name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, ""),

      shortDescription: shortDescription || null,
      description: description || null,

      type: type || "custom",
      rarity: rarity || "common",

      points: Number(points) || 10,

      icon: icon || null,
      badge: badge || null,

      status: "active",
    });

    return sendCreated(res, {
      message: "Achievement created",
      data: achievement,
    });
  }
);

export const getAchievements = asyncHandler(
  async (req, res) => {
    const { status, type, rarity } = req.query;

    const query = scoped(req);

    if (status) query.status = status;
    if (type) query.type = type;
    if (rarity) query.rarity = rarity;

    const achievements =
      await Achievement.find(query).sort({
        createdAt: -1,
      });

    return sendSuccess(res, {
      message: "Achievements fetched",
      data: achievements,
    });
  }
);

export const updateAchievement = asyncHandler(
  async (req, res) => {
    const achievement = await Achievement.findOne({
      publicId: req.params.publicId,
      ...scoped(req),
    });

    if (!achievement) {
      return sendNotFound(
        res,
        "Achievement not found"
      );
    }

    const allowed = [
      "name",
      "shortDescription",
      "description",
      "type",
      "rarity",
      "points",
      "icon",
      "badge",
      "status",
    ];

    const updates = {};

    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const updated =
      await Achievement.findOneAndUpdate(
        { publicId: req.params.publicId },
        updates,
        { new: true, runValidators: true }
      );

    return sendSuccess(res, {
      message: "Achievement updated",
      data: updated,
    });
  }
);

export const deleteAchievement = asyncHandler(
  async (req, res) => {
    const achievement = await Achievement.findOne({
      publicId: req.params.publicId,
      ...scoped(req),
    });

    if (!achievement) {
      return sendNotFound(
        res,
        "Achievement not found"
      );
    }

    await achievement.deleteOne();

    return sendSuccess(res, {
      message: "Achievement deleted",
      data: null,
    });
  }
);

/* =========================================================
   AWARDS (user achievements)
========================================================= */

export const awardAchievement = asyncHandler(
  async (req, res) => {
    const { userId, achievementId, reason } = req.body;

    if (!userId || !achievementId) {
      return sendError(
        res,
        400,
        "userId and achievementId are required"
      );
    }

    const resolvedUserId = await resolveRef(
      User,
      userId,
      { label: "User" }
    );

    const achievement =
      await Achievement.findOne({
        publicId: achievementId,
        ...scoped(req),
      });

    if (!achievement) {
      return sendNotFound(
        res,
        "Achievement not found"
      );
    }

    const existing =
      await UserAchievement.findOne({
        userId: resolvedUserId,
        achievementId: achievement._id,
        status: { $in: ["earned", "claimed"] },
      });

    if (existing) {
      return sendError(
        res,
        409,
        "User already holds this achievement"
      );
    }

    const award = await UserAchievement.create({
      instituteId: req.user.instituteId,

      userId: resolvedUserId,

      achievementId: achievement._id,

      status: "earned",

      awardSource: "manual",

      awardedBy: req.user._id,

      awardedAt: new Date(),

      reason: reason || null,
    });

    // Grant the achievement's point value.
    if (achievement.points > 0) {
      const last = await PointLedger.findOne({
        userId: resolvedUserId,
      }).sort({ createdAt: -1 });

      const balanceBefore = last?.balanceAfter ?? 0;

      await PointLedger.create({
        instituteId: req.user.instituteId,

        userId: resolvedUserId,

        type: "earn",

        source: "achievement",

        points: achievement.points,

        balanceBefore,

        balanceAfter:
          balanceBefore + achievement.points,

        reference: {
          type: "achievement",
          id: achievement._id,
        },

        description: `Achievement: ${achievement.name}`,
      });
    }

    return sendCreated(res, {
      message: "Achievement awarded",
      data: award,
    });
  }
);

export const getUserAchievements = asyncHandler(
  async (req, res) => {
    const { userId } = req.query;

    const query = scoped(req);

    if (userId) {
      query.userId = await resolveRef(
        User,
        userId,
        { label: "User" }
      );
    } else if (
      ["student", "employee"].includes(
        req.user.role
      )
    ) {
      query.userId = req.user._id;
    }

    const awards =
      await UserAchievement.find(query)
        .populate("userId", "name userCode")
        .populate(
          "achievementId",
          "name slug rarity points icon badge"
        )
        .sort({ awardedAt: -1 });

    return sendSuccess(res, {
      message: "Achievements fetched",
      data: awards,
    });
  }
);

/* =========================================================
   POINTS LEDGER
========================================================= */

export const awardPoints = asyncHandler(
  async (req, res) => {
    const { userId, points, reason } = req.body;

    const value = Number(points);

    if (!userId || !value) {
      return sendError(
        res,
        400,
        "userId and a non-zero points value are required"
      );
    }

    const resolvedUserId = await resolveRef(
      User,
      userId,
      { label: "User" }
    );

    const last = await PointLedger.findOne({
      userId: resolvedUserId,
    }).sort({ createdAt: -1 });

    const balanceBefore = last?.balanceAfter ?? 0;

    const entry = await PointLedger.create({
      instituteId: req.user.instituteId,

      userId: resolvedUserId,

      type: value > 0 ? "earn" : "redeem",

      source: "manual",

      points: Math.abs(value),

      balanceBefore,

      balanceAfter: balanceBefore + value,

      description: reason || "Manual adjustment",

      createdBy: req.user._id,
    });

    return sendCreated(res, {
      message: "Points recorded",
      data: entry,
    });
  }
);

export const getPointsLedger = asyncHandler(
  async (req, res) => {
    const { userId, limit } = req.query;

    const query = scoped(req);

    if (userId) {
      query.userId = await resolveRef(
        User,
        userId,
        { label: "User" }
      );
    } else if (
      ["student", "employee"].includes(
        req.user.role
      )
    ) {
      query.userId = req.user._id;
    }

    const entries = await PointLedger.find(query)
      .populate("userId", "name userCode")
      .sort({ createdAt: -1 })
      .limit(Number(limit) || 100);

    return sendSuccess(res, {
      message: "Points ledger fetched",
      data: entries,
    });
  }
);

/* =========================================================
   LEADERBOARD (computed from ledger balances)
========================================================= */

export const getLeaderboard = asyncHandler(
  async (req, res) => {
    const match = scoped(req);

    const leaderboard = await PointLedger.aggregate([
      { $match: match },

      // Latest balance per user.
      { $sort: { createdAt: -1 } },

      {
        $group: {
          _id: "$userId",

          points: { $first: "$balanceAfter" },
        },
      },

      { $sort: { points: -1 } },

      { $limit: 50 },

      {
        $lookup: {
          from: "users",

          localField: "_id",

          foreignField: "_id",

          as: "user",
        },
      },

      { $unwind: "$user" },

      {
        $project: {
          _id: 0,

          userId: "$_id",

          publicId: "$user.publicId",

          name: "$user.name",

          userCode: "$user.userCode",

          points: 1,
        },
      },
    ]);

    const ranked = leaderboard.map(
      (row, index) => ({
        rank: index + 1,
        ...row,
      })
    );

    return sendSuccess(res, {
      message: "Leaderboard fetched",
      data: ranked,
    });
  }
);
