// server/src/utils/seed/crmComms.js
//
// CRM (leads, deals, contacts, customers, tasks, activities, notes), support
// tickets with replies, calendar events and announcements for the demo
// school (see demoData.js for ctx). Field shapes follow what the controllers
// write: crmController, contactController, customerController,
// crmActivityController, ticketController, eventController and
// announcementController.

import { ROLES } from "../../config/constants.js";

import { Lead } from "../../models/Lead.js";
import { Deal } from "../../models/Deal.js";
import { Contact } from "../../models/Contact.js";
import { Customer } from "../../models/Customer.js";
import { CRMTask } from "../../models/CRMTask.js";
import { CRMActivity } from "../../models/CRMActivity.js";
import { Ticket } from "../../models/Ticket.js";
import { TicketMessage } from "../../models/TicketMessage.js";
import { CalendarEvent } from "../../models/CalendarEvent.js";
import { Announcement } from "../../models/Announcement.js";

import { DAY_MS, dayOffset } from "./helpers.js";

const HOUR_MS = 60 * 60 * 1000;

// Same table as ticketController (resolution hours; first response = 1/4).
const TICKET_SLA_HOURS = { critical: 2, urgent: 4, high: 8, normal: 24, low: 72 };

const at = (days, hour = 10) => new Date(dayOffset(days).getTime() + hour * HOUR_MS);

/* ------------------------------------------------------------------------ */
/* CRM                                                                       */
/* ------------------------------------------------------------------------ */

const LEADS = [
  { first: "Ananya", last: "Kulkarni", email: "ananya.kulkarni@example.com", phone: "+919845000101", source: "walk_in", status: "new", priority: "high", type: "parent", budget: 85000, notes: "Wants Grade 6 admission for her daughter next term." },
  { first: "Vikram", last: "Menon", email: "vikram.menon@example.com", phone: "+919845000102", source: "website", status: "contacted", priority: "normal", type: "parent", budget: 90000, notes: "Asked about the transport route and fee instalments." },
  { first: "Farah", last: "Khan", email: "farah.khan@example.com", phone: "+919845000103", source: "referral", status: "qualified", priority: "high", type: "parent", budget: 120000, notes: "Referred by the Sharma family. Two children, Grades 4 and 8." },
  { first: "Arjun", last: "Reddy", email: "arjun.reddy@example.com", phone: "+919845000104", source: "facebook", status: "nurturing", priority: "low", type: "student", budget: 60000, notes: "Interested in the weekend coaching batch." },
  { first: "Priya", last: "Nair", email: "priya.nair@example.com", phone: "+919845000105", source: "event", status: "contacted", priority: "normal", type: "parent", budget: 75000, notes: "Met at the open day; wants a campus tour." },
  { company: "Brightpath Learning Pvt Ltd", email: "partnerships@brightpath.example.com", phone: "+918040000106", source: "partner", status: "qualified", priority: "urgent", type: "business", budget: 250000, notes: "Wants to run a robotics programme on campus." },
];

const DEALS = [
  { title: "Khan family — 2 admissions (2026-27)", value: 240000, stage: "proposal", status: "open", close: 20 },
  { title: "Brightpath robotics programme", value: 250000, stage: "negotiation", status: "open", close: 35 },
  { title: "Kulkarni — Grade 6 admission", value: 85000, stage: "qualification", status: "open", close: 45 },
  { title: "Menon — transport + tuition package", value: 98000, stage: "discovery", status: "open", close: 30 },
];

const CONTACTS = [
  { first: "Sunita", last: "Sharma", email: "sunita.sharma@example.com", phone: "+919845000201", type: "parent", source: "student", designation: null },
  { first: "Rajesh", last: "Patel", email: "rajesh.patel@example.com", phone: "+919845000202", type: "parent", source: "student", designation: null },
  { first: "Kiran", last: "Desai", email: "kiran.desai@brightpath.example.com", phone: "+919845000203", type: "partner", source: "lead", designation: "Programme Manager", company: "Brightpath Learning Pvt Ltd" },
  { first: "Manoj", last: "Pillai", email: "manoj@citystationers.example.com", phone: "+919845000204", type: "vendor", source: "manual", designation: "Owner", company: "City Stationers" },
];

