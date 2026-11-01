// server/src/services/subscriptionService.js
//
// Subscription engine (F4): usage vs plan limits, lazy period reconciliation,
// Razorpay payment activation (idempotent on the gateway payment id),
// cancel/resume, super_admin overrides and the soft seat-limit check used by
// user creation. Organization.plan / planExpiresAt / billing stay the
// denormalised copy the rest of the app reads.

import mongoose from "mongoose";

import Organization from "../models/organization.js";
import { User } from "../models/User.js";
import File from "../models/File.js";
import { Subscription } from "../models/Subscription.js";
import ApiError from "../utils/ApiError.js";
import logger from "../config/logger.js";
import {
  PLAN_CATALOG,
  PAID_PLAN_KEYS,
  BILLING_CYCLES,
  describeViolations,
  effectiveLimits,
  findLimitViolations,
  getPlan,
  isKnownPlan,
  nextPeriod,
  addCycle,
  priceFor,
  reconcileStatus,
} from "../config/plans.js";

const GB = 1024 * 1024 * 1024;

const toObjectId = (id) =>
  id instanceof mongoose.Types.ObjectId ? id : new mongoose.Types.ObjectId(String(id));

/* -------------------------------------------------------------------------- */
/* Usage                                                                      */
/* -------------------------------------------------------------------------- */

// Deactivated users ("deleted" in the UI) do not take a seat.
const seatFilter = (instituteId) => ({
  instituteId: toObjectId(instituteId),
  isDeleted: { $ne: true },
  status: { $ne: "inactive" },
});

export const getUsage = async (instituteId) => {
  const [users, students, storage] = await Promise.all([
    User.countDocuments(seatFilter(instituteId)),
    User.countDocuments({ ...seatFilter(instituteId), role: "student" }),
    File.aggregate([
      { $match: { instituteId: toObjectId(instituteId), isDeleted: { $ne: true } } },
      { $group: { _id: null, bytes: { $sum: "$size" } } },
    ]),
  ]);

  const bytes = storage[0]?.bytes ?? 0;

  return {
    users,
    students,
    storageBytes: bytes,
    storageGb: Number((bytes / GB).toFixed(3)),
  };
};

/* -------------------------------------------------------------------------- */
/* Loading + reconciliation                                                   */
/* -------------------------------------------------------------------------- */

const historyEntry = (action, extra = {}, actor = null) => ({
  action,
  actorId: actor?._id ?? actor?.id ?? null,
  actorRole: actor?.role ?? (actor ? null : "system"),
  at: new Date(),
  ...extra,
});

/** Copies the subscription's plan/period onto the organization document. */
const syncOrganization = async (subscription, extra = {}) => {
  const set = {
    plan: subscription.plan,
    planExpiresAt: subscription.plan === "free" ? null : subscription.currentPeriodEnd,
    "billing.cycle": subscription.plan === "free" ? null : subscription.billingCycle,
    ...extra,
  };

  // updateOne: never re-validate unrelated legacy org fields.
  await Organization.updateOne({ _id: subscription.instituteId }, { $set: set });
};

/** The organization's subscription, created from the org's plan on first use. */
export const ensureSubscription = async (org) => {
  const existing = await Subscription.findOne({ instituteId: org._id });
  if (existing) return existing;

  const plan = isKnownPlan(org.plan) ? org.plan : "free";

  try {
    return await Subscription.create({
      instituteId: org._id,
      plan,
      billingCycle: plan === "free" ? null : org.billing?.cycle || "monthly",
      status: "active",
      currentPeriodEnd: plan === "free" ? null : org.planExpiresAt || null,
      amount: org.billing?.pricePaid || 0,
      history: [historyEntry("created", { toPlan: plan })],
    });
  } catch (error) {
    // Two first requests raced on the unique instituteId index.
    if (error?.code === 11000) {
      return Subscription.findOne({ instituteId: org._id });
    }
    throw error;
  }
};

/** Applies period-end transitions (past_due / expired) lazily on read. */
export const reconcileSubscription = async (subscription, now = new Date()) => {
  const next = reconcileStatus(subscription, now);
  if (next === subscription.status) return subscription;

  const fromPlan = subscription.plan;

  if (next === "expired") {
    subscription.history.push(
      historyEntry("expired", { fromPlan, toPlan: "free", status: "expired" })
    );
    subscription.plan = "free";
    subscription.billingCycle = null;
    subscription.cancelAtPeriodEnd = false;
    subscription.status = "expired";
  } else {
    subscription.history.push(historyEntry(next, { fromPlan, toPlan: fromPlan, status: next }));
    subscription.status = next;
  }

  await subscription.save();
  await syncOrganization(subscription);

  return subscription;
};

