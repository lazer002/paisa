// src/controllers/leaveController.js

import { Leave, LEAVE_TYPES } from "../models/Leave.js";
import { User } from "../models/User.js";
import {
  leaveYearOf,
  remainingFor,
  syncUserBalances,
  UNPAID_LEAVE_TYPE,
} from "../services/leaveBalanceService.js";

import { asyncHandler } from "../utils/errorHandler.js";
import { hasAnyPermission } from "../utils/permissions.js";
import { resolveRef } from "../utils/resolveRef.js";
import { sendInBackground } from "../services/emailService.js";
import { sendLeaveDecisionEmail } from "../services/transactionalEmails.js";

import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendForbidden,
  sendError,
} from "../utils/response.js";

// Holders of these may approve/reject and act on anyone's leave in their org.
const APPROVER_PERMISSIONS = [
  "leave:approve",
  "leave:manage",
];

const HALF_DAY_DURATIONS = [
  "half_day_morning",
  "half_day_evening",
];

const isApprover = (user) =>
  user.role === "super_admin" ||
  hasAnyPermission(user, APPROVER_PERMISSIONS);

const sameTenant = (req, row) =>
  req.user.role === "super_admin" ||
  String(row.instituteId) === String(req.user.instituteId);

/** Recompute the leave owner's balance for the leave's year. */
const resyncOwner = async (leave) => {
  const owner = await User.findById(leave.userId).select(
    "_id role instituteId"
  );

  if (owner) {
    await syncUserBalances(owner, leaveYearOf(leave.startDate));
  }
};

const fmt = (n) => Number(n.toFixed(2));

/* =========================================================
   APPLY LEAVE
========================================================= */

export const applyLeave = asyncHandler(async (req, res) => {
  const {
    type,
    startDate,
    endDate,
    reason,
    duration,
  } = req.body;

  if (
    !type ||
    !startDate ||
    !endDate ||
    !reason
  ) {
    return sendError(
      res,
      400,
      "All fields are required"
    );
  }

  if (!LEAVE_TYPES.includes(type)) {
    return sendError(res, 400, "Invalid leave type");
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    return sendError(
      res,
      400,
      "Invalid start or end date"
    );
  }

  if (end < start) {
    return sendError(
      res,
      400,
      "End date cannot be before start date"
    );
  }

  const isHalfDay =
    HALF_DAY_DURATIONS.includes(duration) ||
    type === "half_day";

  if (
    isHalfDay &&
    start.toISOString().slice(0, 10) !==
      end.toISOString().slice(0, 10)
  ) {
    return sendError(
      res,
      400,
      "Half-day leave must be for a single day"
    );
  }

  const days = isHalfDay
    ? 0.5
    : Math.ceil(
        (end - start) /
          (1000 * 60 * 60 * 24)
      ) + 1;

  const resolvedDuration = isHalfDay
    ? HALF_DAY_DURATIONS.includes(duration)
      ? duration
      : "half_day_morning"
    : days > 1
      ? "multi_day"
      : "full_day";

  const overlapping = await Leave.findOverlapping({
    userId: req.user._id,
    startDate: start,
    endDate: end,
  });

  if (overlapping.length) {
    return sendError(
      res,
      400,
      "You already have a pending or approved leave on these dates"
    );
  }

  const year = leaveYearOf(start);

  // Pre-check against the balance (unpaid / untracked types are unlimited).
  const before = await remainingFor(req.user, type, year);

  if (before && days > before.remaining) {
    return sendError(res, {
      statusCode: 400,
      code: "INSUFFICIENT_LEAVE_BALANCE",
      message: `Insufficient ${before.name} balance: ${fmt(Math.max(0, before.remaining))} day(s) remaining, ${days} requested. Apply as unpaid leave instead.`,
    });
  }

  const leave = await Leave.create({
    instituteId:
      req.user.instituteId,

    userId:
      req.user._id,

    type,

    duration: resolvedDuration,

    startDate: start,

    endDate: end,

    days,

    reason,

    createdBy: req.user._id,
  });

  // Post-check closes the race where two requests pass the pre-check at once.
  if (before) {
    const after = await remainingFor(req.user, type, year);

    if (after && after.remaining < 0) {
      await Leave.deleteOne({ _id: leave._id });
      await syncUserBalances(req.user, year);

      return sendError(res, {
        statusCode: 409,
        code: "INSUFFICIENT_LEAVE_BALANCE",
        message: `Insufficient ${after.name} balance for ${days} day(s)`,
      });
    }
  }

  sendCreated(
    res,
    "Leave applied",
    leave
  );
});

/* =========================================================
   GET LEAVES
========================================================= */

