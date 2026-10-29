// server/src/models/PaymentTransaction.js
//
// A single money movement against an invoice (manual or gateway).
// Registered as "Payment" because Invoice.paymentAllocations refs it.
// (The Invoice model itself lives in Payment.js.)

import mongoose from "mongoose";
import crypto from "node:crypto";

export const PAYMENT_METHODS = [
  "cash",
  "bank_transfer",
  "card",
  "upi",
  "cheque",
  "netbanking",
  "wallet",
  "razorpay",
  "other",
];

export const PAYMENT_PROVIDERS = ["manual", "razorpay"];

export const PAYMENT_TXN_STATUSES = [
  "created",
  "succeeded",
  "failed",
  "partially_refunded",
  "refunded",
];

const paymentSchema = new mongoose.Schema(
  {
    publicId: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      default: () =>
        `pay_${crypto.randomBytes(16).toString("base64url")}`,
    },

    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
      index: true,
    },

    payerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    receiptNumber: {
      type: String,
      default: null,
    },

    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },

    amountRefunded: {
      type: Number,
      default: 0,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
      uppercase: true,
    },

    method: {
      type: String,
      enum: PAYMENT_METHODS,
      default: "cash",
    },

    provider: {
      type: String,
      enum: PAYMENT_PROVIDERS,
      default: "manual",
    },

    status: {
      type: String,
      enum: PAYMENT_TXN_STATUSES,
      default: "succeeded",
      index: true,
    },

    reference: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
    },

    providerOrderId: {
      type: String,
      default: null,
      index: true,
    },

    providerPaymentId: {
      type: String,
      default: null,
    },

    failureReason: {
      type: String,
      default: null,
    },

    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    refunds: [
      {
        amount: { type: Number, required: true, min: 0.01 },
        reason: { type: String, default: null },
        providerRefundId: { type: String, default: null },
        refundedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },
        refundedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
    collection: "payments",
  }
);

// A gateway payment id may only ever be recorded once (webhook + verify race).
paymentSchema.index(
  { providerPaymentId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      providerPaymentId: { $type: "string" },
    },
  }
);

paymentSchema.index({ instituteId: 1, createdAt: -1 });

export const Payment =
  mongoose.models.Payment ||
  mongoose.model("Payment", paymentSchema);

export default Payment;
