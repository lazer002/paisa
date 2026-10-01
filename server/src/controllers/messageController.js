// server/src/controllers/messageController.js
//
// Messaging module: Conversations (direct/group) + Messages.
// Every org member can list their own conversations, start direct
// chats, create groups, and exchange messages. Tenant-scoped and
// participation-checked throughout.

import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import { User } from "../models/User.js";

import { resolveRef } from "../utils/resolveRef.js";

import { asyncHandler } from "../utils/errorHandler.js";

import ApiError from "../utils/ApiError.js";

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

const assertTenant = (req, row) => {
  if (
    req.user.role !== "super_admin" &&
    String(row.instituteId) !==
      String(req.user.instituteId)
  ) {
    throw ApiError.forbidden(
      "Access denied",
      "ACCESS_DENIED"
    );
  }
};

const isParticipant = (conversation, userId) =>
  conversation.participants.some(
    (participant) =>
      participant.status === "active" &&
      participant.userId.equals(userId)
  );

const participantView = (conversation) =>
  conversation.participants
    .filter(
      (participant) =>
        participant.status === "active"
    )
    .map((participant) => ({
      userId: participant.userId,

      role: participant.role,

      lastReadAt: participant.lastReadAt,

      unreadCount: participant.unreadCount,
    }));

/* =========================================================
   CONVERSATIONS
========================================================= */

export const getConversations = asyncHandler(
  async (req, res) => {
    const { type } = req.query;

    const query = scoped(req, {
      "participants.userId": req.user._id,

      "participants.status": "active",

      isDeleted: false,
    });

    if (type) {
      query.type = type;
    }

    const conversations =
      await Conversation.find(query)
        .sort({ lastActivityAt: -1 })
        .limit(100);

    const withUnread = conversations.map(
      (conversation) => {
        const mine =
          conversation.participants.find(
            (participant) =>
              participant.userId.equals(
                req.user._id
              )
          );

        return {
          ...conversation.toObject(),

          myUnreadCount:
            mine?.unreadCount ?? 0,

          participantView: participantView(
            conversation
          ),
        };
      }
    );

    return sendSuccess(res, {
      message: "Conversations fetched",

      data: withUnread,
    });
  }
);

export const createDirectConversation =
  asyncHandler(async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
      throw ApiError.badRequest(
        "userId is required",
        "VALIDATION_ERROR"
      );
    }

    const otherUser = await resolveRef(
      User,
      userId,
      { label: "User" }
    );

    if (
      req.user.role !== "super_admin" &&
      String(otherUser.instituteId) !==
        String(req.user.instituteId)
    ) {
      throw ApiError.forbidden(
        "User is not in your organization",
        "TENANT_ACCESS_DENIED"
      );
    }

    const existing =
      await Conversation.findDirectConversation(
        req.user.instituteId,
        req.user._id,
        otherUser._id
      );

    if (existing) {
      return sendSuccess(res, {
        message: "Conversation exists",

        data: existing,
      });
    }

    const conversation =
      await Conversation.create({
        instituteId: req.user.instituteId,

        type: "direct",

        createdBy: req.user._id,

        ownerId: req.user._id,

        participants: [
          {
            userId: req.user._id,

            role: "member",

            status: "active",
          },

          {
            userId: otherUser._id,

            role: "member",

            status: "active",
          },
        ],

        lastActivityAt: new Date(),
      });

    return sendCreated(res, {
      message: "Conversation created",

      data: conversation,
    });
  });

