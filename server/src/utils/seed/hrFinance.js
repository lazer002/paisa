// server/src/utils/seed/hrFinance.js
//
// HR and finance demo data for the demo school (see demoData.js for ctx):
//   - leave policies (sick / casual / earned) + per-user balances
//   - staff leaves (approved past, pending upcoming, rejected, half-day)
//   - staff attendance (classId null) for the last 14 working days
//   - salary structures (teaching / administrative / support), assigned to
//     the staff Employee profiles the way PUT /payroll/salary-assignments does
//   - one generated payroll month (previous calendar month), computed with
//     services/payrollCalculator.js exactly like POST /payroll/generate
//   - student fee invoices (issued / paid / partially paid / overdue) and the
//     Payment records (receipts) behind the paid amounts
//
// Every record is keyed by a stable natural key through seeder.ensure, so a
// re-run creates nothing new (attendance only gains the newest working days).

import mongoose from "mongoose";

import { ROLES } from "../../config/constants.js";

import { Leave } from "../../models/Leave.js";
import { LeavePolicy } from "../../models/LeavePolicy.js";
import { Attendance } from "../../models/Attendance.js";
import { SalaryStructure } from "../../models/SalaryStructure.js";
import { Payroll } from "../../models/Payroll.js";
import Employee from "../../models/Employee.js";
import { Invoice } from "../../models/Payment.js";
import { Payment } from "../../models/PaymentTransaction.js";

import { syncUserBalances } from "../../services/leaveBalanceService.js";
import {
  computeAttendanceBreakdown,
  computeSalary,
  monthBounds,
} from "../../services/payrollCalculator.js";
import { getNextSequence } from "../sequence.js";

import { DAY_MS, dayOffset, findRaw } from "./helpers.js";

/* ------------------------------------------------------------------------ */
/* DATE HELPERS                                                              */
/* ------------------------------------------------------------------------ */

/** UTC midnight of the n-th working day (Mon-Sat) from today; n < 0 = past. */
const workday = (n) => {
  if (n === 0) return dayOffset(0);

  const step = n < 0 ? -1 : 1;
  let offset = 0;
  let count = 0;

  while (count < Math.abs(n)) {
    offset += step;
    if (dayOffset(offset).getUTCDay() !== 0) count += 1;
  }

  return dayOffset(offset);
};

/** A time on a UTC-midnight day, given in UTC hours/minutes. */
const at = (day, hours, minutes) =>
  new Date(day.getTime() + (hours * 60 + minutes) * 60000);

const fiscalYearOf = (date) => {
  const year = date.getUTCFullYear();
  const start = date.getUTCMonth() >= 3 ? year : year - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
};

/* ------------------------------------------------------------------------ */
/* LEAVE POLICIES + LEAVES                                                   */
/* ------------------------------------------------------------------------ */

const POLICY_SPECS = [
  { leaveType: "casual", name: "Casual leave", yearlyAllocation: 12, carryForwardCap: 0 },
  { leaveType: "sick", name: "Sick leave", yearlyAllocation: 10, carryForwardCap: 5 },
  { leaveType: "earned", name: "Earned leave", yearlyAllocation: 15, carryForwardCap: 10 },
];

// from/to are working-day offsets; duration is resolved like applyLeave.
const LEAVE_SPECS = [
  {
    role: ROLES.EMPLOYEE, type: "casual", from: -16, to: -15, status: "approved",
    reason: "Family function in hometown", approver: ROLES.HR, comment: "Approved, enjoy!",
  },
  {
    role: ROLES.TEACHER, type: "sick", from: -5, to: -5, status: "approved",
    reason: "Fever, doctor advised rest", approver: ROLES.HR, comment: "Get well soon",
  },
  {
    role: ROLES.HR, type: "sick", from: -9, to: -9, half: "half_day_evening", status: "approved",
    reason: "Dental appointment in the afternoon", approver: ROLES.ADMIN, comment: null,
  },
  {
    role: ROLES.ACCOUNTANT, type: "casual", from: 2, to: 2, half: "half_day_morning", status: "pending",
    reason: "Parent-teacher meeting at my child's school",
  },
  {
    role: ROLES.SUPPORT, type: "casual", from: 4, to: 5, status: "pending",
    reason: "Personal work at the bank and RTO",
  },
  {
    role: ROLES.COUNSELOR, type: "earned", from: 8, to: 12, status: "rejected",
    reason: "Trip to Kerala with family", approver: ROLES.HR,
    rejectionReason: "Admissions open house falls in that week; please choose other dates",
  },
  {
    role: ROLES.PRINCIPAL, type: "earned", from: 15, to: 17, status: "approved",
    reason: "Annual family vacation", approver: ROLES.ADMIN, comment: "Vice principal will cover",
  },
];

