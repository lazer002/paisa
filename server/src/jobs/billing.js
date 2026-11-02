// server/src/jobs/billing.js
//
// Invoices past their due date become "overdue" (payer + guardians told
// once); subscriptions past their period are moved on (grace → free).

import { Invoice } from "../models/Payment.js";
import Student from "../models/student.js";
import Subscription from "../models/Subscription.js";
import { reconcileSubscription } from "../services/subscriptionService.js";
import { notifyOnce } from "../services/notify.js";

const BATCH = 500;

const money = (amount, currency = "INR") =>
  `${currency === "INR" ? "₹" : `${currency} `}${Number(amount || 0).toLocaleString("en-IN")}`;

/** Billed student / employee plus the student's guardians. */
const invoiceAudience = async (invoice) => {
  const ids = [invoice.studentId, invoice.employeeId, invoice.userId].filter(Boolean);

  if (invoice.studentId) {
    const profile = await Student.findOne({
      userId: invoice.studentId,
      instituteId: invoice.instituteId,
    })
      .select("guardianUserIds")
      .lean();

    ids.push(...(profile?.guardianUserIds ?? []));
  }

  return ids;
};

export const invoiceOverdue = {
  name: "invoice-overdue",
  description: "Marks unpaid invoices past their due date as overdue and tells the payer",
  everyMinutes: 60,

  async run(now = new Date()) {
    const invoices = await Invoice.find({
      status: { $in: ["issued", "pending", "partially_paid"] },
      amountDue: { $gt: 0 },
      dueDate: { $lt: now },
      isDeleted: { $ne: true },
    }).limit(BATCH);

    let markedOverdue = 0;
    let notified = 0;

    for (const invoice of invoices) {
      const fromStatus = invoice.status;

      invoice.history.push({
        action: "overdue",
        fromStatus,
        toStatus: "overdue",
        reason: "Past the due date (scheduled check)",
      });

      await invoice.markOverdue();

      if (invoice.status !== "overdue") continue;
      markedOverdue += 1;

      notified += await notifyOnce({
        instituteId: invoice.instituteId,
        userIds: await invoiceAudience(invoice),
        type: "invoice",
        title: `Invoice ${invoice.invoiceNumber ?? ""} is overdue`.replace("  ", " "),
        body: `${money(invoice.amountDue, invoice.currency)} was due on ${invoice.dueDate.toDateString()}.`,
        link: "/dashboard/invoices",
        reference: { kind: "invoice_overdue", id: invoice._id, publicId: invoice.publicId },
      });
    }

    return { checked: invoices.length, markedOverdue, notified };
  },
};

export const subscriptionExpiry = {
  name: "subscription-expiry",
  description: "Moves subscriptions past their period to past-due, then back to the free plan after the grace period",
  everyMinutes: 60,

  async run(now = new Date()) {
    const subscriptions = await Subscription.find({
      status: { $in: ["trialing", "active", "past_due"] },
      currentPeriodEnd: { $lt: now },
    }).limit(BATCH);

    const changed = {};

    for (const subscription of subscriptions) {
      const before = subscription.status;
      await reconcileSubscription(subscription, now);

      if (subscription.status !== before) {
        changed[subscription.status] = (changed[subscription.status] ?? 0) + 1;
      }
    }

    return { checked: subscriptions.length, ...changed };
  },
};
