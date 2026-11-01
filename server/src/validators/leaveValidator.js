// server/src/validators/leaveValidator.js
//
// Body schemas for /api/leaves writes. Field lists mirror what
// leaveController / leavePolicyController read; unknown keys are allowed
// (and passed through) so existing clients keep working.

import Joi from "joi";

import { LEAVE_TYPES, LEAVE_DURATIONS } from "../models/Leave.js";
import { POLICY_LEAVE_TYPES } from "../models/LeavePolicy.js";
import { ROLES } from "../config/constants.js";
import { body } from "./common.js";

const ORG_ROLES = Object.values(ROLES).filter(
  (role) => role !== ROLES.SUPER_ADMIN
);

const optionalText = (max) =>
  Joi.string().trim().max(max).allow(null, "");

const days = Joi.number().min(0).max(366);

const year = Joi.number().integer().min(2000).max(2200);

/**
 * Same policy as every other body validator (validators/common.js):
 * unknown keys kept, bad input answered with 422 VALIDATION_ERROR.
 * Shared by the payroll and attendance validators.
 */
export const bodyValidator = body;

const policyFields = {
  leaveType: Joi.string().valid(...POLICY_LEAVE_TYPES),
  yearlyAllocation: days,
  carryForwardCap: days.allow(null),
  name: optionalText(100),
  isActive: Joi.boolean().truthy(1, "1").falsy(0, "0"),
  appliesToRoles: Joi.array()
    .items(Joi.string().valid(...ORG_ROLES))
    .min(1),
};

export const applyLeaveSchema = Joi.object({
  type: Joi.string().valid(...LEAVE_TYPES).required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
  reason: Joi.string().trim().min(2).max(500).required(),
  duration: Joi.string().valid(...LEAVE_DURATIONS).allow(null, ""),
});

export const leaveStatusSchema = Joi.object({
  status: Joi.string().valid("approved", "rejected").required(),
  rejectionReason: optionalText(300),
  comment: optionalText(300),
});

export const cancelLeaveSchema = Joi.object({
  // The controller keeps the first 300 characters.
  reason: optionalText(2000),
});

export const createPolicySchema = Joi.object({
  ...policyFields,
  leaveType: policyFields.leaveType.required(),
  yearlyAllocation: policyFields.yearlyAllocation.required(),
});

export const updatePolicySchema = Joi.object(policyFields);

export const adjustBalanceSchema = Joi.object({
  year,
  leaveType: Joi.string().valid(...POLICY_LEAVE_TYPES).required(),
  adjustment: Joi.number().min(-366).max(366).required(),
});

export const validateApplyLeave = bodyValidator(applyLeaveSchema);
export const validateLeaveStatus = bodyValidator(leaveStatusSchema);
export const validateCancelLeave = bodyValidator(cancelLeaveSchema);
export const validateCreatePolicy = bodyValidator(createPolicySchema);
export const validateUpdatePolicy = bodyValidator(updatePolicySchema);
export const validateAdjustBalance = bodyValidator(adjustBalanceSchema);
