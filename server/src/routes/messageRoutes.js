// server/src/routes/messageRoutes.js

import express from "express";

import {
  getConversations,
  createDirectConversation,
  createGroupConversation,
  getConversation,
  addConversationParticipants,
  leaveConversation,
  markConversationRead,
  getMessages,
  sendMessage,
  deleteMessage,
  editMessage,
} from "../controllers/messageController.js";

import authenticate from "../middleware/authenticate.js";

import { authorize } from "../middleware/authorize.js";

import { body } from "../validators/common.js";

import {
  directConversationSchema,
  groupConversationSchema,
  addParticipantsSchema,
  sendMessageSchema,
  editMessageSchema,
} from "../validators/communicationValidator.js";

const router = express.Router();

router.use(authenticate);

// ─────────────────────────────────────────────
// CONVERSATIONS
// ─────────────────────────────────────────────

router.get(
  "/",
  authorize({
    anyPermissions: ["conversation:read"],
  }),
  getConversations
);

router.post(
  "/direct",
  authorize({
    anyPermissions: ["conversation:create"],
  }),
  body(directConversationSchema),
  createDirectConversation
);

router.post(
  "/group",
  authorize({
    anyPermissions: ["conversation:create"],
  }),
  body(groupConversationSchema),
  createGroupConversation
);

router.get(
  "/:publicId",
  authorize({
    anyPermissions: ["conversation:read"],
  }),
  getConversation
);

router.post(
  "/:publicId/participants",
  authorize({
    anyPermissions: ["conversation:update"],
  }),
  body(addParticipantsSchema),
  addConversationParticipants
);

router.post(
  "/:publicId/leave",
  authorize({
    anyPermissions: ["conversation:update"],
  }),
  leaveConversation
);

router.post(
  "/:publicId/read",
  authorize({
    anyPermissions: ["conversation:read"],
  }),
  markConversationRead
);

// ─────────────────────────────────────────────
// MESSAGES
// ─────────────────────────────────────────────

router.get(
  "/:publicId/messages",
  authorize({
    anyPermissions: ["message:read"],
  }),
  getMessages
);

router.post(
  "/:publicId/messages",
  authorize({
    anyPermissions: ["message:create"],
  }),
  body(sendMessageSchema),
  sendMessage
);

export const messageItemRouter =
  express.Router();

messageItemRouter.use(authenticate);

messageItemRouter.put(
  "/:publicId",
  authorize({
    anyPermissions: ["message:update"],
  }),
  body(editMessageSchema),
  editMessage
);

messageItemRouter.delete(
  "/:publicId",
  authorize({
    anyPermissions: ["message:delete"],
  }),
  deleteMessage
);

export default router;
