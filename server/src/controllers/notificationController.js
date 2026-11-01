// server/src/controllers/notificationController.js
//
// Notifications module: personal in-app feed, read-state,
// per-user channel preferences, and an admin broadcast.
// Feed is strictly per-recipient; broadcast fans out one
// NotificationLog per target user.

import {
  NotificationLog,
  NOTIFICATION_TYPES,
} from "../models/NotificationLog.js";

import { NotificationPreference } from "../models/NotificationPreference.js";

import { User } from "../models/User.js";

import { resolveRef } from "../utils/resolveRef.js";

import { asyncHandler } from "../utils/errorHandler.js";

import ApiError from "../utils/ApiError.js";

import { sendInBackground } from "../services/emailService.js";

import { sendNotificationEmails } from "../services/transactionalEmails.js";

import { emit } from "../realtime/emitter.js";

// Tells the user's other tabs/devices that read state changed.
const pushReadState = (req) =>
  emit.toUser(req.user._id, "notification:read", {});

import {
  sendSuccess,
  sendCreated,
  sendNotFound,
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

/* =========================================================
   FEED
========================================================= */

export const getNotifications = asyncHandler(
  async (req, res) => {
    const { status, type } = req.query;

    const query = {
      instituteId: req.user.instituteId,

      userId: req.user._id,
    };

    if (status) {
      query.status = status;
    }

    if (type) {
      query.type = type;
    }

    const notifications =
      await NotificationLog.find(query)
        .sort({ createdAt: -1 })
        .limit(100);

    const unreadCount =
      await NotificationLog.countDocuments({
        ...query,

        status: "unread",
      });

    return sendSuccess(res, {
      message: "Notifications fetched",

      data: {
        items: notifications,

        unreadCount,
      },
    });
  }
);

export const markNotificationRead =
  asyncHandler(async (req, res) => {
    const notification =
      await NotificationLog.findOne({
        publicId: req.params.publicId,

        instituteId: req.user.instituteId,

        userId: req.user._id,
      });

    if (!notification) {
      return sendNotFound(
        res,
        "Notification not found"
      );
    }

    await notification.markRead();

    pushReadState(req);

    return sendSuccess(res, {
      message: "Marked as read",

      data: null,
    });
  });

export const markAllNotificationsRead =
  asyncHandler(async (req, res) => {
    await NotificationLog.markManyRead(
      req.user.instituteId,
      req.user._id
    );

    pushReadState(req);

    return sendSuccess(res, {
      message: "All marked as read",

      data: null,
    });
  });

export const archiveNotification =
  asyncHandler(async (req, res) => {
    const notification =
      await NotificationLog.findOne({
        publicId: req.params.publicId,

        instituteId: req.user.instituteId,

        userId: req.user._id,
      });

    if (!notification) {
      return sendNotFound(
        res,
        "Notification not found"
      );
    }

    await notification.archive();

    pushReadState(req);

    return sendSuccess(res, {
      message: "Notification archived",

      data: null,
    });
  });

/* =========================================================
   PREFERENCES
========================================================= */

export const getNotificationPreferences =
  asyncHandler(async (req, res) => {
    let preferences =
      await NotificationPreference.findOne({
        instituteId: req.user.instituteId,

        userId: req.user._id,
      });

    if (!preferences) {
      preferences =
        await NotificationPreference.create({
          instituteId: req.user.instituteId,

          userId: req.user._id,
        });
    }

    return sendSuccess(res, {
      message: "Preferences fetched",

      data: preferences,
    });
  });

export const updateNotificationPreferences =
  asyncHandler(async (req, res) => {
    let preferences =
      await NotificationPreference.findOne({
        instituteId: req.user.instituteId,

        userId: req.user._id,
      });

    if (!preferences) {
      preferences =
        await NotificationPreference.create({
          instituteId: req.user.instituteId,

          userId: req.user._id,
        });
    }

    const allowed = [
      "enabled",
      "allowMarketing",
      "allowSystem",
      "allowSecurity",
      "allowNotifications",
    ];

    const updates = {};

    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    Object.assign(preferences, updates);

    await preferences.save();

    return sendSuccess(res, {
      message: "Preferences updated",

      data: preferences,
    });
  });

/* =========================================================
   BROADCAST (admin)
========================================================= */

export const broadcastNotification =
  asyncHandler(async (req, res) => {
    const {
      title,
      body,
      type,
      link,
      targetRoles,
      channels,
      sendEmail,
    } = req.body;

    const withEmail =
      sendEmail === true ||
      (Array.isArray(channels) &&
        channels.includes("email"));

    if (!title) {
      throw ApiError.badRequest(
        "Title is required",
        "VALIDATION_ERROR"
      );
    }

    if (
      type &&
      !NOTIFICATION_TYPES.includes(type)
    ) {
      throw ApiError.badRequest(
        "Unknown notification type",
        "VALIDATION_ERROR"
      );
    }

    const userQuery = {
      instituteId: req.user.instituteId,

      isDeleted: { $ne: true },
    };

    if (
      Array.isArray(targetRoles) &&
      targetRoles.length > 0
    ) {
      userQuery.role = {
        $in: targetRoles,
      };
    }

    const users = await User.find(userQuery)
      .select("_id role")
      .limit(1000);

    if (users.length === 0) {
      return sendSuccess(res, {
        message: "No users matched target roles",

        data: { delivered: 0 },
      });
    }

    const docs = users.map((user) => ({
      instituteId: req.user.instituteId,

      userId: user._id,

      type: type || "announcement",

      title,

      body: body || null,

      link: link || null,

      actorId: req.user._id,

      actorName: req.user.name,

      channels: withEmail
        ? ["in_app", "email"]
        : ["in_app"],

      status: "unread",
    }));

    const created =
      await NotificationLog.insertMany(docs);

    // Realtime: each recipient's bell updates at once (no-op without sockets).
    for (const notification of created) {
      emit.toUser(notification.userId, "notification:new", {
        notification: notification.toJSON(),
      });
    }

    sendCreated(res, {
      message: `Notification sent to ${created.length} users`,

      data: {
        delivered: created.length,
        email: withEmail,
      },
    });

    // Email copy for users whose preferences allow email (fire and forget).
    if (withEmail) {
      sendInBackground("notification-broadcast", () =>
        sendNotificationEmails({
          instituteId: req.user.instituteId,
          userIds: users.map((user) => user._id),
          type: type || "announcement",
          title,
          body: body || null,
          link: link || null,
          actorName: req.user.name,
        })
      );
    }
  });