const HALF_DAY_DURATIONS = ["half_day_morning", "half_day_evening"];

const leaveFields = (spec, ctx) => {
  const start = workday(spec.from);
  const end = workday(spec.to);
  const isHalf = HALF_DAY_DURATIONS.includes(spec.half);

  // Same day count and duration rules as leaveController.applyLeave.
  const days = isHalf ? 0.5 : Math.ceil((end - start) / DAY_MS) + 1;
  const duration = isHalf ? spec.half : days > 1 ? "multi_day" : "full_day";

  const owner = ctx.users[spec.role];
  const approver = spec.approver ? ctx.users[spec.approver] : null;
  const decidedAt = new Date(Math.min(Date.now(), start.getTime() - DAY_MS));

  return {
    duration,
    startDate: start,
    endDate: end,
    days,
    createdBy: owner._id,
    ...(spec.status === "approved"
      ? {
          approvedBy: approver._id,
          approvedAt: decidedAt,
          approverComment: spec.comment ?? null,
          updatedBy: approver._id,
        }
      : {}),
    ...(spec.status === "rejected"
      ? {
          rejectionReason: spec.rejectionReason,
          approverComment: null,
          updatedBy: approver._id,
        }
      : {}),
  };
};

const seedLeaves = async (seeder, ctx, staff) => {
  const { org } = ctx;
  const adminId = ctx.users[ROLES.ADMIN]._id;

  for (const spec of POLICY_SPECS) {
    await seeder.ensure(
      LeavePolicy,
      { instituteId: org._id, leaveType: spec.leaveType, isDeleted: false },
      {
        name: spec.name,
        yearlyAllocation: spec.yearlyAllocation,
        carryForwardCap: spec.carryForwardCap,
        createdBy: adminId,
      }
    );
  }

  const leaves = [];

  for (const spec of LEAVE_SPECS) {
    const owner = ctx.users[spec.role];
    if (!owner) continue;

    const leave = await seeder.ensure(
      Leave,
      // Not keyed by status: approving the pending demo leave in the app
      // must not make the next seed run recreate it.
      { instituteId: org._id, userId: owner._id, type: spec.type, reason: spec.reason },
      () => ({ status: spec.status, ...leaveFields(spec, ctx) })
    );

    leaves.push(leave);
  }

  // Balances: same service the API uses (creates the year's rows, then
  // recomputes used/pending from the leave records).
  if (!seeder.dryRun) {
    const years = new Set([new Date().getUTCFullYear(), ...leaves.map((l) => l.startDate.getUTCFullYear())]);

    for (const user of staff) {
      for (const year of years) {
        await syncUserBalances(user, year);
      }
    }
  }

  return leaves;
};

/* ------------------------------------------------------------------------ */
/* STAFF ATTENDANCE                                                          */
/* ------------------------------------------------------------------------ */

const ATTENDANCE_DAYS = 14;
const SHIFT_START = { h: 3, m: 30 }; // 09:00 IST in UTC

