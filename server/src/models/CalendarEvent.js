// server/src/models/CalendarEvent.js
//
// Organization calendar entries (meetings, holidays, exams, functions).
// Not to be confused with models/Event.js, which is the domain-event outbox.

import mongoose from "mongoose";

import crypto from "node:crypto";

export const CALENDAR_EVENT_STATUSES = [
  "scheduled",
  "postponed",
  "cancelled",
  "completed",
];

const calendarEventSchema = new mongoose.Schema(
  {
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
        `evt_${crypto.randomBytes(16).toString("base64url")}`,
    },

    title: {
      type: String,
      trim: true,
      minlength: 1,
      maxlength: 200,
      required: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: null,
    },

    // Free-form labels from the UI (meeting, holiday, exam, ...).
    type: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "meeting",
    },

    category: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "general",
    },

    startsAt: {
      type: Date,
      required: true,
      index: true,
    },

    endsAt: {
      type: Date,
      default: null,
    },

    location: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },

    targetRoles: [
      {
        type: String,
        trim: true,
        maxlength: 50,
      },
    ],

    status: {
      type: String,
      enum: CALENDAR_EVENT_STATUSES,
      default: "scheduled",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "calendar_events",
  }
);

calendarEventSchema.index(
  { instituteId: 1, startsAt: 1 },
  { name: "tenant_calendar_events_by_start" }
);

calendarEventSchema.pre("validate", function (next) {
  if (this.endsAt && this.startsAt && this.endsAt < this.startsAt) {
    this.invalidate("endsAt", "endsAt must be after startsAt");
  }

  next();
});

export const CalendarEvent =
  mongoose.models.CalendarEvent ||
  mongoose.model("CalendarEvent", calendarEventSchema);

export default CalendarEvent;
