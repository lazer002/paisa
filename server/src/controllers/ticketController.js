// server/src/controllers/ticketController.js
//
// Support module: Tickets + threaded TicketMessages.
// Requesters open tickets; staff reply, assign, and
// resolve. SLA fields stay model-driven.

import { Ticket } from "../models/Ticket.js";
import { TicketMessage } from "../models/TicketMessage.js";
import { TicketTemplate } from "../models/TicketTemplate.js";
import { User } from "../models/User.js";
import { resolveRef } from "../utils/resolveRef.js";
import { escapeRegex } from "../utils/crudHelpers.js";

import { asyncHandler } from "../utils/errorHandler.js";

import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendForbidden,
  sendError,
} from "../utils/response.js";

import ApiError from "../utils/ApiError.js";

/* =========================================================
   SLA
   Resolution targets per priority, in hours. The first-response
   target is a quarter of it (urgent: respond in 1h, resolve in 4h).
========================================================= */

export const TICKET_SLA_HOURS = Object.freeze({
  critical: 2,
  urgent: 4,
  high: 8,
  normal: 24,
  low: 72,
});

const HOUR_MS = 60 * 60 * 1000;

// Statuses where the SLA clock no longer runs.
const SLA_STOPPED_STATUSES = ["resolved", "closed", "cancelled"];

const slaHoursFor = (priority) =>
  TICKET_SLA_HOURS[priority] ?? TICKET_SLA_HOURS.normal;

// (Re)computes due dates from the ticket's creation time and priority.
const applySla = (ticket) => {
  const hours = slaHoursFor(ticket.priority);
  const start = new Date(ticket.createdAt ?? Date.now()).getTime();

  ticket.sla.policyCode = `priority_${ticket.priority}`;
  ticket.sla.responseTargetMinutes = hours * 15;
  ticket.sla.resolutionTargetMinutes = hours * 60;
  ticket.sla.responseDueAt = new Date(start + (hours * HOUR_MS) / 4);
  ticket.sla.resolutionDueAt = new Date(start + hours * HOUR_MS);
  ticket.sla.lastCalculatedAt = new Date();

  if (ticket.sla.status === "not_started") {
    ticket.sla.status = "active";
  }
};

// Read-side view: works for older tickets saved before SLA was set.
const slaState = (json) => {
  const hours = slaHoursFor(json.priority);
  const created = new Date(json.createdAt ?? Date.now()).getTime();

  const dueAt = json.sla?.resolutionDueAt
    ? new Date(json.sla.resolutionDueAt)
    : new Date(created + hours * HOUR_MS);

  const responseDueAt = json.sla?.responseDueAt
    ? new Date(json.sla.responseDueAt)
    : new Date(created + (hours * HOUR_MS) / 4);

  const stopped = SLA_STOPPED_STATUSES.includes(json.status);
  const now = Date.now();
  const firstResponseAt = json.firstResponseAt ?? null;

  return {
    hours,
    dueAt,
    responseDueAt,
    firstResponseAt,
    overdue: !stopped && now > dueAt.getTime(),
    responseOverdue:
      !stopped && !firstResponseAt && now > responseDueAt.getTime(),
    stopped,
  };
};

// The assignee lives in `assignment.assignedTo`; clients read it as `assigneeId`.
const withAssignee = (ticket) => {
  const json = ticket.toJSON();
  return {
    ...json,
    assigneeId: json.assignment?.assignedTo ?? null,
    slaState: slaState(json),
  };
};

const scoped = (req, extra = {}) => {
  if (req.user.role === "super_admin") {
    return { ...extra };
  }

  return {
    instituteId: req.user.instituteId,
    ...extra,
  };
};

const STAFF_ROLES = [
  "super_admin",
  "admin",
  "hr",
  "support",
];

const forbidden = () =>
  ApiError.forbidden("Access denied", { code: "ACCESS_DENIED" });