const seedAttendance = async (seeder, ctx, staff, leaves) => {
  const { org } = ctx;
  const hrId = ctx.users[ROLES.HR]._id;
  const approved = leaves.filter((l) => l.status === "approved");
  const records = [];

  for (const [u, user] of staff.entries()) {
    for (let i = 1; i <= ATTENDANCE_DAYS; i += 1) {
      const date = workday(-i);
      const leave = approved.find(
        (l) => String(l.userId) === String(user._id) && l.startDate <= date && l.endDate >= date
      );

      const k = (u * 3 + i * 7) % 20;
      let fields;

      if (leave && !HALF_DAY_DURATIONS.includes(leave.duration)) {
        fields = {
          status: "leave",
          notes: `On approved ${leave.type} leave`,
          markedVia: "manual",
          markedBy: hrId,
        };
      } else if (leave || k === 1) {
        const checkIn = at(date, SHIFT_START.h, SHIFT_START.m - 10 + (u % 5));
        fields = {
          status: "half_day",
          checkIn,
          checkOut: at(date, 7, 35 + (i % 10)),
          notes: leave ? "Half-day leave" : "Left early (personal work)",
          markedVia: "self_checkin",
          markedBy: user._id,
        };
      } else if (k === 13) {
        fields = {
          status: "absent",
          notes: "Did not report; no leave applied",
          markedVia: "manual",
          markedBy: hrId,
        };
      } else if (k === 0 || k === 7) {
        const lateBy = 20 + ((u * 5 + i) % 25);
        fields = {
          status: "late",
          checkIn: at(date, SHIFT_START.h, SHIFT_START.m + lateBy),
          checkOut: at(date, 11, 50 + (u % 10)),
          lateBy,
          notes: "Traffic delay",
          markedVia: "self_checkin",
          markedBy: user._id,
        };
      } else {
        fields = {
          status: "present",
          checkIn: at(date, 3, 12 + ((u + i) % 16)),
          checkOut: at(date, 11, 35 + ((u * 2 + i) % 25)),
          markedVia: "self_checkin",
          markedBy: user._id,
        };
      }

      const record = await seeder.ensure(
        Attendance,
        { instituteId: org._id, userId: user._id, date, classId: null },
        { ...fields, timezone: "Asia/Kolkata", source: "web" }
      );

      records.push(record);
    }
  }

  return records;
};

/* ------------------------------------------------------------------------ */
/* SALARY STRUCTURES                                                         */
/* ------------------------------------------------------------------------ */

const PF = { enabled: true, employeePercentage: 12, employerPercentage: 12, ceiling: 15000 };

const STRUCTURE_SPECS = [
  {
    key: "teaching",
    structureCode: "DEMO-SAL-TEACH",
    name: "Teaching Staff",
    designation: "Teaching",
    grade: "T1",
    department: "Academics",
    baseSalary: 42000,
    components: [
      { code: "HRA", name: "House rent allowance", type: "earning", category: "hra", calculationType: "percentage", percentage: 40, percentageBase: "basic", displayOrder: 1 },
      { code: "TRANSPORT", name: "Transport allowance", type: "earning", category: "transport", calculationType: "fixed", amount: 1600, displayOrder: 2 },
      { code: "SPECIAL", name: "Special allowance", type: "earning", category: "special_allowance", calculationType: "fixed", amount: 5000, displayOrder: 3 },
      { code: "PT", name: "Professional tax", type: "deduction", category: "professional_tax", calculationType: "fixed", amount: 200, proratable: false, displayOrder: 10 },
    ],
    benefits: { providentFund: PF },
  },
  {
    key: "admin",
    structureCode: "DEMO-SAL-ADMIN",
    name: "Administrative Staff",
    designation: "Administration",
    grade: "A1",
    department: "Administration",
    baseSalary: 32000,
    components: [
      { code: "HRA", name: "House rent allowance", type: "earning", category: "hra", calculationType: "percentage", percentage: 40, percentageBase: "basic", displayOrder: 1 },
      { code: "TRANSPORT", name: "Transport allowance", type: "earning", category: "transport", calculationType: "fixed", amount: 1600, displayOrder: 2 },
      { code: "MEDICAL", name: "Medical allowance", type: "earning", category: "medical", calculationType: "fixed", amount: 1250, displayOrder: 3 },
      { code: "PT", name: "Professional tax", type: "deduction", category: "professional_tax", calculationType: "fixed", amount: 200, proratable: false, displayOrder: 10 },
    ],
    benefits: { providentFund: PF },
  },
  {
    key: "support",
    structureCode: "DEMO-SAL-SUPP",
    name: "Support Staff",
    designation: "Support",
    grade: "S1",
    department: "Student Support",
    baseSalary: 15000,
    components: [
      { code: "HRA", name: "House rent allowance", type: "earning", category: "hra", calculationType: "percentage", percentage: 30, percentageBase: "basic", displayOrder: 1 },
      { code: "TRANSPORT", name: "Transport allowance", type: "earning", category: "transport", calculationType: "fixed", amount: 1200, displayOrder: 2 },
    ],
    benefits: {
      providentFund: PF,
      esi: { enabled: true, employeePercentage: 0.75, employerPercentage: 3.25, wageCeiling: 21000 },
    },
  },
];