const CUSTOMERS = [
  { first: "Sunita", last: "Sharma", email: "sunita.sharma@example.com", phone: "+919845000201", type: "parent", status: "active", notes: "Two children enrolled (Aarav, Kabir)." },
  { first: "Rajesh", last: "Patel", email: "rajesh.patel@example.com", phone: "+919845000202", type: "parent", status: "active", notes: "Two children enrolled (Diya, Rohan)." },
  { display: "Brightpath Learning Pvt Ltd", email: "billing@brightpath.example.com", phone: "+918040000106", type: "business", status: "prospect", notes: "Partner programme under negotiation." },
];

const seedCrm = async (seeder, ctx) => {
  const { org } = ctx;
  const counselor = ctx.users[ROLES.COUNSELOR];
  const admin = ctx.users[ROLES.ADMIN];
  const leads = [];

  for (const spec of LEADS) {
    leads.push(
      await seeder.ensure(
        Lead,
        { instituteId: org._id, email: spec.email },
        {
          type: spec.type,
          firstName: spec.first ?? null,
          lastName: spec.last ?? null,
          fullName: spec.company ?? `${spec.first} ${spec.last}`,
          companyName: spec.company ?? null,
          phone: spec.phone,
          source: spec.source,
          status: spec.status,
          priority: spec.priority,
          notes: spec.notes,
          qualification: { budget: { max: spec.budget } },
          createdBy: counselor._id,
        }
      )
    );
  }

  // Deals are not linked to leads: GET /deals populates leadId with a
  // partial select and the Lead `isConverted` virtual then throws (500).
  const deals = [];

  for (const spec of DEALS) {
    deals.push(
      await seeder.ensure(
        Deal,
        { instituteId: org._id, title: spec.title },
        {
          value: spec.value,
          currency: "INR",
          stage: spec.stage,
          status: spec.status,
          expectedCloseDate: dayOffset(spec.close),
          createdBy: counselor._id,
        }
      )
    );
  }

  for (const spec of CONTACTS) {
    await seeder.ensure(
      Contact,
      { instituteId: org._id, email: spec.email },
      {
        type: spec.type,
        status: "active",
        source: spec.source,
        firstName: spec.first,
        lastName: spec.last,
        fullName: `${spec.first} ${spec.last}`,
        companyName: spec.company ?? null,
        designation: spec.designation,
        phone: spec.phone,
        preferredContactMethod: "phone",
        createdBy: counselor._id,
      }
    );
  }

  for (const spec of CUSTOMERS) {
    const displayName = spec.display ?? `${spec.first} ${spec.last}`;

    await seeder.ensure(
      Customer,
      { instituteId: org._id, displayName },
      {
        type: spec.type,
        status: spec.status,
        firstName: spec.first ?? null,
        lastName: spec.last ?? null,
        notes: spec.notes,
        communication: { primaryEmail: spec.email, primaryPhone: spec.phone },
        createdBy: admin._id,
      }
    );
  }

  const [kulkarni, menon, khan, reddy, nair, brightpath] = leads;

  const TASKS = [
    { title: "Call back Ananya Kulkarni about Grade 6 seats", type: "call", priority: "high", status: "pending", due: 1, lead: kulkarni },
    { title: "Send fee instalment plan to Vikram Menon", type: "email", priority: "normal", status: "in_progress", due: 2, lead: menon },
    { title: "Campus tour for Priya Nair", type: "meeting", priority: "normal", status: "pending", due: 4, lead: nair },
    { title: "Prepare robotics programme proposal", type: "proposal", priority: "urgent", status: "pending", due: -1, deal: deals[1] },
    { title: "Share admission forms with the Khan family", type: "document", priority: "high", status: "completed", due: -3, deal: deals[0] },
    { title: "Follow up with Arjun Reddy on weekend batch", type: "follow_up", priority: "low", status: "pending", due: 7, lead: reddy },
  ];

  for (const spec of TASKS) {
    const completed = spec.status === "completed";

    await seeder.ensure(
      CRMTask,
      { instituteId: org._id, title: spec.title },
      {
        type: spec.type,
        status: spec.status,
        priority: spec.priority,
        dueAt: at(spec.due, 11),
        leadId: spec.lead?._id ?? null,
        dealId: spec.deal?._id ?? null,
        ownerId: counselor._id,
        assignedBy: counselor._id,
        createdBy: counselor._id,
        ...(completed
          ? {
              completedAt: at(spec.due, 15),
              completedBy: counselor._id,
              completion: { completedBy: counselor._id, notes: "Forms emailed and received back." },
            }
          : {}),
      }
    );
  }

  const ACTIVITIES = [
    { subject: "Intro call with Vikram Menon", type: "call", channel: "phone", status: "completed", outcome: "interested", day: -4, minutes: 12, lead: menon },
    { subject: "Open-day conversation with Priya Nair", type: "meeting", channel: "in_person", status: "completed", outcome: "callback_requested", day: -6, minutes: 20, lead: nair },
    { subject: "Sent prospectus to Farah Khan", type: "email", channel: "email", status: "completed", outcome: "proposal_sent", day: -2, minutes: 5, lead: khan },
    { subject: "Robotics demo with Brightpath", type: "demo", channel: "in_person", status: "planned", outcome: null, day: 3, minutes: 60, lead: brightpath },
    { subject: "Parent meeting — Khan family", type: "meeting", channel: "in_person", status: "planned", outcome: null, day: 2, minutes: 30, deal: deals[0] },
  ];

  for (const spec of ACTIVITIES) {
    const completed = spec.status === "completed";

    await seeder.ensure(
      CRMActivity,
      { instituteId: org._id, subject: spec.subject },
      {
        type: spec.type,
        status: spec.status,
        priority: "normal",
        channel: spec.channel,
        outcome: spec.outcome,
        scheduledAt: at(spec.day, 11),
        completedAt: completed ? at(spec.day, 12) : null,
        durationMinutes: spec.minutes,
        leadId: spec.lead?._id ?? null,
        dealId: spec.deal?._id ?? null,
        ownerId: counselor._id,
        createdBy: counselor._id,
        completedBy: completed ? counselor._id : null,
      }
    );
  }

  // Notes are CRMActivity rows with type "note" (see crmActivityController).
  const NOTES = [
    { subject: "Prefers WhatsApp after 6 pm", description: "Prefers WhatsApp after 6 pm; works night shifts on weekdays.", lead: menon },
    { subject: "Sibling discount discussed", description: "Sibling discount discussed: 10% on the second child's tuition if both join this term.", lead: khan },
  ];

  for (const spec of NOTES) {
    await seeder.ensure(
      CRMActivity,
      { instituteId: org._id, subject: spec.subject },
      {
        type: "note",
        status: "completed",
        channel: "system",
        description: spec.description,
        leadId: spec.lead._id,
        ownerId: counselor._id,
        createdBy: counselor._id,
        completedBy: counselor._id,
      }
    );
  }
};

