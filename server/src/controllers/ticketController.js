// server/src/controllers/ticketController.js
//
// Support module: Tickets + threaded TicketMessages.
// Requesters open tickets; staff reply, assign, and
// resolve. SLA fields stay model-driven.

import { Ticket } from "../models/Ticket.js";
import { TicketMessage } from "../models/TicketMessage.js";
import { User } from "../models/User.js";
import { resolveRef } from "../utils/resolveRef.js";

import { asyncHandler } from "../utils/errorHandler.js";

import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendForbidden,
  sendError,
} from "../utils/response.js";

import ApiError from "../utils/ApiError.js";

// The assignee lives in `assignment.assignedTo`; clients read it as `assigneeId`.
const withAssignee = (ticket) => {
  const json = ticket.toJSON();
  return { ...json, assigneeId: json.assignment?.assignedTo ?? null };
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

    const ticket = await Ticket.create({
      instituteId: req.user.instituteId,

      subject,

      description: description || null,

      type: type || "support",

      priority: priority || "normal",

      status: "open",

      source: "web",

      requesterId: req.user._id,
    });

    return sendCreated(res, {
      message: "Ticket created",
      data: ticket,
    });
  }
);

export const getTickets = asyncHandler(async (req, res) => {
  const { status, priority, type, search } = req.query;

  const query = scoped(req);

  // Non-staff see only their own tickets.
  if (!STAFF_ROLES.includes(req.user.role)) {
    query.requesterId = req.user._id;
  }

  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (type) query.type = type;

  if (search) {
    query.subject = {
      $regex: search,
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

    if (status === "resolved") {
      ticket.resolvedAt = new Date();
    }

    if (status === "closed") {
      ticket.closedAt = new Date();
    }
  }

  if (priority !== undefined && isStaff) {
    ticket.priority = priority;
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

    const message = await TicketMessage.create({
      instituteId: req.user.instituteId,

      ticketId: ticket._id,

      authorId: req.user._id,

      body,

      // Staff-only notes use the schema's "internal_note" type
      // (the old isInternalNote key was not a schema field).
      type:
        isInternal === true && isStaff
          ? "internal_note"
          : "text",

      source: "web",
    });

    // First staff reply stops the ticket being "new".
    if (isStaff && ticket.status === "open") {
      ticket.status = "in_progress";
      await ticket.save();
    }

    return sendCreated(res, {
      message: "Message added",
      data: message,
    });
  }
);
