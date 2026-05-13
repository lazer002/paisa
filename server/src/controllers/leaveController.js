import { Leave } from "../models/Leave.js";
import { asyncHandler } from "../utils/errorHandler.js";
import { sendSuccess, sendCreated, sendNotFound, sendForbidden, sendError } from "../utils/response.js";

// Roles that can approve/reject leaves
const APPROVER_ROLES = ["super_admin", "admin", "hr"];
// Roles that can only see their own leaves
const SELF_ONLY_ROLES = ["employee", "teacher", "student"];

export const applyLeave = asyncHandler(async (req, res) => {
  const { type, startDate, endDate, reason } = req.body;

  if (!type || !startDate || !endDate || !reason) {
    return sendError(res, 400, "All fields are required");
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (end < start) return sendError(res, 400, "End date cannot be before start date");

  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

  const leave = await Leave.create({
    instituteId: req.user.instituteId,
    userId: req.user._id,
    type,
    startDate: start,
    endDate: end,
    days,
    reason,
  });

  sendCreated(res, "Leave applied", leave);
});

export const getLeaves = asyncHandler(async (req, res) => {
  let query = {};

  if (req.user.role !== "super_admin") query.instituteId = req.user.instituteId;

  // Self-only roles can only see their own leaves regardless of query params
  if (SELF_ONLY_ROLES.includes(req.user.role)) {
    query.userId = req.user._id;
  } else {
    // HR/admin can filter by userId
    if (req.query.userId) query.userId = req.query.userId;
  }

  if (req.query.status) query.status = req.query.status;
  if (req.query.type) query.type = req.query.type;

  const leaves = await Leave.find(query)
    .populate("userId", "name email userCode role")
    .populate("approvedBy", "name")
    .sort({ createdAt: -1 });

  sendSuccess(res, "Leaves fetched", leaves);
});

export const updateLeaveStatus = asyncHandler(async (req, res) => {
  // Only approvers can change leave status
  if (!APPROVER_ROLES.includes(req.user.role)) {
    return sendForbidden(res, "Only HR or Admin can approve or reject leaves");
  }

  const { status, rejectionReason } = req.body;
  const validStatuses = ["approved", "rejected"];
  if (!validStatuses.includes(status)) {
    return sendError(res, 400, "Status must be 'approved' or 'rejected'");
  }

  const leave = await Leave.findById(req.params.id);
  if (!leave) return sendNotFound(res, "Leave not found");

  // Institute isolation
  if (req.user.role !== "super_admin" && String(leave.instituteId) !== String(req.user.instituteId)) {
    return sendForbidden(res, "Access denied");
  }

  if (leave.status !== "pending") {
    return sendError(res, 400, `Leave is already ${leave.status}`);
  }

  const update = { status, approvedBy: req.user._id, approvedAt: new Date() };
  if (status === "rejected" && rejectionReason) update.rejectionReason = rejectionReason;

  const updated = await Leave.findByIdAndUpdate(req.params.id, update, { new: true })
    .populate("userId", "name email");

  sendSuccess(res, `Leave ${status}`, updated);
});

export const cancelLeave = asyncHandler(async (req, res) => {
  const leave = await Leave.findOne({
    _id: req.params.id,
    userId: req.user._id,
    status: "pending",
  });

  if (!leave) return sendNotFound(res, "Pending leave not found or you do not own it");

  leave.status = "cancelled";
  await leave.save();

  sendSuccess(res, "Leave cancelled", leave);
});