/* ------------------------------------------------------------------------ */
/* Support tickets                                                           */
/* ------------------------------------------------------------------------ */

const seedTickets = async (seeder, ctx) => {
  const { org, users } = ctx;
  const support = users[ROLES.SUPPORT];

  const TICKETS = [
    {
      subject: "Fee receipt not received for October",
      description: "I paid the October tuition online but have not received a receipt.",
      type: "billing", priority: "high", status: "in_progress", requester: users[ROLES.PARENT], day: -3,
      replies: [
        { author: support, body: "Thanks for reporting this. We can see the payment and are regenerating the receipt." },
        { author: users[ROLES.PARENT], body: "Thank you, please email it to me as well." },
      ],
    },
    {
      subject: "Cannot open the Science worksheet link",
      description: "The worksheet link in Class 10A Science says access denied.",
      type: "technical", priority: "normal", status: "resolved", requester: users[ROLES.STUDENT], day: -6,
      replies: [
        { author: support, body: "The file permissions were fixed. Please try the link again." },
        { author: users[ROLES.STUDENT], body: "It works now, thanks!" },
      ],
    },
    {
      subject: "Payslip shows wrong bank account",
      description: "My September payslip lists my old bank account number.",
      type: "payroll", priority: "normal", status: "open", requester: users[ROLES.EMPLOYEE], day: -1,
      replies: [],
    },
    {
      subject: "Projector in Room 204 not working",
      description: "The projector turns on but shows no input from the laptop.",
      type: "support", priority: "urgent", status: "waiting_for_user", requester: users[ROLES.TEACHER], day: -2,
      replies: [
        { author: support, body: "A technician checked the cable. Could you confirm which laptop port you are using?" },
      ],
    },
  ];

  for (const spec of TICKETS) {
    const createdAt = at(spec.day, 9);
    const hours = TICKET_SLA_HOURS[spec.priority];
    const staffReplies = spec.replies.filter((r) => r.author._id.equals(support._id));
    const firstResponseAt = staffReplies.length ? new Date(createdAt.getTime() + 2 * HOUR_MS) : null;
    const resolved = spec.status === "resolved";
    const resolvedAt = resolved ? new Date(createdAt.getTime() + 20 * HOUR_MS) : null;
    const responseDueAt = new Date(createdAt.getTime() + (hours * HOUR_MS) / 4);
    const resolutionDueAt = new Date(createdAt.getTime() + hours * HOUR_MS);

    const ticket = await seeder.ensure(
      Ticket,
      { instituteId: org._id, subject: spec.subject },
      {
        description: spec.description,
        type: spec.type,
        priority: spec.priority,
        status: spec.status,
        source: "web",
        requesterId: spec.requester._id,
        createdAt,
        assignment: { assignedTo: support._id, assignedBy: users[ROLES.ADMIN]._id, assignedAt: createdAt },
        firstResponseAt,
        lastResponseAt: spec.replies.length ? new Date(createdAt.getTime() + 3 * HOUR_MS) : null,
        responseCount: spec.replies.length,
        agentResponseCount: staffReplies.length,
        customerResponseCount: spec.replies.length - staffReplies.length,
        ...(resolved ? { resolution: { resolvedAt, resolvedBy: support._id } } : {}),
        sla: {
          policyCode: `priority_${spec.priority}`,
          responseTargetMinutes: hours * 15,
          resolutionTargetMinutes: hours * 60,
          responseDueAt,
          resolutionDueAt,
          firstRespondedAt: firstResponseAt,
          responseBreached: Boolean(firstResponseAt && firstResponseAt > responseDueAt),
          resolvedAt,
          resolutionBreached: Boolean(resolvedAt && resolvedAt > resolutionDueAt),
          status: resolved ? "completed" : "active",
          lastCalculatedAt: createdAt,
        },
      }
    );

    for (const [index, reply] of spec.replies.entries()) {
      await seeder.ensure(
        TicketMessage,
        { ticketId: ticket._id, body: reply.body },
        {
          instituteId: org._id,
          authorId: reply.author._id,
          type: "text",
          source: "web",
          createdAt: new Date(createdAt.getTime() + (index + 2) * HOUR_MS),
        }
      );
    }
  }

  // One internal note staff can see on the projector ticket.
  const projector = seeder.dryRun
    ? null
    : await Ticket.findOne({ instituteId: org._id, subject: "Projector in Room 204 not working" }).select("_id");

  if (projector || seeder.dryRun) {
    await seeder.ensure(
      TicketMessage,
      { ticketId: projector?._id ?? org._id, body: "Spare HDMI adapter is in the AV cupboard if the port is the issue." },
      {
        instituteId: org._id,
        authorId: support._id,
        type: "internal_note",
        internal: { visibleToCustomer: false, visibleToAgents: true },
        source: "web",
      }
    );
  }
};

