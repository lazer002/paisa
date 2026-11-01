// src/controllers/payrollController.js

import { Payroll } from "../models/Payroll.js";
import Employee from "../models/Employee.js";
import { SalaryStructure } from "../models/SalaryStructure.js";
import { Attendance } from "../models/Attendance.js";
import { Leave } from "../models/Leave.js";
import Organization from "../models/organization.js";

import { asyncHandler } from "../utils/errorHandler.js";
import ApiError from "../utils/ApiError.js";

import { User } from "../models/User.js";

import { resolveRef } from "../utils/resolveRef.js";

import {
  computeAttendanceBreakdown,
  computeSalary,
  monthBounds,
} from "../services/payrollCalculator.js";

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

// Roles that read every payroll of their organization; everyone else
// (employee, teacher, ...) only ever sees their own payslips.
const PAYROLL_VIEWERS = [
  ...PAYROLL_MANAGERS,
  "accountant",
  "principal",
];

// Employee statuses that are paid for a month.
const PAYABLE_EMPLOYEE_STATUSES = [
  "active",
  "on_leave",
  "probation",
  "notice_period",
];

// Generated rows in these states are never recalculated.
const LOCKED_PAYROLL_STATUSES = [
  "approved",
  "paid",
  "cancelled",
];

const PAYMENT_METHODS = [
  "bank_transfer",
  "cheque",
  "cash",
  "upi",
];

const orgOf = (req) => {
  if (!req.user.instituteId) {
    throw ApiError.badRequest(
      "Payroll runs belong to an organization",
      { code: "ORGANIZATION_REQUIRED" }
    );
  }

  return req.user.instituteId;
};

const parsePeriod = (source) => {
  const month = Number(source?.month);
  const year = Number(source?.year);

  if (
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12 ||
    !Number.isInteger(year) ||
    year < 2000 ||
    year > 2200
  ) {
    throw ApiError.badRequest(
      "A valid month (1-12) and year are required",
      { code: "INVALID_PERIOD" }
    );
  }

  return { month, year };
};

const parseOptions = (source) => {
  let weeklyOff = [0];
  const raw = source?.weeklyOff;

  if (raw !== undefined && raw !== null && raw !== "") {
    const list = Array.isArray(raw)
      ? raw
      : String(raw).split(",");

    weeklyOff = [
      ...new Set(
        list
          .map((value) => Number(value))
          .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6)
      ),
    ];
  }

  const unmarked = source?.unmarkedAsPresent;

  return {
    weeklyOff,
    unmarkedAsPresent:
      unmarked === true || unmarked === "true" || unmarked === "1",
  };
};

const effectiveIn = (start, end) => ({
  status: "active",
  isDeleted: false,
  effectiveFrom: { $lte: end },
  $or: [
    { effectiveTo: null },
    { effectiveTo: { $gte: start } },
  ],
});

/**
 * The employee's salary structure for the period: the one assigned on the
 * employee profile (salaryStructureId), else one that names the employee
 * (employeeId / employeeIds). Must be active and effective in the month.
 */
const findStructureFor = async (employee, start, end) => {
  const base = {
    instituteId: employee.instituteId,
    ...effectiveIn(start, end),
  };

  if (employee.salaryStructureId) {
    const assigned = await SalaryStructure.findOne({
      ...base,
      _id: employee.salaryStructureId,
    });

    if (assigned) return assigned;
  }

  return SalaryStructure.findOne({
    ...base,
    $and: [
      {
        $or: [
          { employeeId: employee._id },
          { employeeIds: employee._id },
        ],
      },
    ],
  }).sort({ effectiveFrom: -1 });
};

