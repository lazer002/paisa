// server/src/controllers/enrollmentController.js
//
// Enrollment module: students join classes/programs,
// progress through statuses, admins manage the lifecycle.

import {Enrollment} from "../models/Enrollment.js";
import { Class } from "../models/Class.js";
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

const ENROLLMENT_STATUSES = [
  "pending",
  "active",
  "completed",
  "suspended",
  "withdrawn",
  "transferred",
  "cancelled",
  "expired",
  "rejected",
];

export const createEnrollment = asyncHandler(
  async (req, res) => {
    const {
      studentId,
      classId,
      type,
      enrollmentNumber,
    } = req.body;

    if (!studentId) {
      return sendError(res, 400, "studentId is required");
    }

    const resolvedStudentId = await resolveRef(
      User,
      studentId,
      { label: "Student" }
    );

    const resolvedClassId = classId
      ? await resolveRef(Class, classId, {
          label: "Class",
        })
      : null;

    const enrollment =
      await Enrollment.create({
        instituteId: req.user.instituteId,

        studentId: resolvedStudentId,

        classId: resolvedClassId,

        type: type || "class",

        enrollmentNumber:
          enrollmentNumber || null,

        status: "active",
      });

    // Keep Class.studentIds in sync.
    if (resolvedClassId) {
      await Class.findByIdAndUpdate(
        resolvedClassId,
        {
          $addToSet: {
            studentIds: resolvedStudentId,
          },
        }
      );
    }

    return sendCreated(res, {
      message: "Student enrolled",
      data: enrollment,
    });
  }
);

export const getEnrollments = asyncHandler(
  async (req, res) => {
    const { status, classId, studentId } = req.query;

    const query = scoped(req);

    if (req.user.role === "student") {
      query.studentId = req.user._id;
    }

    if (status) query.status = status;

    if (classId) {
      query.classId = await resolveRef(
        Class,
        classId,
        { label: "Class" }
      );
    }

    if (studentId) {
      query.studentId = await resolveRef(
        User,
        studentId,
        { label: "Student" }
      );
    }

    const enrollments =
      await Enrollment.find(query)
        .populate(
          "studentId",
          "name email userCode"
        )
        .populate("classId", "name subject")
        .sort({ createdAt: -1 });

    return sendSuccess(res, {
      message: "Enrollments fetched",
      data: enrollments,
    });
  }
);

export const updateEnrollmentStatus = asyncHandler(
  async (req, res) => {
    const { status } = req.body;

    if (
      !ENROLLMENT_STATUSES.includes(status)
    ) {
      return sendError(
        res,
        400,
        "Invalid enrollment status"
      );
    }

    const enrollment =
      await Enrollment.findOne({
        publicId: req.params.publicId,
      });

    if (!enrollment) {
      return sendNotFound(
        res,
        "Enrollment not found"
      );
    }

    if (
      req.user.role !== "super_admin" &&
      String(enrollment.instituteId) !==
        String(req.user.instituteId)
    ) {
      return sendForbidden(res, "Access denied");
    }

    enrollment.status = status;

    await enrollment.save();

    return sendSuccess(res, {
      message: "Enrollment updated",
      data: enrollment,
    });
  }
);

export const deleteEnrollment = asyncHandler(
  async (req, res) => {
    const enrollment =
      await Enrollment.findOne({
        publicId: req.params.publicId,
      });

    if (!enrollment) {
      return sendNotFound(
        res,
        "Enrollment not found"
      );
    }

    if (
      req.user.role !== "super_admin" &&
      String(enrollment.instituteId) !==
        String(req.user.instituteId)
    ) {
      return sendForbidden(res, "Access denied");
    }

    // Detach from the class roster.
    if (enrollment.classId) {
      await Class.findByIdAndUpdate(
        enrollment.classId,
        {
          $pull: {
            studentIds: enrollment.studentId,
          },
        }
      );
    }

    await enrollment.deleteOne();

    return sendSuccess(res, {
      message: "Enrollment removed",
      data: null,
    });
  }
);