// Which structure each staff Employee profile gets.
const ASSIGNMENTS = {
  [ROLES.PRINCIPAL]: "teaching",
  [ROLES.ACCOUNTANT]: "admin",
  [ROLES.COUNSELOR]: "admin",
  [ROLES.EMPLOYEE]: "admin",
  [ROLES.SUPPORT]: "support",
};

const seedSalaryStructures = async (seeder, ctx) => {
  const { org, users } = ctx;
  const year = new Date().getUTCFullYear();
  const structures = {};

  for (const spec of STRUCTURE_SPECS) {
    structures[spec.key] = await seeder.ensure(
      SalaryStructure,
      { instituteId: org._id, structureCode: spec.structureCode },
      () => {
        const fields = {
          name: spec.name,
          slug: spec.structureCode.toLowerCase(),
          description: `${spec.name} pay scale for the demo school`,
          status: "active",
          type: "monthly",
          payFrequency: "monthly",
          currency: "INR",
          departmentId: ctx.departments?.[spec.department]?._id ?? null,
          designation: spec.designation,
          grade: spec.grade,
          baseSalary: spec.baseSalary,
          monthlyBaseSalary: spec.baseSalary,
          components: spec.components,
          benefits: spec.benefits,
          tax: { professionalTaxEnabled: true },
          leave: { lossOfPayEnabled: true, workingDaysPerMonth: 26, workingHoursPerDay: 8 },
          // Indian financial year start (1 April of last year).
          effectiveFrom: new Date(Date.UTC(year - 1, 3, 1)),
          effectiveTo: null,
          createdBy: users[ROLES.HR]._id,
          activatedBy: users[ROLES.HR]._id,
          activatedAt: new Date(Date.UTC(year - 1, 3, 1)),
          tags: ["demo", spec.key],
        };

        // Fill totals the way the model's own calculateTotals does.
        const draft = new SalaryStructure(fields);
        draft.calculateTotals();

        return {
          ...fields,
          annualBaseSalary: draft.annualBaseSalary,
          totals: JSON.parse(JSON.stringify(draft.totals)),
        };
      }
    );
  }

  return structures;
};

/** Employee profile per staff role, with the structure assigned (if unset). */
const assignStructures = async (seeder, ctx, structures) => {
  const { org, users } = ctx;
  const employees = [];

  for (const [role, key] of Object.entries(ASSIGNMENTS)) {
    const user = users[role];
    if (!user) continue;

    const structure = structures[key];

    if (seeder.dryRun) {
      employees.push({ user, employee: { _id: new mongoose.Types.ObjectId(), salaryStructureId: structure._id }, structure });
      continue;
    }

    let employee = await findRaw(Employee, { instituteId: org._id, userId: user._id });
    if (!employee) continue;

    // Same write as PUT /payroll/salary-assignments/:userId, but never
    // overrides an assignment someone already made in the app.
    if (!employee.salaryStructureId) {
      await Employee.collection.updateOne(
        { _id: employee._id },
        { $set: { salaryStructureId: structure._id } }
      );
      employee.salaryStructureId = structure._id;
    }

    employees.push({ user, employee, structure });
  }

  return employees;
};