// Staff of the ticket's own organization who can take it.
// super_admin has no instituteId, so it is never an assignee.
const ASSIGNABLE_ROLES = STAFF_ROLES.filter(
  (role) => role !== "super_admin"
);

/* =========================================================
   TICKETS
========================================================= */

export const createTicket = asyncHandler(
  async (req, res) => {
    const { subject, description, type, priority } =
      req.body;

    if (!subject) {
      return sendError(res, 400, "Subject is required");
    }

    const ticket = new Ticket({
      instituteId: req.user.instituteId,

      subject,

      description: description || null,

      type: type || "support",

      priority: priority || "normal",

      status: "open",

      source: "web",

      requesterId: req.user._id,
    });

    ticket.createdAt = new Date();
    applySla(ticket);

    await ticket.save();

    return sendCreated(res, {
      message: "Ticket created",
      data: withAssignee(ticket),
    });
  }
);

export const getTickets = asyncHandler(async (req, res) => {
  const { status, priority, type, search, overdue } = req.query;

  const query = scoped(req);

  // ?overdue=true → past the resolution due time and still open.
  // Tickets saved before SLA existed fall back to createdAt + target.
  if (overdue === "true" || overdue === "1") {
    const now = Date.now();

    query.$and = [
      { status: { $nin: SLA_STOPPED_STATUSES } },
      {
        $or: [
          { "sla.resolutionDueAt": { $lt: new Date(now) } },
          ...Object.entries(TICKET_SLA_HOURS).map(([p, hours]) => ({
            "sla.resolutionDueAt": null,
            priority: p,
            createdAt: { $lt: new Date(now - hours * HOUR_MS) },
          })),
        ],
      },
    ];
  }

  // Non-staff see only their own tickets.
  if (!STAFF_ROLES.includes(req.user.role)) {
    query.requesterId = req.user._id;
  }

  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (type) query.type = type;

  if (search) {
    query.subject = {
      $regex: escapeRegex(search),
      $options: "i",
    };
  }

  const tickets = await Ticket.find(query)
    .populate("requesterId", "name email userCode")
    .populate("assignment.assignedTo", "publicId name email")
    .sort({ createdAt: -1 });

  return sendSuccess(res, {
    message: "Tickets fetched",
    data: tickets.map(withAssignee),
  });
});

export const getTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findOne({
    publicId: req.params.publicId,
    ...scoped(req),
  })
    .populate("requesterId", "name email userCode")
    .populate("assignment.assignedTo", "publicId name email");

  if (!ticket) {
    return sendNotFound(res, "Ticket not found");
  }

  const isStaff = STAFF_ROLES.includes(req.user.role);

  // Requesters only see their own tickets, and never staff notes.
  if (
    !isStaff &&
    String(ticket.requesterId?._id ?? ticket.requesterId) !==
      String(req.user._id)
  ) {
    return sendNotFound(res, "Ticket not found");
  }

  const messages = await TicketMessage.find({
    ticketId: ticket._id,
    ...(isStaff ? {} : { type: { $ne: "internal_note" } }),
  })
    .populate("authorId", "name role")
    .sort({ createdAt: 1 });

  return sendSuccess(res, {
    message: "Ticket fetched",
    data: { ticket: withAssignee(ticket), messages },
  });
});

