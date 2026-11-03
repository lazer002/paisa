// server/src/controllers/reconciliationController.js
//
// GET  /payments/reconciliation?from&to            finance:read
// POST /payments/reconciliation/invoices/:id/fix   finance:manage
// Always the caller's own organization.

import { reconcile, fixInvoice } from "../services/reconciliation.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/errorHandler.js";
import { sendSuccess } from "../utils/response.js";

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

const parseDay = (value, label) => {
  if (!value) return null;
  if (!DATE_KEY.test(String(value))) throw ApiError.badRequest(`${label} must be a date (YYYY-MM-DD)`, "INVALID_RANGE");
  return new Date(`${value}T00:00:00`);
};

const requireOrg = (req) => {
  if (!req.user.instituteId) throw ApiError.badRequest("Reconciliation is per organization", "ORGANIZATION_REQUIRED");
  return req.user.instituteId;
};

export const getReconciliation = asyncHandler(async (req, res) => {
  const from = parseDay(req.query.from, "from");
  const toDay = parseDay(req.query.to, "to");
  // `to` is inclusive: count the whole day.
  const to = toDay ? new Date(toDay.getTime() + 24 * 60 * 60 * 1000) : null;

  return sendSuccess(res, {
    message: "Reconciliation",
    data: await reconcile({ instituteId: requireOrg(req), from, to }),
  });
});

export const fixReconciledInvoice = asyncHandler(async (req, res) => {
  const invoice = await fixInvoice({
    instituteId: requireOrg(req),
    invoicePublicId: req.params.publicId,
    performedBy: req.user._id,
  });

  if (!invoice) throw ApiError.notFound("Invoice not found", "INVOICE_NOT_FOUND");

  return sendSuccess(res, {
    message: `Invoice ${invoice.invoiceNumber ?? ""} recalculated from its payments`.replace("  ", " "),
    data: {
      publicId: invoice.publicId,
      status: invoice.status,
      amountPaid: invoice.amountPaid,
      amountRefunded: invoice.amountRefunded,
      amountDue: invoice.amountDue,
    },
  });
});