/* ------------------------------------------------------------------------ */
/* PAYROLL (previous calendar month)                                         */
/* ------------------------------------------------------------------------ */

// Status mix for the generated month, by role.
const PAYROLL_STATUS = {
  [ROLES.EMPLOYEE]: "paid",
  [ROLES.PRINCIPAL]: "paid",
  [ROLES.ACCOUNTANT]: "approved",
  [ROLES.COUNSELOR]: "processed",
  [ROLES.SUPPORT]: "draft",
};

// Same options a payroll run from the HR screen would send: Sunday off, and
// days before the seeded attendance window counted as present.
const PAYROLL_OPTIONS = { weeklyOff: [0], unmarkedAsPresent: true };

const previousMonth = () => {
  const today = dayOffset(0);
  const month = today.getUTCMonth(); // 0-based current = 1-based previous
  return month === 0
    ? { month: 12, year: today.getUTCFullYear() - 1 }
    : { month, year: today.getUTCFullYear() };
};

const effectiveIn = (start, end) => ({
  status: "active",
  isDeleted: false,
  effectiveFrom: { $lte: end },
  $or: [{ effectiveTo: null }, { effectiveTo: { $gte: start } }],
});

/** Mirrors payrollController.calculateFor + payrollFields. */
const calculatePayroll = async ({ seeder, ctx, entry, month, year, attendance, leaves }) => {
  const { org } = ctx;
  const { start, end } = monthBounds(month, year);
  const userId = entry.user._id;

  let structure = entry.structure;
  let monthAttendance;
  let monthLeaves;

  if (seeder.dryRun) {
    monthAttendance = attendance
      .filter((a) => String(a.userId) === String(userId) && a.date >= start && a.date <= end)
      .map((a) => ({ date: a.date, status: a.status }));
    monthLeaves = leaves.filter(
      (l) => String(l.userId) === String(userId) && l.status === "approved" && l.startDate <= end && l.endDate >= start
    );
  } else {
    // The structure the app would use: the assigned one when it is effective.
    structure =
      (await SalaryStructure.findOne({
        instituteId: org._id,
        _id: entry.employee.salaryStructureId,
        ...effectiveIn(start, end),
      })) ?? structure;

    [monthAttendance, monthLeaves] = await Promise.all([
      Attendance.find({
        instituteId: org._id,
        userId,
        classId: null,
        isDeleted: { $ne: true },
        date: { $gte: start, $lte: end },
      })
        .select("date status")
        .lean(),
      Leave.find({
        instituteId: org._id,
        userId,
        status: "approved",
        isDeleted: { $ne: true },
        startDate: { $lte: end },
        endDate: { $gte: start },
      })
        .select("type duration startDate endDate days")
        .lean(),
    ]);
  }

  const breakdown = computeAttendanceBreakdown({
    month,
    year,
    attendance: monthAttendance,
    leaves: monthLeaves,
    ...PAYROLL_OPTIONS,
  });

  const salary = computeSalary({ structure, breakdown });

  return {
    month,
    year,
    periodStart: start,
    periodEnd: end,
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
      ...PAYROLL_OPTIONS,
      structure: { publicId: structure.publicId, name: structure.name },
      generatedAt: new Date(end.getTime() + DAY_MS),
    },
  };
};

