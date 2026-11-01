// server/src/controllers/paymentController.js
//
// Payment history, receipts, refunds and Razorpay checkout/webhook.

import { Invoice } from "../models/Payment.js";
import { Payment } from "../models/PaymentTransaction.js";
import Organization from "../models/organization.js";
import { asyncHandler } from "../utils/errorHandler.js";
import ApiError from "../utils/ApiError.js";
import env from "../config/env.js";
import logger from "../config/logger.js";
import { sendSuccess } from "../utils/response.js";
import {
  findAccessibleInvoice,
  invoiceOwnershipFilter,
  recordInvoicePayment,
  refundInvoicePayment,
} from "../services/paymentService.js";
import {
  createOrder,
  fetchPayment,
  isRazorpayConfigured,
  refundPayment as refundOnRazorpay,
  verifyPaymentSignature,
  verifyWebhookSignature,
} from "../services/razorpay.js";
import { activateSubscriptionPayment } from "../services/subscriptionService.js";

const PAYMENT_POPULATE = [
  { path: "invoiceId", select: "publicId invoiceNumber title grandTotal amountDue status currency" },
  { path: "payerId", select: "publicId name email" },
  { path: "receivedBy", select: "publicId name" },
];

/** Payments the user may see: tenant-scoped, and own/children's for self-service roles. */
const paymentScope = async (user) => {
  const scope = user.role === "super_admin" ? {} : { instituteId: user.instituteId };
  const ownership = await invoiceOwnershipFilter(user);

  if (Object.keys(ownership).length) {
    const invoices = await Invoice.find({ ...scope, ...ownership }).select("_id");
    scope.invoiceId = { $in: invoices.map((i) => i._id) };
  }

  return scope;
};

export const getPayments = asyncHandler(async (req, res) => {
  const query = await paymentScope(req.user);

  if (req.query.invoiceId) {
    const invoice = await findAccessibleInvoice(req.user, String(req.query.invoiceId));
    query.invoiceId = invoice._id;
  }

  const payments = await Payment.find(query)
    .sort({ createdAt: -1 })
    .limit(200)
    .populate(PAYMENT_POPULATE);

  return sendSuccess(res, { message: "Payments fetched", data: payments });
});

/** Receipt: the payment plus what is needed to print it. */
export const getPayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findOne({
    ...(await paymentScope(req.user)),
    publicId: req.params.publicId,
  }).populate(PAYMENT_POPULATE);

  if (!payment) {
    throw ApiError.notFound("Payment not found", { code: "PAYMENT_NOT_FOUND" });
  }

  const organization = await Organization.findById(payment.instituteId).select(
    "name slug contact"
  );

  return sendSuccess(res, {
    message: "Payment fetched",
    data: { payment, organization },
  });
});

export const getPaymentConfig = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    message: "Payment configuration",
    data: {
      razorpayEnabled: isRazorpayConfigured(),
      keyId: isRazorpayConfigured() ? env.RAZORPAY_KEY_ID : null,
    },
  })
);

export const createRazorpayOrder = asyncHandler(async (req, res) => {
  const invoice = await findAccessibleInvoice(req.user, String(req.body?.invoiceId ?? ""));
  const due = Number(invoice.amountDue ?? invoice.grandTotal ?? 0);
  const amount = req.body?.amount ? Number(req.body.amount) : due;

  if (["draft", "paid", "cancelled", "void", "refunded", "written_off"].includes(invoice.status)) {
    throw ApiError.badRequest("Invoice is not payable", { code: "INVOICE_NOT_PAYABLE" });
  }

  if (!(amount > 0) || amount > due + 0.001) {
    throw ApiError.badRequest(`Amount must be between 0 and ${due}`, {
      code: "INVALID_PAYMENT_AMOUNT",
    });
  }

  const order = await createOrder({
    amount,
    currency: invoice.currency || "INR",
    receipt: invoice.invoiceNumber || invoice.publicId,
    notes: {
      kind: "invoice",
      invoicePublicId: invoice.publicId,
      instituteId: String(invoice.instituteId),
      payerId: String(req.user._id),
    },
  });

  return sendSuccess(res, {
    message: "Order created",
    data: {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: env.RAZORPAY_KEY_ID,
      invoice: {
        publicId: invoice.publicId,
        invoiceNumber: invoice.invoiceNumber,
        title: invoice.title,
      },
      prefill: { name: req.user.name, email: req.user.email },
    },
  });
});