export const updateTicket = asyncHandler(async (req, res) => {
  const { status, priority, assigneeId } = req.body;

  const ticket = await Ticket.findOne({
    publicId: req.params.publicId,
  });

  if (!ticket) {
    return sendNotFound(res, "Ticket not found");
  }

  if (
    req.user.role !== "super_admin" &&
    String(ticket.instituteId) !==
      String(req.user.instituteId)
  ) {
    return sendForbidden(res, "Access denied");
  }

  const isStaff = STAFF_ROLES.includes(
    req.user.role
  );

  if (!isStaff) {
    // Requesters may only close their own tickets.
    const isRequester =
      String(ticket.requesterId) ===
      String(req.user._id);

    if (!isRequester || status !== "closed") {
      throw forbidden();
    }
  }

  if (status !== undefined) {
    ticket.status = status;

    if (status === "resolved" || status === "closed") {
      const now = new Date();

      if (status === "resolved") {
        ticket.resolution.resolvedAt = now;
        ticket.resolution.resolvedBy = req.user._id;
      } else {
        ticket.closedAt = now;
        ticket.closedBy = req.user._id;
      }

      // Stop the SLA clock and record whether it was met.
      if (!ticket.sla.resolvedAt) {
        ticket.sla.resolvedAt = now;
        ticket.sla.status = "completed";
        ticket.sla.resolutionBreached = Boolean(
          ticket.sla.resolutionDueAt &&
            now > ticket.sla.resolutionDueAt
        );
      }
    } else if (
      !SLA_STOPPED_STATUSES.includes(status) &&
      ticket.sla.resolvedAt
    ) {
      // Reopened: the clock runs again against the original due time.
      ticket.sla.resolvedAt = null;
      ticket.sla.status = "active";
    }
  }

  if (
    priority !== undefined &&
    isStaff &&
    priority !== ticket.priority
  ) {
    ticket.priority = priority;
    applySla(ticket);
  }

  if (assigneeId !== undefined && isStaff) {
    const assignedTo = assigneeId
      ? await resolveRef(User, assigneeId, {
          label: "Assignee",
          scope: { instituteId: ticket.instituteId },
        })
      : null;

    if (
      assignedTo &&
      !(await User.exists({
        _id: assignedTo,
        role: { $in: ASSIGNABLE_ROLES },
      }))
    ) {
      return sendError(
        res,
        400,
        "Tickets can only be assigned to support staff"
      );
    }

    ticket.assignment = {
      ...(ticket.assignment?.toObject?.() ?? {}),
      assignedTo,
      assignedBy: assignedTo ? req.user._id : null,
      assignedAt: assignedTo ? new Date() : null,
    };
  }

  await ticket.save();

  return sendSuccess(res, {
    message: "Ticket updated",
    data: withAssignee(ticket),
  });
});

export const getTicketAssignees = asyncHandler(
  async (req, res) => {
    if (!STAFF_ROLES.includes(req.user.role)) {
      throw forbidden();
    }

    const ticket = await Ticket.findOne(
      scoped(req, { publicId: req.params.publicId })
    ).select("instituteId");

    if (!ticket) {
      return sendNotFound(res, "Ticket not found");
    }

    const staff = await User.find({
      instituteId: ticket.instituteId,
      role: { $in: ASSIGNABLE_ROLES },
      status: "active",
    })
      .select("publicId name email role")
      .sort({ name: 1 })
      .lean();

    return sendSuccess(res, {
      message: "Assignees fetched",
      data: staff,
    });
  }
);

export const deleteTicket = asyncHandler(
  async (req, res) => {
    const ticket = await Ticket.findOne(
      scoped(req, { publicId: req.params.publicId })
    );

    if (!ticket) {
      return sendNotFound(res, "Ticket not found");
    }

    if (
      !["super_admin", "admin"].includes(
        req.user.role
      )
    ) {
      throw forbidden();
    }

    await TicketMessage.deleteMany({
      ticketId: ticket._id,
    });

    await ticket.deleteOne();

    return sendSuccess(res, {
      message: "Ticket deleted",
      data: null,
    });
  }
);

/* =========================================================
   MERGE
   Folds a duplicate ticket into another one of the same
   requester: the duplicate's messages move to the target,
   the duplicate is closed with parentTicketId -> target, and
   both threads get a staff note. Different requesters are
   refused so nobody sees another person's messages.
========================================================= */