export const createGroupConversation =
  asyncHandler(async (req, res) => {
    const { title, participantIds } = req.body;

    if (!title || !title.trim()) {
      throw ApiError.badRequest(
        "Title is required",
        "VALIDATION_ERROR"
      );
    }

    if (
      !Array.isArray(participantIds) ||
      participantIds.length === 0
    ) {
      throw ApiError.badRequest(
        "At least one participant is required",
        "VALIDATION_ERROR"
      );
    }

    const resolvedUsers = [];

    for (const id of participantIds) {
      const user = await resolveRef(User, id, {
        label: "User",
      });

      if (
        req.user.role !== "super_admin" &&
        String(user.instituteId) !==
          String(req.user.instituteId)
      ) {
        throw ApiError.forbidden(
          `${user.name || "User"} is not in your organization`,
          "TENANT_ACCESS_DENIED"
        );
      }

      resolvedUsers.push(user);
    }

    const uniqueIds = [
      ...new Set(
        resolvedUsers.map((user) =>
          String(user._id)
        )
      )
    ];

    const conversation =
      await Conversation.create({
        instituteId: req.user.instituteId,

        type: "group",

        title: title.trim(),

        createdBy: req.user._id,

        ownerId: req.user._id,

        participants: [
          {
            userId: req.user._id,

            role: "owner",

            status: "active",
          },

          ...uniqueIds.map((id) => ({
            userId: id,

            role: "member",

            status: "active",
          })),
        ],

        lastActivityAt: new Date(),
      });

    return sendCreated(res, {
      message: "Group created",

      data: conversation,
    });
  });

export const getConversation = asyncHandler(
  async (req, res) => {
    const conversation =
      await Conversation.findOne({
        publicId: req.params.publicId,

        ...scoped(req),

        isDeleted: false,
      }).populate(
        "participants.userId",
        "name email role userCode"
      );

    if (!conversation) {
      return sendNotFound(
        res,
        "Conversation not found"
      );
    }

    if (
      !isParticipant(conversation, req.user._id)
    ) {
      throw ApiError.forbidden(
        "You are not a participant",
        "ACCESS_DENIED"
      );
    }

    return sendSuccess(res, {
      message: "Conversation fetched",

      data: conversation,
    });
  }
);

export const addConversationParticipants =
  asyncHandler(async (req, res) => {
    const { userIds } = req.body;

    if (
      !Array.isArray(userIds) ||
      userIds.length === 0
    ) {
      throw ApiError.badRequest(
        "userIds array is required",
        "VALIDATION_ERROR"
      );
    }

    const conversation =
      await Conversation.findOne({
        publicId: req.params.publicId,

        ...scoped(req),

        isDeleted: false,
      });

    if (!conversation) {
      return sendNotFound(
        res,
        "Conversation not found"
      );
    }

    assertTenant(req, conversation);

    if (conversation.type === "direct") {
      throw ApiError.badRequest(
        "Cannot add participants to a direct conversation",
        "VALIDATION_ERROR"
      );
    }

    if (
      !isParticipant(conversation, req.user._id)
    ) {
      throw ApiError.forbidden(
        "You are not a participant",
        "ACCESS_DENIED"
      );
    }

    for (const id of userIds) {
      const user = await resolveRef(User, id, {
        label: "User",
      });

      await conversation.addParticipant({
        userId: user._id,
      });
    }

    return sendSuccess(res, {
      message: "Participants added",

      data: conversation,
    });
  });

export const leaveConversation = asyncHandler(
  async (req, res) => {
    const conversation =
      await Conversation.findOne({
        publicId: req.params.publicId,

        ...scoped(req),

        isDeleted: false,
      });

    if (!conversation) {
      return sendNotFound(
        res,
        "Conversation not found"
      );
    }

    await conversation.leave(req.user._id);

    return sendSuccess(res, {
      message: "Left conversation",

      data: null,
    });
  }
);

export const markConversationRead =
  asyncHandler(async (req, res) => {
    const conversation =
      await Conversation.findOne({
        publicId: req.params.publicId,

        ...scoped(req),

        isDeleted: false,
      });

    if (!conversation) {
      return sendNotFound(
        res,
        "Conversation not found"
      );
    }

    if (
      !isParticipant(conversation, req.user._id)
    ) {
      throw ApiError.forbidden(
        "You are not a participant",
        "ACCESS_DENIED"
      );
    }

    const latest = await Message.findOne({
      conversationId: conversation._id,
    }).sort({ createdAt: -1 });

    await conversation.updateReadState(
      req.user._id,
      latest?._id ?? null
    );

    return sendSuccess(res, {
      message: "Marked as read",

      data: null,
    });
  });

/* =========================================================
   MESSAGES
========================================================= */

