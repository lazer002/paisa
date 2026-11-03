// server/src/services/reconciliation.js
//
// Checks an organization's invoices against the payments recorded for them
// and lists what doesn't add up, so finance can fix it:
//   amount_mismatch    invoice.amountPaid / amountRefunded ≠ its payments
//   payment_not_applied a successful payment missing from the invoice's allocations
//   status_mismatch    fully paid but not marked paid, or marked paid with money due
//   overpaid           more collected than the invoice total
//   payment_on_closed  money taken against a cancelled / void invoice
//   orphan_payment     payment whose invoice no longer exists
//   stale_online_order online checkout started > 24 h ago and never completed
// Plus totals for a date range (invoiced, collected, refunded, by method).

import { Invoice } from "../models/Payment.js";
import { Payment } from "../models/PaymentTransaction.js";

const CENT = 0.01;
const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const COUNTED = ["succeeded", "partially_refunded", "refunded"];
const CLOSED = ["cancelled", "void"];

/** What an invoice's own fields should be, from its payments. */
export const expectedFromPayments = (payments) => ({
  amountPaid: r2(payments.filter((p) => COUNTED.includes(p.status)).reduce((s, p) => s + p.amount, 0)),
  amountRefunded: r2(payments.reduce((s, p) => s + (p.amountRefunded || 0), 0)),
});

/** Pure check of one invoice against its payments (exported for tests). */
export const invoiceIssues = (invoice, payments) => {
  const issues = [];
  const expected = expectedFromPayments(payments);
  const ref = { invoiceId: invoice.publicId, invoiceNumber: invoice.invoiceNumber ?? null };

  if (
    Math.abs(expected.amountPaid - (invoice.amountPaid || 0)) > CENT ||
    Math.abs(expected.amountRefunded - (invoice.amountRefunded || 0)) > CENT
  ) {
    issues.push({
      type: "amount_mismatch",
      ...ref,
      message: `Invoice shows ₹${r2(invoice.amountPaid)} paid / ₹${r2(invoice.amountRefunded)} refunded; its payments add up to ₹${expected.amountPaid} / ₹${expected.amountRefunded}`,
      expected,
      actual: { amountPaid: r2(invoice.amountPaid), amountRefunded: r2(invoice.amountRefunded) },
      fixable: true,
    });
  }

  const allocated = new Set((invoice.paymentAllocations ?? []).map((a) => String(a.paymentId)));
  for (const p of payments.filter((x) => COUNTED.includes(x.status) && !allocated.has(String(x._id)))) {
    issues.push({
      type: "payment_not_applied",
      ...ref,
      paymentId: p.publicId,
      receiptNumber: p.receiptNumber ?? null,
      message: `Payment ${p.receiptNumber ?? p.publicId} (₹${r2(p.amount)}) is not applied to the invoice`,
      fixable: true,
    });
  }

  const net = r2((invoice.amountPaid || 0) - (invoice.amountRefunded || 0));

  if (!CLOSED.includes(invoice.status)) {
    if (invoice.grandTotal > 0 && net >= invoice.grandTotal - CENT && invoice.status !== "paid" && invoice.status !== "refunded") {
      issues.push({ type: "status_mismatch", ...ref, message: `Fully paid but status is "${invoice.status}"`, fixable: true });
    }
    if (invoice.status === "paid" && (invoice.amountDue || 0) > CENT) {
      issues.push({ type: "status_mismatch", ...ref, message: `Marked paid but ₹${r2(invoice.amountDue)} is still due`, fixable: true });
    }
  }

  if (net > (invoice.grandTotal || 0) + CENT) {
    issues.push({
      type: "overpaid",
      ...ref,
      message: `₹${r2(net - invoice.grandTotal)} more collected than the invoice total — refund or credit it`,
      fixable: false,
    });
  }

  if (CLOSED.includes(invoice.status) && expected.amountPaid - expected.amountRefunded > CENT) {
    issues.push({
      type: "payment_on_closed",
      ...ref,
      message: `Invoice is ${invoice.status} but ₹${r2(expected.amountPaid - expected.amountRefunded)} was collected — refund it`,
      fixable: false,
    });
  }

  return issues;
};