const seedPayroll = async (seeder, ctx, employees, attendance, leaves) => {
  const { org, users } = ctx;
  const { month, year } = previousMonth();
  const { end } = monthBounds(month, year);
  const hrId = users[ROLES.HR]._id;
  const adminId = users[ROLES.ADMIN]._id;

  // Approved on the 1st working day after the month, paid on the next.
  const approvedAt = new Date(end.getTime() + DAY_MS + 5 * 3600000);
  const paidAt = new Date(end.getTime() + 2 * DAY_MS + 6 * 3600000);
  const payDate = paidAt.getTime() > Date.now() ? new Date() : paidAt;

  for (const entry of employees) {
    const role = entry.user.role;
    const status = PAYROLL_STATUS[role] ?? "draft";

    await seeder.ensure(
      Payroll,
      { instituteId: org._id, employeeId: entry.user._id, month, year },
      async () => {
        const fields = await calculatePayroll({ seeder, ctx, entry, month, year, attendance, leaves });
        const workflow = { status, processedBy: hrId };

        if (status === "approved" || status === "paid") {
          workflow.approvedBy = adminId;
          workflow.approvedAt = approvedAt.getTime() > Date.now() ? new Date() : approvedAt;
        }

        if (status === "paid") {
          workflow.payment = {
            method: "bank_transfer",
            referenceNo: `NEFT-${year}${String(month).padStart(2, "0")}-${String(entry.user.userCode ?? role).replace(/[^A-Z0-9]/gi, "")}`,
            paidAt: payDate,
            paidToAccount: "XXXX4821",
          };
          workflow.isFinalized = true;
          workflow.finalizedAt = payDate;
          workflow.finalizedBy = hrId;
        }

        return { ...fields, ...workflow };
      }
    );
  }
};

/* ------------------------------------------------------------------------ */
/* INVOICES + PAYMENTS                                                       */
/* ------------------------------------------------------------------------ */

// student = index into ctx.students; dates are day offsets from today.
// payments: [{ amount, daysAgo, method }]
const INVOICE_SPECS = [
  {
    number: "DEMO-INV-0001", student: 0, type: "tuition", issued: -75, due: -60,
    period: "Term 1 (Apr-Sep)",
    items: [
      { code: "TUITION", name: "Tuition fee - Term 1", unitPrice: 18000 },
      { code: "LAB", name: "Science lab fee", unitPrice: 1500 },
    ],
    payments: [{ amount: 19500, daysAgo: 65, method: "upi" }],
  },
  {
    number: "DEMO-INV-0002", student: 0, type: "transport", issued: -25, due: 5,
    period: "Transport - October",
    items: [{ code: "BUS", name: "School bus - Route 4", unitPrice: 2400 }],
    payments: [{ amount: 1200, daysAgo: 12, method: "cash" }],
  },
  {
    number: "DEMO-INV-0003", student: 0, type: "exam", issued: -3, due: 14,
    period: "Half-yearly exams",
    items: [
      { code: "EXAM", name: "Half-yearly examination fee", unitPrice: 1200 },
      { code: "ID", name: "Admit card and ID renewal", unitPrice: 150 },
    ],
    payments: [],
  },
  {
    number: "DEMO-INV-0004", student: 1, type: "tuition", issued: -75, due: -60,
    period: "Term 1 (Apr-Sep)",
    items: [
      { code: "TUITION", name: "Tuition fee - Term 1", unitPrice: 18000 },
      { code: "SPORTS", name: "Sports and activities fee", unitPrice: 2000 },
    ],
    payments: [
      { amount: 10000, daysAgo: 70, method: "bank_transfer" },
      { amount: 10000, daysAgo: 40, method: "bank_transfer" },
    ],
  },
  {
    number: "DEMO-INV-0005", student: 2, type: "tuition", issued: -40, due: -10,
    period: "Term 2 (Oct-Mar)",
    items: [{ code: "TUITION", name: "Tuition fee - Term 2", unitPrice: 18000 }],
    payments: [],
  },
  {
    number: "DEMO-INV-0006", student: 3, type: "tuition", issued: -20, due: 10,
    period: "Term 2 (Oct-Mar)",
    items: [
      { code: "TUITION", name: "Tuition fee - Term 2", unitPrice: 18000 },
      { code: "LAB", name: "Science lab fee", unitPrice: 1500 },
    ],
    payments: [{ amount: 9000, daysAgo: 8, method: "card" }],
  },
  {
    number: "DEMO-INV-0007", student: 4, type: "tuition", issued: -5, due: 20,
    period: "Term 2 (Oct-Mar)",
    items: [{ code: "TUITION", name: "Tuition fee - Term 2", unitPrice: 16500 }],
    payments: [],
  },
  {
    number: "DEMO-INV-0008", student: 5, type: "library", issued: -45, due: -15,
    period: "Annual library and books",
    items: [
      { code: "LIB", name: "Library membership (annual)", unitPrice: 800 },
      { code: "BOOKS", name: "Textbook set - Grade 9", unitPrice: 3200 },
      { code: "NOTEBOOK", name: "Notebooks", quantity: 12, unit: "pcs", unitPrice: 45 },
    ],
    payments: [],
  },
];