export const mergeTicket = asyncHandler(async (req, res) => {
  if (!STAFF_ROLES.includes(req.user.role)) {
    throw forbidden();
  }

  const source = await Ticket.findOne(
    scoped(req, { publicId: req.params.publicId })
  );

  if (!source) {
    return sendNotFound(res, "Ticket not found");
  }

  const target = await Ticket.findOne({
    publicId: String(req.body.into ?? ""),
    instituteId: source.instituteId,
  });

  if (!target) {
    return sendNotFound(res, "Target ticket not found");
  }

  if (String(target._id) === String(source._id)) {
    return sendError(res, { statusCode: 400, code: "MERGE_SELF", message: "A ticket can't be merged into itself" });
  }

  if (source.parentTicketId || target.parentTicketId) {
    return sendError(res, { statusCode: 400, code: "ALREADY_MERGED", message: "One of these tickets was already merged" });
  }

  if (String(source.requesterId) !== String(target.requesterId)) {
    return sendError(res, {
      statusCode: 400,
      code: "DIFFERENT_REQUESTER",
      message: "Only tickets from the same requester can be merged",
    });
  }

  const moved = await TicketMessage.updateMany(
    { ticketId: source._id },
    { $set: { ticketId: target._id } }
  );

  const note = (ticket, body) =>
    TicketMessage.create({
      instituteId: ticket.instituteId,
      ticketId: ticket._id,
      authorId: req.user._id,
      body,
      type: "internal_note",
      internal: { visibleToCustomer: false, visibleToAgents: true },
      source: "web",
    });

  await note(
    target,
    `Merged ticket ${source.publicId} ("${source.subject}") into this one; ${moved.modifiedCount} message(s) moved.`
  );
  await note(source, `Merged into ${target.publicId} ("${target.subject}").`);

  const now = new Date();
  source.parentTicketId = target._id;
  source.status = "closed";
  source.closedAt = now;
  source.closedBy = req.user._id;
  if (!source.sla.resolvedAt) {
    source.sla.resolvedAt = now;
    source.sla.status = "completed";
  }
  await source.save();

  if (!target.relatedTicketIds.some((id) => String(id) === String(source._id))) {
    target.relatedTicketIds.push(source._id);
  }
  await target.save();

  return sendSuccess(res, {
    message: "Tickets merged",
    data: { ticket: withAssignee(target), mergedFrom: source.publicId, movedMessages: moved.modifiedCount },
  });
});

/* =========================================================
   MESSAGES
========================================================= */

export const addTicketMessage = asyncHandler(
  async (req, res) => {
    const { body, isInternal } = req.body;

    if (!body) {
      return sendError(res, 400, "Message body is required");
    }

    const ticket = await Ticket.findOne({
      publicId: req.params.publicId,
      ...scoped(req),
    });

    if (!ticket) {
      return sendNotFound(res, "Ticket not found");
    }

    const isStaff = STAFF_ROLES.includes(
      req.user.role
    );

    const isRequester =
      String(ticket.requesterId) ===
      String(req.user._id);

    if (!isStaff && !isRequester) {
      throw forbidden();
    }

    // Staff-only notes use the schema's "internal_note" type
    // (the old isInternalNote key was not a schema field).
    // Requesters can never create one.
    const internal =
      isStaff && (isInternal === true || isInternal === "true");

    const message = await TicketMessage.create({
      // The ticket's org (super_admin has no instituteId of its own).
      instituteId: ticket.instituteId,

      ticketId: ticket._id,

      authorId: req.user._id,

      body,

      type: internal ? "internal_note" : "text",

      ...(internal
        ? { internal: { visibleToCustomer: false, visibleToAgents: true } }
        : {}),

      source: "web",
    });

    const now = new Date();

    if (internal) {
      // Notes are invisible to the requester: they neither count as a
      // response nor move the ticket out of "open".
    } else if (isStaff && !isRequester) {
      if (!ticket.firstResponseAt) {
        ticket.firstResponseAt = now;
        ticket.sla.firstRespondedAt = now;
        ticket.sla.responseBreached = Boolean(
          ticket.sla.responseDueAt && now > ticket.sla.responseDueAt
        );
      }

      ticket.lastResponseAt = now;
      ticket.lastAgentResponseAt = now;
      ticket.responseCount += 1;
      ticket.agentResponseCount += 1;

      // First staff reply stops the ticket being "new".
      if (ticket.status === "open") {
        ticket.status = "in_progress";
      }

      if (ticket.sla.status === "not_started") {
        applySla(ticket);
      }

      await ticket.save();
    } else {
      ticket.lastResponseAt = now;
      ticket.lastCustomerResponseAt = now;
      ticket.responseCount += 1;
      ticket.customerResponseCount += 1;

      if (ticket.status === "waiting_for_user") {
        ticket.status = "in_progress";
      }

      await ticket.save();
    }

    return sendCreated(res, {
      message: "Message added",
      data: message,
    });
  }
);

