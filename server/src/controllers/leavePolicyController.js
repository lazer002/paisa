// server/src/controllers/leavePolicyController.js
//
// Leave policies (per-org yearly allocation per leave type) and per-user
// leave balances. Balance rules live in services/leaveBalanceService.js.

import { LeavePolicy, POLICY_LEAVE_TYPES } from "../models/LeavePolicy.js";
import { LeaveBalance } from "../models/LeaveBalance.js";
import { User } from "../models/User.js";
import { ROLES } from "../config/constants.js";
import {
  balanceView,
  getActivePolicies,
  policyApplies,
  sumLeaveDays,
  syncUserBalances,
  ensureBalance,
} from "../services/leaveBalanceService.js";

import { asyncHandler } from "../utils/errorHandler.js";
import ApiError from "../utils/ApiError.js";
import { hasAnyPermission } from "../utils/permissions.js";
import { resolveRef } from "../utils/resolveRef.js";
import { sendSuccess, sendCreated } from "../utils/response.js";

const ASSIGNABLE_ROLES = Object.values(ROLES).filter(
  (role) => role !== ROLES.SUPER_ADMIN
);

const orgOf = (req) => {
  if (!req.user.instituteId) {
    throw ApiError.badRequest(
      "Leave policies belong to an organization",
      { code: "ORGANIZATION_REQUIRED" }
    );
  }

  return req.user.instituteId;
};

const canSeeEveryone = (user) =>
  user.role === "super_admin" ||
  hasAnyPermission(user, ["leave:approve", "leave:manage"]);

const parseYear = (value) => {
  const year = value === undefined ? new Date().getUTCFullYear() : Number(value);

  if (!Number.isInteger(year) || year < 2000 || year > 2200) {
    throw ApiError.badRequest("Invalid year", { code: "INVALID_YEAR" });
  }

  return year;
};

const daysField = (value, label) => {
  const n = Number(value);

  if (!Number.isFinite(n) || n < 0 || n > 366) {
    throw ApiError.badRequest(`${label} must be between 0 and 366`, {
      code: "VALIDATION_ERROR",
    });
  }

  return n;
};

const policyFields = (body, { partial }) => {
  const update = {};

  if (!partial || body.leaveType !== undefined) {
    if (!POLICY_LEAVE_TYPES.includes(body.leaveType)) {
      throw ApiError.badRequest(
        `leaveType must be one of: ${POLICY_LEAVE_TYPES.join(", ")}`,
        { code: "VALIDATION_ERROR" }
      );
    }
    update.leaveType = body.leaveType;
  }

  if (!partial || body.yearlyAllocation !== undefined) {
    update.yearlyAllocation = daysField(body.yearlyAllocation, "yearlyAllocation");
  }

  if (body.carryForwardCap !== undefined) {
    update.carryForwardCap = daysField(body.carryForwardCap ?? 0, "carryForwardCap");
  }

  if (body.name !== undefined) {
    update.name = String(body.name || "").trim().slice(0, 100) || null;
  }

  if (body.isActive !== undefined) {
    update.isActive = Boolean(body.isActive);
  }

  if (body.appliesToRoles !== undefined) {
    const roles = Array.isArray(body.appliesToRoles) ? body.appliesToRoles : [];
    const invalid = roles.filter((role) => !ASSIGNABLE_ROLES.includes(role));

    if (invalid.length || !roles.length) {
      throw ApiError.badRequest(
        "appliesToRoles must be a non-empty list of organization roles",
        { code: "VALIDATION_ERROR" }
      );
    }
    update.appliesToRoles = [...new Set(roles)];
  }

  return update;
};

const findPolicy = async (req) => {
  const policy = await LeavePolicy.findOne({
    publicId: req.params.publicId,
    instituteId: orgOf(req),
    isDeleted: false,
  });

  if (!policy) {
    throw ApiError.notFound("Leave policy not found");
  }

  return policy;
};

/* =========================================================
   POLICIES
========================================================= */

export const getPolicies = asyncHandler(async (req, res) => {
  const policies = await LeavePolicy.find({
    instituteId: orgOf(req),
    isDeleted: false,
  }).sort({ leaveType: 1 });

  return sendSuccess(res, {
    message: "Leave policies fetched",
    data: policies,
  });
});

export const createPolicy = asyncHandler(async (req, res) => {
  const instituteId = orgOf(req);
  const fields = policyFields(req.body ?? {}, { partial: false });

  const exists = await LeavePolicy.exists({
    instituteId,
    leaveType: fields.leaveType,
    isDeleted: false,
  });

  if (exists) {
    throw ApiError.conflict(
      `A ${fields.leaveType} leave policy already exists`,
      { code: "LEAVE_POLICY_EXISTS" }
    );
  }

  const policy = await LeavePolicy.create({
    ...fields,
    instituteId,
    createdBy: req.user._id,
  });

  return sendCreated(res, {
    message: "Leave policy created",
    data: policy,
  });
});