/** Compute (without saving) one employee's payroll for a month. */
const calculateFor = async ({
  employee,
  month,
  year,
  options,
}) => {
  const { start, end } = monthBounds(month, year);
  const structure = await findStructureFor(employee, start, end);

  if (!structure) {
    return { error: "No active salary structure for this month" };
  }

  const [attendance, leaves] = await Promise.all([
    Attendance.find({
      instituteId: employee.instituteId,
      userId: employee.userId,
      classId: null,
      isDeleted: { $ne: true },
      date: { $gte: start, $lte: end },
    })
      .select("date status")
      .lean(),
    Leave.find({
      instituteId: employee.instituteId,
      userId: employee.userId,
      status: "approved",
      isDeleted: { $ne: true },
      startDate: { $lte: end },
      endDate: { $gte: start },
    })
      .select("type duration startDate endDate days")
      .lean(),
  ]);

  const breakdown = computeAttendanceBreakdown({
    month,
    year,
    attendance,
    leaves,
    weeklyOff: options.weeklyOff,
    unmarkedAsPresent: options.unmarkedAsPresent,
  });

  const salary = computeSalary({ structure, breakdown });

  return {
    structure,
    breakdown,
    salary,
    period: { start, end },
  };
};

const payrollFields = ({
  calculation,
  options,
  month,
  year,
}) => {
  const { structure, breakdown, salary, period } = calculation;

  return {
    month,
    year,
    periodStart: period.start,
    periodEnd: period.end,
    basicSalary: salary.basicSalary,
    allowances: salary.allowances,
    deductions: salary.deductions,
    attendanceSummary: {
      workingDays: breakdown.workingDays,
      presentDays: breakdown.presentDays,
      paidLeaveDays: breakdown.paidLeaveDays,
      unpaidLeaveDays: breakdown.unpaidLeaveDays,
    },
    source: "generated",
    salaryStructureId: structure._id,
    calculation: {
      ...breakdown,
      perDayRate: salary.perDayRate,
      lopEnabled: salary.lopEnabled,
      lines: salary.lines,
      weeklyOff: options.weeklyOff,
      unmarkedAsPresent: options.unmarkedAsPresent,
      structure: {
        publicId: structure.publicId,
        name: structure.name,
      },
      generatedAt: new Date(),
    },
  };
};

