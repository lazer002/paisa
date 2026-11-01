// server/src/controllers/billingController.js
//
// Billing module: Invoices (draft → sent → paid) +
// payment recording with amount-due tracking.
//
// NOTE: the Invoice model lives in Payment.js
// (`export const Invoice`); each payment is a Payment
// document (PaymentTransaction.js) allocated to the
// invoice via services/paymentService.js.

import { Invoice } from "../models/Payment.js";
import { PAYMENT_METHODS } from "../models/PaymentTransaction.js";
import { recordInvoicePayment } from "../services/paymentService.js";
import { childUserIdsFor } from "../utils/parentScope.js";
import { User } from "../models/User.js";
import { sendInBackground } from "../services/emailService.js";
import { sendInvoiceIssuedEmails } from "../services/transactionalEmails.js";

import { asyncHandler } from "../utils/errorHandler.js";

import { resolveRef } from "../utils/resolveRef.js";
import { getNextSequence } from "../utils/sequence.js";
import { escapeRegex } from "../utils/crudHelpers.js";

import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendForbidden,
  sendError,
} from "../utils/response.js";

const scoped = (req, extra = {}) => {
  if (req.user.role === "super_admin") {
    return { ...extra };
  }

  return {
    instituteId: req.user.instituteId,
    ...extra,
  };
};

// The client sends/reads `lineItems: [{ description, quantity, unitPrice }]`;
// the model stores `items` (name + unitPrice required) and `subtotal`.
const toModelItems = (lineItems) =>
  lineItems.map((item) => {
    const quantity = Number(item.quantity) || 1;
    const unitPrice = Math.max(Number(item.unitPrice) || 0, 0);
    const label = String(item.name || item.description || "Item").trim();

    return {
      name: label.slice(0, 500),
      description: item.description || null,
      quantity,
      unitPrice,
      grossAmount: quantity * unitPrice,
      taxAmount: Number(item.taxAmount) || 0,
    };
  });