const round2 = (n) => Number(Number(n).toFixed(2));

const buildItems = (items) =>
  items.map((item) => {
    const quantity = item.quantity ?? 1;
    const gross = round2(quantity * item.unitPrice);

    return {
      itemType: "fee",
      code: item.code,
      name: item.name,
      quantity,
      unit: item.unit ?? "unit",
      unitPrice: item.unitPrice,
      grossAmount: gross,
      discount: { type: null, value: 0, amount: 0 },
      taxableAmount: gross,
      taxes: [],
      taxAmount: 0,
      netAmount: gross,
    };
  });

const invoiceFields = (spec, ctx, paymentIds) => {
  const { users } = ctx;
  const accountantId = users[ROLES.ACCOUNTANT]._id;
  const { user, profile } = ctx.students[spec.student];
  const cls = ctx.classes?.find((c) => (c.studentIds ?? []).map(String).includes(String(user._id)));

  const issueDate = dayOffset(spec.issued);
  const dueDate = dayOffset(spec.due);
  const items = buildItems(spec.items);
  const grandTotal = round2(items.reduce((sum, item) => sum + item.netAmount, 0));

  const payments = spec.payments.map((p, i) => ({
    ...p,
    paymentId: paymentIds[i],
    paidAt: at(dayOffset(-p.daysAgo), 6, 30 + i * 7),
  }));

  const amountPaid = round2(payments.reduce((sum, p) => sum + p.amount, 0));
  const amountDue = round2(Math.max(0, grandTotal - amountPaid));
  const overdue = amountDue > 0 && dueDate < dayOffset(0);

  // Same status rules as Invoice.addPayment / markOverdue.
  const paymentStatus = amountDue === 0 ? "paid" : amountPaid > 0 ? "partially_paid" : "unpaid";
  const status =
    paymentStatus === "paid" ? "paid" : overdue ? "overdue" : paymentStatus === "partially_paid" ? "partially_paid" : "issued";

  const history = [
    { action: "created", fromStatus: null, toStatus: "draft", performedBy: accountantId, performedAt: issueDate },
    { action: "issued", fromStatus: "draft", toStatus: "issued", performedBy: accountantId, performedAt: issueDate },
  ];

  let running = 0;
  let current = "issued";

  for (const p of payments) {
    running = round2(running + p.amount);
    const next = running >= grandTotal ? "paid" : "partially_paid";
    history.push({
      action: "payment_allocated",
      fromStatus: current,
      toStatus: next,
      performedBy: accountantId,
      performedAt: p.paidAt,
      metadata: { paymentId: p.paymentId, amount: p.amount },
    });
    current = next;
  }

  if (status === "overdue") {
    history.push({
      action: "marked_overdue",
      fromStatus: current,
      toStatus: "overdue",
      performedBy: null,
      performedAt: new Date(dueDate.getTime() + DAY_MS),
    });
  }

  return {
    invoicePrefix: "INV",
    fiscalYear: fiscalYearOf(issueDate),
    type: spec.type,
    status,
    paymentStatus,
    // Billing stores the student's USER id here (see billingController /
    // paymentService ownership filters), not the Student profile id.
    studentId: user._id,
    studentSnapshot: {
      studentCode: profile?.enrollmentNumber ?? user.userCode ?? null,
      name: user.name,
      className: cls?.name ?? null,
    },
    customerSnapshot: { name: user.name, email: user.email },
    billingPeriod: { label: spec.period },
    issueDate,
    dueDate,
    currency: "INR",
    items,
    subtotal: grandTotal,
    discountTotal: 0,
    taxableAmount: grandTotal,
    taxTotal: 0,
    grandTotal,
    amountPaid,
    amountDue,
    balanceAfterRefund: grandTotal,
    paymentAllocations: payments.map((p) => ({
      paymentId: p.paymentId,
      amount: p.amount,
      allocatedAt: p.paidAt,
      allocatedBy: accountantId,
    })),
    paymentCount: payments.length,
    lastPaymentAt: payments.length ? payments[payments.length - 1].paidAt : null,
    paymentTerms: "Payable by the due date. A late fee may apply after the due date.",
    notes: `${spec.period} fees for ${user.name}`,
    history,
    source: "manual",
    createdBy: accountantId,
    tags: ["demo"],
  };
};