/* =========================================================
   REPLY TEMPLATES (canned responses)
   Every staff role may read and insert them; admin and
   support manage the organization's list.
========================================================= */

const TEMPLATE_MANAGER_ROLES = ["super_admin", "admin", "support"];

const cleanTemplate = (body = {}) => ({
  name: typeof body.name === "string" ? body.name.trim() : "",
  body: typeof body.body === "string" ? body.body.trim() : "",
});

const assertTemplateManager = (req) => {
  if (!TEMPLATE_MANAGER_ROLES.includes(req.user.role)) {
    throw forbidden();
  }
};

const templateNameTaken = (instituteId, name, exceptId = null) =>
  TicketTemplate.exists({
    instituteId,
    name: {
      $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
      $options: "i",
    },
    ...(exceptId ? { _id: { $ne: exceptId } } : {}),
  });

export const getTicketTemplates = asyncHandler(async (req, res) => {
  if (!STAFF_ROLES.includes(req.user.role)) {
    throw forbidden();
  }

  const templates = await TicketTemplate.find(scoped(req))
    .select("publicId name body createdAt updatedAt")
    .sort({ name: 1 })
    .lean();

  return sendSuccess(res, {
    message: "Templates fetched",
    data: templates,
  });
});

export const createTicketTemplate = asyncHandler(async (req, res) => {
  assertTemplateManager(req);

  if (!req.user.instituteId) {
    return sendError(res, 400, "Templates belong to an organization");
  }

  const { name, body } = cleanTemplate(req.body);

  if (!name || !body) {
    return sendError(res, 400, "Name and body are required");
  }

  if (await templateNameTaken(req.user.instituteId, name)) {
    return sendError(res, 409, "A template with this name already exists");
  }

  const template = await TicketTemplate.create({
    instituteId: req.user.instituteId,
    name,
    body,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  return sendCreated(res, {
    message: "Template created",
    data: template,
  });
});

export const updateTicketTemplate = asyncHandler(async (req, res) => {
  assertTemplateManager(req);

  const template = await TicketTemplate.findOne(
    scoped(req, { publicId: req.params.templateId })
  );

  if (!template) {
    return sendNotFound(res, "Template not found");
  }

  const { name, body } = cleanTemplate(req.body);

  if (req.body?.name !== undefined) {
    if (!name) return sendError(res, 400, "Name is required");

    if (
      await templateNameTaken(template.instituteId, name, template._id)
    ) {
      return sendError(res, 409, "A template with this name already exists");
    }

    template.name = name;
  }

  if (req.body?.body !== undefined) {
    if (!body) return sendError(res, 400, "Body is required");
    template.body = body;
  }

  template.updatedBy = req.user._id;
  await template.save();

  return sendSuccess(res, {
    message: "Template updated",
    data: template,
  });
});

export const deleteTicketTemplate = asyncHandler(async (req, res) => {
  assertTemplateManager(req);

  const template = await TicketTemplate.findOne(
    scoped(req, { publicId: req.params.templateId })
  );

  if (!template) {
    return sendNotFound(res, "Template not found");
  }

  await template.deleteOne();

  return sendSuccess(res, {
    message: "Template deleted",
    data: null,
  });
});