const userSummary = (user) =>
  user
    ? {
        publicId: user.publicId,
        name: user.name,
        email: user.email,
        role: user.role,
        userCode: user.userCode,
      }
    : null;

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

  // employeeId arrives as a publicId — resolve within this organization.
  const resolvedEmployeeId = await resolveRef(
    User,
    employeeId,
    { label: "Employee", scope: { instituteId: orgOf(req) } }
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

  // Everyone outside the payroll viewers only sees their own payslips.
  if (
    !PAYROLL_VIEWERS.includes(
      req.user.role
    )
  ) {
    query.employeeId =
      req.user._id;
  } else if (req.query.employeeId) {
    query.employeeId = await resolveRef(
      User,
      req.query.employeeId,
      {
        label: "Employee",
        scope: query.instituteId ? { instituteId: query.instituteId } : {},
      }
    );
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
        "name email userCode publicId role"
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

    if (
      payroll.status === "paid" ||
      payroll.isFinalized
    ) {
      return sendError(
        res,
        400,
        "Paid payroll is final and cannot change status"
      );
    }

    const update = {
      status,
    };

    if (
      status === "paid"
    ) {
      const now = new Date();

      update["payment.paidAt"] = now;
      update["payment.method"] = PAYMENT_METHODS.includes(
        req.body.method
      )
        ? req.body.method
        : "bank_transfer";

      if (req.body.referenceNo) {
        update["payment.referenceNo"] = String(
          req.body.referenceNo
        ).slice(0, 150);
      }

      update.isFinalized = true;
      update.finalizedAt = now;
      update.finalizedBy = req.user._id;
    } else if (status === "processed") {
      update.processedBy = req.user._id;
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

/* =========================================================
   PAYSLIP (one payroll with employee + organization details)
   Payroll viewers: any record of their org. Others: only their own.
========================================================= */

export const getPayslip = asyncHandler(async (req, res) => {
  const query = { publicId: req.params.publicId };

  if (req.user.role !== "super_admin") {
    query.instituteId = req.user.instituteId;
  }

  if (!PAYROLL_VIEWERS.includes(req.user.role)) {
    query.employeeId = req.user._id;
  }

  const payroll = await Payroll.findOne(query)
    .populate("employeeId", "name email userCode publicId role")
    .populate("salaryStructureId", "name publicId");

  if (!payroll) {
    return sendNotFound(res, "Payslip not found");
  }

  const [employee, organization] = await Promise.all([
    Employee.findOne({
      instituteId: payroll.instituteId,
      userId: payroll.employeeId?._id ?? payroll.employeeId,
      isDeleted: { $ne: true },
    })
      .select("publicId employeeCode displayName designation jobTitle departmentId joiningDate")
      .populate("departmentId", "name")
      .lean(),
    Organization.findById(payroll.instituteId)
      .select("name slug contact")
      .lean(),
  ]);

  return sendSuccess(res, {
    message: "Payslip fetched",
    data: {
      payroll,
      employee: employee
        ? {
            publicId: employee.publicId,
            employeeCode: employee.employeeCode,
            name: employee.displayName,
            designation: employee.designation || employee.jobTitle || null,
            department: employee.departmentId?.name ?? null,
            joiningDate: employee.joiningDate,
          }
        : null,
      organization,
    },
  });
});

/* =========================================================
   SALARY ASSIGNMENTS (employee profile -> salary structure)
========================================================= */

export const getSalaryAssignments = asyncHandler(async (req, res) => {
  const instituteId = orgOf(req);

  const employees = await Employee.find({
    instituteId,
    isDeleted: { $ne: true },
    userId: { $ne: null },
    status: { $in: PAYABLE_EMPLOYEE_STATUSES },
  })
    .select("publicId employeeCode displayName designation status userId salaryStructureId")
    .populate("userId", "name email role publicId userCode")
    .populate("salaryStructureId", "publicId name baseSalary type status")
    .sort({ displayName: 1 })
    .lean();

  return sendSuccess(res, {
    message: "Salary assignments fetched",
    data: employees.map((employee) => ({
      employee: {
        publicId: employee.publicId,
        employeeCode: employee.employeeCode,
        name: employee.displayName,
        designation: employee.designation,
        status: employee.status,
      },
      user: userSummary(employee.userId),
      salaryStructure: employee.salaryStructureId ?? null,
    })),
  });
});

// PUT /payroll/salary-assignments/:userId  { salaryStructureId | null }
export const assignSalaryStructure = asyncHandler(async (req, res) => {
  const instituteId = orgOf(req);

  const userId = await resolveRef(User, req.params.userId, {
    label: "User",
    scope: { instituteId },
  });

  const employee = await Employee.findOne({
    instituteId,
    userId,
    isDeleted: { $ne: true },
  }).select("_id");

  if (!employee) {
    return sendNotFound(res, "This user has no employee profile");
  }

  let structureId = null;

  if (req.body?.salaryStructureId) {
    structureId = await resolveRef(SalaryStructure, req.body.salaryStructureId, {
      label: "Salary structure",
      scope: { instituteId, isDeleted: false },
    });
  }

  await Employee.updateOne(
    { _id: employee._id },
    { $set: { salaryStructureId: structureId } }
  );

  return sendSuccess(res, {
    message: structureId ? "Salary structure assigned" : "Salary structure removed",
    data: { userId: req.params.userId, salaryStructureId: req.body?.salaryStructureId ?? null },
  });
});

/* =========================================================
   PREVIEW (one employee, nothing saved)
========================================================= */

export const previewPayroll = asyncHandler(async (req, res) => {
  const instituteId = orgOf(req);
  const { month, year } = parsePeriod(req.query);
  const options = parseOptions(req.query);

  if (!req.query.userId) {
    return sendError(res, 400, "userId is required");
  }

  const userId = await resolveRef(User, req.query.userId, {
    label: "User",
    scope: { instituteId },
  });

  const employee = await Employee.findOne({
    instituteId,
    userId,
    isDeleted: { $ne: true },
  }).populate("userId", "name email role publicId userCode");

  if (!employee) {
    return sendNotFound(res, "This user has no employee profile");
  }

  const calculation = await calculateFor({
    employee: { ...employee.toObject(), userId },
    month,
    year,
    options,
  });

  if (calculation.error) {
    return sendError(res, { statusCode: 400, code: "NO_SALARY_STRUCTURE", message: calculation.error });
  }

  const fields = payrollFields({ calculation, options, month, year });
  const { salary } = calculation;

  const existing = await Payroll.findOne({
    instituteId,
    employeeId: userId,
    month,
    year,
  }).select("publicId status source isFinalized netSalary");

  return sendSuccess(res, {
    message: "Payroll preview",
    data: {
      user: userSummary(employee.userId),
      ...fields,
      grossSalary: salary.grossSalary,
      totalDeductions: salary.totalDeductions,
      netSalary: salary.netSalary,
      existing,
    },
  });
});

/* =========================================================
   GENERATE (all payable employees for a month; idempotent)
========================================================= */

export const generatePayroll = asyncHandler(async (req, res) => {
  const instituteId = orgOf(req);
  const { month, year } = parsePeriod(req.body);
  const options = parseOptions(req.body);

  const employees = await Employee.find({
    instituteId,
    isDeleted: { $ne: true },
    userId: { $ne: null },
    status: { $in: PAYABLE_EMPLOYEE_STATUSES },
  }).populate("userId", "name email role publicId userCode status");

  const summary = {
    month,
    year,
    created: 0,
    updated: 0,
    unchanged: 0,
    skipped: [],
    results: [],
  };

  for (const employee of employees) {
    const user = employee.userId;

    if (!user || user.status !== "active") {
      summary.skipped.push({ user: userSummary(user), reason: "User account is not active" });
      continue;
    }

    const calculation = await calculateFor({
      employee: { ...employee.toObject(), userId: user._id },
      month,
      year,
      options,
    });

    if (calculation.error) {
      summary.skipped.push({ user: userSummary(user), reason: calculation.error });
      continue;
    }

    const fields = payrollFields({ calculation, options, month, year });

    const existing = await Payroll.findOne({
      instituteId,
      employeeId: user._id,
      month,
      year,
    });

    if (existing) {
      if (existing.source !== "generated") {
        summary.skipped.push({ user: userSummary(user), reason: "A manually entered payroll exists for this month" });
        continue;
      }

      if (existing.isFinalized || LOCKED_PAYROLL_STATUSES.includes(existing.status)) {
        summary.skipped.push({ user: userSummary(user), reason: `Payroll is already ${existing.status}` });
        continue;
      }

      const before = existing.netSalary;
      const beforeLop = existing.deductions?.lopDays;

      Object.assign(existing, fields, { processedBy: req.user._id });
      existing.markModified("calculation");
      existing.recalculate();
      await existing.save();

      if (before === existing.netSalary && beforeLop === existing.deductions.lopDays) {
        summary.unchanged += 1;
      } else {
        summary.updated += 1;
      }

      summary.results.push({ user: userSummary(user), publicId: existing.publicId, netSalary: existing.netSalary, action: "updated" });
      continue;
    }

    try {
      const payroll = await Payroll.create({
        ...fields,
        instituteId,
        employeeId: user._id,
        status: "draft",
        processedBy: req.user._id,
      });

      summary.created += 1;
      summary.results.push({ user: userSummary(user), publicId: payroll.publicId, netSalary: payroll.netSalary, action: "created" });
    } catch (error) {
      if (error?.code === 11000) {
        summary.skipped.push({ user: userSummary(user), reason: "Created concurrently by another run" });
        continue;
      }
      throw error;
    }
  }

  return sendSuccess(res, {
    message: `Payroll generated: ${summary.created} created, ${summary.updated} updated, ${summary.unchanged} unchanged, ${summary.skipped.length} skipped`,
    data: summary,
  });
});