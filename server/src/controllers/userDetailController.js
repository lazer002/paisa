import { User, RolePermissions } from "../models/user.js";
import Organization from "../models/organization.js";
import { Leave } from "../models/Leave.js";
import { Payroll } from "../models/Payroll.js";
import { Attendance } from "../models/Attendance.js";
import { Class } from "../models/Class.js";
import Student from "../models/student.js";
import { asyncHandler } from "../utils/errorHandler.js";
import { sendSuccess, sendNotFound, sendForbidden } from "../utils/response.js";

/**
 * GET /api/users/:id/detail
 * Rich CRM-style profile: identity, org, role, permissions, and
 * cross-module activity. Access rules:
 *   - super_admin: anyone
 *   - admin: same-org users only (any role in their org)
 *   - everyone else: themselves only
 */
export const getUserDetail = asyncHandler(async (req, res) => {
  const targetId = req.params.id;
  const actor = req.user;

  const isSelf = String(actor._id) === targetId;

  if (!isSelf) {
    if (actor.role === "admin") {
      const target = await User.findById(targetId).select("instituteId").lean();
      if (!target || String(target.instituteId ?? "") !== String(actor.instituteId ?? "")) {
        return sendForbidden(res, "Access denied");
      }
    } else if (actor.role !== "super_admin") {
      return sendForbidden(res, "Access denied");
    }
  }

  const user = await User.findById(targetId)
    .select("-passwordHash -failedAttempts -lockedUntil")
    .populate("instituteId", "name type orgCode status plan")
    .lean();

  if (!user) return sendNotFound(res, "User not found");

  const orgId = user.instituteId?._id ?? user.instituteId;

  // Parallel aggregates — cheap queries, big CRM value
  const [leaves, payrolls, attendance, teachingClasses, enrolledClasses, studentProfile] =
    await Promise.all([
      Leave.find({ userId: targetId }).sort({ createdAt: -1 }).limit(10).lean(),
      Payroll.find({ employeeId: targetId }).sort({ year: -1, month: -1 }).limit(10).lean(),
      Attendance.find({ userId: targetId }).sort({ date: -1 }).limit(30).lean(),
      user.role === "teacher"
        ? Class.find({ teacherId: targetId }).select("name subject status").lean()
        : Promise.resolve([]),
      Class.find({ studentIds: targetId }).select("name subject status").lean(),
      Student.findOne({ userId: targetId }).populate("userId", "name").lean(),
    ]);

  const presentCount = attendance.filter((a) => a.status === "present").length;
  const attendancePercent = attendance.length
    ? Math.round((presentCount / attendance.length) * 100)
    : null;

  sendSuccess(res, "User detail fetched", {
    user,
    permissions: RolePermissions[user.role] ?? [],
    activity: {
      leaves,
      payrolls,
      attendancePercent,
      recentAttendance: attendance.slice(0, 10),
      teachingClasses,
      enrolledClasses,
      studentProfile,
    },
  });
});