/* ------------------------------------------------------------------------ */
/* Calendar events + announcements                                           */
/* ------------------------------------------------------------------------ */

const EVENTS = [
  { title: "Parent-Teacher Meeting", type: "meeting", category: "academic", day: 5, hours: [10, 13], location: "Main Hall", roles: ["parent", "teacher"], description: "Term 1 progress review with class teachers." },
  { title: "Annual Sports Day", type: "function", category: "sports", day: 12, hours: [8, 16], location: "School Ground", roles: [], description: "Track events, relays and the house march past." },
  { title: "Half-yearly Exams Begin", type: "exam", category: "academic", day: 20, hours: [9, 12], location: "Exam Halls", roles: ["student", "teacher", "parent"], description: "Mathematics paper on day one. Report by 8:45 am." },
  { title: "Diwali Holiday", type: "holiday", category: "holiday", day: 9, hours: [0, 23], location: null, roles: [], description: "School closed." },
  { title: "Staff Training: Digital Classrooms", type: "training", category: "staff", day: -3, hours: [14, 17], location: "Computer Lab", roles: ["teacher", "principal"], description: "Hands-on session on the new LMS features.", status: "completed" },
];

const ANNOUNCEMENTS = [
  { title: "Half-yearly exam timetable published", content: "The half-yearly exam timetable is now available on the notice board and in the Events calendar. Exams begin in three weeks.", roles: ["all"], priority: "high", category: "exam", by: ROLES.PRINCIPAL },
  { title: "Fee due date reminder", content: "Term 2 fees are due by the 10th of next month. Pay online from the Invoices page to receive an instant receipt.", roles: ["student"], priority: "medium", category: "fee", by: ROLES.ADMIN },
  { title: "Sports Day volunteers needed", content: "Teachers who can help with the track events on Sports Day, please sign up with the PE department by Friday.", roles: ["teacher"], priority: "low", category: "event", by: ROLES.ADMIN },
  { title: "Updated leave policy", content: "Casual leave is now 12 days per year and unused earned leave carries over (up to 10 days). See the Leaves page for your balance.", roles: ["employee", "hr", "teacher"], priority: "medium", category: "policy", by: ROLES.HR },
];