export const loadOrganization = async (organizationRef) => {
  const query = mongoose.isValidObjectId(organizationRef) && String(organizationRef).length === 24
    ? { _id: organizationRef }
    : { publicId: String(organizationRef ?? "") };

  const org = await Organization.findOne({ ...query, isDeleted: false });

  if (!org) {
    throw ApiError.notFound("Organization not found", { code: "ORGANIZATION_NOT_FOUND" });
  }

  return org;
};

export const loadState = async (org) => {
  const subscription = await reconcileSubscription(await ensureSubscription(org));
  const usage = await getUsage(org._id);
  const limits = effectiveLimits(subscription.plan, subscription.customLimits);

  return {
    subscription,
    usage,
    limits,
    plan: getPlan(subscription.plan),
    violations: findLimitViolations(usage, limits),
  };
};

/** Refuses a plan whose limits the organization already exceeds. */
export const assertFitsPlan = async (instituteId, planKey, customLimits = null) => {
  const usage = await getUsage(instituteId);
  const violations = findLimitViolations(usage, effectiveLimits(planKey, customLimits));

  if (violations.length) {
    throw new ApiError(
      `Current usage exceeds the ${getPlan(planKey).name} plan: ${describeViolations(violations)}. Remove or deactivate records first.`,
      409,
      { code: "PLAN_LIMIT_EXCEEDED", details: { plan: planKey, violations } }
    );
  }

  return usage;
};

/* -------------------------------------------------------------------------- */
/* Checkout + activation                                                      */
/* -------------------------------------------------------------------------- */

export const assertPurchasable = (plan, billingCycle) => {
  if (!PAID_PLAN_KEYS.includes(plan)) {
    throw ApiError.badRequest("Choose a paid plan to check out", { code: "INVALID_PLAN" });
  }
  if (!BILLING_CYCLES.includes(billingCycle)) {
    throw ApiError.badRequest("Billing cycle must be monthly or yearly", { code: "INVALID_BILLING_CYCLE" });
  }
};

export const recordPendingOrder = async (subscription, { order, plan, billingCycle, amount, actor }) => {
  subscription.pendingOrder = {
    orderId: order.id,
    plan,
    billingCycle,
    amount,
    createdBy: actor._id,
    createdAt: new Date(),
  };
  subscription.lastRazorpayOrderId = order.id;
  subscription.history.push(
    historyEntry("checkout", { fromPlan: subscription.plan, toPlan: plan, billingCycle }, actor)
  );

  await subscription.save();
};

/**
 * Activates (or extends) the subscription for a captured Razorpay payment.
 * Safe to call from both verify and the webhook: a gateway payment id is
 * applied at most once (duplicate: true on replays).
 */
