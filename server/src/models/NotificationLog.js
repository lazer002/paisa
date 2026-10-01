// server/src/models/NotificationLog.js
//
// In-app notification feed. One document per (user, notification).
// Created by notificationController when someone broadcasts a
// notification; read state is per-recipient.

import mongoose from "mongoose";

import crypto from "node:crypto";

const NOTIFICATION_CHANNELS = [
  "in_app",
  "push",
  "email",
  "sms",
];

const NOTIFICATION_TYPES = [
  "announcement",
  "assignment",
  "assignment_due",
  "assignment_graded",
  "test",
  "test_scheduled",
  "test_reminder",
  "test_result",
  "attendance",
  "attendance_marked",
  "attendance_alert",
  "leave",
  "leave_submitted",
  "leave_approved",
  "leave_rejected",
  "payroll",
  "payroll_processed",
  "payment",
  "invoice",
  "live_session",
  "live_session_starting",
  "live_session_started",
  "live_session_ended",
  "message",
  "conversation",
  "ticket",
  "ticket_update",
  "crm",
  "task",
  "event",
  "certificate",
  "achievement",
  "leaderboard",
  "streak",
  "security",
  "login",
  "device",
  "system",
  "marketing",
];

const NOTIFICATION_STATUSES = [
  "unread",
  "read",
  "archived",
];

const notificationLogSchema =
  new mongoose.Schema(
    {
      /* ==================================================================== */
      /* TENANCY                                                              */
      /* ==================================================================== */

      instituteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
        index: true,
      },

      publicId: {
        type: String,
        required: true,
        unique: true,
        immutable: true,
        index: true,
        default: () =>
          `ntf_${crypto.randomBytes(16).toString("base64url")}`,
      },

      /* ==================================================================== */
      /* RECIPIENT                                                            */
      /* ==================================================================== */

      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      /* ==================================================================== */
      /* CONTENT                                                              */
      /* ==================================================================== */

      type: {
        type: String,
        enum: NOTIFICATION_TYPES,
        default: "system",
        index: true,
      },

      title: {
        type: String,
        trim: true,
        required: true,
        maxlength: 300,
      },

      body: {
        type: String,
        trim: true,
        maxlength: 2000,
        default: null,
      },

      link: {
        type: String,
        trim: true,
        maxlength: 500,
        default: null,
      },

      /* ==================================================================== */
      /* ACTOR (who triggered it, may be system)                              */
      /* ==================================================================== */

      actorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      actorName: {
        type: String,
        trim: true,
        maxlength: 300,
        default: null,
      },

      /* ==================================================================== */
      /* DELIVERY                                                             */
      /* ==================================================================== */

      channels: {
        type: [String],
        enum: NOTIFICATION_CHANNELS,
        default: ["in_app"],
      },

      status: {
        type: String,
        enum: NOTIFICATION_STATUSES,
        default: "unread",
        index: true,
      },

      readAt: {
        type: Date,
        default: null,
      },

      archivedAt: {
        type: Date,
        default: null,
      },

      /* ==================================================================== */
      /* CONTEXT (small reference payload for deep-linking)                   */
      /* ==================================================================== */

      reference: {
        type: {
          kind: {
            type: String,
            trim: true,
            maxlength: 100,
            default: null,
          },

          id: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
          },

          publicId: {
            type: String,
            trim: true,
            maxlength: 200,
            default: null,
          },
        },
        default: null,
      },

      metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
    },
    {
      timestamps: true,

      toJSON: { virtuals: true },

      toObject: { virtuals: true },
    }
  );

/* ============================================================================
 * INDEXES
 * ========================================================================== */

notificationLogSchema.index(
  {
    instituteId: 1,
    userId: 1,
    status: 1,
    createdAt: -1,
  },
  {
    name: "user_feed",
  }
);

notificationLogSchema.index(
  {
    instituteId: 1,
    userId: 1,
    type: 1,
    createdAt: -1,
  },
  {
    name: "user_feed_by_type",
  }
);

/* ============================================================================
 * VIRTUALS
 * ========================================================================== */

notificationLogSchema.virtual(
  "isUnread"
).get(function () {
  return this.status === "unread";
});

/* ============================================================================
 * INSTANCE METHODS
 * ========================================================================== */

notificationLogSchema.methods.markRead =
  function () {
    if (this.status === "unread") {
      this.status = "read";

      this.readAt = new Date();
    }

    return this.save();
  };

notificationLogSchema.methods.archive =
  function () {
    this.status = "archived";

    this.archivedAt = new Date();

    return this.save();
  };

/* ============================================================================
 * STATICS
 * ========================================================================== */

notificationLogSchema.statics.markManyRead =
  function (instituteId, userId, ids = null) {
    const filter = {
      instituteId,
      userId,
      status: "unread",
    };

    if (ids && ids.length > 0) {
      filter._id = {
        $in: ids,
      };
    }

    return this.updateMany(filter, {
      status: "read",

      readAt: new Date(),
    });
  };

/* ============================================================================
 * MODEL
 * ========================================================================== */

export const NotificationLog =
  mongoose.models.NotificationLog ||
  mongoose.model(
    "NotificationLog",
    notificationLogSchema
  );

export {
  NOTIFICATION_TYPES,
  NOTIFICATION_STATUSES,
  NOTIFICATION_CHANNELS,
};
