// server/src/controllers/reportController.js
//
// GET /stats/trends?from=YYYY-MM-DD&to=YYYY-MM-DD
//
// Time series and breakdowns for the Reports page. What is returned depends
// on the caller's role (each role sees the report for its own job) and every
// query is scoped to the caller's organization (super_admin: platform-wide).
// Ranges up to 62 days are bucketed by day, longer ones by month, in the
// organization time zone (DEFAULT_TIMEZONE).

import { User } from "../models/User.js";
import Organization from "../models/organization.js";
import { Attendance } from "../models/Attendance.js";
import { Assignment } from "../models/Assignment.js";
import { Submission } from "../models/Submission.js";
import { Leave } from "../models/Leave.js";
import { Payroll } from "../models/Payroll.js";
import { Class } from "../models/Class.js";
import { Department } from "../models/Department.js";
import { Invoice } from "../models/Payment.js";
import { Payment } from "../models/PaymentTransaction.js";
import { Lead } from "../models/Lead.js";
import { Deal } from "../models/Deal.js";
import { Ticket } from "../models/Ticket.js";

import env from "../config/env.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/errorHandler.js";
import { hasPermission } from "../utils/permissions.js";
import { sendSuccess } from "../utils/response.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const DAY_BUCKET_LIMIT_DAYS = 62;
const MAX_RANGE_DAYS = 731;
const DEFAULT_RANGE_DAYS = 30;

const STAFF_ROLES = ["admin", "principal", "teacher", "hr", "accountant", "counselor", "support", "employee"];
const PRESENT_STATUSES = ["present", "late", "half_day"];
const MARKED_STATUSES = ["present", "late", "half_day", "absent"];
const BILLED_STATUSES = ["issued", "partially_paid", "paid", "overdue"];
const COLLECTED_STATUSES = ["succeeded", "partially_refunded"];

/* =========================================================
   RANGE + BUCKETS
========================================================= */

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

/** "YYYY-MM-DD" of an instant in the time zone. */
const dayKeyIn = (date, timeZone) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

/** Milliseconds the time zone is ahead of UTC at that instant. */
const zoneOffsetMs = (instant, timeZone) => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    })
      .formatToParts(instant)
      .map((p) => [p.type, Number(p.value)])
  );

  const wall = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);

  return wall - Math.floor(instant / 1000) * 1000;
};

/** The instant local midnight of `key` begins in the time zone. */
const zonedMidnight = (key, timeZone) => {
  const guess = Date.parse(`${key}T00:00:00Z`);
  return new Date(guess - zoneOffsetMs(guess, timeZone));
};

/**
 * Parse ?from/?to (inclusive local days). Defaults to the last 30 days.
 * Exported for tests.
 */
export const parseRange = (query, timeZone = env.DEFAULT_TIMEZONE, now = new Date()) => {
  const today = dayKeyIn(now, timeZone);

  const to = query.to ?? today;
  const from =
    query.from ??
    new Date(Date.parse(`${to}T00:00:00Z`) - (DEFAULT_RANGE_DAYS - 1) * DAY_MS)
      .toISOString()
      .slice(0, 10);

  if (!DATE_KEY.test(from) || !DATE_KEY.test(to) || Number.isNaN(Date.parse(from)) || Number.isNaN(Date.parse(to))) {
    throw ApiError.badRequest("from and to must be dates (YYYY-MM-DD)", "INVALID_RANGE");
  }

  const days = (Date.parse(to) - Date.parse(from)) / DAY_MS + 1;

  if (days < 1) {
    throw ApiError.badRequest("from must be on or before to", "INVALID_RANGE");
  }

  if (days > MAX_RANGE_DAYS) {
    throw ApiError.badRequest("The range can be at most two years", "INVALID_RANGE");
  }

  const unit = days <= DAY_BUCKET_LIMIT_DAYS ? "day" : "month";

  const keys = [];
  for (let t = Date.parse(from); t <= Date.parse(to); t += DAY_MS) {
    const key = new Date(t).toISOString().slice(0, 10);
    const bucket = unit === "day" ? key : key.slice(0, 7);
    if (keys[keys.length - 1] !== bucket) keys.push(bucket);
  }

  const nextDay = new Date(Date.parse(to) + DAY_MS).toISOString().slice(0, 10);

  return {
    from,
    to,
    unit,
    timeZone,
    keys,
    start: zonedMidnight(from, timeZone),
    end: zonedMidnight(nextDay, timeZone),
  };
};

