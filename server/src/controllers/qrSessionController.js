// server/src/controllers/qrSessionController.js
//
// Short-lived class attendance codes. A teacher opens a session, gets a
// one-time readable code (shown on screen / encoded in a QR), and students
// redeem it from attendanceController.scanQr. Only the code's hash is stored.

import crypto from "node:crypto";

import { QRSession } from "../models/QRSession.js";
import { Class } from "../models/Class.js";

import { asyncHandler } from "../utils/errorHandler.js";

import { resolveRef } from "../utils/resolveRef.js";

import ApiError from "../utils/ApiError.js";

import {
  sendSuccess,
  sendCreated,
  sendNotFound,
} from "../utils/response.js";

import {
  tenantScope,
  requireInstitute,
} from "../utils/crudHelpers.js";

// No 0/O/1/I so a code read off a screen is hard to mistype.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;

const DEFAULT_MINUTES = 10;
const MAX_MINUTES = 60;

export const hashCode = (code) =>
  crypto
    .createHash("sha256")
    .update(String(code).trim().toUpperCase())
    .digest("hex");

const generateCode = () =>
  Array.from(
    { length: CODE_LENGTH },
    () => CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)]
  ).join("");

export const createQrSession = asyncHandler(async (req, res) => {
  const instituteId = requireInstitute(req);

  const classId = await resolveRef(Class, req.body.classId, {
    label: "Class",
  });

  const cls = await Class.findOne({ _id: classId, instituteId }).select(
    "teacherId"
  );

  if (!cls) {
    return sendNotFound(res, "Class not found");
  }

  // Teachers can only open sessions for their own classes.
  if (
    req.user.role === "teacher" &&
    String(cls.teacherId) !== String(req.user._id)
  ) {
    throw ApiError.forbidden("You can only open sessions for your own classes");
  }

  const minutes = Math.min(
    Math.max(Number(req.body.minutes) || DEFAULT_MINUTES, 1),
    MAX_MINUTES
  );

  const code = generateCode();
  const startsAt = new Date();

  const session = await QRSession.create({
    instituteId,
    sessionType: "attendance",
    status: "active",
    classId,
    teacherId: cls.teacherId ?? req.user._id,
    createdBy: req.user._id,
    tokenHash: hashCode(code),
    sessionCode: crypto.randomBytes(5).toString("hex").toUpperCase(),
    startsAt,
    expiresAt: new Date(startsAt.getTime() + minutes * 60 * 1000),
    restrictToClass: true,
  });

  // The plain code leaves the server exactly once.
  return sendCreated(res, {
    message: "Attendance session opened",
    data: {
      publicId: session.publicId,
      code,
      startsAt: session.startsAt,
      expiresAt: session.expiresAt,
    },
  });
});

export const getQrSessions = asyncHandler(async (req, res) => {
  const query = tenantScope(req, { sessionType: "attendance" });

  if (req.user.role === "teacher") {
    query.createdBy = req.user._id;
  }

  const sessions = await QRSession.find(query)
    .select(
      "publicId status classId startsAt expiresAt scanCount uniqueScannerCount createdAt"
    )
    .populate("classId", "name subject")
    .sort({ createdAt: -1 })
    .limit(50);

  return sendSuccess(res, {
    message: "Attendance sessions fetched",
    data: sessions,
  });
});

export const closeQrSession = asyncHandler(async (req, res) => {
  const query = tenantScope(req, { publicId: req.params.publicId });

  if (req.user.role === "teacher") {
    query.createdBy = req.user._id;
  }

  const session = await QRSession.findOne(query);

  if (!session) {
    return sendNotFound(res, "Session not found");
  }

  session.status = "completed";
  session.completedAt = new Date();
  await session.save();

  return sendSuccess(res, { message: "Attendance session closed" });
});
