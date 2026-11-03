import test from "node:test";
import assert from "node:assert/strict";

import { expectedFromPayments, invoiceIssues } from "../src/services/reconciliation.js";

const pay = (id, amount, status = "succeeded", amountRefunded = 0) => ({ _id: id, publicId: `pay_${id}`, amount, status, amountRefunded });
const invoice = (over = {}) => ({
  publicId: "inv_1",
  invoiceNumber: "INV-1",
  status: "partially_paid",
  grandTotal: 1000,
  amountPaid: 400,
  amountRefunded: 0,
  amountDue: 600,
  paymentAllocations: [{ paymentId: "a" }],
  ...over,
});
const types = (issues) => issues.map((i) => i.type).sort();

test("expected amounts come from successful payments and their refunds", () => {
  assert.deepEqual(expectedFromPayments([pay("a", 400), pay("b", 100, "failed"), pay("c", 300, "partially_refunded", 50)]), {
    amountPaid: 700,
    amountRefunded: 50,
  });
});

test("a consistent invoice has no issues", () => {
  assert.deepEqual(invoiceIssues(invoice(), [pay("a", 400)]), []);
});

test("payment recorded but not applied to the invoice", () => {
  const issues = invoiceIssues(invoice(), [pay("a", 400), pay("b", 200)]);
  assert.deepEqual(types(issues), ["amount_mismatch", "payment_not_applied"]);
  assert.equal(issues.find((i) => i.type === "amount_mismatch").expected.amountPaid, 600);
});

test("fully paid but status not updated", () => {
  const issues = invoiceIssues(invoice({ amountPaid: 1000, amountDue: 0 }), [pay("a", 1000)]);
  assert.deepEqual(types(issues), ["status_mismatch"]);
});

test("marked paid with money still due", () => {
  const issues = invoiceIssues(invoice({ status: "paid", amountDue: 600 }), [pay("a", 400)]);
  assert.deepEqual(types(issues), ["status_mismatch"]);
});

test("overpaid and money on a cancelled invoice are flagged, not auto-fixed", () => {
  const over = invoiceIssues(invoice({ status: "paid", amountPaid: 1200, amountDue: 0 }), [pay("a", 1200)]);
  assert.ok(over.some((i) => i.type === "overpaid" && i.fixable === false));

  const closed = invoiceIssues(invoice({ status: "cancelled", amountPaid: 400 }), [pay("a", 400)]);
  assert.deepEqual(types(closed), ["payment_on_closed"]);
});