/* =========================================================
   AGGREGATION HELPERS
========================================================= */

const notDeleted = { isDeleted: { $ne: true } };

/** Sum of `value` (1 = count) per bucket of `dateField` inside the range. */
const bucketed = async (Model, match, dateField, range, value = 1) => {
  const rows = await Model.aggregate([
    {
      $match: {
        ...notDeleted,
        ...match,
        [dateField]: { $gte: range.start, $lt: range.end },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: range.unit === "day" ? "%Y-%m-%d" : "%Y-%m",
            date: `$${dateField}`,
            timezone: range.timeZone,
          },
        },
        value: { $sum: value },
      },
    },
  ]);

  const byKey = new Map(rows.map((r) => [r._id, r.value]));

  return range.keys.map((key) => round(byKey.get(key) ?? 0));
};

/** Sum of `value` grouped by `field`, largest first. */
const grouped = async (Model, match, field, value = 1, labels = {}) => {
  const rows = await Model.aggregate([
    { $match: { ...notDeleted, ...match } },
    { $group: { _id: `$${field}`, value: { $sum: value } } },
    { $sort: { value: -1 } },
  ]);

  return rows
    .filter((r) => r.value)
    .map((r) => ({
      label: labels[String(r._id)] ?? humanize(r._id),
      value: round(r.value),
    }));
};

const round = (n) => Math.round(n * 100) / 100;

const humanize = (value) =>
  value === null || value === undefined || value === ""
    ? "Not set"
    : String(value)
        .replace(/_/g, " ")
        .replace(/^\w/, (c) => c.toUpperCase());

const inRange = (field, range) => ({ [field]: { $gte: range.start, $lt: range.end } });

const series = (key, title, format, datasets) => ({ key, title, format, datasets });
const breakdown = (key, title, format, items) => ({ key, title, format, items });

/** Present ÷ marked per bucket, as a percentage; null where nothing was marked. */
const attendanceRate = async (match, range) => {
  const [present, marked] = await Promise.all([
    bucketed(Attendance, { ...match, status: { $in: PRESENT_STATUSES } }, "date", range),
    bucketed(Attendance, { ...match, status: { $in: MARKED_STATUSES } }, "date", range),
  ]);

  return marked.map((m, i) => (m ? round((present[i] / m) * 100) : null));
};

/** Invoiced (by issue date) vs collected (by payment date). */
const financeSeries = async (scope, range) => {
  const [invoiced, collected] = await Promise.all([
    bucketed(Invoice, { ...scope, status: { $in: BILLED_STATUSES } }, "issueDate", range, "$grandTotal"),
    bucketed(
      Payment,
      { ...scope, status: { $in: COLLECTED_STATUSES } },
      "paidAt",
      range,
      { $subtract: ["$amount", { $ifNull: ["$amountRefunded", 0] }] }
    ),
  ]);

  return series("billing", "Invoiced vs collected", "currency", [
    { label: "Invoiced", data: invoiced },
    { label: "Collected", data: collected },
  ]);
};

/* =========================================================
   PER-ROLE REPORTS
========================================================= */

const platformReport = async (range) => {
  const [orgs, users, orgTypes, roles] = await Promise.all([
    bucketed(Organization, {}, "createdAt", range),
    bucketed(User, {}, "createdAt", range),
    grouped(Organization, {}, "type"),
    grouped(User, { status: "active" }, "role"),
  ]);

  return {
    series: [
      series("growth", "New organizations and users", "count", [
        { label: "Organizations", data: orgs },
        { label: "Users", data: users },
      ]),
    ],
    breakdowns: [
      breakdown("orgTypes", "Organizations by type", "count", orgTypes),
      breakdown("roles", "Active users by role", "count", roles),
    ],
  };
};