export const activateSubscriptionPayment = async ({
  instituteId,
  gatewayPayment,
  plan,
  billingCycle,
  payerId = null,
  source = "verify",
  now = new Date(),
}) => {
  if (!["captured", "authorized"].includes(gatewayPayment?.status)) {
    throw ApiError.badRequest(`Payment is ${gatewayPayment?.status ?? "unknown"}`, {
      code: "PAYMENT_NOT_CAPTURED",
    });
  }

  assertPurchasable(plan, billingCycle);

  const paymentId = String(gatewayPayment.id);
  const paid = Number(gatewayPayment.amount) / 100;
  const expected = priceFor(plan, billingCycle);

  if (!(paid + 0.001 >= expected)) {
    throw ApiError.badRequest(`Paid ${paid} but the ${plan} ${billingCycle} plan costs ${expected}`, {
      code: "PAYMENT_AMOUNT_MISMATCH",
    });
  }

  const replay = await Subscription.findOne({ "payments.providerPaymentId": paymentId });
  if (replay) return { subscription: replay, duplicate: true };

  const org = await loadOrganization(instituteId);
  const subscription = await ensureSubscription(org);

  const fromPlan = subscription.plan;
  const renewing = fromPlan === plan && subscription.status !== "expired";
  const period = nextPeriod({
    now,
    currentPlan: renewing ? fromPlan : null,
    currentPeriodEnd: subscription.currentPeriodEnd,
    newPlan: plan,
    cycle: billingCycle,
  });

  const payment = {
    provider: "razorpay",
    providerOrderId: gatewayPayment.order_id ?? null,
    providerPaymentId: paymentId,
    amount: paid,
    currency: gatewayPayment.currency || "INR",
    method: gatewayPayment.method ?? null,
    status: "succeeded",
    plan,
    billingCycle,
    periodStart: period.start,
    periodEnd: period.end,
    payerId,
    source,
    paidAt: now,
  };

  const updated = await Subscription.findOneAndUpdate(
    { _id: subscription._id, "payments.providerPaymentId": { $ne: paymentId } },
    {
      $set: {
        plan,
        billingCycle,
        status: "active",
        currentPeriodStart: renewing && subscription.currentPeriodStart ? subscription.currentPeriodStart : period.start,
        currentPeriodEnd: period.end,
        cancelAtPeriodEnd: false,
        cancelledAt: null,
        amount: paid,
        currency: payment.currency,
        lastRazorpayOrderId: payment.providerOrderId,
        lastRazorpayPaymentId: paymentId,
        ...(subscription.pendingOrder?.orderId === payment.providerOrderId
          ? { pendingOrder: {} }
          : {}),
      },
      $push: {
        payments: payment,
        history: historyEntry(
          renewing ? "renewed" : "activated",
          { fromPlan, toPlan: plan, billingCycle, status: "active", periodEnd: period.end },
          payerId ? { _id: payerId, role: null } : null
        ),
      },
    },
    { new: true }
  );

  if (!updated) {
    // Lost a race with the other path (verify vs webhook) for this payment.
    return {
      subscription: await Subscription.findOne({ "payments.providerPaymentId": paymentId }),
      duplicate: true,
    };
  }

  await syncOrganization(updated, {
    "billing.pricePaid": paid,
    "billing.lastInvoiceAt": now,
    "billing.paymentMethod": payment.method || "razorpay",
  });

  return { subscription: updated, duplicate: false, payment };
};

/* -------------------------------------------------------------------------- */
/* Cancel / resume                                                            */
/* -------------------------------------------------------------------------- */

const assertPaidAndRunning = (subscription) => {
  if (subscription.plan === "free" || !subscription.currentPeriodEnd) {
    throw ApiError.badRequest("There is no paid subscription to change", {
      code: "NO_PAID_SUBSCRIPTION",
    });
  }
  if (!["active", "trialing", "past_due"].includes(subscription.status)) {
    throw ApiError.badRequest(`Subscription is ${subscription.status}`, {
      code: "SUBSCRIPTION_NOT_ACTIVE",
    });
  }
};

export const cancelAtPeriodEnd = async (subscription, actor, note = null) => {
  assertPaidAndRunning(subscription);

  if (!subscription.cancelAtPeriodEnd) {
    subscription.cancelAtPeriodEnd = true;
    subscription.cancelledAt = new Date();
    subscription.history.push(
      historyEntry(
        "cancel_scheduled",
        { fromPlan: subscription.plan, toPlan: "free", periodEnd: subscription.currentPeriodEnd, note },
        actor
      )
    );
    await subscription.save();
  }

  return subscription;
};

export const resumeSubscription = async (subscription, actor) => {
  assertPaidAndRunning(subscription);

  if (subscription.cancelAtPeriodEnd) {
    subscription.cancelAtPeriodEnd = false;
    subscription.cancelledAt = null;
    subscription.history.push(
      historyEntry(
        "resumed",
        { fromPlan: subscription.plan, toPlan: subscription.plan, periodEnd: subscription.currentPeriodEnd },
        actor
      )
    );
    await subscription.save();
  }

  return subscription;
};

/* -------------------------------------------------------------------------- */
/* super_admin override (comp / manual plan)                                  */
/* -------------------------------------------------------------------------- */

