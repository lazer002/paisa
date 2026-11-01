// server/src/controllers/subscriptionController.js
//
// Organization subscriptions (F4): current plan + usage, Razorpay checkout and
// verification, cancel/resume at period end, and super_admin overrides.
// Razorpay webhooks for subscription orders are handled in
// paymentController.razorpayWebhook (orders carry notes.kind = "subscription").

import env from "../config/env.js";
import { ROLES } from "../config/constants.js";
import { PLAN_CATALOG, getPlan, priceFor } from "../config/plans.js";
import { createAuditEntry } from "../middleware/audit.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/errorHandler.js";
import { sendSuccess } from "../utils/response.js";
import {
  createOrder,
  fetchPayment,
  isRazorpayConfigured,
  verifyPaymentSignature,
} from "../services/razorpay.js";
import {
  activateSubscriptionPayment,
  assertFitsPlan,
  assertPurchasable,
  cancelAtPeriodEnd,
  ensureSubscription,
  loadOrganization,
  loadState,
  recordPendingOrder,
  resumeSubscription,
  overrideSubscription,
  subscriptionView,
} from "../services/subscriptionService.js";

/**
 * The organization a request acts on: always the caller's own; a super_admin
 * names one with `organizationId` (query or body).
 */
const targetOrganization = async (req) => {
  const requested = req.query.organizationId ?? req.body?.organizationId ?? null;

  if (req.user.role === ROLES.SUPER_ADMIN) {
    if (!requested) {
      throw ApiError.badRequest("organizationId is required", { code: "ORGANIZATION_REQUIRED" });
    }
    return loadOrganization(requested);
  }

  if (!req.user.instituteId) {
    throw ApiError.badRequest("Your account is not linked to an organization", {
      code: "ORGANIZATION_REQUIRED",
    });
  }

  const org = await loadOrganization(req.user.instituteId);

  if (requested && requested !== org.publicId && String(requested) !== String(org._id)) {
    throw ApiError.forbidden("You can only manage your own organization's subscription", {
      code: "TENANT_ACCESS_DENIED",
    });
  }

  return org;
};

const respondWithState = async (res, org, message) => {
  const state = await loadState(org);

  return sendSuccess(res, {
    message,
    data: {
      organization: { publicId: org.publicId, name: org.name, type: org.type },
      ...subscriptionView(state),
      razorpayEnabled: isRazorpayConfigured(),
      keyId: isRazorpayConfigured() ? env.RAZORPAY_KEY_ID : null,
    },
  });
};

export const getPlans = asyncHandler(async (req, res) =>
  sendSuccess(res, { message: "Plans fetched", data: PLAN_CATALOG })
);

export const getCurrentSubscription = asyncHandler(async (req, res) => {
  const org = await targetOrganization(req);
  return respondWithState(res, org, "Subscription fetched");
});

export const createCheckout = asyncHandler(async (req, res) => {
  const { plan, billingCycle } = req.body;

  assertPurchasable(plan, billingCycle);

  const org = await targetOrganization(req);
  const subscription = await ensureSubscription(org);

  // Downgrades must fit: refuse before any money moves.
  await assertFitsPlan(org._id, plan, subscription.customLimits);

  const amount = priceFor(plan, billingCycle);

  const order = await createOrder({
    amount,
    currency: "INR",
    receipt: `sub-${org.publicId}`.slice(0, 40),
    notes: {
      kind: "subscription",
      instituteId: String(org._id),
      organizationPublicId: org.publicId,
      subscriptionPublicId: subscription.publicId,
      plan,
      billingCycle,
      payerId: String(req.user._id),
    },
  });

  await recordPendingOrder(subscription, { order, plan, billingCycle, amount, actor: req.user });

  return sendSuccess(res, {
    message: "Checkout order created",
    data: {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: env.RAZORPAY_KEY_ID,
      plan: { key: plan, name: getPlan(plan).name },
      billingCycle,
      organization: { publicId: org.publicId, name: org.name },
      prefill: { name: req.user.name, email: req.user.email },
    },
  });
});

export const verifyCheckout = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: signature,
  } = req.body;

  if (!verifyPaymentSignature({ orderId, paymentId, signature })) {
    throw ApiError.badRequest("Payment signature is invalid", {
      code: "INVALID_PAYMENT_SIGNATURE",
    });
  }

  const org = await targetOrganization(req);
  const subscription = await ensureSubscription(org);

  // Trust the gateway for amount/status/notes, never the browser.
  const gatewayPayment = await fetchPayment(paymentId);
  const notes = gatewayPayment.notes ?? {};

  if (gatewayPayment.order_id !== orderId) {
    throw ApiError.badRequest("Payment does not belong to this order", {
      code: "PAYMENT_ORDER_MISMATCH",
    });
  }

  const ownOrder =
    (notes.kind === "subscription" && notes.instituteId === String(org._id)) ||
    subscription.pendingOrder?.orderId === orderId;

  if (!ownOrder) {
    throw ApiError.forbidden("This payment is not for your organization's subscription", {
      code: "PAYMENT_ORDER_MISMATCH",
    });
  }

  const { duplicate } = await activateSubscriptionPayment({
    instituteId: org._id,
    gatewayPayment,
    plan: notes.plan || subscription.pendingOrder?.plan,
    billingCycle: notes.billingCycle || subscription.pendingOrder?.billingCycle,
    payerId: req.user._id,
    source: "verify",
  });

  return respondWithState(
    res,
    org,
    duplicate ? "Payment was already applied" : "Subscription activated"
  );
});

export const cancelSubscription = asyncHandler(async (req, res) => {
  const org = await targetOrganization(req);
  const { subscription } = await loadState(org);

  await cancelAtPeriodEnd(subscription, req.user, req.body?.reason || null);

  return respondWithState(res, org, "Subscription will end at the end of the current period");
});

export const resumeSubscriptionHandler = asyncHandler(async (req, res) => {
  const org = await targetOrganization(req);
  const { subscription } = await loadState(org);

  await resumeSubscription(subscription, req.user);

  return respondWithState(res, org, "Subscription resumed");
});

export const overrideSubscriptionHandler = asyncHandler(async (req, res) => {
  const org = await loadOrganization(req.body.organizationId);
  const { plan, billingCycle, periodEnd, status, customLimits, note, force } = req.body;

  const { subscription, fromPlan } = await overrideSubscription({
    org,
    plan,
    billingCycle,
    periodEnd,
    status,
    customLimits,
    note,
    force: Boolean(force),
    actor: req.user,
  });

  // Attribute the request's automatic audit entry to the target organization,
  // and write an explicit one with the details.
  req.instituteId = org._id;

  await createAuditEntry({
    req,
    action: "update",
    category: "finance",
    severity: "warning",
    resource: "subscription",
    // AuditLog.resourceId is an ObjectId; the publicId goes in metadata.
    resourceId: subscription._id,
    description: `Subscription override for ${org.name}: ${fromPlan} -> ${subscription.plan}`,
    metadata: {
      subscriptionId: subscription.publicId,
      organizationId: org.publicId,
      fromPlan,
      toPlan: subscription.plan,
      billingCycle: subscription.billingCycle,
      status: subscription.status,
      periodEnd: subscription.currentPeriodEnd,
      customLimits: subscription.customLimits,
      forced: Boolean(force),
      note,
    },
  });

  return respondWithState(res, org, "Subscription updated");
});