const seedComms = async (seeder, ctx) => {
  const { org, users } = ctx;

  for (const spec of EVENTS) {
    const startsAt = at(spec.day, spec.hours[0]);

    await seeder.ensure(
      CalendarEvent,
      { instituteId: org._id, title: spec.title },
      {
        description: spec.description,
        type: spec.type,
        category: spec.category,
        startsAt,
        endsAt: new Date(startsAt.getTime() + (spec.hours[1] - spec.hours[0]) * HOUR_MS),
        location: spec.location,
        targetRoles: spec.roles,
        status: spec.status ?? "scheduled",
        createdBy: users[ROLES.ADMIN]._id,
      }
    );
  }

  for (const [index, spec] of ANNOUNCEMENTS.entries()) {
    await seeder.ensure(
      Announcement,
      { instituteId: org._id, title: spec.title },
      {
        content: spec.content,
        targetRoles: spec.roles,
        priority: spec.priority,
        category: spec.category,
        status: "published",
        publishedAt: new Date(Date.now() - (index + 1) * DAY_MS),
        expiresAt: dayOffset(30),
        createdBy: users[spec.by]._id,
      }
    );
  }
};

export const seedCrmComms = async (seeder, ctx) => {
  await seedCrm(seeder, ctx);
  await seedTickets(seeder, ctx);
  await seedComms(seeder, ctx);
};
