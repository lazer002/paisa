// src/controllers/attendanceController.js

import { Attendance } from "../models/Attendance.js";
import { childUserIdsFor } from "../utils/parentScope.js";

import { User } from "../models/User.js";

import { Class } from "../models/Class.js";
import { Geofence } from "../models/Geofence.js";
import { QRSession } from "../models/QRSession.js";

import ApiError from "../utils/ApiError.js";
import { distanceMeters, isValidCoordinate } from "../utils/geo.js";
import { hashCode } from "./qrSessionController.js";

import { asyncHandler } from "../utils/errorHandler.js";

import { resolveRef } from "../utils/resolveRef.js";

import {
  sendSuccess,
  sendCreated,
} from "../utils/response.js";

export const markAttendance = asyncHandler(async (req, res) => {
  const {
    classId,
    date,
    records,
  } = req.body;

  const instituteId = req.user.instituteId;

  // classId arrives as a publicId — resolve once for the batch.
  const resolvedClassId = classId
    ? await resolveRef(Class, classId, {
        label: "Class",
      })
    : null;

  // Resolve every userId (publicIds) before upserting.
  const resolvedRecords = [];

  for (const record of records || []) {
    resolvedRecords.push({
      ...record,

      userId: await resolveRef(User, record.userId, {
        label: "User",
      }),
    });
  }

  const ops = resolvedRecords.map(
    ({ userId, status, notes }) =>
      Attendance.findOneAndUpdate(
        {
          userId,
          date: new Date(date),
          classId: resolvedClassId || null,
          instituteId,
        },
        {
          status,
          notes,
          markedBy: req.user._id,
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
        }
      )
  );

  const results = await Promise.all(ops);

  sendSuccess(
    res,
    "Attendance marked",
    results
  );
});

export const getAttendance = asyncHandler(async (req, res) => {
  const query = {};

  if (req.user.role !== "super_admin") {
    query.instituteId = req.user.instituteId;
  }

  if (req.query.classId) {
    query.classId = await resolveRef(
      Class,
      req.query.classId,
      { label: "Class" }
    );
  }

  if (req.query.userId) {
    query.userId = await resolveRef(
      User,
      req.query.userId,
      { label: "User" }
    );
  }

  if (req.query.date) {
    query.date = new Date(req.query.date);
  }

  if (req.query.month && req.query.year) {
    const month = parseInt(req.query.month, 10);
    const year = parseInt(req.query.year, 10);

    query.date = {
      $gte: new Date(year, month - 1, 1),
      $lte: new Date(year, month, 0),
    };
  }

  const attendance = await Attendance.find(query)
    .populate(
      "userId",
      "name email userCode"
    )
    .populate(
      "classId",
      "name subject"
    )
    .sort({
      date: -1,
    });

  sendSuccess(
    res,
    "Attendance fetched",
    attendance
  );
});

export const getMyAttendance = asyncHandler(async (req, res) => {
  const query = {
    userId:
      req.user.role === "parent"
        ? { $in: await childUserIdsFor(req.user) }
        : req.user._id,
  };

  if (req.query.classId) {
    query.classId = req.query.classId;
  }

  if (req.query.month && req.query.year) {
    const month = parseInt(req.query.month, 10);
    const year = parseInt(req.query.year, 10);

    query.date = {
      $gte: new Date(year, month - 1, 1),
      $lte: new Date(year, month, 0),
    };
  }

  const attendance = await Attendance.find(query)
    // Parents see several children's rows, so each one carries a name.
    .populate("userId", "name")
    .populate(
      "classId",
      "name subject"
    )
    .sort({
      date: -1,
    });

  const total = attendance.length;

  const present = attendance.filter(
    (a) => a.status === "present"
  ).length;

  const absent = attendance.filter(
    (a) => a.status === "absent"
  ).length;

  const late = attendance.filter(
    (a) => a.status === "late"
  ).length;

  const percentage =
    total > 0
      ? Math.round((present / total) * 100)
      : 0;

  sendSuccess(
    res,
    "My attendance",
    {
      records: attendance,
      summary: {
        total,
        present,
        absent,
        late,
        percentage,
      },
    }
  );
});

/* =========================================================
   SELF CHECK-IN (geofence) AND CLASS CODE (QR) ATTENDANCE
========================================================= */

const MAX_GPS_ACCURACY_METERS = 500;

// Attendance rows are keyed by UTC midnight of the person's local calendar
// day (the web form sends YYYY-MM-DD). The client supplies its IANA
// timezone; anything unrecognised falls back to UTC.
const resolveTimezone = (value) => {
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: value });
    return value;
  } catch {
    return "UTC";
  }
};

const todayKey = (timezone = "UTC") =>
  new Date(
    new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(
      new Date()
    )
  );

