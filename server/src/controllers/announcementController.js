// src/controllers/announcementController.js

import { Announcement } from "../models/Announcement.js";

import { asyncHandler } from "../utils/errorHandler.js";

import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendForbidden,
  sendError,
} from "../utils/response.js";

// Who may post is decided by the route (notification:create).
// Moderators may edit/delete any announcement in their organization;
// every other author may only manage their own.
const MODERATOR_ROLES = ["super_admin", "admin", "principal"];

const canManageAnnouncement = (user, announcement) =>
  MODERATOR_ROLES.includes(user.role) ||
  String(announcement.createdBy) === String(user._id);

export const createAnnouncement = asyncHandler(async (req, res) => {
  const {
    title,
    content,
    targetRoles,
    priority,
    expiresAt,
  } = req.body;

  if (!title || !content) {
    return sendError(
      res,
      400,
      "Title and content are required"
    );
  }

  const announcement = await Announcement.create({
    instituteId:
      req.user.role === "super_admin"
        ? null
        : req.user.instituteId,

    createdBy: req.user._id,

    title,
    content,

    targetRoles:
      targetRoles?.length
        ? targetRoles
        : ["all"],

    priority: priority || "medium",

    expiresAt,
  });

  sendCreated(
    res,
    "Announcement created",
    announcement
  );
});

export const getAnnouncements = asyncHandler(async (req, res) => {
  const now = new Date();

  const query = {
    isActive: true,

    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: now } },
    ],
  };

  if (req.user.role !== "super_admin") {
    query.$and = [
      {
        $or: [
          {
            instituteId: req.user.instituteId,
          },
          {
            instituteId: null,
          },
        ],
      },

      {
        $or: [
          {
            targetRoles: "all",
          },
          {
            targetRoles: req.user.role,
          },
        ],
      },
    ];
  }

  const announcements = await Announcement.find(query)
    .populate("createdBy", "name role")
    .sort({ createdAt: -1 });

  sendSuccess(
    res,
    "Announcements fetched",
    announcements
  );
});

export const getAnnouncementById = asyncHandler(
  async (req, res) => {
    const { publicId } = req.params;

    const announcement =
      await Announcement.findOne({
        publicId,
      }).populate("createdBy", "name role");

    if (!announcement) {
      return sendNotFound(
        res,
        "Announcement not found"
      );
    }

    if (req.user.role !== "super_admin") {
      const sameInstitute =
        String(announcement.instituteId) ===
          String(req.user.instituteId) ||
        announcement.instituteId === null;

      const allowedRole =
        announcement.targetRoles?.includes("all") ||
        announcement.targetRoles?.includes(req.user.role);

      if (!sameInstitute || !allowedRole) {
        return sendForbidden(
          res,
          "Access denied"
        );
      }
    }

    sendSuccess(
      res,
      "Announcement fetched",
      announcement
    );
  }
);

export const updateAnnouncement = asyncHandler(
  async (req, res) => {
    const announcement =
      await Announcement.findOne({
        publicId: req.params.publicId,
      });

    if (!announcement) {
      return sendNotFound(
        res,
        "Announcement not found"
      );
    }

    if (
      req.user.role !== "super_admin" &&
      String(announcement.instituteId) !==
        String(req.user.instituteId)
    ) {
      return sendForbidden(
        res,
        "Access denied"
      );
    }

    if (!canManageAnnouncement(req.user, announcement)) {
      return sendForbidden(
        res,
        "You can only manage announcements you created"
      );
    }

    const allowedFields = [
      "title",
      "content",
      "targetRoles",
      "priority",
      "expiresAt",
      "isActive",
    ];

    const updates = {};

    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const updated =
      await Announcement.findOneAndUpdate(
        {
          publicId: req.params.publicId,
        },
        updates,
        {
          new: true,
          runValidators: true,
        }
      );

    sendSuccess(
      res,
      "Announcement updated",
      updated
    );
  }
);

export const deleteAnnouncement = asyncHandler(
  async (req, res) => {
    const announcement =
      await Announcement.findOne({
        publicId: req.params.publicId,
      });

    if (!announcement) {
      return sendNotFound(
        res,
        "Announcement not found"
      );
    }

    if (
      req.user.role !== "super_admin" &&
      String(announcement.instituteId) !==
        String(req.user.instituteId)
    ) {
      return sendForbidden(
        res,
        "Access denied"
      );
    }

    if (!canManageAnnouncement(req.user, announcement)) {
      return sendForbidden(
        res,
        "You can only manage announcements you created"
      );
    }

    await Announcement.deleteOne({
      publicId: req.params.publicId,
    });

    sendSuccess(
      res,
      "Announcement deleted"
    );
  }
);