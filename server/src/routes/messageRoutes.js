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
  createDirectConversation
);

router.post(
  "/group",
  authorize({
    anyPermissions: ["conversation:create"],
  }),
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
