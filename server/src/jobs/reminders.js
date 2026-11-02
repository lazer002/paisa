// server/src/jobs/reminders.js
//
// Reminders sent once per person and record (notifyOnce):
// - assignments due within 24 h, to enrolled students who have not submitted;
// - live sessions starting within 15 min, to the host and the class;
// - tickets past their resolution deadline (SLA), to the assignee or the
//   organization's support staff; the ticket's SLA is marked "breached".

import { Assignment } from "../models/Assignment.js";
import { Submission } from "../models/Submission.js";
import { Class } from "../models/Class.js";
import { LiveSession } from "../models/LiveSession.js";
import { Ticket } from "../models/Ticket.js";
import { User } from "../models/User.js";
import { notifyOnce } from "../services/notify.js";

const HOUR_MS = 60 * 60 * 1000;
const BATCH = 500;

export const assignmentDueReminders = {
  name: "assignment-due-reminders",
  description: "Reminds students about assignments due in the next 24 hours they have not submitted",
  everyMinutes: 60,

  async run(now = new Date()) {
    const assignments = await Assignment.find({
      status: "published",
      classId: { $ne: null },
      dueDate: { $gt: now, $lte: new Date(now.getTime() + 24 * HOUR_MS) },
      isDeleted: { $ne: true },
    })
      .select("_id publicId instituteId classId title dueDate")
      .limit(BATCH)
      .lean();

    let notified = 0;

    for (const assignment of assignments) {
      const [cls, submitted] = await Promise.all([
        Class.findById(assignment.classId).select("studentIds").lean(),
        Submission.find({ assignmentId: assignment._id }).distinct("studentId"),
      ]);

      const done = new Set(submitted.map(String));
      const pending = (cls?.studentIds ?? []).filter((id) => !done.has(String(id)));

      notified += await notifyOnce({
        instituteId: assignment.instituteId,
        userIds: pending,
        type: "assignment_due",
        title: `"${assignment.title}" is due soon`,
        body: `Due ${assignment.dueDate.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}. You have not submitted yet.`,
        link: "/dashboard/assignments",
        reference: { kind: "assignment_due", id: assignment._id, publicId: assignment.publicId },
      });
    }

    return { assignments: assignments.length, notified };
  },
};

export const liveSessionReminders = {
  name: "live-session-reminders",
  description: "Tells the host and class 15 minutes before a live session starts",
  everyMinutes: 5,

  async run(now = new Date()) {
    const sessions = await LiveSession.find({
      status: "scheduled",
      scheduledStartAt: { $gt: now, $lte: new Date(now.getTime() + 15 * 60 * 1000) },
      isDeleted: { $ne: true },
    })
      .select("_id publicId instituteId classId hostUserId teacherId title scheduledStartAt participants.userId")
      .limit(BATCH)
      .lean();

    let notified = 0;

    for (const session of sessions) {
      const cls = session.classId
        ? await Class.findById(session.classId).select("studentIds teacherId").lean()
        : null;

      const audience = [
        session.hostUserId,
        session.teacherId,
        cls?.teacherId,
        ...(cls?.studentIds ?? []),
        ...(session.participants ?? []).map((p) => p.userId),
      ].filter(Boolean);

      const minutes = Math.max(1, Math.round((new Date(session.scheduledStartAt) - now) / 60000));

      notified += await notifyOnce({
        instituteId: session.instituteId,
        userIds: audience,
        type: "live_session_starting",
        title: `"${session.title}" starts in ${minutes} min`,
        body: "Open Live Sessions to join.",
        link: "/dashboard/live-sessions",
        reference: { kind: "live_session_starting", id: session._id, publicId: session.publicId },
      });
    }

    return { sessions: sessions.length, notified };
  },
};

export const ticketSlaBreaches = {
  name: "ticket-sla",
  description: "Marks open tickets past their resolution deadline as breached and alerts support",
  everyMinutes: 15,

  async run(now = new Date()) {
    const tickets = await Ticket.find({
      status: { $nin: ["resolved", "closed", "cancelled"] },
      "sla.resolutionDueAt": { $lt: now },
      "sla.status": { $ne: "breached" },
      isDeleted: { $ne: true },
    })
      .select("_id publicId instituteId ticketCode subject sla assignment")
      .limit(BATCH);

    let breached = 0;
    let notified = 0;
    const supportStaff = new Map();

    for (const ticket of tickets) {
      await Ticket.updateOne({ _id: ticket._id }, { $set: { "sla.status": "breached" } });
      breached += 1;

      let audience = ticket.assignment?.assignedTo ? [ticket.assignment.assignedTo] : null;

      if (!audience) {
        const key = String(ticket.instituteId);
        if (!supportStaff.has(key)) {
          supportStaff.set(
            key,
            await User.find({
              instituteId: ticket.instituteId,
              role: { $in: ["support", "admin"] },
              status: "active",
            }).distinct("_id")
          );
        }
        audience = supportStaff.get(key);
      }

      notified += await notifyOnce({
        instituteId: ticket.instituteId,
        userIds: audience,
        type: "ticket_update",
        title: `Ticket ${ticket.ticketCode ?? ""} missed its deadline`.replace("  ", " "),
        body: ticket.subject,
        link: "/dashboard/tickets",
        reference: { kind: "ticket_sla_breached", id: ticket._id, publicId: ticket.publicId },
      });
    }

    return { breached, notified };
  },
};
