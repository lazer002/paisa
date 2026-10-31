// server/src/services/leaveBalanceService.js
//
// Leave balance rules:
// - A leave counts against the balance of the calendar year (UTC) its
//   startDate falls in.
// - Only leave types with an active policy that applies to the user's role
//   are tracked. "unpaid" (loss of pay) and untracked types are never limited.
// - pending = sum of days of pending leaves, used = sum of approved leaves.
//   Approving moves days pending -> used; rejecting/cancelling frees them.
// - Applying for more days than remaining (total - used - pending) is refused.
// - Carry forward: when a year's row is first created, the previous year's
//   remaining days (if that row exists) are carried over, capped by the
//   policy's carryForwardCap.

import mongoose from "mongoose";

import { Leave } from "../models/Leave.js";
import { LeavePolicy } from "../models/LeavePolicy.js";
import { LeaveBalance } from "../models/LeaveBalance.js";

export const UNPAID_LEAVE_TYPE = "unpaid";

export const leaveYearOf = (date) =>
  new Date(date).getUTCFullYear();

const toObjectId = (value) =>
  value instanceof mongoose.Types.ObjectId
    ? value
    : new mongoose.Types.ObjectId(String(value));

const yearRange = (year) => ({
  $gte: new Date(Date.UTC(year, 0, 1)),
  $lt: new Date(Date.UTC(year + 1, 0, 1)),
});

export const policyApplies = (policy, role) =>
  Boolean(policy?.isActive) &&
  (!policy.appliesToRoles?.length ||
    policy.appliesToRoles.includes(role));

export const getActivePolicies = (instituteId) =>
  LeavePolicy.find({
    instituteId,
    isDeleted: false,
    isActive: true,
  }).sort({ leaveType: 1 });

/** Days per type/status for one user's leaves starting in `year`. */
export const sumLeaveDays = async (
  instituteId,
  userIds,
  year
) => {
  const rows = await Leave.aggregate([
    {
      $match: {
        instituteId: toObjectId(instituteId),
        userId: { $in: userIds.map(toObjectId) },
        isDeleted: false,
        status: { $in: ["pending", "approved"] },
        startDate: yearRange(year),
      },
    },
    {
      $group: {
        _id: {
          userId: "$userId",
          type: "$type",
          status: "$status",
        },
        days: { $sum: "$days" },
      },
    },
  ]);

  // Map key: `${userId}:${type}` -> { used, pending }
  const sums = new Map();

  for (const row of rows) {
    const key = `${row._id.userId}:${row._id.type}`;
    const entry = sums.get(key) ?? { used: 0, pending: 0 };

    if (row._id.status === "approved") entry.used += row.days;
    else entry.pending += row.days;

    sums.set(key, entry);
  }

  return sums;
};

export const balanceView = (balance, policy) => {
  const allocated = balance?.allocated ?? policy?.yearlyAllocation ?? 0;
  const carriedForward = balance?.carriedForward ?? 0;
  const adjustment = balance?.adjustment ?? 0;
  const used = balance?.used ?? 0;
  const pending = balance?.pending ?? 0;
  const total = allocated + carriedForward + adjustment;

  return {
    publicId: balance?.publicId ?? null,
    leaveType: policy?.leaveType ?? balance?.leaveType,
    name: policy?.name || policy?.leaveType || balance?.leaveType,
    year: balance?.year,
    allocated,
    carriedForward,
    adjustment,
    total,
    used,
    pending,
    remaining: total - used - pending,
  };
};

/** Find or create the user's row for a policy/year (race-safe upsert). */
export const ensureBalance = async (
  policy,
  userId,
  year
) => {
  const filter = {
    instituteId: policy.instituteId,
    userId,
    year,
    leaveType: policy.leaveType,
  };

  const existing = await LeaveBalance.findOne(filter);
  if (existing) return existing;

  let carriedForward = 0;

  if (policy.carryForwardCap > 0) {
    const previous = await LeaveBalance.findOne({
      ...filter,
      year: year - 1,
    });

    if (previous) {
      carriedForward = Math.max(
        0,
        Math.min(policy.carryForwardCap, previous.remaining)
      );
    }
  }

  try {
    return await LeaveBalance.findOneAndUpdate(
      filter,
      {
        $setOnInsert: {
          allocated: policy.yearlyAllocation,
          carriedForward,
        },
      },
      { new: true, upsert: true }
    );
  } catch (error) {
    // Concurrent upsert lost the race: read the winner.
    if (error?.code === 11000) return LeaveBalance.findOne(filter);
    throw error;
  }
};

/**
 * Recompute and persist one user's balances for a year.
 * Returns [{ policy, balance, view }] for every policy that applies.
 */
export const syncUserBalances = async (
  user,
  year
) => {
  const instituteId = user.instituteId;
  if (!instituteId) return [];

  const policies = (await getActivePolicies(instituteId)).filter(
    (policy) => policyApplies(policy, user.role)
  );

  if (!policies.length) return [];

  const sums = await sumLeaveDays(instituteId, [user._id], year);
  const result = [];

  for (const policy of policies) {
    const balance = await ensureBalance(policy, user._id, year);
    const sum = sums.get(`${user._id}:${policy.leaveType}`) ?? {
      used: 0,
      pending: 0,
    };

    if (balance.used !== sum.used || balance.pending !== sum.pending) {
      balance.used = sum.used;
      balance.pending = sum.pending;
      await balance.save();
    }

    result.push({
      policy,
      balance,
      view: balanceView(balance, policy),
    });
  }

  return result;
};

/**
 * Remaining days for one tracked leave type, or null when the type is not
 * limited for this user (unpaid, no policy, or policy not for their role).
 */
export const remainingFor = async (
  user,
  leaveType,
  year
) => {
  if (leaveType === UNPAID_LEAVE_TYPE) return null;

  const entries = await syncUserBalances(user, year);
  const entry = entries.find(
    (item) => item.policy.leaveType === leaveType
  );

  return entry ? entry.view : null;
};
