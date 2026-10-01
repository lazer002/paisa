// server/src/controllers/billingController.js
//
// Billing module: Invoices (draft → sent → paid) +
// payment recording with amount-due tracking.
//
// NOTE: the Invoice model lives in Payment.js
// (`export const Invoice`); Payment records are not
// yet modelled separately — payments are entries on
// the invoice's payment history.

import { Invoice } from "../models/Payment.js";
import { User } from "../models/User.js";

import { asyncHandler } from "../utils/errorHandler.js";

import { resolveRef } from "../utils/resolveRef.js";

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

const INVOICE_STATUSES = [
  "draft",
  "sent",
  "partial",
  "paid",
  "overdue",
  "cancelled",
  "refunded",
  "uncollectible",
  "void",
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

    const [resolvedStudent, resolvedEmployee] =
      await Promise.all([
        studentId
          ? resolveRef(User, studentId, {
              label: "Student",
            })
          : null,
        employeeId
          ? resolveRef(User, employeeId, {
              label: "Employee",
            })
          : null,
      ]);

    const subTotal = lineItems.reduce(
      (sum, item) =>
        sum +
        (Number(item.quantity) || 1) *
          (Number(item.unitPrice) || 0),
      0
    );

    const taxTotal = lineItems.reduce(
      (sum, item) =>
        sum +
        (Number(item.taxAmount) || 0),
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

      lineItems,

      subTotal,

      taxTotal,

      grandTotal: subTotal + taxTotal,

      amountDue: subTotal + taxTotal,

      status: "draft",
    });

    return sendCreated(res, {
      message: "Invoice created",
      data: invoice,
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

    if (req.user.role === "employee") {
      query.employeeId = req.user._id;
    }

    if (status) query.status = status;
    if (type) query.type = type;

    if (search) {
      query.invoiceNumber = {
        $regex: search,
        $options: "i",
      };
    }

    const invoices = await Invoice.find(query)
      .populate("studentId", "name email userCode")
      .populate("employeeId", "name email userCode")
      .sort({ createdAt: -1 });

    return sendSuccess(res, {
      message: "Invoices fetched",
      data: invoices,
    });
  }
);

export const getInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOne({
    publicId: req.params.publicId,
    ...scoped(req),
  });

  if (!invoice) {
    return sendNotFound(res, "Invoice not found");
  }

  return sendSuccess(res, {
    message: "Invoice fetched",
    data: invoice,
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

    invoice.status = status;

    await invoice.save();

    return sendSuccess(res, {
      message: "Invoice updated",
      data: invoice,
    });
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

    if (
      ["paid", "cancelled", "void"].includes(
        invoice.status
      )
    ) {
      return sendError(
        res,
        400,
        "Invoice is closed"
      );
    }

    const amountDue =
      (invoice.amountDue ?? invoice.grandTotal) -
      paid;

    invoice.amountPaid =
      (invoice.amountPaid || 0) + paid;

    invoice.amountDue = Math.max(0, amountDue);

    invoice.payments = invoice.payments || [];

    invoice.payments.push({
      amount: paid,

      method: method || "cash",

      reference: reference || null,

      receivedBy: req.user._id,

      receivedAt: new Date(),
    });

    invoice.paymentStatus =
      invoice.amountDue === 0 ? "paid" : "partial";

    invoice.status =
      invoice.amountDue === 0 ? "paid" : "partial";

    await invoice.save();

    return sendSuccess(res, {
      message: "Payment recorded",
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
