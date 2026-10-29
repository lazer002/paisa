// server/src/services/paymentService.js
//
// One path for every payment and refund, so manual entry, Razorpay checkout
// and Razorpay webhooks all leave the same records: a Payment document plus
// an allocation on the Invoice (which recomputes amountDue and status).

import { Invoice } from "../models/Payment.js";
import { Payment } from "../models/PaymentTransaction.js";
import { getNextSequence } from "../utils/sequence.js";
import { childUserIdsFor } from "../utils/parentScope.js";
import ApiError from "../utils/ApiError.js";

const CLOSED_STATUSES = ["paid", "cancelled", "void", "refunded", "written_off"];

const nextReceiptNumber = async (instituteId) => {
  const seq = await getNextSequence(`receipt:${instituteId}`);

  return `RCPT-${new Date().getFullYear()}-${String(seq).padStart(5, "0")}`;
};

export const assertInvoicePayable = (invoice, amount) => {
  if (CLOSED_STATUSES.includes(invoice.status) || invoice.status === "draft") {
    throw ApiError.badRequest(
      invoice.status === "draft"
        ? "Invoice has not been issued yet"
        : "Invoice is closed",
      { code: "INVOICE_NOT_PAYABLE" }
    );
  }

  const due = Number(invoice.amountDue ?? invoice.grandTotal ?? 0);

  if (!(amount > 0) || amount > due + 0.001) {
    throw ApiError.badRequest(`Amount must be between 0 and ${due}`, {
      code: "INVALID_PAYMENT_AMOUNT",
    });
  }
};

/**
 * Invoices a user may pay or see payments for: staff with tenant scope see
 * all; students/employees their own; parents their children's.
 */
export const invoiceOwnershipFilter = async (user) => {
  if (user.role === "student") return { studentId: user._id };
  if (user.role === "employee") return { employeeId: user._id };
  if (user.role === "parent") {
    return { studentId: { $in: await childUserIdsFor(user) } };
  }

  return {};
};

export const findAccessibleInvoice = async (user, invoicePublicId) => {
  const query = {
    publicId: invoicePublicId,
    ...(await invoiceOwnershipFilter(user)),
  };

  if (user.role !== "super_admin") {
    query.instituteId = user.instituteId;
  }

  const invoice = await Invoice.findOne(query);

  if (!invoice) {
    throw ApiError.notFound("Invoice not found", { code: "INVOICE_NOT_FOUND" });
  }

  return invoice;
};

export const recordInvoicePayment = async ({
  invoice,
  amount,
  method = "cash",
  provider = "manual",
  reference = null,
  providerOrderId = null,
  providerPaymentId = null,
  payerId = null,
  receivedBy = null,
}) => {
  if (providerPaymentId) {
    const existing = await Payment.findOne({ providerPaymentId });

    if (existing) return { payment: existing, invoice, duplicate: true };
  }

  const value = Number(Number(amount).toFixed(2));

  assertInvoicePayable(invoice, value);

  let payment;

  try {
    payment = await Payment.create({
      instituteId: invoice.instituteId,
      invoiceId: invoice._id,
      payerId,
      receiptNumber: await nextReceiptNumber(invoice.instituteId),
      amount: value,
      currency: invoice.currency || "INR",
      method,
      provider,
      status: "succeeded",
      reference,
      providerOrderId,
      providerPaymentId,
      receivedBy,
      paidAt: new Date(),
    });
  } catch (error) {
    // Lost a race with a concurrent webhook/verify for the same payment.
    if (error?.code === 11000 && providerPaymentId) {
      const existing = await Payment.findOne({ providerPaymentId });

      return { payment: existing, invoice, duplicate: true };
    }

    throw error;
  }

  await invoice.addPayment({
    paymentId: payment._id,
    amount: value,
    performedBy: receivedBy ?? payerId,
  });

  return { payment, invoice, duplicate: false };
};

export const refundInvoicePayment = async ({
  payment,
  amount,
  reason = null,
  refundedBy = null,
  providerRefundId = null,
}) => {
  const value = Number(Number(amount).toFixed(2));
  const refundable = payment.amount - (payment.amountRefunded || 0);

  if (payment.status === "failed" || !(value > 0) || value > refundable + 0.001) {
    throw ApiError.badRequest(`Refund must be between 0 and ${refundable}`, {
      code: "INVALID_REFUND_AMOUNT",
    });
  }

  const invoice = await Invoice.findById(payment.invoiceId);

  if (!invoice) {
    throw ApiError.notFound("Invoice not found", { code: "INVOICE_NOT_FOUND" });
  }

  await invoice.addRefund({
    amount: value,
    reason,
    paymentId: payment._id,
    requestedBy: refundedBy,
  });

  const refund = invoice.refunds[invoice.refunds.length - 1];

  await invoice.completeRefund({
    refundId: refund._id,
    processedBy: refundedBy,
    providerRefundId,
  });

  payment.amountRefunded = Number(
    ((payment.amountRefunded || 0) + value).toFixed(2)
  );
  payment.status =
    payment.amountRefunded >= payment.amount ? "refunded" : "partially_refunded";
  payment.refunds.push({ amount: value, reason, providerRefundId, refundedBy });

  await payment.save();

  return { payment, invoice };
};
