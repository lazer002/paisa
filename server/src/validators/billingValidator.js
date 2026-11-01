// server/src/validators/billingValidator.js
//
// Body schemas for /invoices and /payments (H3). Fields mirror what
// billingController / paymentController read; unknown keys pass through
// (see validators/common.js). The Razorpay webhook is deliberately NOT
// validated: it is authenticated by an HMAC over the raw body.

import {
  INVOICE_STATUSES,
  INVOICE_TYPES,
  LINE_ITEM_TYPES,
} from "../models/Payment.js";

import {
  Joi,
  optStr,
  text,
  ref,
  optRef,
  optDate,
  optNum,
  oneOf,
  optOneOf,
  str,
} from "./common.js";

const lineItem = Joi.object({
  itemType: optOneOf(LINE_ITEM_TYPES),
  name: optStr(500),
  description: text(2000),
  quantity: Joi.number().greater(0).allow(null, ""),
  unit: optStr(50),
  unitPrice: Joi.number().min(0).required(),
  taxAmount: optNum(0),
});

export const createInvoiceSchema = Joi.object({
  studentId: optRef(),
  employeeId: optRef(),
  customerId: optRef(),
  type: optOneOf(INVOICE_TYPES),
  dueDate: optDate(),
  notes: text(5000),
  lineItems: Joi.array().items(lineItem).min(1).max(200).required(),
});

export const updateInvoiceStatusSchema = Joi.object({
  status: oneOf(INVOICE_STATUSES).required(),
});

export const recordPaymentSchema = Joi.object({
  amount: Joi.number().greater(0).required(),
  // Unknown methods fall back to "cash" in the controller.
  method: optStr(50),
  reference: optStr(200),
});

export const razorpayOrderSchema = Joi.object({
  invoiceId: ref().required(),
  // Omitted / 0 means "pay the full amount due".
  amount: optNum(0),
});

export const razorpayVerifySchema = Joi.object({
  invoiceId: ref().required(),
  razorpay_order_id: str(100).required(),
  razorpay_payment_id: str(100).required(),
  razorpay_signature: str(512).required(),
});

export const refundSchema = Joi.object({
  // Omitted / null refunds the whole remaining amount.
  amount: Joi.number().greater(0).allow(null),
  reason: optStr(500),
});