const receiptNumber = async (seeder, org) => {
  const year = new Date().getFullYear();

  if (seeder.dryRun) return `RCPT-${year}-DRYRUN`;

  // Same counter paymentService.nextReceiptNumber uses, so receipts recorded
  // later in the app continue the sequence instead of colliding.
  const seq = await getNextSequence(`receipt:${org._id}`);
  return `RCPT-${year}-${String(seq).padStart(5, "0")}`;
};

const seedInvoices = async (seeder, ctx) => {
  const { org, users } = ctx;
  const accountantId = users[ROLES.ACCOUNTANT]._id;

  for (const spec of INVOICE_SPECS) {
    const student = ctx.students[spec.student];
    if (!student) continue;

    const newPaymentIds = spec.payments.map(() => new mongoose.Types.ObjectId());

    const invoice = await seeder.ensure(
      Invoice,
      { instituteId: org._id, invoiceNumber: spec.number },
      () => invoiceFields(spec, ctx, newPaymentIds)
    );

    for (const [i, p] of spec.payments.entries()) {
      const allocation = invoice.paymentAllocations?.[i];
      const paidAt = allocation?.allocatedAt ?? at(dayOffset(-p.daysAgo), 6, 30 + i * 7);

      await seeder.ensure(
        Payment,
        { instituteId: org._id, invoiceId: invoice._id, reference: `${p.method.toUpperCase()}/${spec.number}/${i + 1}` },
        async () => ({
          _id: allocation?.paymentId ?? newPaymentIds[i],
          payerId: student.user._id,
          receiptNumber: await receiptNumber(seeder, org),
          amount: p.amount,
          currency: "INR",
          method: p.method,
          provider: "manual",
          status: "succeeded",
          receivedBy: accountantId,
          paidAt,
        })
      );
    }
  }
};

/* ------------------------------------------------------------------------ */
/* ENTRY                                                                     */
/* ------------------------------------------------------------------------ */

const STAFF_ROLES = [
  ROLES.PRINCIPAL,
  ROLES.HR,
  ROLES.ACCOUNTANT,
  ROLES.COUNSELOR,
  ROLES.TEACHER,
  ROLES.SUPPORT,
  ROLES.EMPLOYEE,
];

export const seedHrFinance = async (seeder, ctx) => {
  const staffMap = new Map();

  for (const role of STAFF_ROLES) {
    if (ctx.users[role]) staffMap.set(String(ctx.users[role]._id), ctx.users[role]);
  }

  for (const teacher of ctx.teachers ?? []) {
    staffMap.set(String(teacher._id), teacher);
  }

  const staff = [...staffMap.values()];

  const leaves = await seedLeaves(seeder, ctx, staff);
  const attendance = await seedAttendance(seeder, ctx, staff, leaves);

  const structures = await seedSalaryStructures(seeder, ctx);
  const employees = await assignStructures(seeder, ctx, structures);
  await seedPayroll(seeder, ctx, employees, attendance, leaves);

  await seedInvoices(seeder, ctx);
};
