// server/src/models/Subscription.js
//
// One subscription per organization (F4). The organization keeps the
// denormalised `plan` / `planExpiresAt` / `billing` fields that the rest of
// the app reads; this document holds the billing period, the Razorpay order
// in flight, every subscription payment and an audit history.

import mongoose from "mongoose";
import crypto from "node:crypto";

import { BILLING_CYCLES, PLAN_KEYS } from "../config/plans.js";

export const SUBSCRIPTION_STATUSES = [
  "trialing",
  "active",
  "past_due",
  "cancelled",
  "expired",
];

export const SUBSCRIPTION_ACTIONS = [
  "created",
  "checkout",
  "activated",
  "renewed",
  "cancel_scheduled",
  "resumed",
  "expired",
  "past_due",
  "override",
];

const paymentSchema = new mongoose.Schema(
  {
    publicId: {
      type: String,
      default: () => `spay_${crypto.randomBytes(12).toString("base64url")}`,
    },
    provider: { type: String, enum: ["razorpay", "manual"], default: "razorpay" },
    providerOrderId: { type: String, default: null },
    providerPaymentId: { type: String, default: null },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR", uppercase: true },
    method: { type: String, default: null },
    status: { type: String, enum: ["succeeded", "failed", "refunded"], default: "succeeded" },
    plan: { type: String, enum: PLAN_KEYS, required: true },
    billingCycle: { type: String, enum: BILLING_CYCLES, required: true },
    periodStart: { type: Date, default: null },
    periodEnd: { type: Date, default: null },
    payerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    source: { type: String, enum: ["verify", "webhook", "manual"], default: "verify" },
    paidAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const historySchema = new mongoose.Schema(
  {
    action: { type: String, enum: SUBSCRIPTION_ACTIONS, required: true },
    fromPlan: { type: String, default: null },
    toPlan: { type: String, default: null },
    billingCycle: { type: String, default: null },
    status: { type: String, default: null },
    periodEnd: { type: Date, default: null },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    actorRole: { type: String, default: null },
    note: { type: String, trim: true, maxlength: 1000, default: null },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const subscriptionSchema = new mongoose.Schema(
  {
    publicId: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      default: () => `sub_${crypto.randomBytes(16).toString("base64url")}`,
    },

    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      unique: true,
    },

    plan: { type: String, enum: PLAN_KEYS, default: "free" },

    billingCycle: { type: String, enum: [...BILLING_CYCLES, null], default: null },

    status: {
      type: String,
      enum: SUBSCRIPTION_STATUSES,
      default: "active",
      index: true,
    },

    currentPeriodStart: { type: Date, default: null },
    currentPeriodEnd: { type: Date, default: null },

    cancelAtPeriodEnd: { type: Boolean, default: false },
    cancelledAt: { type: Date, default: null },

    amount: { type: Number, min: 0, default: 0 },
    currency: { type: String, default: "INR", uppercase: true },

    // Per-organization limit overrides set by a super_admin (null = plan default).
    customLimits: {
      maxUsers: { type: Number, min: 0, default: null },
      maxStudents: { type: Number, min: 0, default: null },
      storageGb: { type: Number, min: 0, default: null },
    },

    // The Razorpay order created by the latest checkout (cleared once paid).
    pendingOrder: {
      orderId: { type: String, default: null },
      plan: { type: String, default: null },
      billingCycle: { type: String, default: null },
      amount: { type: Number, default: null },
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      createdAt: { type: Date, default: null },
    },

    lastRazorpayOrderId: { type: String, default: null },
    lastRazorpayPaymentId: { type: String, default: null },

    payments: { type: [paymentSchema], default: [] },

    history: { type: [historySchema], default: [] },
  },
  {
    timestamps: true,
    collection: "subscriptions",
  }
);

subscriptionSchema.index({ "payments.providerPaymentId": 1 });
subscriptionSchema.index({ status: 1, currentPeriodEnd: 1 });

export const Subscription =
  mongoose.models.Subscription ||
  mongoose.model("Subscription", subscriptionSchema);

export default Subscription;