export const reconcile = async ({ instituteId, from, to, now = new Date() }) => {
  const [invoices, payments] = await Promise.all([
    Invoice.find({ instituteId, isDeleted: { $ne: true } })
      .select("publicId invoiceNumber status grandTotal amountPaid amountRefunded amountDue paymentAllocations issueDate")
      .lean(),
    Payment.find({ instituteId })
      .select("publicId invoiceId receiptNumber amount amountRefunded status method provider paidAt createdAt")
      .lean(),
  ]);

  const byInvoice = new Map();
  for (const p of payments) {
    const key = String(p.invoiceId);
    if (!byInvoice.has(key)) byInvoice.set(key, []);
    byInvoice.get(key).push(p);
  }

  const issues = invoices.flatMap((invoice) => invoiceIssues(invoice, byInvoice.get(String(invoice._id)) ?? []));

  const invoiceIds = new Set(invoices.map((i) => String(i._id)));
  for (const p of payments) {
    if (COUNTED.includes(p.status) && !invoiceIds.has(String(p.invoiceId))) {
      issues.push({
        type: "orphan_payment",
        paymentId: p.publicId,
        receiptNumber: p.receiptNumber ?? null,
        message: `Payment ${p.receiptNumber ?? p.publicId} (₹${r2(p.amount)}) belongs to an invoice that no longer exists`,
        fixable: false,
      });
    }
    if (p.status === "created" && now - new Date(p.createdAt) > 24 * 60 * 60 * 1000) {
      issues.push({
        type: "stale_online_order",
        paymentId: p.publicId,
        message: `Online checkout of ₹${r2(p.amount)} started ${new Date(p.createdAt).toDateString()} was never completed`,
        fixable: false,
      });
    }
  }

  // Range totals.
  const inRange = (d) => d && (!from || new Date(d) >= from) && (!to || new Date(d) < to);
  const rangeInvoices = invoices.filter((i) => !CLOSED.includes(i.status) && i.status !== "draft" && inRange(i.issueDate));
  const rangePayments = payments.filter((p) => COUNTED.includes(p.status) && inRange(p.paidAt));
  const byMethod = {};
  for (const p of rangePayments) byMethod[p.method] = r2((byMethod[p.method] ?? 0) + p.amount - (p.amountRefunded || 0));

  return {
    summary: {
      invoiced: r2(rangeInvoices.reduce((s, i) => s + (i.grandTotal || 0), 0)),
      collected: r2(rangePayments.reduce((s, p) => s + p.amount, 0)),
      refunded: r2(rangePayments.reduce((s, p) => s + (p.amountRefunded || 0), 0)),
      outstanding: r2(invoices.filter((i) => !CLOSED.includes(i.status) && i.status !== "draft").reduce((s, i) => s + (i.amountDue || 0), 0)),
      byMethod,
      invoicesChecked: invoices.length,
      paymentsChecked: payments.length,
    },
    issues,
  };
};

/** Re-derive an invoice's paid/refunded/due/status and allocations from its payments. */
export const fixInvoice = async ({ instituteId, invoicePublicId, performedBy }) => {
  const invoice = await Invoice.findOne({ publicId: invoicePublicId, instituteId });
  if (!invoice) return null;

  const payments = await Payment.find({ invoiceId: invoice._id }).lean();
  const expected = expectedFromPayments(payments);
  const before = { amountPaid: invoice.amountPaid, amountRefunded: invoice.amountRefunded, status: invoice.status };

  invoice.amountPaid = expected.amountPaid;
  invoice.amountRefunded = expected.amountRefunded;

  const allocated = new Set((invoice.paymentAllocations ?? []).map((a) => String(a.paymentId)));
  for (const p of payments.filter((x) => COUNTED.includes(x.status) && !allocated.has(String(x._id)))) {
    invoice.paymentAllocations.push({ paymentId: p._id, amount: p.amount, allocatedAt: p.paidAt ?? new Date() });
  }

  invoice.calculateTotals();

  if (!CLOSED.includes(invoice.status)) {
    const paidStatus = { paid: "paid", overpaid: "paid", refunded: "refunded", partially_paid: "partially_paid" }[invoice.paymentStatus];
    if (paidStatus) invoice.status = paidStatus;
    else if (invoice.status === "paid") invoice.status = "issued";
  }

  invoice.history.push({
    action: "reconciled",
    fromStatus: before.status,
    toStatus: invoice.status,
    performedBy,
    reason: `Recalculated from payments (paid ₹${before.amountPaid} → ₹${invoice.amountPaid}, refunded ₹${before.amountRefunded} → ₹${invoice.amountRefunded})`,
  });

  await invoice.save();
  return invoice;
};