const organizationReport = async (req, range) => {
  const scope = { instituteId: req.user.instituteId };

  const [students, staff, rate, leaves, roles] = await Promise.all([
    bucketed(User, { ...scope, role: "student" }, "createdAt", range),
    bucketed(User, { ...scope, role: { $in: STAFF_ROLES } }, "createdAt", range),
    attendanceRate(scope, range),
    grouped(Leave, { ...scope, ...inRange("createdAt", range) }, "status"),
    grouped(User, { ...scope, status: "active" }, "role"),
  ]);

  const result = {
    series: [
      series("people", "New students and staff", "count", [
        { label: "Students", data: students },
        { label: "Staff", data: staff },
      ]),
      series("attendance", "Attendance rate", "percent", [{ label: "Present", data: rate }]),
    ],
    breakdowns: [
      breakdown("roles", "Active people by role", "count", roles),
      breakdown("leaves", "Leave requests by status", "count", leaves),
    ],
  };

  // Billing figures only for roles that may read invoices.
  if (hasPermission(req.user, "invoice:read")) {
    result.series.push(await financeSeries(scope, range));
  }

  return result;
};

const teacherReport = async (req, range) => {
  const scope = { instituteId: req.user.instituteId };

  const [assignmentIds, classIds] = await Promise.all([
    Assignment.find({ ...scope, createdBy: req.user._id }).distinct("_id"),
    Class.find({ ...scope, teacherId: req.user._id }).distinct("_id"),
  ]);

  const mine = { ...scope, assignmentId: { $in: assignmentIds } };

  const [received, graded, statuses, rate, scores] = await Promise.all([
    bucketed(Submission, mine, "submittedAt", range),
    bucketed(Submission, mine, "gradedAt", range),
    grouped(Submission, { ...mine, ...inRange("submittedAt", range) }, "status"),
    attendanceRate({ ...scope, classId: { $in: classIds } }, range),
    Submission.aggregate([
      { $match: { ...notDeleted, ...mine, status: "graded", ...inRange("gradedAt", range) } },
      { $group: { _id: "$assignmentId", value: { $avg: "$percentage" } } },
      { $sort: { value: -1 } },
    ]),
  ]);

  const titles = new Map(
    (await Assignment.find({ _id: { $in: scores.map((s) => s._id) } }).select("title").lean())
      .map((a) => [String(a._id), a.title])
  );

  return {
    series: [
      series("grading", "Submissions received vs graded", "count", [
        { label: "Received", data: received },
        { label: "Graded", data: graded },
      ]),
      series("attendance", "Attendance rate in my classes", "percent", [{ label: "Present", data: rate }]),
    ],
    breakdowns: [
      breakdown("submissionStatus", "Submissions by status", "count", statuses),
      breakdown(
        "scores",
        "Average score by assignment",
        "percent",
        scores.map((s) => ({ label: titles.get(String(s._id)) ?? "Assignment", value: round(s.value ?? 0) }))
      ),
    ],
  };
};

const hrReport = async (req, range) => {
  const scope = { instituteId: req.user.instituteId };

  const departments = new Map(
    (await Department.find(scope).select("name").lean()).map((d) => [String(d._id), d.name])
  );

  const [requested, approved, rate, payroll, leaveTypes, headcount] = await Promise.all([
    bucketed(Leave, scope, "createdAt", range),
    bucketed(Leave, { ...scope, status: "approved" }, "approvedAt", range),
    attendanceRate({ ...scope, classId: null }, range),
    bucketed(Payroll, { ...scope, status: { $in: ["approved", "paid"] } }, "periodStart", range, "$netSalary"),
    grouped(Leave, { ...scope, status: "approved", ...inRange("startDate", range) }, "type", "$days"),
    grouped(
      User,
      { ...scope, status: "active", role: { $in: STAFF_ROLES } },
      "employment.department",
      1,
      Object.fromEntries(departments)
    ),
  ]);

  return {
    series: [
      series("leaves", "Leave requests vs approvals", "count", [
        { label: "Requested", data: requested },
        { label: "Approved", data: approved },
      ]),
      series("attendance", "Staff attendance rate", "percent", [{ label: "Present", data: rate }]),
      series("payroll", "Net payroll (approved + paid)", "currency", [{ label: "Net pay", data: payroll }]),
    ],
    breakdowns: [
      breakdown("leaveTypes", "Leave days taken by type", "count", leaveTypes),
      breakdown("headcount", "Active staff by department", "count", headcount),
    ],
  };
};

