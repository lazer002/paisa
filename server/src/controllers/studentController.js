// src/controllers/studentController.js

import Student from "../models/student.js";
import { User, Roles } from "../models/User.js";

import {
  sendSuccess,
  sendCreated,
  sendError,
  sendNotFound,
  sendForbidden,
} from "../utils/response.js";

import { scopedQuery } from "../utils/peopleHelpers.js";

import { resolveRef } from "../utils/resolveRef.js";

// Create student profile
export const createStudent = async (
  req,
  res
) => {
  try {
    const {
      userId,
      enrollmentNumber,
      course,
      year,
    } = req.body;

    if (
      !userId ||
      !enrollmentNumber
    ) {
      return sendError(
        res,
        400,
        "userId and enrollmentNumber are required"
      );
    }

    // userId arrives as a publicId — resolve to _id.
    const resolvedUserId = await resolveRef(
      User,
      userId,
      { label: "User" }
    );

    const user =
      await User.findById(
        resolvedUserId
      ).lean();

    if (!user) {
      return sendError(
        res,
        404,
        "User not found"
      );
    }

    if (
      user.role !==
      Roles.STUDENT
    ) {
      return sendError(
        res,
        400,
        "The linked user must have the student role"
      );
    }

    // Super admin can use the
    // student's institute.
    // Other users use their own institute.
    const instituteId =
      req.user.role ===
      Roles.SUPER_ADMIN
        ? user.instituteId
        : req.user.instituteId;

    if (!instituteId) {
      return sendError(
        res,
        400,
        "Institute context required"
      );
    }

    const student =
      await Student.create({
        userId: resolvedUserId,
        instituteId,
        enrollmentNumber,
        course,
        year,
      });

    sendCreated(
      res,
      "Student created",
      student
    );
  } catch (err) {
    if (
      err?.code === 11000
    ) {
      return sendError(
        res,
        400,
        "Enrollment number already exists"
      );
    }

    console.error(
      "Create student error:",
      err
    );

    sendError(
      res,
      500,
      "Server error"
    );
  }
};

// Get students
export const getStudents = async (
  req,
  res
) => {
  try {
    const students =
      await Student.find(
        scopedQuery(req.user)
      )
        .populate(
          "userId",
          "name email userCode"
        )
        .populate(
          "instituteId",
          "name type"
        )
        .sort({
          createdAt: -1,
        })
        .lean();    sendSuccess(
      res,
      "Students fetched",
      students
    );
  } catch (err) {
    console.error("Get students error:", err);

    sendError(res, 500, "Server error");
  }
};

// Get one student profile
export const getStudent = async (req, res) => {
  try {
    const _id = await resolveRef(Student, req.params.publicId, {
      label: "Student",
    });

    const student = await Student.findById(_id)
      .populate("userId", "name email userCode role status")
      .populate("instituteId", "name type")
      .lean();

    if (!student) {
      return sendNotFound(res, "Student not found");
    }

    if (
      req.user.role !== "super_admin" &&
      String(student.instituteId?._id || student.instituteId) !==
        String(req.user.instituteId)
    ) {
      return sendForbidden(res, "Access denied");
    }

    sendSuccess(res, "Student fetched", student);
  } catch (err) {
    console.error("Get student error:", err);
    sendError(res, 500, "Server error");
  }
};

// Fields a manager may edit on a student profile.
const UPDATABLE = [
  "course",
  "branch",
  "year",
  "semester",
  "section",
  "rollNumber",
  "academicStatus",
];

// Update student profile
export const updateStudent = async (req, res) => {
  try {
    const _id = await resolveRef(Student, req.params.publicId, {
      label: "Student",
    });

    const student = await Student.findById(_id);

    if (!student) {
      return sendNotFound(res, "Student not found");
    }

    if (
      req.user.role !== "super_admin" &&
      String(student.instituteId) !== String(req.user.instituteId)
    ) {
      return sendForbidden(res, "Access denied");
    }

    const updates = {};
    for (const key of UPDATABLE) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    if (!Object.keys(updates).length) {
      return sendError(res, 400, "No editable fields supplied");
    }

    Object.assign(student, updates);
    await student.save();

    sendSuccess(res, "Student updated", student);
  } catch (err) {
    console.error("Update student error:", err);
    sendError(res, 500, "Server error");
  }
};

// Delete student profile (keeps the linked user account)
export const deleteStudent = async (req, res) => {
  try {
    const _id = await resolveRef(Student, req.params.publicId, {
      label: "Student",
    });

    const student = await Student.findById(_id);

    if (!student) {
      return sendNotFound(res, "Student not found");
    }

    if (
      req.user.role !== "super_admin" &&
      String(student.instituteId) !== String(req.user.instituteId)
    ) {
      return sendForbidden(res, "Access denied");
    }

    await student.deleteOne();

    sendSuccess(res, "Student profile deleted", null);
  } catch (err) {
    console.error("Delete student error:", err);
    sendError(res, 500, "Server error");
  }
};