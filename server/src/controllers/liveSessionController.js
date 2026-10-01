// server/src/controllers/liveSessionController.js
//
// Live sessions module: scheduled live classes / meetings
// with a join-url, lifecycle (schedule → live → completed)
// and participant roster. Host manages lifecycle; class
// members / everyone else can view and join.

import { LiveSession } from "../models/LiveSession.js";

import { asyncHandler } from "../utils/errorHandler.js";

import ApiError from "../utils/ApiError.js";

import {
  sendSuccess,
  sendCreated,
  sendNotFound,
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

const isHostish = (user, session) =>
  [
    "super_admin",
    "admin",
    "principal",
  ].includes(user.role) ||
  String(session.hostUserId) ===
    String(user._id);

export const createLiveSession = asyncHandler(
  async (req, res) => {
    const {
      title,
      description,
      classId,
      joinUrl,
      scheduledStartAt,
      scheduledEndAt,
      accessMode,
    } = req.body;

    if (!title || !scheduledStartAt) {
      throw ApiError.badRequest(
        "Title and scheduledStartAt are required",
        "VALIDATION_ERROR"
      );
    }

    const session = await LiveSession.create({
      instituteId: req.user.instituteId,

      title,

      description: description || null,

      classId: classId || null,

      joinUrl: joinUrl || null,

      hostUserId: req.user._id,

      scheduledStartAt,

      scheduledEndAt: scheduledEndAt || null,

      accessMode: accessMode || "class",

      status: "scheduled",
    });

    return sendCreated(res, {
      message: "Live session scheduled",

      data: session,
    });
  }
);

export const getLiveSessions = asyncHandler(
  async (req, res) => {
    const { status, classId, from, to } =
      req.query;

    const query = scoped(req);

    if (status) {
      query.status = status;
    }

    if (classId) {
      query.classId = classId;
    }

    if (from || to) {
      query.scheduledStartAt = {};

      if (from) {
        query.scheduledStartAt.$gte =
          new Date(from);
      }

      if (to) {
        query.scheduledStartAt.$lte =
          new Date(to);
      }
    }

    const sessions = await LiveSession.find(
      query
    )
      .populate("hostUserId", "name role")
      .populate("classId", "name")
      .sort({ scheduledStartAt: 1 })
      .limit(200);

    return sendSuccess(res, {
      message: "Live sessions fetched",

      data: sessions,
    });
  }
);

export const getLiveSession = asyncHandler(
  async (req, res) => {
    const session = await LiveSession.findOne({
      publicId: req.params.publicId,

      ...scoped(req),
    })
      .populate("hostUserId", "name role")
      .populate("classId", "name");

    if (!session) {
      return sendNotFound(
        res,
        "Live session not found"
      );
    }

    return sendSuccess(res, {
      message: "Live session fetched",

      data: session,
    });
  }
);

export const updateLiveSession = asyncHandler(
  async (req, res) => {
    const session = await LiveSession.findOne({
      publicId: req.params.publicId,

      ...scoped(req),
    });

    if (!session) {
      return sendNotFound(
        res,
        "Live session not found"
      );
    }

    if (!isHostish(req.user, session)) {
      throw ApiError.forbidden(
        "Only the host or an admin can manage this session",
        "ACCESS_DENIED"
    );
    }

    const allowed = [
      "title",
      "description",
      "classId",
      "joinUrl",
      "scheduledStartAt",
      "scheduledEndAt",
      "accessMode",
      "status",
    ];

    const updates = {};

    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (
      updates.status === "live" &&
      !session.actualStartAt
    ) {
      session.actualStartAt = new Date();
    }

    if (
      updates.status === "completed" &&
      !session.actualEndAt
    ) {
      session.actualEndAt = new Date();

      if (session.actualStartAt) {
        session.durationSeconds = Math.max(
          0,
          Math.floor(
            (session.actualEndAt -
              session.actualStartAt) /
              1000
          )
        );
      }
    }

    Object.assign(session, updates);

    await session.save();

    return sendSuccess(res, {
      message: "Live session updated",

      data: session,
    });
  }
);

export const deleteLiveSession = asyncHandler(
  async (req, res) => {
    const session = await LiveSession.findOne({
      publicId: req.params.publicId,

      ...scoped(req),
    });

    if (!session) {
      return sendNotFound(
        res,
        "Live session not found"
      );
    }

    if (!isHostish(req.user, session)) {
      throw ApiError.forbidden(
        "Only the host or an admin can delete this session",
        "ACCESS_DENIED"
      );
    }

    await session.deleteOne();

    return sendSuccess(res, {
      message: "Live session deleted",

      data: null,
    });
  }
);