const accountantReport = async (req, range) => {
  const scope = { instituteId: req.user.instituteId };

  const [billing, statuses, methods, outstanding] = await Promise.all([
    financeSeries(scope, range),
    grouped(Invoice, { ...scope, ...inRange("issueDate", range) }, "status"),
    grouped(
      Payment,
      { ...scope, status: { $in: COLLECTED_STATUSES }, ...inRange("paidAt", range) },
      "method",
      "$amount"
    ),
    grouped(Invoice, { ...scope, amountDue: { $gt: 0 }, status: { $in: BILLED_STATUSES } }, "type", "$amountDue"),
  ]);

  return {
    series: [billing],
    breakdowns: [
      breakdown("invoiceStatus", "Invoices by status", "count", statuses),
      breakdown("methods", "Collections by payment method", "currency", methods),
      breakdown("outstanding", "Outstanding by invoice type", "currency", outstanding),
    ],
  };
};

const counselorReport = async (req, range) => {
  const scope = { instituteId: req.user.instituteId };

  const [created, converted, won, sources, statuses] = await Promise.all([
    bucketed(Lead, scope, "createdAt", range),
    bucketed(Lead, scope, "convertedAt", range),
    bucketed(Deal, { ...scope, status: "won" }, "wonAt", range, {
      $cond: [{ $gt: ["$netAmount", 0] }, "$netAmount", { $ifNull: ["$amount", 0] }],
    }),
    grouped(Lead, { ...scope, ...inRange("createdAt", range) }, "source"),
    grouped(Lead, scope, "status"),
  ]);

  return {
    series: [
      series("leads", "New vs converted leads", "count", [
        { label: "New", data: created },
        { label: "Converted", data: converted },
      ]),
      series("won", "Won deal value", "currency", [{ label: "Won", data: won }]),
    ],
    breakdowns: [
      breakdown("sources", "New leads by source", "count", sources),
      breakdown("leadStatus", "All leads by status", "count", statuses),
    ],
  };
};

const supportReport = async (req, range) => {
  const scope = { instituteId: req.user.instituteId };

  const [created, resolved, priorities, types, response] = await Promise.all([
    bucketed(Ticket, scope, "createdAt", range),
    bucketed(Ticket, scope, "resolution.resolvedAt", range),
    grouped(Ticket, { ...scope, ...inRange("createdAt", range) }, "priority"),
    grouped(Ticket, { ...scope, ...inRange("createdAt", range) }, "type"),
    bucketed(
      Ticket,
      { ...scope, firstResponseAt: { $ne: null } },
      "createdAt",
      range,
      { $divide: [{ $subtract: ["$firstResponseAt", "$createdAt"] }, 3600000] }
    ),
  ]);

  // Average first-response hours per bucket = total hours ÷ tickets answered.
  const answered = await bucketed(Ticket, { ...scope, firstResponseAt: { $ne: null } }, "createdAt", range);

  return {
    series: [
      series("tickets", "Tickets opened vs resolved", "count", [
        { label: "Opened", data: created },
        { label: "Resolved", data: resolved },
      ]),
      series("firstResponse", "Average first response (hours)", "hours", [
        { label: "First response", data: response.map((h, i) => (answered[i] ? round(h / answered[i]) : null)) },
      ]),
    ],
    breakdowns: [
      breakdown("priority", "New tickets by priority", "count", priorities),
      breakdown("type", "New tickets by type", "count", types),
    ],
  };
};

const REPORTS = {
  super_admin: (req, range) => platformReport(range),
  admin: organizationReport,
  principal: organizationReport,
  teacher: teacherReport,
  hr: hrReport,
  accountant: accountantReport,
  counselor: counselorReport,
  support: supportReport,
};

export const getReportTrends = asyncHandler(async (req, res) => {
  const build = REPORTS[req.user.role];

  if (!build) {
    throw ApiError.forbidden("There is no report for your role", "NO_REPORT_FOR_ROLE");
  }

  const range = parseRange(req.query);
  const report = await build(req, range);

  return sendSuccess(res, {
    message: "Report fetched",
    data: {
      range: {
        from: range.from,
        to: range.to,
        unit: range.unit,
        timeZone: range.timeZone,
        buckets: range.keys,
      },
      ...report,
    },
  });
});
