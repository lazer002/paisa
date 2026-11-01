// server/src/controllers/liveSessionController.js
//
// Live sessions module: scheduled live classes / meetings
// with a join-url, lifecycle (schedule → live → ended)
// and participant roster. Host manages lifecycle; class
// members / everyone else can view and join.

import crypto from "node:crypto";

import { LiveSession } from "../models/LiveSession.js";
import { Class } from "../models/Class.js";

import env from "../config/env.js";
import { asyncHandler } from "../utils/errorHandler.js";
import { resolveRef } from "../utils/resolveRef.js";
import { visibleClassIdsFor } from "../utils/parentScope.js";

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

// Clients send class publicIds; the model stores the ObjectId.
const resolveClassRef = (req, ref) =>
  resolveRef(Class, ref, {
    label: "Class",
    scope:
      req.user.role === "super_admin"
        ? {}
        : { instituteId: req.user.instituteId },
  });

const idOf = (value) => String(value?._id ?? value ?? "");

const isHostish = (user, session) =>
  [
    "super_admin",
    "admin",
    "principal",
  ].includes(user.role) ||
  idOf(session.hostUserId) ===
    String(user._id);

/* ---------------------------------------------------------------------- */
/* Jitsi rooms                                                             */
/* ---------------------------------------------------------------------- */

const jitsiDomain = () =>
  String(env.JITSI_DOMAIN || "meet.jit.si")
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");

// Unguessable: part of the publicId plus 80 random bits.
const jitsiRoomName = (session) =>
  `Paisa-${String(session.publicId)
    .replace(/^[a-z]+_/, "")
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(0, 10)}-${crypto.randomBytes(10).toString("hex")}`;

const assignJitsiRoom = (session) => {
  const room = jitsiRoomName(session);

  session.provider = "jitsi";
  session.providerMeetingId = room;
  session.joinUrl = `https://${jitsiDomain()}/${room}`;
};

const jitsiRoomOf = (session) => {
  if (session.provider !== "jitsi" || !session.joinUrl) return null;

  try {
    const url = new URL(session.joinUrl);
    return {
      domain: url.host,
      roomName: decodeURIComponent(url.pathname.replace(/^\/+/, "")),
    };
  } catch {
    return null;
  }
};

/* ---------------------------------------------------------------------- */
/* Access                                                                  */
/* ---------------------------------------------------------------------- */

const OPEN_MODES = ["organization", "public"];
const INVITE_MODES = ["private", "invite_only"];

const isListedParticipant = (user, session) =>
  (session.participants ?? []).some(
    (p) => idOf(p.userId) === String(user._id) && p.status !== "banned" && p.status !== "removed"
  );

/**
 * Who may see a session (and so get its join URL): hosts/admins always;
 * open sessions: everyone in the org; invite-only: listed participants;
 * class sessions: students/parents of that class, and staff.
 */
const canAccessSession = async (user, session) => {
  if (isHostish(user, session)) return true;

  const mode = session.accessMode || "class";

  if (INVITE_MODES.includes(mode)) return isListedParticipant(user, session);
  if (OPEN_MODES.includes(mode) || !session.classId) return true;

  const classIds = await visibleClassIdsFor(user);

  // Staff roles are not limited by class membership.
  if (classIds === null) return true;

  return classIds.some((id) => String(id) === idOf(session.classId));
};

/** Mongo filter matching the sessions canAccessSession allows (list view). */
const accessFilter = async (user) => {
  if (["super_admin", "admin", "principal"].includes(user.role)) return null;

  const mine = [
    { hostUserId: user._id },
    { "participants.userId": user._id },
  ];

  const classIds = await visibleClassIdsFor(user);

  if (classIds === null) {
    return { $or: [{ accessMode: { $nin: INVITE_MODES } }, ...mine] };
  }

  return {
    $or: [
      { accessMode: { $in: OPEN_MODES } },
      { accessMode: { $nin: INVITE_MODES }, classId: null },
      { accessMode: { $nin: INVITE_MODES }, classId: { $in: classIds } },
      ...mine,
    ],
  };
};

/** Non-hosts never see the participant roster. */
const sessionView = (session, user) => {
  const json = session.toJSON ? session.toJSON() : session;

  if (isHostish(user, session)) return json;

  const { participants, ...rest } = json;
  void participants;
  return rest;
};

const findAccessibleSession = async (req) => {
  const session = await LiveSession.findOne({
    publicId: req.params.publicId,
    ...scoped(req),
  });

  // Same answer for "missing" and "not yours": do not reveal sessions.
  if (!session || !(await canAccessSession(req.user, session))) {
    throw ApiError.notFound("Live session not found", {
      code: "LIVE_SESSION_NOT_FOUND",
    });
  }

  return session;
};

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

    const resolvedClassId = await resolveClassRef(req, classId);

    const session = new LiveSession({
      instituteId: req.user.instituteId,

      title,

      description: description || null,

      classId: resolvedClassId,

      joinUrl: joinUrl || null,

      provider: joinUrl ? "custom" : "internal",

      hostUserId: req.user._id,

      createdBy: req.user._id,

      scheduledStartAt,

      scheduledEndAt: scheduledEndAt || null,

      // "class" access needs a class; without one the session is org-wide.
      accessMode:
        accessMode || (resolvedClassId ? "class" : "organization"),

      status: "scheduled",
    });

    // No meeting link given: host it on Jitsi (no API key needed).
    if (!joinUrl) {
      assignJitsiRoom(session);
    }

    await session.save();

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

    const access = await accessFilter(req.user);

    if (access) {
      query.$and = [access];
    }

    if (status) {
      query.status = status;
    }

    if (classId) {
      query.classId = await resolveClassRef(req, classId);
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

      data: sessions.map((s) => sessionView(s, req.user)),
    });
  }
);

