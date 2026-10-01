// src/controllers/teacherController.js

import Teacher from "../models/teacher.js";
import { User, Roles } from "../models/User.js";

import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendError,
} from "../utils/response.js";

import { scopedQuery } from "../utils/peopleHelpers.js";

import { resolveRef } from "../utils/resolveRef.js";

// Create teacher profile
export const createTeacher = async (
  req,
  res
) => {
  try {
    const {
      userId,
      instituteId,
      subject,
      qualifications,
      experience,
    } = req.body;

    if (!userId) {
      return sendError(
        res,
        400,
        "userId is required"
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
      return sendNotFound(
        res,
        "User not found"
      );
    }

    if (
      user.role !==
      Roles.TEACHER
    ) {
      return sendError(
        res,
        400,
        "The linked user must have the teacher role"
      );
    }

    // Never allow a normal user
    // to create a teacher profile
    // inside another institute.
    const resolvedInstituteId =
      req.user.role ===
      Roles.SUPER_ADMIN
        ? instituteId ||
          user.instituteId
        : req.user.instituteId;

    if (!resolvedInstituteId) {
      return sendError(
        res,
        400,
        "Institute context required"
      );
    }

    // For non-super-admin users,
    // enforce their own institute.
    if (
      req.user.role !==
        Roles.SUPER_ADMIN &&
      instituteId &&
      String(instituteId) !==
        String(req.user.instituteId)
    ) {
      return sendError(
        res,
        403,
        "You cannot create a teacher in another institute"
      );
    }

    const teacher =
      await Teacher.create({
        userId: resolvedUserId,
        instituteId:
          resolvedInstituteId,
        subject,
        qualifications,
        experience,
      });

    sendCreated(
      res,
      "Teacher created",
      teacher
    );
  } catch (err) {
    if (
      err?.code === 11000
    ) {
      return sendError(
        res,
        400,
        "Teacher profile already exists"
      );
    }

    console.error(
      "Create teacher error:",
      err
    );

    sendError(
      res,
      500,
      "Server error"
    );
  }
};

// Get teachers
export const getTeachers = async (
  req,
  res
) => {
  try {
    const teachers =
      await Teacher.find(
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
        .lean();

    sendSuccess(
      res,
      "Teachers fetched",
      teachers
    );
  } catch (err) {
    console.error(
      "Get teachers error:",
      err
    );

    sendError(
      res,
      500,
      "Server error"
    );
  }
};