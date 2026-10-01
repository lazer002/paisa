// src/controllers/payrollController.js

import { Payroll } from "../models/Payroll.js";

import { asyncHandler } from "../utils/errorHandler.js";

import { User } from "../models/User.js";

import { resolveRef } from "../utils/resolveRef.js";

import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendForbidden,
  sendError,
} from "../utils/response.js";

const PAYROLL_MANAGERS = [
  "super_admin",
  "admin",
  "hr",
];

/* =========================================================
   CREATE PAYROLL
========================================================= */

export const createPayroll = asyncHandler(async (req, res) => {
  if (
    !PAYROLL_MANAGERS.includes(
      req.user.role
    )
  ) {
    return sendForbidden(
      res,
      "Only HR or Admin can process payroll"
    );
  }

  const {
    employeeId,
    month,
    year,
    basicSalary,
    allowances,
    deductions,
    remarks,
  } = req.body;

  if (
    !employeeId ||
    !month ||
    !year ||
    !basicSalary
  ) {
    return sendError(
      res,
      400,
      "employeeId, month, year, and basicSalary are required"
    );
  }

  // employeeId arrives as a publicId — resolve to _id.
  const resolvedEmployeeId = await resolveRef(
    User,
    employeeId,
    { label: "Employee" }
  );

  const existing =
    await Payroll.findOne({
      employeeId: resolvedEmployeeId,
      month: Number(month),
      year: Number(year),
    });

  if (existing) {
    return sendError(
      res,
      400,
      "Payroll already exists for this employee and period"
    );
  }

  const totalAllow =
    Object.values(
      allowances || {}
    ).reduce(
      (total, value) =>
        total +
        (Number(value) || 0),
      0
    );

  const totalDeduct =
    Object.values(
      deductions || {}
    ).reduce(
      (total, value) =>
        total +
        (Number(value) || 0),
      0
    );

  const netSalary =
    Number(basicSalary) +
    totalAllow -
    totalDeduct;

  const payroll =
    await Payroll.create({
      instituteId:
        req.user.instituteId,

      employeeId: resolvedEmployeeId,

      month:
        Number(month),

      year:
        Number(year),

      basicSalary:
        Number(basicSalary),

      allowances,

      deductions,

      netSalary,

      status:
        "processed",

      processedBy:
        req.user._id,

      remarks,
    });

  sendCreated(
    res,
    "Payroll processed",
    payroll
  );
});

/* =========================================================
   GET PAYROLLS
========================================================= */

export const getPayrolls = asyncHandler(async (req, res) => {
  const query = {};

  if (
    req.user.role !==
    "super_admin"
  ) {
    query.instituteId =
      req.user.instituteId;
  }

  // Employees can only see
  // their own payslips
  if (
    req.user.role ===
    "employee"
  ) {
    query.employeeId =
      req.user._id;
  } else if (
    PAYROLL_MANAGERS.includes(
      req.user.role
    )
  ) {
    if (req.query.employeeId) {
      query.employeeId =
        req.query.employeeId;
    }
  }

  if (req.query.month) {
    query.month =
      parseInt(
        req.query.month,
        10
      );
  }

  if (req.query.year) {
    query.year =
      parseInt(
        req.query.year,
        10
      );
  }

  if (req.query.status) {
    query.status =
      req.query.status;
  }

  const payrolls =
    await Payroll.find(query)
      .populate(
        "employeeId",
        "name email userCode"
      )
      .populate(
        "processedBy",
        "name"
      )
      .sort({
        year: -1,
        month: -1,
      });

  sendSuccess(
    res,
    "Payrolls fetched",
    payrolls
  );
});

/* =========================================================
   UPDATE PAYROLL STATUS
========================================================= */

export const updatePayrollStatus =
  asyncHandler(async (req, res) => {
    if (
      !PAYROLL_MANAGERS.includes(
        req.user.role
      )
    ) {
      return sendForbidden(
        res,
        "Only HR or Admin can update payroll status"
      );
    }

    const { status } =
      req.body;

    const validStatuses = [
      "draft",
      "processed",
      "paid",
    ];

    if (
      !validStatuses.includes(
        status
      )
    ) {
      return sendError(
        res,
        400,
        `Status must be one of: ${validStatuses.join(", ")}`
      );
    }

    const payroll =
      await Payroll.findOne({
        publicId:
          req.params.publicId,
      });

    if (!payroll) {
      return sendNotFound(
        res,
        "Payroll not found"
      );
    }

    if (
      req.user.role !==
        "super_admin" &&
      String(
        payroll.instituteId
      ) !==
        String(
          req.user.instituteId
        )
    ) {
      return sendForbidden(
        res,
        "Access denied"
      );
    }

    const update = {
      status,
    };

    if (
      status === "paid"
    ) {
      update.paidAt =
        new Date();
    }

    const updated =
      await Payroll.findOneAndUpdate(
        {
          publicId:
            req.params.publicId,
        },
        update,
        {
          new: true,
          runValidators: true,
        }
      );

    sendSuccess(
      res,
      "Payroll status updated",
      updated
    );
  });

/* =========================================================
   DELETE PAYROLL
========================================================= */

export const deletePayroll =
  asyncHandler(async (req, res) => {
    if (
      !PAYROLL_MANAGERS.includes(
        req.user.role
      )
    ) {
      return sendForbidden(
        res,
        "Only HR or Admin can delete payroll records"
      );
    }

    const payroll =
      await Payroll.findOne({
        publicId:
          req.params.publicId,
      });

    if (!payroll) {
      return sendNotFound(
        res,
        "Payroll not found"
      );
    }

    if (
      req.user.role !==
        "super_admin" &&
      String(
        payroll.instituteId
      ) !==
        String(
          req.user.instituteId
        )
    ) {
      return sendForbidden(
        res,
        "Access denied"
      );
    }

    if (
      payroll.status ===
      "paid"
    ) {
      return sendError(
        res,
        400,
        "Cannot delete a paid payroll record"
      );
    }

    await Payroll.deleteOne({
      publicId:
        req.params.publicId,
    });

    sendSuccess(
      res,
      "Payroll deleted"
    );
  });