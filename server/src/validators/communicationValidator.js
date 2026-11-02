// server/src/validators/communicationValidator.js
//
// Body schemas for announcements, events, notifications and
// conversations/messages (H3). Fields mirror what the controllers read;
// see validators/common.js for the unknown-key policy.

import {
  Joi,
  str,
  optStr,
  text,
  ref,
  refList,
  isoDate,
  optDate,
  bool,
  oneOf,
  optOneOf,
} from "./common.js";

import {
  ANNOUNCEMENT_PRIORITY,
  TARGET_ROLES,
} from "../models/Announcement.js";

import { NOTIFICATION_TYPES } from "../models/NotificationLog.js";

import { MESSAGE_TYPES } from "../models/Message.js";

import { ROLE_VALUES } from "../config/constants.js";

/* ── Announcements ─────────────────────────────── */

const announcementFields = {
  title: str(200),
  content: str(20000),
  targetRoles: Joi.array().items(oneOf(TARGET_ROLES)).max(20),
  priority: optOneOf(ANNOUNCEMENT_PRIORITY),
  expiresAt: optDate(),
};

export const createAnnouncementSchema = Joi.object({
  ...announcementFields,
  title: announcementFields.title.required(),
  content: announcementFields.content.required(),
});

export const updateAnnouncementSchema = Joi.object({
  ...announcementFields,
  isActive: bool(),
});

/* ── Events (calendar) ─────────────────────────── */

const eventFields = {
  title: str(300),
  description: text(5000),
  type: optStr(100),
  category: optStr(100),
  startsAt: isoDate(),
  endsAt: optDate(),
  location: optStr(500),
  targetRoles: Joi.array().items(Joi.string().trim().max(50)).max(20),
};

export const createEventSchema = Joi.object({
  ...eventFields,
  title: eventFields.title.required(),
  startsAt: eventFields.startsAt.required(),
});

export const updateEventSchema = Joi.object({
  ...eventFields,
  status: optStr(50),
});

/* ── Notifications ─────────────────────────────── */

export const notificationPreferencesSchema = Joi.object({
  enabled: bool(),
  allowMarketing: bool(),
  allowSystem: bool(),
  allowSecurity: bool(),
  allowNotifications: bool(),
});

export const broadcastNotificationSchema = Joi.object({
  title: str(300).required(),
  body: text(2000),
  type: optOneOf(NOTIFICATION_TYPES),
  link: optStr(500),
  targetRoles: Joi.array().items(oneOf(ROLE_VALUES)).max(20).allow(null),
  // Delivery channels; "email" also emails users whose preferences allow it.
  channels: Joi.array().items(oneOf(["in_app", "email"])).max(2).allow(null),
  sendEmail: bool(),
});

/* ── Conversations & messages ──────────────────── */

export const directConversationSchema = Joi.object({
  userId: ref().required(),
});

export const groupConversationSchema = Joi.object({
  title: str(500).required(),
  participantIds: refList(500).min(1).required(),
});

export const addParticipantsSchema = Joi.object({
  userIds: refList(500).min(1).required(),
});

// Text, attachments (publicIds of files uploaded with purpose
// chat_attachment), or both.
export const sendMessageSchema = Joi.object({
  text: Joi.string().trim().max(50000).allow(""),
  type: optOneOf(MESSAGE_TYPES),
  fileIds: Joi.array().items(Joi.string().trim().max(100)).max(5),
}).or("text", "fileIds");

export const editMessageSchema = Joi.object({
  text: str(50000).required(),
});
