// server/src/controllers/eventController.js
//
// Events module: institute calendar of events
// (academic + corporate), with RSVP-style metadata.

import {Event} from "../models/Event.js";

import { asyncHandler } from "../utils/errorHandler.js";

import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendForbidden,
  sendError,
} from "../utils/response.js";

const scoped = (req, extra = {}) => {
  if (req.user.role === "super_admin") {
    return { ...extra };
  }

  return {
    instituteId: req.user.instituteId,
    ...extra,
  };
};

export const createEvent = asyncHandler(
  async (req, res) => {
    const {
      title,
      description,
      type,
      category,
      startsAt,
      endsAt,
      location,
      targetRoles,
    } = req.body;

    if (!title || !startsAt) {
      return sendError(
        res,
        400,
        "Title and startsAt are required"
      );
    }

    const event = await Event.create({
      instituteId: req.user.instituteId,

      createdBy: req.user._id,

      title,

      description: description || null,

      type: type || "meeting",

      category: category || "general",

      startsAt,

      endsAt: endsAt || null,

      location: location || null,

      status: "scheduled",
    });

    return sendCreated(res, {
      message: "Event created",
      data: event,
    });
  }
);

export const getEvents = asyncHandler(async (req, res) => {
  const { type, category, from, to } = req.query;

  const query = scoped(req);

  if (type) query.type = type;
  if (category) query.category = category;

  if (from || to) {
    query.startsAt = {};

    if (from) query.startsAt.$gte = new Date(from);
    if (to) query.startsAt.$lte = new Date(to);
  }

  const events = await Event.find(query)
    .populate("createdBy", "name")
    .sort({ startsAt: 1 });

  return sendSuccess(res, {
    message: "Events fetched",
    data: events,
  });
});

export const getEvent = asyncHandler(async (req, res) => {
  const event = await Event.findOne({
    publicId: req.params.publicId,
    ...scoped(req),
  });

  if (!event) {
    return sendNotFound(res, "Event not found");
  }

  return sendSuccess(res, {
    message: "Event fetched",
    data: event,
  });
});

export const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findOne({
    publicId: req.params.publicId,
  });

  if (!event) {
    return sendNotFound(res, "Event not found");
  }

  if (
    req.user.role !== "super_admin" &&
    String(event.instituteId) !==
      String(req.user.instituteId)
  ) {
    return sendForbidden(res, "Access denied");
  }

  const allowed = [
    "title",
    "description",
    "type",
    "category",
    "startsAt",
    "endsAt",
    "location",
    "status",
  ];

  const updates = {};

  for (const field of allowed) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  const updated = await Event.findOneAndUpdate(
    { publicId: req.params.publicId },
    updates,
    { new: true, runValidators: true }
  );

  return sendSuccess(res, {
    message: "Event updated",
    data: updated,
  });
});

export const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findOne({
    publicId: req.params.publicId,
  });

  if (!event) {
    return sendNotFound(res, "Event not found");
  }

  if (
    req.user.role !== "super_admin" &&
    String(event.instituteId) !==
      String(req.user.instituteId)
  ) {
    return sendForbidden(res, "Access denied");
  }

  await event.deleteOne();

  return sendSuccess(res, {
    message: "Event deleted",
    data: null,
  });
});