export const getLiveSession = asyncHandler(
  async (req, res) => {
    const session = await findAccessibleSession(req);

    await session.populate([
      { path: "hostUserId", select: "name role" },
      { path: "classId", select: "name" },
    ]);

    return sendSuccess(res, {
      message: "Live session fetched",

      data: sessionView(session, req.user),
    });
  }
);

/**
 * Join: returns the meeting URL (creating a Jitsi room for sessions that
 * have none) and records the caller as a participant (attendance).
 */
export const joinLiveSession = asyncHandler(
  async (req, res) => {
    const session = await findAccessibleSession(req);

    if (["ended", "cancelled", "failed", "archived"].includes(session.status)) {
      throw ApiError.badRequest("This session is closed", {
        code: "LIVE_SESSION_CLOSED",
      });
    }

    if (!session.joinUrl) {
      assignJitsiRoom(session);
    }

    const now = new Date();
    const host = idOf(session.hostUserId) === String(req.user._id);
    let participant = session.participants.find(
      (p) => idOf(p.userId) === String(req.user._id)
    );

    if (participant?.status === "banned" || participant?.status === "removed") {
      throw ApiError.forbidden("You cannot join this session", {
        code: "LIVE_SESSION_ACCESS_DENIED",
      });
    }

    if (!participant) {
      if (session.participants.length >= (session.maxParticipants || 500)) {
        throw ApiError.badRequest("This session is full", {
          code: "LIVE_SESSION_FULL",
        });
      }

      session.participants.push({
        userId: req.user._id,
        role: host
          ? "host"
          : req.user.role === "student"
            ? "student"
            : req.user.role === "teacher"
              ? "teacher"
              : req.user.role === "parent"
                ? "observer"
                : "employee",
        status: "joined",
        joinedAt: now,
        lastSeenAt: now,
        connectionCount: 1,
        attendanceMarked: true,
      });
      participant = session.participants[session.participants.length - 1];
    } else {
      participant.status = "joined";
      participant.joinedAt = participant.joinedAt || now;
      participant.lastSeenAt = now;
      participant.connectionCount = (participant.connectionCount || 0) + 1;
      participant.attendanceMarked = true;
    }

    session.participantCount = session.participants.length;
    session.currentParticipantCount = session.participants.filter(
      (p) => p.status === "joined"
    ).length;
    session.analytics.totalJoins = (session.analytics.totalJoins || 0) + 1;
    session.analytics.totalUniqueParticipants = session.participants.length;
    session.analytics.peakConcurrentParticipants = Math.max(
      session.analytics.peakConcurrentParticipants || 0,
      session.currentParticipantCount
    );
    session.analytics.updatedAt = now;

    await session.save();

    const jitsi = jitsiRoomOf(session);

    return sendSuccess(res, {
      message: "Joined live session",

      data: {
        publicId: session.publicId,
        title: session.title,
        provider: session.provider,
        joinUrl: session.joinUrl,
        jitsi: jitsi
          ? {
              ...jitsi,
              scriptUrl: `https://${jitsi.domain}/external_api.js`,
            }
          : null,
        displayName: req.user.name,
        isHost: isHostish(req.user, session),
        joinedAt: participant.joinedAt,
      },
    });
  }
);

/** Host roster: who joined and when. */
export const getLiveSessionParticipants = asyncHandler(
  async (req, res) => {
    const session = await LiveSession.findOne({
      publicId: req.params.publicId,

      ...scoped(req),
    }).populate("participants.userId", "publicId name email role");

    if (!session) {
      return sendNotFound(
        res,
        "Live session not found"
      );
    }

    if (!isHostish(req.user, session)) {
      throw ApiError.forbidden(
        "Only the host or an admin can see participants",
        { code: "ACCESS_DENIED" }
      );
    }

    return sendSuccess(res, {
      message: "Participants fetched",

      data: session.participants.map((p) => ({
        user: p.userId
          ? {
              publicId: p.userId.publicId,
              name: p.userId.name,
              email: p.userId.email,
              role: p.userId.role,
            }
          : null,
        role: p.role,
        status: p.status,
        joinedAt: p.joinedAt,
        lastSeenAt: p.lastSeenAt,
        connectionCount: p.connectionCount,
      })),
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

    if (updates.classId !== undefined) {
      updates.classId = await resolveClassRef(req, updates.classId);
    }

    if (
      updates.status === "live" &&
      !session.actualStartAt
    ) {
      session.actualStartAt = new Date();
    }

    if (
      updates.status === "ended" &&
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

    // A pasted link replaces the room; clearing it falls back to Jitsi.
    if (updates.joinUrl !== undefined) {
      if (updates.joinUrl) {
        session.provider = "custom";
        session.providerMeetingId = null;
      } else {
        assignJitsiRoom(session);
      }
    }

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
