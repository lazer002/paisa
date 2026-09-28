// src/controllers/userDetailController.js

import { User, RolePermissions } from "../models/User.js";
import Organization from "../models/organization.js";
import { Leave } from "../models/Leave.js";
import { Payroll } from "../models/Payroll.js";
import { Attendance } from "../models/Attendance.js";
import { Class } from "../models/Class.js";
import Student from "../models/student.js";

import { asyncHandler } from "../utils/errorHandler.js";

import {
  sendSuccess,
  sendNotFound,
  sendForbidden,
} from "../utils/response.js";

export const getUserDetail = asyncHandler(
  async (req, res) => {
    const targetPublicId =
      req.params.publicId;

    const actor = req.user;

    const target =
      await User.findOne({
        publicId:
          targetPublicId,
      })
        .select(
          "_id publicId instituteId role"
        )
        .lean();

    if (!target) {
      return sendNotFound(
        res,
        "User not found"
      );
    }

    const isSelf =
      String(target._id) ===
      String(actor._id);

    // ─────────────────────────────
    // ACCESS CONTROL
    // ─────────────────────────────

    if (!isSelf) {
      if (
        actor.role === "admin"
      ) {
        if (
          String(
            target.instituteId ??
              ""
          ) !==
          String(
            actor.instituteId ??
              ""
          )
        ) {
          return sendForbidden(
            res,
            "Access denied"
          );
        }
      } else if (
        actor.role !==
        "super_admin"
      ) {
        return sendForbidden(
          res,
          "Access denied"
        );
      }
    }

    // ─────────────────────────────
    // USER
    // ─────────────────────────────

    const user =
      await User.findOne({
        publicId:
          targetPublicId,
      })
        .select(
          "-passwordHash -failedAttempts -lockedUntil"
        )
        .populate(
          "instituteId",
          "name type orgCode status plan"
        )
        .lean();

    if (!user) {
      return sendNotFound(
        res,
        "User not found"
      );
    }

    const userId =
      user._id;

    // ─────────────────────────────
    // RELATED DATA
    // ─────────────────────────────

    const [
      leaves,
      payrolls,
      attendance,
      teachingClasses,
      enrolledClasses,
      studentProfile,
    ] = await Promise.all([
      Leave.find({
        userId,
      })
        .sort({
          createdAt: -1,
        })
        .limit(10)
        .lean(),

      Payroll.find({
        employeeId: userId,
      })
        .sort({
          year: -1,
          month: -1,
        })
        .limit(10)
        .lean(),

      Attendance.find({
        userId,
      })
        .sort({
          date: -1,
        })
        .limit(30)
        .lean(),

      user.role === "teacher"
        ? Class.find({
            teacherId: userId,
          })
            .select(
              "name subject status"
            )
            .lean()
        : Promise.resolve([]),

      Class.find({
        studentIds: userId,
      })
        .select(
          "name subject status"
        )
        .lean(),

      Student.findOne({
        userId,
      })
        .populate(
          "userId",
          "name"
        )
        .lean(),
    ]);

    // ─────────────────────────────
    // ATTENDANCE
    // ─────────────────────────────

    const presentCount =
      attendance.filter(
        (item) =>
          item.status ===
          "present"
      ).length;

    const attendancePercent =
      attendance.length
        ? Math.round(
            (presentCount /
              attendance.length) *
              100
          )
        : null;

    // ─────────────────────────────
    // RESPONSE
    // ─────────────────────────────

    sendSuccess(
      res,
      "User detail fetched",
      {
        user,

        permissions:
          RolePermissions[
            user.role
          ] ?? [],

        activity: {
          leaves,
          payrolls,
          attendancePercent,

          recentAttendance:
            attendance.slice(
              0,
              10
            ),

          teachingClasses,
          enrolledClasses,
          studentProfile,
        },
      }
    );
  }
);