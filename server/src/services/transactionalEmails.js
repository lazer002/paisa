// server/src/services/transactionalEmails.js
//
// Event emails (invoice issued, leave decision, payslip ready, notification
// broadcast). Controllers call these through sendInBackground() after the
// response-critical work, so nothing here can fail a request.
//
// Recipients are filtered by their NotificationPreference: a user who
// switched notifications off, muted the type, or disabled the email channel
// gets no email. Users without a preference document get email (defaults).

import logger from "../config/logger.js";
import { User } from "../models/User.js";
import Student from "../models/student.js";
import { NotificationPreference } from "../models/NotificationPreference.js";
import { sendEmail } from "./emailService.js";
import {
  invoiceIssuedEmail,
  leaveDecisionEmail,
  notificationEmail,
  payslipReadyEmail,
} from "./emailTemplates.js";

const ACTIVE_STATUSES = ["active", "verified"];

const isReachable = (user) =>
  user &&
  user.email &&
  !user.isDeleted &&
  ACTIVE_STATUSES.includes(String(user.status || "active").toLowerCase());

/**
 * Users (of one institute) whose preferences allow an email of `type`.
 *
 * mode "transactional": global switch + type enabled/not muted + email
 *   channel enabled (quiet hours are ignored: these are one-off records).
 * mode "notification": the model's full shouldNotify() rule, incl. quiet
 *   hours and marketing opt-in.
 */
export const filterByEmailPreference = async (
  users,
  { instituteId, type, mode = "transactional" }
) => {
  if (users.length === 0) return [];

  const prefs = await NotificationPreference.find({
    instituteId: instituteId ?? null,
    userId: { $in: users.map((user) => user._id) },
    isDeleted: { $ne: true },
  });

  const byUser = new Map(prefs.map((pref) => [String(pref.userId), pref]));

  return users.filter((user) => {
    const pref = byUser.get(String(user._id));

    if (!pref) {
      return type !== "marketing";
    }

    if (mode === "notification") {
      return pref.shouldNotify({ type, channel: "email" });
    }

    return pref.isTypeEnabled(type) && pref.isChannelEnabled("email");
  });
};

const loadUsers = (ids) =>
  User.find({ _id: { $in: ids.filter(Boolean) } })
    .select("_id name email status isDeleted instituteId role")
    .lean();

/* ── Invoice issued ──────────────────────────── */

/**
 * Email the billed student / employee and, for a student, the linked
 * guardians (parents).
 */
export const sendInvoiceIssuedEmails = async (invoice) => {
  const billedIds = [invoice.studentId, invoice.employeeId].filter(Boolean);

  if (billedIds.length === 0) {
    logger.info("Invoice issued email skipped: no billed person", {
      invoiceId: String(invoice._id),
    });
    return 0;
  }

  const billed = await loadUsers(billedIds);
  const billedById = new Map(billed.map((user) => [String(user._id), user]));

  // Guardians of the billed student.
  let guardianIds = [];

  if (invoice.studentId) {
    const studentProfile = await Student.findOne({
      userId: invoice.studentId,
      instituteId: invoice.instituteId,
      isDeleted: { $ne: true },
    })
      .select("guardianUserIds")
      .lean();

    guardianIds = studentProfile?.guardianUserIds ?? [];
  }

  const guardians = guardianIds.length ? await loadUsers(guardianIds) : [];

  const candidates = [...billed, ...guardians].filter(
    (user, index, list) =>
      isReachable(user) &&
      String(user.instituteId) === String(invoice.instituteId) &&
      list.findIndex((other) => String(other._id) === String(user._id)) === index
  );

  const recipients = await filterByEmailPreference(candidates, {
    instituteId: invoice.instituteId,
    type: "invoice",
  });

  const billedName =
    billedById.get(String(invoice.studentId))?.name ||
    billedById.get(String(invoice.employeeId))?.name ||
    null;

  for (const user of recipients) {
    const message = invoiceIssuedEmail({
      name: user.name,
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.amountDue ?? invoice.grandTotal,
      currency: invoice.currency,
      dueDate: invoice.dueDate,
      billedName,
    });

    await sendEmail({
      to: user.email,
      ...message,
      tags: { category: "invoice_issued" },
    });
  }

  return recipients.length;
};

/* ── Leave approved / rejected ───────────────── */

export const sendLeaveDecisionEmail = async (leave) => {
  const [applicant] = await loadUsers([leave.userId?._id ?? leave.userId]);

  if (!isReachable(applicant)) return 0;

  const type =
    leave.status === "approved" ? "leave_approved" : "leave_rejected";

  const [recipient] = await filterByEmailPreference([applicant], {
    instituteId: leave.instituteId,
    type,
  });

  if (!recipient) return 0;

  const message = leaveDecisionEmail({
    name: recipient.name,
    status: leave.status,
    leaveType: leave.type,
    startDate: leave.startDate,
    endDate: leave.endDate,
    days: leave.days,
    reason:
      leave.status === "approved"
        ? leave.approverComment
        : leave.rejectionReason,
  });

  await sendEmail({
    to: recipient.email,
    ...message,
    tags: { category: type },
  });

  return 1;
};

/* ── Payslip ready (payroll paid) ────────────── */

export const sendPayslipReadyEmail = async (payroll) => {
  const [employee] = await loadUsers([payroll.employeeId]);

  if (!isReachable(employee)) return 0;

  const [recipient] = await filterByEmailPreference([employee], {
    instituteId: payroll.instituteId,
    type: "payroll",
  });

  if (!recipient) return 0;

  const message = payslipReadyEmail({
    name: recipient.name,
    month: payroll.month,
    year: payroll.year,
    netSalary: payroll.netSalary,
    currency: payroll.currency,
  });

  await sendEmail({
    to: recipient.email,
    ...message,
    tags: { category: "payslip_ready" },
  });

  return 1;
};

/* ── Notification broadcast ──────────────────── */

/**
 * Email a broadcast to the users whose preferences allow email for the
 * notification type (full shouldNotify rule).
 */
export const sendNotificationEmails = async ({
  instituteId,
  userIds,
  type,
  title,
  body,
  link,
  actorName,
}) => {
  const users = (await loadUsers(userIds)).filter(isReachable);

  const recipients = await filterByEmailPreference(users, {
    instituteId,
    type,
    mode: "notification",
  });

  for (const user of recipients) {
    const message = notificationEmail({
      name: user.name,
      title,
      body,
      link,
      actorName,
    });

    await sendEmail({
      to: user.email,
      ...message,
      tags: { category: `notification_${type}` },
    });
  }

  logger.info("Notification emails processed", {
    candidates: userIds.length,
    emailed: recipients.length,
    type,
  });

  return recipients.length;
};

export default {
  filterByEmailPreference,
  sendInvoiceIssuedEmails,
  sendLeaveDecisionEmail,
  sendPayslipReadyEmail,
  sendNotificationEmails,
};
