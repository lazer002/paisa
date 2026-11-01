// server/src/validators/subscriptionValidator.js
//
// Body schemas for /subscriptions (F4). Unknown keys pass through
// (see validators/common.js); controllers read only these fields.

import { BILLING_CYCLES, PLAN_KEYS, PAID_PLAN_KEYS } from "../config/plans.js";
import { SUBSCRIPTION_STATUSES } from "../models/Subscription.js";

import { Joi, oneOf, optOneOf, optRef, optStr, optDate, ref, str, bool } from "./common.js";

const limitValue = Joi.number().integer().min(0).allow(null, "");

export const checkoutSchema = Joi.object({
  plan: oneOf(PAID_PLAN_KEYS).required(),
  billingCycle: oneOf(BILLING_CYCLES).required(),
  organizationId: optRef(),
});

export const verifySchema = Joi.object({
  razorpay_order_id: str(100).required(),
  razorpay_payment_id: str(100).required(),
  razorpay_signature: str(512).required(),
  organizationId: optRef(),
});

export const cancelSchema = Joi.object({
  reason: optStr(500),
  organizationId: optRef(),
});

export const resumeSchema = Joi.object({
  organizationId: optRef(),
});

export const overrideSchema = Joi.object({
  organizationId: ref().required(),
  plan: oneOf(PLAN_KEYS).required(),
  billingCycle: optOneOf(BILLING_CYCLES),
  periodEnd: optDate(),
  status: optOneOf(SUBSCRIPTION_STATUSES),
  customLimits: Joi.object({
    maxUsers: limitValue,
    maxStudents: limitValue,
    storageGb: limitValue,
  }).allow(null),
  // Every manual change needs a reason for the audit trail.
  note: str(1000, 3).required(),
  force: bool(),
});