export const selfCheck = asyncHandler(async (req, res) => {
  const { action } = req.body;

  if (!["in", "out"].includes(action)) {
    throw ApiError.badRequest("action must be 'in' or 'out'");
  }

  const instituteId = req.user.instituteId;

  const timezone = resolveTimezone(req.body.timezone);

  const geofences = await Geofence.find({
    instituteId,
    status: "active",
    shapeType: "circle",
    isDeleted: { $ne: true },
  }).select("name center radiusMeters");

  // With no geofence configured the institute has not asked for a location
  // check, so check-in is accepted on trust (and marked as plain self check-in).
  let markedVia = "self_checkin";
  let zone = null;

  if (geofences.length > 0) {
    const latitude = Number(req.body.latitude);
    const longitude = Number(req.body.longitude);
    const accuracy = Number(req.body.accuracy);

    if (!isValidCoordinate(latitude, longitude)) {
      throw ApiError.badRequest("Your location is required to check in");
    }

    if (Number.isFinite(accuracy) && accuracy > MAX_GPS_ACCURACY_METERS) {
      throw ApiError.badRequest(
        "Your location is too imprecise. Move to an open area and try again"
      );
    }

    zone = geofences.find(
      (fence) =>
        distanceMeters({ latitude, longitude }, fence.center) <=
        fence.radiusMeters
    );

    if (!zone) {
      throw ApiError.forbidden("You are outside the allowed check-in area");
    }

    markedVia = "geofence";
  }

  const now = new Date();

  const filter = {
    instituteId,
    userId: req.user._id,
    date: todayKey(timezone),
    classId: null,
  };

  const existing = await Attendance.findOne(filter);

  if (action === "in") {
    if (existing?.checkIn) {
      throw ApiError.badRequest("You have already checked in today");
    }

    const record = await Attendance.findOneAndUpdate(
      filter,
      {
        $set: {
          status: "present",
          checkIn: now,
          timezone,
          markedVia,
          source: "web",
          markedBy: req.user._id,
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    return sendSuccess(res, {
      message: zone ? `Checked in at ${zone.name}` : "Checked in",
      data: record,
    });
  }

  if (!existing?.checkIn) {
    throw ApiError.badRequest("Check in before checking out");
  }

  if (existing.checkOut) {
    throw ApiError.badRequest("You have already checked out today");
  }

  existing.checkOut = now;
  existing.workedMinutes = Math.round(
    (now.getTime() - existing.checkIn.getTime()) / 60000
  );

  await existing.save();

  return sendSuccess(res, {
    message: "Checked out",
    data: existing,
  });
});

export const scanQr = asyncHandler(async (req, res) => {
  const code = String(req.body.code ?? "").trim();

  if (!code) {
    throw ApiError.badRequest("Enter the attendance code");
  }

  const now = new Date();

  const timezone = resolveTimezone(req.body.timezone);

  const session = await QRSession.findOne({
    instituteId: req.user.instituteId,
    tokenHash: hashCode(code),
    sessionType: "attendance",
    status: "active",
    startsAt: { $lte: now },
    expiresAt: { $gt: now },
    isDeleted: { $ne: true },
  });

  // One message for wrong, expired and closed codes alike.
  if (!session) {
    throw ApiError.badRequest("That code is invalid or has expired");
  }

  const enrolled = await Class.exists({
    _id: session.classId,
    studentIds: req.user._id,
  });

  if (!enrolled) {
    throw ApiError.forbidden("You are not enrolled in this class");
  }

  // Claim the scan atomically: the filter only matches while this student
  // has no accepted scan, so a double-tap cannot be counted twice.
  const claimed = await QRSession.updateOne(
    {
      _id: session._id,
      scans: {
        $not: {
          $elemMatch: { userId: req.user._id, status: "accepted" },
        },
      },
    },
    {
      $push: {
        scans: {
          userId: req.user._id,
          status: "accepted",
          verificationMethod: "qr",
          scannedAt: now,
        },
      },
      $inc: { scanCount: 1, uniqueScannerCount: 1 },
    }
  );

  if (claimed.modifiedCount === 0) {
    return sendSuccess(res, { message: "Your attendance is already marked" });
  }

  const record = await Attendance.findOneAndUpdate(
    {
      instituteId: req.user.instituteId,
      userId: req.user._id,
      date: todayKey(timezone),
      classId: session.classId,
    },
    {
      $set: {
        status: "present",
        checkIn: now,
        markedVia: "qr",
        source: "web",
        markedBy: req.user._id,
      },
    },
    { upsert: true, new: true, runValidators: true }
  );

  return sendSuccess(res, {
    message: "Attendance marked present",
    data: record,
  });
});