export const getMessages = asyncHandler(
  async (req, res) => {
    const { before, limit } = req.query;

    const conversation =
      await Conversation.findOne({
        publicId: req.params.publicId,

        ...scoped(req),

        isDeleted: false,
      });

    if (!conversation) {
      return sendNotFound(
        res,
        "Conversation not found"
      );
    }

    if (
      !isParticipant(conversation, req.user._id)
    ) {
      throw ApiError.forbidden(
        "You are not a participant",
        "ACCESS_DENIED"
      );
    }

    const query = {
      instituteId: conversation.instituteId,

      conversationId: conversation._id,

      status: { $ne: "deleted" },
    };

    if (before) {
      query.createdAt = {
        $lt: new Date(before),
      };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit) || 50);

    return sendSuccess(res, {
      message: "Messages fetched",

      data: messages.reverse(),
    });
  }
);

export const sendMessage = asyncHandler(
  async (req, res) => {
    const { text, type } = req.body;

    if (!text || !String(text).trim()) {
      throw ApiError.badRequest(
        "Message text is required",
        "VALIDATION_ERROR"
      );
    }

    const conversation =
      await Conversation.findOne({
        publicId: req.params.publicId,

        ...scoped(req),

        isDeleted: false,
      });

    if (!conversation) {
      return sendNotFound(
        res,
        "Conversation not found"
      );
    }

    if (
      !isParticipant(conversation, req.user._id)
    ) {
      throw ApiError.forbidden(
        "You are not a participant",
        "ACCESS_DENIED"
      );
    }

    if (conversation.status !== "active") {
      throw ApiError.badRequest(
        "Conversation is not active",
        "VALIDATION_ERROR"
      );
    }

    const message = await Message.create({
      instituteId: conversation.instituteId,

      conversationId: conversation._id,

      senderId: req.user._id,

      senderName: req.user.name,

      senderRole: req.user.role,

      type: type || "text",

      text: String(text).trim(),

      status: "sent",
    });

    await conversation.updateLastMessage({
      messageId: message._id,

      senderId: req.user._id,

      senderName: req.user.name,

      type: message.type,

      preview: message.text.slice(0, 200),

      createdAt: message.createdAt,
    });

    await conversation.incrementUnread(
      req.user._id
    );

    return sendCreated(res, {
      message: "Message sent",

      data: message,
    });
  }
);

export const deleteMessage = asyncHandler(
  async (req, res) => {
    const message = await Message.findOne({
      publicId: req.params.publicId,

      ...scoped(req),
    });

    if (!message) {
      return sendNotFound(
        res,
        "Message not found"
      );
    }

    const isMine =
      String(message.senderId) ===
      String(req.user._id);

    const isStaff = [
      "super_admin",
      "admin",
    ].includes(req.user.role);

    if (!isMine && !isStaff) {
      throw ApiError.forbidden(
        "You can only delete your own messages",
        "ACCESS_DENIED"
      );
    }

    message.status = "deleted";

    message.deletedAt = new Date();

    message.deletedBy = req.user._id;

    await message.save();

    return sendSuccess(res, {
      message: "Message deleted",

      data: null,
    });
  }
);

export const editMessage = asyncHandler(
  async (req, res) => {
    const { text } = req.body;

    if (!text || !String(text).trim()) {
      throw ApiError.badRequest(
        "Message text is required",
        "VALIDATION_ERROR"
      );
    }

    const message = await Message.findOne({
      publicId: req.params.publicId,

      ...scoped(req),
    });

    if (!message) {
      return sendNotFound(
        res,
        "Message not found"
      );
    }

    if (
      String(message.senderId) !==
      String(req.user._id)
    ) {
      throw ApiError.forbidden(
        "You can only edit your own messages",
        "ACCESS_DENIED"
      );
    }

    message.editHistory.push({
      previousText: message.text,

      editedBy: req.user._id,
    });

    message.text = String(text).trim();

    message.editedAt = new Date();

    message.editedBy = req.user._id;

    await message.save();

    return sendSuccess(res, {
      message: "Message updated",

      data: message,
    });
  }
);