const invoiceView = (invoice) => {
  if (!invoice) return invoice;
  const json = invoice.toJSON ? invoice.toJSON() : invoice;

  return {
    ...json,
    lineItems: (json.items ?? []).map((item) => ({
      description: item.description ?? item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
  };
};

// INV-2026-00001 style, unique per organization; skips numbers already used.
const nextInvoiceNumber = async (instituteId) => {
  const year = new Date().getFullYear();

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const seq = await getNextSequence(`invoice:${instituteId}:${year}`);
    const number = `INV-${year}-${String(seq).padStart(5, "0")}`;

    if (!(await Invoice.exists({ instituteId, invoiceNumber: number }))) {
      return number;
    }
  }

  return null;
};

// Mirrors the Invoice model enum (models/Payment.js).
const INVOICE_STATUSES = [
  "draft",
  "pending",
  "issued",
  "partially_paid",
  "paid",
  "overdue",
  "cancelled",
  "void",
  "refunded",
  "written_off",
];

export const createInvoice = asyncHandler(
  async (req, res) => {
    const {
      customerId,
      studentId,
      employeeId,
      type,
      dueDate,
      notes,
      lineItems,
    } = req.body;

    if (
      !Array.isArray(lineItems) ||
      lineItems.length === 0
    ) {
      return sendError(
        res,
        400,
        "At least one line item is required"
      );
    }

    // Billed people must belong to this organization.
    const orgScope = { instituteId: req.user.instituteId };

    const [resolvedStudent, resolvedEmployee] =
      await Promise.all([
        studentId
          ? resolveRef(User, studentId, {
              label: "Student",
              scope: orgScope,
            })
          : null,
        employeeId
          ? resolveRef(User, employeeId, {
              label: "Employee",
              scope: orgScope,
            })
          : null,
      ]);

    const items = toModelItems(lineItems);

    const subTotal = items.reduce(
      (sum, item) => sum + item.grossAmount,
      0
    );

    const taxTotal = items.reduce(
      (sum, item) => sum + item.taxAmount,
      0
    );

    const invoice = await Invoice.create({
      instituteId: req.user.instituteId,

      createdBy: req.user._id,

      customerId: null,
      studentId: resolvedStudent,
      employeeId: resolvedEmployee,

      type: type || "other",

      dueDate: dueDate || null,

      notes: notes || null,

      invoiceNumber: await nextInvoiceNumber(req.user.instituteId),

      items,

      subtotal: subTotal,

      taxTotal,

      grandTotal: subTotal + taxTotal,

      amountDue: subTotal + taxTotal,

      status: "draft",
    });

    return sendCreated(res, {
      message: "Invoice created",
      data: invoiceView(invoice),
    });
  }
);

export const getInvoices = asyncHandler(
  async (req, res) => {
    const { status, type, search } = req.query;

    const query = scoped(req);

    if (req.user.role === "student") {
      query.studentId = req.user._id;
    }

    if (req.user.role === "parent") {
      query.studentId = {
        $in: await childUserIdsFor(req.user),
      };
    }

    if (req.user.role === "employee") {
      query.employeeId = req.user._id;
    }

    if (status) query.status = status;
    if (type) query.type = type;

    if (search) {
      query.invoiceNumber = {
        $regex: escapeRegex(search),
        $options: "i",
      };
    }

    const invoices = await Invoice.find(query)
      .populate("studentId", "name email userCode")
      .populate("employeeId", "name email userCode")
      .sort({ createdAt: -1 });

    return sendSuccess(res, {
      message: "Invoices fetched",
      data: invoices.map(invoiceView),
    });
  }
);

export const getInvoice = asyncHandler(async (req, res) => {
  const query = scoped(req, {
    publicId: req.params.publicId,
  });

  // Same ownership rules as getInvoices.
  if (req.user.role === "student") {
    query.studentId = req.user._id;
  }

  if (req.user.role === "parent") {
    query.studentId = {
      $in: await childUserIdsFor(req.user),
    };
  }

  if (req.user.role === "employee") {
    query.employeeId = req.user._id;
  }

  const invoice = await Invoice.findOne(query);

  if (!invoice) {
    return sendNotFound(res, "Invoice not found");
  }

  return sendSuccess(res, {
    message: "Invoice fetched",
    data: invoiceView(invoice),
  });
});

export const updateInvoiceStatus = asyncHandler(
  async (req, res) => {
    const { status } = req.body;

    if (!INVOICE_STATUSES.includes(status)) {
      return sendError(
        res,
        400,
        "Invalid invoice status"
      );
    }

    const invoice = await Invoice.findOne({
      publicId: req.params.publicId,
    });

    if (!invoice) {
      return sendNotFound(res, "Invoice not found");
    }

    if (
      req.user.role !== "super_admin" &&
      String(invoice.instituteId) !==
        String(req.user.instituteId)
    ) {
      return sendForbidden(res, "Access denied");
    }

    const previousStatus = invoice.status;

    invoice.status = status;

    await invoice.save();

    sendSuccess(res, {
      message: "Invoice updated",
      data: invoice,
    });

    // Email the billed people once, when the invoice becomes issued.
    if (status === "issued" && previousStatus !== "issued") {
      sendInBackground("invoice-issued", () =>
        sendInvoiceIssuedEmails(invoice)
      );
    }
  }
);

export const recordPayment = asyncHandler(
  async (req, res) => {
    const { amount, method, reference } = req.body;

    const paid = Number(amount);

    if (!paid || paid <= 0) {
      return sendError(
        res,
        400,
        "A positive amount is required"
      );
    }

    const invoice = await Invoice.findOne(
      scoped(req, {
        publicId: req.params.publicId,
      })
    );

    if (!invoice) {
      return sendNotFound(res, "Invoice not found");
    }

    const { payment } = await recordInvoicePayment({
      invoice,
      amount: paid,
      method: PAYMENT_METHODS.includes(method)
        ? method
        : "cash",
      reference: reference || null,
      payerId: invoice.studentId || invoice.userId || null,
      receivedBy: req.user._id,
    });

    return sendSuccess(res, {
      message: `Payment recorded (receipt ${payment.receiptNumber})`,
      data: invoice,
    });
  }
);

export const deleteInvoice = asyncHandler(
  async (req, res) => {
    const invoice = await Invoice.findOne({
      publicId: req.params.publicId,
    });

    if (!invoice) {
      return sendNotFound(res, "Invoice not found");
    }

    if (
      req.user.role !== "super_admin" &&
      String(invoice.instituteId) !==
        String(req.user.instituteId)
    ) {
      return sendForbidden(res, "Access denied");
    }

    if (invoice.status === "paid") {
      return sendError(
        res,
        400,
        "Paid invoices cannot be deleted"
      );
    }

    await invoice.deleteOne();

    return sendSuccess(res, {
      message: "Invoice deleted",
      data: null,
    });
  }
);