export const getLeaves = asyncHandler(async (req, res) => {
  const query = { isDeleted: { $ne: true } };

  if (
    req.user.role !== "super_admin"
  ) {
    query.instituteId =
      req.user.instituteId;
  }

  // Anyone who can't approve leave sees only their own.
  if (!isApprover(req.user)) {
    query.userId =
      req.user._id;
  } else {
    // HR/Admin can filter by user.
    if (req.query.userId) {
      query.userId = await resolveRef(
        User,
        req.query.userId,
        { label: "User" }
      );
    }
  }

  if (req.query.status) {
    query.status =
      String(req.query.status);
  }

  if (req.query.type) {
    query.type =
      String(req.query.type);
  }

  const leaves =
    await Leave.find(query)
      .populate(
        "userId",
        "name email userCode role publicId"
      )
      .populate(
        "approvedBy",
        "name"
      )
      .sort({
        createdAt: -1,
      });

  sendSuccess(
    res,
    "Leaves fetched",
    leaves
  );
});

/* =========================================================
   UPDATE LEAVE STATUS
========================================================= */

export const updateLeaveStatus =
  asyncHandler(async (req, res) => {
    if (!isApprover(req.user)) {
      return sendForbidden(
        res,
        "Only HR or Admin can approve or reject leaves"
      );
    }

    const {
      status,
      rejectionReason,
      comment,
    } = req.body;

    const validStatuses = [
      "approved",
      "rejected",
    ];

    if (
      !validStatuses.includes(status)
    ) {
      return sendError(
        res,
        400,
        "Status must be 'approved' or 'rejected'"
      );
    }

    const leave =
      await Leave.findOne({
        publicId:
          req.params.publicId,
        isDeleted: { $ne: true },
      });

    if (!leave) {
      return sendNotFound(
        res,
        "Leave not found"
      );
    }

    // Institute isolation
    if (!sameTenant(req, leave)) {
      return sendForbidden(
        res,
        "Access denied"
      );
    }

    if (
      leave.status !==
      "pending"
    ) {
      return sendError(
        res,
        400,
        `Leave is already ${leave.status}`
      );
    }

    leave.status = status;
    leave.updatedBy = req.user._id;
    leave.approverComment = comment ?? null;

    if (status === "approved") {
      leave.approvedBy = req.user._id;
      leave.approvedAt = new Date();
      leave.balanceSnapshot = {
        typeBefore: null,
        typeAfter: null,
        capturedAt: new Date(),
      };
    } else {
      leave.rejectionReason =
        String(rejectionReason || "").trim() ||
        "Not approved";
    }

    await leave.save();

    // Approve: pending -> used. Reject: pending days freed.
    await resyncOwner(leave);

    const updated =
      await Leave.findById(leave._id)
        .populate(
          "userId",
          "name email publicId"
        )
        .populate(
          "approvedBy",
          "name"
        );

    sendSuccess(
      res,
      `Leave ${status}`,
      updated
    );

    sendInBackground("leave-decision", () =>
      sendLeaveDecisionEmail(leave)
    );
  });

/* =========================================================
   CANCEL LEAVE
   Owner: a pending leave, or an approved one that has not started.
   Approvers: any pending/approved leave in their organization.
   Cancelling frees the days in the balance.
========================================================= */

export const cancelLeave =
  asyncHandler(async (req, res) => {
    const leave =
      await Leave.findOne({
        publicId:
          req.params.publicId,
        isDeleted: { $ne: true },
      });

    const isOwner =
      leave &&
      String(leave.userId) ===
        String(req.user._id);

    if (
      !leave ||
      !sameTenant(req, leave) ||
      (!isOwner && !isApprover(req.user))
    ) {
      return sendNotFound(
        res,
        "Leave not found or you do not own it"
      );
    }

    if (
      !["pending", "approved"].includes(
        leave.status
      )
    ) {
      return sendError(
        res,
        400,
        `Leave is already ${leave.status}`
      );
    }

    if (
      leave.status === "approved" &&
      !isApprover(req.user) &&
      leave.startDate <= new Date()
    ) {
      return sendError(
        res,
        400,
        "An approved leave that has started can only be cancelled by HR"
      );
    }

    leave.status = "cancelled";
    leave.cancelledAt = new Date();
    leave.cancelledBy = req.user._id;
    leave.cancellationReason =
      typeof req.body?.reason === "string"
        ? req.body.reason.trim().slice(0, 300) || null
        : null;
    leave.updatedBy = req.user._id;

    await leave.save();
    await resyncOwner(leave);

    sendSuccess(
      res,
      "Leave cancelled",
      leave
    );
  });

export { UNPAID_LEAVE_TYPE };
