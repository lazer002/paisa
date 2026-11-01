// src/controllers/classController.js

import crypto from "node:crypto";

import { Class } from "../models/Class.js";
import { childUserIdsFor } from "../utils/parentScope.js";

import { User } from "../models/User.js";

import { asyncHandler } from "../utils/errorHandler.js";

import { resolveRef } from "../utils/resolveRef.js";
import { escapeRegex } from "../utils/crudHelpers.js";

import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendForbidden,
  sendError,
} from "../utils/response.js";

export const createClass = asyncHandler(async (req, res) => {
  const {
    name,
    subject,
    description,
    teacherId,
    schedule,
    room,
    maxStudents,
  } = req.body;

  const instituteId = req.user.instituteId;

  if (!instituteId) {
    return sendForbidden(
      res,
      "Institute context required"
    );
  }

  if (!name || !subject) {
    return sendError(
      res,
      400,
      "Name and subject are required"
    );
  }

  // teacherId arrives as a publicId — resolve it within this organization.
  const resolvedTeacherId =
    req.user.role === "teacher"
      ? req.user._id
      : ((await resolveRef(User, teacherId, {
          label: "Teacher",
          scope: { instituteId },
        })) ??
          req.user._id);

  const newClass = await Class.create({
    instituteId,
    name,
    // Existing databases still have the old null-colliding unique index,
    // so a class always gets a code.
    code: req.body.code || `CLS-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
    subject,
    description,

    teacherId: resolvedTeacherId,

    schedule,
    room,
    maxStudents,
  });

  sendCreated(
    res,
    "Class created successfully",
    newClass
  );
});

export const getClasses = asyncHandler(async (req, res) => {
  const {
    search,
    status,
    teacherId,
  } = req.query;

  const query = {};

  if (req.user.role !== "super_admin") {
    query.instituteId = req.user.instituteId;
  }

  if (req.user.role === "teacher") {
    query.teacherId = req.user._id;
  }

  if (req.user.role === "student") {
    query.studentIds = req.user._id;
  }

  if (req.user.role === "parent") {
    query.studentIds = {
      $in: await childUserIdsFor(req.user),
    };
  }

  if (status) {
    query.status = status;
  }

  // Admin/super_admin can filter by teacherId (publicId)
  if (
    teacherId &&
    req.user.role !== "teacher"
  ) {
    query.teacherId = await resolveRef(
      User,
      teacherId,
      {
        label: "Teacher",
        scope:
          req.user.role === "super_admin"
            ? {}
            : { instituteId: req.user.instituteId },
      }
    );
  }

  if (search) {
    query.$or = [
      {
        name: {
          $regex: escapeRegex(search),
          $options: "i",
        },
      },
      {
        subject: {
          $regex: escapeRegex(search),
          $options: "i",
        },
      },
    ];
  }

  const classes = await Class.find(query)
    .populate(
      "teacherId",
      "name email userCode"
    )
    .sort({
      createdAt: -1,
    });

  sendSuccess(
    res,
    "Classes fetched",
    classes
  );
});

export const getClass = asyncHandler(async (req, res) => {
  const cls = await Class.findOne({
    publicId: req.params.publicId,
  })
    .populate(
      "teacherId",
      "name email userCode"
    )
    .populate(
      "studentIds",
      "name email userCode"
    );

  if (!cls) {
    return sendNotFound(
      res,
      "Class not found"
    );
  }

  // Verify institute isolation
  if (req.user.role !== "super_admin") {
    if (
      String(cls.instituteId) !==
      String(req.user.instituteId)
    ) {
      return sendForbidden(
        res,
        "Access denied"
      );
    }
  }

  // Student can only view enrolled classes
  if (req.user.role === "student") {
    const enrolled =
      cls.studentIds?.some(
        (student) =>
          String(student._id || student) ===
          String(req.user._id)
      );

    if (!enrolled) {
      return sendForbidden(
        res,
        "You are not enrolled in this class"
      );
    }
  }

  if (req.user.role === "parent") {
    const childIds = (
      await childUserIdsFor(req.user)
    ).map(String);

    const isChildClass = cls.studentIds?.some((student) =>
      childIds.includes(String(student._id || student))
    );

    if (!isChildClass) {
      return sendForbidden(
        res,
        "None of your children are in this class"
      );
    }
  }

  sendSuccess(
    res,
    "Class fetched",
    cls
  );
});

export const updateClass = asyncHandler(async (req, res) => {
  const cls = await Class.findOne({
    publicId: req.params.publicId,
  });

  if (!cls) {
    return sendNotFound(
      res,
      "Class not found"
    );
  }

  // Institute isolation
  if (
    req.user.role !== "super_admin" &&
    String(cls.instituteId) !==
      String(req.user.instituteId)
  ) {
    return sendForbidden(
      res,
      "Access denied"
    );
  }

  // Teacher can only edit own classes
  if (
    req.user.role === "teacher" &&
    String(cls.teacherId) !==
      String(req.user._id)
  ) {
    return sendForbidden(
      res,
      "You can only edit your own classes"
    );
  }

  const allowedUpdates = [
    "name",
    "subject",
    "description",
    "schedule",
    "room",
    "maxStudents",
    "status",
  ];

  // Any class manager except the teacher may reassign the teacher
  // (the route already requires class:update).
  if (req.user.role !== "teacher") {
    allowedUpdates.push("teacherId");
  }

  const updates = {};

  for (const key of allowedUpdates) {
    if (req.body[key] !== undefined) {
      updates[key] = req.body[key];
    }
  }

  // A new teacher must belong to the class's own organization.
  if (updates.teacherId) {
    updates.teacherId = await resolveRef(User, updates.teacherId, {
      label: "Teacher",
      scope: { instituteId: cls.instituteId },
    });
  }

  const updated = await Class.findOneAndUpdate(
    {
      publicId: req.params.publicId,
    },
    updates,
    {
      new: true,
      runValidators: true,
    }
  );

  sendSuccess(
    res,
    "Class updated",
    updated
  );
});

export const deleteClass = asyncHandler(async (req, res) => {
  const cls = await Class.findOne({
    publicId: req.params.publicId,
  });

  if (!cls) {
    return sendNotFound(
      res,
      "Class not found"
    );
  }

  if (
    req.user.role !== "super_admin" &&
    String(cls.instituteId) !==
      String(req.user.instituteId)
  ) {
    return sendForbidden(
      res,
      "Access denied"
    );
  }

  await Class.deleteOne({
    publicId: req.params.publicId,
  });

  sendSuccess(
    res,
    "Class deleted"
  );
});

export const enrollStudent = asyncHandler(async (req, res) => {
  const { studentId } = req.body;

  if (!studentId) {
    return sendError(
      res,
      400,
      "studentId is required"
    );
  }

  const cls = await Class.findOne({
    publicId: req.params.publicId,
  });

  if (!cls) {
    return sendNotFound(
      res,
      "Class not found"
    );
  }

  if (
    req.user.role !== "super_admin" &&
    String(cls.instituteId) !==
      String(req.user.instituteId)
  ) {
    return sendForbidden(
      res,
      "Access denied"
    );
  }

  // studentId arrives as a publicId; only students of the class's own
  // organization can be enrolled.
  const resolvedStudentId = await resolveRef(
    User,
    studentId,
    {
      label: "Student",
      scope: { instituteId: cls.instituteId, role: "student" },
    }
  );

  const updated = await Class.findOneAndUpdate(
    {
      publicId: req.params.publicId,
    },
    {
      $addToSet: {
        studentIds: resolvedStudentId,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  ).populate(
    "studentIds",
    "name email userCode"
  );

  sendSuccess(
    res,
    "Student enrolled",
    updated
  );
});

export const removeStudent = asyncHandler(async (req, res) => {
  const cls = await Class.findOne({
    publicId: req.params.publicId,
  });

  if (!cls) {
    return sendNotFound(
      res,
      "Class not found"
    );
  }

  if (
    req.user.role !== "super_admin" &&
    String(cls.instituteId) !==
      String(req.user.instituteId)
  ) {
    return sendForbidden(
      res,
      "Access denied"
    );
  }

  const updated = await Class.findOneAndUpdate(
    {
      publicId: req.params.publicId,
    },
    {
      $pull: {
        studentIds: req.params.studentId,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  sendSuccess(
    res,
    "Student removed",
    updated
  );
});