export const overrideSubscription = async ({
  org,
  plan,
  billingCycle = null,
  periodEnd = null,
  status = null,
  customLimits,
  note,
  force = false,
  actor,
  now = new Date(),
}) => {
  if (!isKnownPlan(plan)) {
    throw ApiError.badRequest("Unknown plan", { code: "INVALID_PLAN" });
  }

  const subscription = await ensureSubscription(org);

  const nextCustom =
    customLimits === undefined
      ? subscription.customLimits?.toObject?.() ?? subscription.customLimits ?? null
      : customLimits ?? { maxUsers: null, maxStudents: null, storageGb: null };

  if (!force) {
    await assertFitsPlan(org._id, plan, nextCustom);
  }

  const fromPlan = subscription.plan;

  if (plan === "free") {
    subscription.plan = "free";
    subscription.billingCycle = null;
    subscription.currentPeriodStart = null;
    subscription.currentPeriodEnd = null;
    subscription.status = status || "active";
  } else {
    const cycle = BILLING_CYCLES.includes(billingCycle) ? billingCycle : subscription.billingCycle || "monthly";
    const end = periodEnd ? new Date(periodEnd) : addCycle(now, cycle);

    if (!(end > now)) {
      throw ApiError.badRequest("Period end must be in the future", { code: "INVALID_PERIOD_END" });
    }

    subscription.plan = plan;
    subscription.billingCycle = cycle;
    subscription.currentPeriodStart = now;
    subscription.currentPeriodEnd = end;
    subscription.status = status || "active";
  }

  subscription.cancelAtPeriodEnd = false;
  subscription.cancelledAt = null;
  subscription.customLimits = {
    maxUsers: nextCustom?.maxUsers ?? null,
    maxStudents: nextCustom?.maxStudents ?? null,
    storageGb: nextCustom?.storageGb ?? null,
  };
  subscription.history.push(
    historyEntry(
      "override",
      {
        fromPlan,
        toPlan: plan,
        billingCycle: subscription.billingCycle,
        status: subscription.status,
        periodEnd: subscription.currentPeriodEnd,
        note: force ? `[forced] ${note}` : note,
      },
      actor
    )
  );

  await subscription.save();
  await syncOrganization(subscription);

  return { subscription, fromPlan };
};

/* -------------------------------------------------------------------------- */
/* Soft seat limits (user creation)                                           */
/* -------------------------------------------------------------------------- */

/**
 * Returns null when one more user (of `role`) fits the organization's plan,
 * otherwise { message, limit, used, allowed }. Fails open: a billing problem
 * must never block user management.
 */
export const checkSeatLimit = async (instituteId, role) => {
  try {
    if (!instituteId) return null;

    const org = await Organization.findById(instituteId).select("plan planExpiresAt billing isDeleted");
    if (!org) return null;

    const subscription = await Subscription.findOne({ instituteId: org._id }).select(
      "plan status currentPeriodEnd cancelAtPeriodEnd customLimits"
    );

    const planKey = isKnownPlan(subscription?.plan ?? org.plan) ? subscription?.plan ?? org.plan : "free";
    const limits = effectiveLimits(planKey, subscription?.customLimits);
    const usage = await getUsage(org._id);
    const plan = getPlan(planKey);

    if (limits.maxUsers !== null && usage.users + 1 > limits.maxUsers) {
      return {
        message: `Your ${plan.name} plan allows ${limits.maxUsers} active users and ${usage.users} are in use. Upgrade the plan or deactivate users first.`,
        limit: "maxUsers",
        used: usage.users,
        allowed: limits.maxUsers,
        plan: planKey,
      };
    }

    if (role === "student" && limits.maxStudents !== null && usage.students + 1 > limits.maxStudents) {
      return {
        message: `Your ${plan.name} plan allows ${limits.maxStudents} students and ${usage.students} are enrolled. Upgrade the plan or deactivate students first.`,
        limit: "maxStudents",
        used: usage.students,
        allowed: limits.maxStudents,
        plan: planKey,
      };
    }

    return null;
  } catch (error) {
    logger.warn?.("Plan limit check skipped", { reason: error.message });
    return null;
  }
};

export const subscriptionView = (state) => {
  const { subscription } = state;
  const json = subscription.toJSON ? subscription.toJSON() : subscription;

  return {
    subscription: {
      publicId: json.publicId,
      plan: json.plan,
      billingCycle: json.billingCycle,
      status: json.status,
      currentPeriodStart: json.currentPeriodStart,
      currentPeriodEnd: json.currentPeriodEnd,
      cancelAtPeriodEnd: json.cancelAtPeriodEnd,
      cancelledAt: json.cancelledAt,
      amount: json.amount,
      currency: json.currency,
      customLimits: json.customLimits,
      hasPendingOrder: Boolean(json.pendingOrder?.orderId),
      payments: [...(json.payments ?? [])].reverse(),
      history: [...(json.history ?? [])].reverse().slice(0, 50),
    },
    plan: state.plan,
    limits: state.limits,
    usage: state.usage,
    violations: state.violations,
    catalog: PLAN_CATALOG,
  };
};
