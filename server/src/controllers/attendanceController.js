// src/controllers/attendanceController.js

import { Attendance } from "../models/Attendance.js";

import { User } from "../models/User.js";

import { Class } from "../models/Class.js";

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
    userId: req.user._id,
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