/** Records a captured/authorized gateway payment against its invoice. */
const settleGatewayPayment = async ({ gatewayPayment, invoice, payerId }) => {
  if (!["captured", "authorized"].includes(gatewayPayment.status)) {
    throw ApiError.badRequest(`Payment is ${gatewayPayment.status}`, {
      code: "PAYMENT_NOT_CAPTURED",
    });
  }

  return recordInvoicePayment({
    invoice,
    amount: gatewayPayment.amount / 100,
    method: ["card", "upi", "netbanking", "wallet"].includes(gatewayPayment.method)
      ? gatewayPayment.method
      : "razorpay",
    provider: "razorpay",
    reference: gatewayPayment.id,
    providerOrderId: gatewayPayment.order_id,
    providerPaymentId: gatewayPayment.id,
    payerId,
  });
};

export const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const {
    invoiceId,
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: signature,
  } = req.body ?? {};

  if (!verifyPaymentSignature({ orderId, paymentId, signature })) {
    throw ApiError.badRequest("Payment signature is invalid", {
      code: "INVALID_PAYMENT_SIGNATURE",
    });
  }

  const invoice = await findAccessibleInvoice(req.user, String(invoiceId ?? ""));

  // Trust the gateway for amount/status, never the browser.
  const gatewayPayment = await fetchPayment(paymentId);

  if (gatewayPayment.order_id !== orderId) {
    throw ApiError.badRequest("Payment does not belong to this order", {
      code: "PAYMENT_ORDER_MISMATCH",
    });
  }

  const { payment } = await settleGatewayPayment({
    gatewayPayment,
    invoice,
    payerId: req.user._id,
  });

  return sendSuccess(res, {
    message: `Payment successful (receipt ${payment.receiptNumber})`,
    data: { payment, invoice },
  });
});

export const razorpayWebhook = asyncHandler(async (req, res) => {
  if (!verifyWebhookSignature(req.rawBody, req.get("x-razorpay-signature"))) {
    throw ApiError.badRequest("Invalid webhook signature", {
      code: "INVALID_WEBHOOK_SIGNATURE",
    });
  }

  const event = req.body?.event;
  const entity = req.body?.payload?.payment?.entity;

  // Subscription orders (notes.kind = "subscription", see subscriptionController).
  if (event === "payment.captured" && entity?.notes?.kind === "subscription") {
    try {
      await activateSubscriptionPayment({
        instituteId: entity.notes.instituteId,
        gatewayPayment: entity,
        plan: entity.notes.plan,
        billingCycle: entity.notes.billingCycle,
        payerId: entity.notes.payerId || null,
        source: "webhook",
      });
    } catch (error) {
      logger.warn?.("Razorpay subscription webhook not applied", {
        paymentId: entity.id,
        reason: error.message,
      });
    }

    return res.status(200).json({ success: true });
  }

  if (event === "payment.captured" && entity?.notes?.invoicePublicId) {
    const invoice = await Invoice.findOne({
      publicId: entity.notes.invoicePublicId,
    });

    if (invoice) {
      try {
        await settleGatewayPayment({
          gatewayPayment: entity,
          invoice,
          payerId: entity.notes.payerId || null,
        });
      } catch (error) {
        // Already settled/closed invoices must not make Razorpay retry forever.
        logger.warn?.("Razorpay webhook not applied", {
          paymentId: entity.id,
          reason: error.message,
        });
      }
    }
  }

  return res.status(200).json({ success: true });
});

export const refundPayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findOne({
    ...(await paymentScope(req.user)),
    publicId: req.params.publicId,
  });

  if (!payment) {
    throw ApiError.notFound("Payment not found", { code: "PAYMENT_NOT_FOUND" });
  }

  const amount = Number(req.body?.amount ?? payment.amount - (payment.amountRefunded || 0));
  let providerRefundId = null;

  if (payment.provider === "razorpay" && payment.providerPaymentId) {
    const refund = await refundOnRazorpay(payment.providerPaymentId, amount, {
      reason: String(req.body?.reason ?? "").slice(0, 200),
    });
    providerRefundId = refund.id;
  }

  const result = await refundInvoicePayment({
    payment,
    amount,
    reason: req.body?.reason ?? null,
    refundedBy: req.user._id,
    providerRefundId,
  });

  return sendSuccess(res, { message: "Refund recorded", data: result });
});
