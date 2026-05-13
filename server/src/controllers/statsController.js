import { User } from "../models/user.js";
import Organization from "../models/organization.js";
import { Attendance } from "../models/Attendance.js";
import { Assignment } from "../models/Assignment.js";
import { Submission } from "../models/Submission.js";
import { Leave } from "../models/Leave.js";
import { Payroll } from "../models/Payroll.js";
import { Announcement } from "../models/Announcement.js";
import { asyncHandler } from "../utils/errorHandler.js";
import { sendSuccess } from "../utils/response.js";

export const getSuperAdminStats = asyncHandler(async (req, res) => {
  const [totalOrgs, totalUsers, institutes, companies] = await Promise.all([
    Organization.countDocuments({ isDeleted: { $ne: true } }),
    User.countDocuments(),
    Organization.countDocuments({ type: { $in: ["school", "college", "coaching"] }, isDeleted: { $ne: true } }),
    Organization.countDocuments({ type: "company", isDeleted: { $ne: true } }),
  ]);

  const usersByRole = await User.aggregate([
    { $group: { _id: "$role", count: { $sum: 1 } } },
  ]);

  const roleMap = usersByRole.reduce((acc, r) => {
    acc[r._id] = r.count;
    return acc;
  }, {});

  sendSuccess(res, "Stats fetched", {
    organizations: totalOrgs,
    users: totalUsers,
    institutes,
    companies,
    teachers: roleMap.teacher || 0,
    students: roleMap.student || 0,
    employees: roleMap.employee || 0,
    hr: roleMap.hr || 0,
    admins: roleMap.admin || 0,
  });
});

export const getAdminStats = asyncHandler(async (req, res) => {
  const instituteId = req.user.instituteId;

  const [teachers, students, employees, hr, announcements, pendingLeaves] = await Promise.all([
    User.countDocuments({ instituteId, role: "teacher" }),
    User.countDocuments({ instituteId, role: "student" }),
    User.countDocuments({ instituteId, role: "employee" }),
    User.countDocuments({ instituteId, role: "hr" }),
    Announcement.countDocuments({ instituteId, isActive: true }),
    Leave.countDocuments({ instituteId, status: "pending" }),
  ]);

  sendSuccess(res, "Admin stats", {
    teachers,
    students,
    employees,
    hr,
    announcements,
    pendingLeaves,
    totalStaff: teachers + students + employees + hr,
  });
});

export const getTeacherStats = asyncHandler(async (req, res) => {
  const { Class } = await import("../models/Class.js");

  const [myClasses, myAssignments, pendingSubmissions] = await Promise.all([
    Class.countDocuments({ teacherId: req.user._id, status: "active" }),
    Assignment.countDocuments({ createdBy: req.user._id }),
    Submission.countDocuments({ status: "submitted" }),
  ]);

  sendSuccess(res, "Teacher stats", { myClasses, myAssignments, pendingSubmissions });
});

export const getStudentStats = asyncHandler(async (req, res) => {
  const { Class } = await import("../models/Class.js");

  const [enrolledClasses, pendingAssignments, submittedAssignments] = await Promise.all([
    Class.countDocuments({ studentIds: req.user._id }),
    Assignment.countDocuments({ status: "published" }),
    Submission.countDocuments({ studentId: req.user._id }),
  ]);

  const attendance = await Attendance.find({ userId: req.user._id }).lean();
  const present = attendance.filter(a => a.status === "present").length;
  const attendancePercent = attendance.length > 0 ? Math.round((present / attendance.length) * 100) : 0;

  sendSuccess(res, "Student stats", {
    enrolledClasses,
    pendingAssignments,
    submittedAssignments,
    attendancePercent,
  });
});

export const getHRStats = asyncHandler(async (req, res) => {
  const instituteId = req.user.instituteId;

  const [employees, pendingLeaves, processedPayrolls, departments] = await Promise.all([
    User.countDocuments({ instituteId, role: "employee" }),
    Leave.countDocuments({ instituteId, status: "pending" }),
    Payroll.countDocuments({ instituteId, status: "paid" }),
    (await import("../models/Department.js")).Department.countDocuments({ instituteId }),
  ]);

  sendSuccess(res, "HR stats", { employees, pendingLeaves, processedPayrolls, departments });
});

export const getEmployeeStats = asyncHandler(async (req, res) => {
  const [myLeaves, myPayslips, pendingLeaves] = await Promise.all([
    Leave.countDocuments({ userId: req.user._id }),
    Payroll.countDocuments({ employeeId: req.user._id }),
    Leave.countDocuments({ userId: req.user._id, status: "pending" }),
  ]);

  const attendance = await Attendance.find({ userId: req.user._id }).sort({ date: -1 }).limit(30).lean();
  const present = attendance.filter(a => a.status === "present").length;
  const attendancePercent = attendance.length > 0 ? Math.round((present / attendance.length) * 100) : 0;

  sendSuccess(res, "Employee stats", { myLeaves, myPayslips, pendingLeaves, attendancePercent });
});