export const updatePolicy = asyncHandler(async (req, res) => {
  const policy = await findPolicy(req);
  const fields = policyFields(req.body ?? {}, { partial: true });

  if (fields.leaveType && fields.leaveType !== policy.leaveType) {
    throw ApiError.badRequest(
      "The leave type of a policy cannot change; create a new policy",
      { code: "VALIDATION_ERROR" }
    );
  }

  Object.assign(policy, fields, { updatedBy: req.user._id });
  await policy.save();

  // Allocation changes apply to the current year's rows that already exist.
  if (fields.yearlyAllocation !== undefined) {
    await LeaveBalance.updateMany(
      {
        instituteId: policy.instituteId,
        leaveType: policy.leaveType,
        year: new Date().getUTCFullYear(),
      },
      { $set: { allocated: policy.yearlyAllocation } }
    );
  }

  return sendSuccess(res, {
    message: "Leave policy updated",
    data: policy,
  });
});

export const deletePolicy = asyncHandler(async (req, res) => {
  const policy = await findPolicy(req);

  policy.isDeleted = true;
  policy.deletedAt = new Date();
  policy.isActive = false;
  policy.updatedBy = req.user._id;
  await policy.save();

  return sendSuccess(res, {
    message: "Leave policy deleted",
    data: null,
  });
});

/* =========================================================
   BALANCES
========================================================= */

// GET /leaves/balances?year=&userId=  (own; approvers may pass userId)
export const getBalances = asyncHandler(async (req, res) => {
  const year = parseYear(req.query.year);
  let target = req.user;

  if (req.query.userId) {
    const userId = await resolveRef(User, req.query.userId, {
      label: "User",
      scope: { instituteId: orgOf(req) },
    });

    if (String(userId) !== String(req.user._id)) {
      if (!canSeeEveryone(req.user)) {
        throw ApiError.forbidden("You can only view your own leave balance");
      }

      target = await User.findById(userId).select("_id role instituteId name");
    }
  }

  const entries = await syncUserBalances(target, year);

  return sendSuccess(res, {
    message: "Leave balances fetched",
    data: {
      year,
      userId: target.publicId ?? String(target._id),
      balances: entries.map((entry) => ({ ...entry.view, year })),
    },
  });
});

// GET /leaves/balances/all?year=  (approvers): every member the policies cover.
export const getAllBalances = asyncHandler(async (req, res) => {
  const instituteId = orgOf(req);
  const year = parseYear(req.query.year);

  const policies = await getActivePolicies(instituteId);

  if (!policies.length) {
    return sendSuccess(res, {
      message: "Leave balances fetched",
      data: { year, policies: [], users: [] },
    });
  }

  const roles = [
    ...new Set(policies.flatMap((policy) => policy.appliesToRoles ?? [])),
  ];

  const users = await User.find({
    instituteId,
    role: { $in: roles },
    status: "active",
    isDeleted: { $ne: true },
  })
    .select("_id publicId name email role userCode")
    .sort({ name: 1 })
    .limit(1000)
    .lean();

  const userIds = users.map((user) => user._id);

  const [sums, rows] = await Promise.all([
    sumLeaveDays(instituteId, userIds, year),
    LeaveBalance.find({ instituteId, year, userId: { $in: userIds } }),
  ]);

  const rowFor = new Map(
    rows.map((row) => [`${row.userId}:${row.leaveType}`, row])
  );

  const data = users.map((user) => ({
    user: {
      publicId: user.publicId,
      name: user.name,
      email: user.email,
      role: user.role,
      userCode: user.userCode,
    },
    balances: policies
      .filter((policy) => policyApplies(policy, user.role))
      .map((policy) => {
        const key = `${user._id}:${policy.leaveType}`;
        const sum = sums.get(key) ?? { used: 0, pending: 0 };
        const row = rowFor.get(key);

        return balanceView(
          {
            year,
            publicId: row?.publicId ?? null,
            allocated: row?.allocated ?? policy.yearlyAllocation,
            carriedForward: row?.carriedForward ?? 0,
            adjustment: row?.adjustment ?? 0,
            used: sum.used,
            pending: sum.pending,
          },
          policy
        );
      }),
  }));

  return sendSuccess(res, {
    message: "Leave balances fetched",
    data: {
      year,
      policies: policies.map((policy) => ({
        publicId: policy.publicId,
        leaveType: policy.leaveType,
        name: policy.name || policy.leaveType,
      })),
      users: data,
    },
  });
});

// PUT /leaves/balances/:userId/adjust  { year, leaveType, adjustment }
export const adjustBalance = asyncHandler(async (req, res) => {
  const instituteId = orgOf(req);
  const year = parseYear(req.body?.year);
  const adjustment = Number(req.body?.adjustment);

  if (!Number.isFinite(adjustment) || Math.abs(adjustment) > 366) {
    throw ApiError.badRequest("adjustment must be a number of days (-366..366)", {
      code: "VALIDATION_ERROR",
    });
  }

  const userId = await resolveRef(User, req.params.userId, {
    label: "User",
    scope: { instituteId },
  });

  const user = await User.findById(userId).select("_id role instituteId");

  const policy = await LeavePolicy.findOne({
    instituteId,
    leaveType: req.body?.leaveType,
    isDeleted: false,
    isActive: true,
  });

  if (!policy || !policyApplies(policy, user.role)) {
    throw ApiError.badRequest("No active policy for this leave type applies to the user", {
      code: "LEAVE_POLICY_NOT_FOUND",
    });
  }

  const balance = await ensureBalance(policy, user._id, year);
  balance.adjustment = adjustment;
  await balance.save();

  const entries = await syncUserBalances(user, year);
  const entry = entries.find((item) => item.policy.leaveType === policy.leaveType);

  return sendSuccess(res, {
    message: "Leave balance adjusted",
    data: { ...entry.view, year },
  });
});
