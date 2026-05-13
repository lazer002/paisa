import { Leave } from "../models/Leave.js";
import { asyncHandler } from "../utils/errorHandler.js";
import { sendSuccess, sendCreated, sendNotFound } from "../utils/response.js";

export const applyLeave = asyncHandler(async (req, res) => {
  const { type, startDate, endDate, reason } = req.body;

  const start = new Date(startDate);
  const end = new Date(endDate);
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
  if (req.user.role !== "super_admin") {
    query.instituteId = req.user.instituteId;
  }
  const selfRoles = ["employee", "teacher", "student"];
  if (selfRoles.includes(req.user.role)) {
    query.userId = req.user._id;
  }
  if (req.query.userId) query.userId = req.query.userId;
  if (req.query.status) query.status = req.query.status;
  if (req.query.type) query.type = req.query.type;

  const leaves = await Leave.find(query)
    .populate("userId", "name email userCode role")
    .populate("approvedBy", "name")
    .sort({ createdAt: -1 });

  sendSuccess(res, "Leaves fetched", leaves);
});

export const updateLeaveStatus = asyncHandler(async (req, res) => {
  const { status, rejectionReason } = req.body;
  const update = {
    status,
    approvedBy: req.user._id,
    approvedAt: new Date(),
  };
  if (status === "rejected") update.rejectionReason = rejectionReason;

  const leave = await Leave.findByIdAndUpdate(req.params.id, update, { new: true })
    .populate("userId", "name email");
  if (!leave) return sendNotFound(res, "Leave not found");
  sendSuccess(res, "Leave status updated", leave);
});

export const cancelLeave = asyncHandler(async (req, res) => {
  const leave = await Leave.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id, status: "pending" },
    { status: "cancelled" },
    { new: true }
  );
  if (!leave) return sendNotFound(res, "Leave not found or cannot be cancelled");
  sendSuccess(res, "Leave cancelled", leave);
});
