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
import { escapeRegex } from "../utils/crudHelpers.js";
import { claimFile, linkFile } from "../services/fileService.js";
import { fileDownloadPath } from "../models/File.js";

import { asyncHandler } from "../utils/errorHandler.js";

import ApiError from "../utils/ApiError.js";

import { emit } from "../realtime/emitter.js";

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

// Students and parents may chat with staff, but not start or extend a
// conversation with other students or parents.
const LEARNER_ROLES = ["student", "parent"];

// resolveRef only returns an _id, so load the user to check the tenant.
const loadOrgUser = async (req, reference) => {
  const id = await resolveRef(User, reference, {
    label: "User",
  });

  const user = await User.findOne({
    _id: id,

    isDeleted: { $ne: true },
  }).select("_id name role instituteId");

  if (!user) {
    throw ApiError.notFound(
      "User not found",
      "RESOURCE_NOT_FOUND"
    );
  }

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

  if (
    LEARNER_ROLES.includes(req.user.role) &&
    LEARNER_ROLES.includes(user.role)
  ) {
    throw ApiError.forbidden(
      "Students and parents can only message staff",
      "CHAT_STAFF_ONLY"
    );
  }

  return user;
};

const isParticipant = (conversation, userId) =>
  conversation.participants.some(
    (participant) =>
      participant.status === "active" &&
      participant.userId.equals(userId)
  );

// `users` (optional) maps a participant _id to { _id, publicId, name, role }
// so the client can show member names.
const participantView = (conversation, users = new Map()) =>
  conversation.participants
    .filter(
      (participant) =>
        participant.status === "active"
    )
    .map((participant) => ({
      userId:
        users.get(String(participant.userId)) ??
        participant.userId,

      role: participant.role,

      lastReadAt: participant.lastReadAt,

      unreadCount: participant.unreadCount,
    }));

const activeParticipantIds = (conversation) =>
  conversation.participants
    .filter((participant) => participant.status === "active")
    .map((participant) => String(participant.userId));

// Realtime pushes (no-ops when sockets are not initialised). The message
// goes to the conversation room (open threads); every active participant
// also gets `conversation:updated` so lists and unread badges refresh.
const pushMessageEvent = (conversation, event, payload) => {
  const conversationId = conversation.publicId;

  emit.toConversation(conversationId, event, {
    conversationId,
    ...payload,
  });

  emit.toUsers(
    activeParticipantIds(conversation),
    "conversation:updated",
    { conversationId, reason: event }
  );
};

/* =========================================================
   CONVERSATIONS
========================================================= */

export const getConversations = asyncHandler(
  async (req, res) => {
    const { type } = req.query;

    // $elemMatch so a conversation the user has left is not listed.
    const query = scoped(req, {
      participants: {
        $elemMatch: {
          userId: req.user._id,

          status: "active",
        },
      },

      isDeleted: false,
    });

    if (type) {
      query.type = type;
    }

    const conversations =
      await Conversation.find(query)
        .sort({ lastActivityAt: -1 })
        .limit(100);

    const memberIds = new Set();

    for (const conversation of conversations) {
      for (const participant of conversation.participants) {
        if (participant.status === "active") {
          memberIds.add(String(participant.userId));
        }
      }
    }

    const members = await User.find({
      _id: { $in: [...memberIds] },
    }).select("_id publicId name role");

    const memberMap = new Map(
      members.map((member) => [
        String(member._id),
        {
          _id: member._id,

          publicId: member.publicId,

          name: member.name,

          role: member.role,
        },
      ])
    );

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
            conversation,
            memberMap
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

    const otherUser = await loadOrgUser(
      req,
      userId
    );

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

    emit.toUsers(
      activeParticipantIds(conversation),
      "conversation:updated",
      { conversationId: conversation.publicId, reason: "created" }
    );

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
      resolvedUsers.push(
        await loadOrgUser(req, id)
      );
    }

    const uniqueIds = [
      ...new Set(
        resolvedUsers
          .map((user) => String(user._id))
          .filter(
            (id) => id !== String(req.user._id)
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

    emit.toUsers(
      activeParticipantIds(conversation),
      "conversation:updated",
      { conversationId: conversation.publicId, reason: "created" }
    );

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
      const user = await loadOrgUser(req, id);

      await conversation.addParticipant({
        userId: user._id,
      });
    }

    emit.toUsers(
      activeParticipantIds(conversation),
      "conversation:updated",
      {
        conversationId: conversation.publicId,
        reason: "participants",
      }
    );

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

    if (
      !isParticipant(conversation, req.user._id)
    ) {
      throw ApiError.forbidden(
        "You are not a participant",
        "ACCESS_DENIED"
      );
    }

    await conversation.leave(req.user._id);

    // Stop pushing this conversation to the leaver's open sockets.
    emit.removeUserFromConversation(
      req.user._id,
      conversation.publicId
    );

    emit.toUsers(
      [
        ...activeParticipantIds(conversation),
        String(req.user._id),
      ],
      "conversation:updated",
      { conversationId: conversation.publicId, reason: "left" }
    );

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

    // Other tabs/devices of this user refresh their unread badges.
    emit.toUser(req.user._id, "conversation:updated", {
      conversationId: conversation.publicId,
      reason: "read",
    });

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

// Search the caller's own conversations (active participation only).
// ?q= text (case-insensitive, min 2 chars) · ?conversationId= limits to one.
export const searchMessages = asyncHandler(
  async (req, res) => {
    const q = String(req.query.q ?? "").trim();

    if (q.length < 2) {
      throw ApiError.badRequest(
        "Search needs at least 2 characters",
        "VALIDATION_ERROR"
      );
    }

    const conversations = await Conversation.find({
      ...scoped(req),
      isDeleted: false,
      participants: { $elemMatch: { userId: req.user._id, status: "active" } },
      ...(req.query.conversationId ? { publicId: String(req.query.conversationId) } : {}),
    }).select("_id publicId title type");

    const byId = new Map(conversations.map((c) => [String(c._id), c]));
    const regex = { $regex: escapeRegex(q), $options: "i" };

    const messages = conversations.length
      ? await Message.find({
          conversationId: { $in: [...byId.keys()] },
          status: { $ne: "deleted" },
          $or: [{ text: regex }, { "attachments.name": regex }],
        })
          .sort({ createdAt: -1 })
          .limit(50)
      : [];

    return sendSuccess(res, {
      message: "Messages found",
      data: messages.map((message) => {
        const conversation = byId.get(String(message.conversationId));
        return {
          ...message.toJSON(),
          conversation: {
            publicId: conversation?.publicId,
            title: conversation?.title ?? null,
            type: conversation?.type,
          },
        };
      }),
    });
  }
);

export const sendMessage = asyncHandler(
  async (req, res) => {
    const { text, type } = req.body;
    const fileIds = [...new Set(req.body.fileIds ?? [])];
    const cleanText = String(text ?? "").trim();

    if (!cleanText && !fileIds.length) {
      throw ApiError.badRequest(
        "Message text or an attachment is required",
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

    // Uploaded chat files, described from the stored File so the client
    // can't fake name/size/type. Linked to the message once it exists.
    const files = [];
    for (const fileId of fileIds) {
      files.push(
        await claimFile(req, fileId, { purpose: "chat_attachment", kind: "message" })
      );
    }

    const message = await Message.create({
      instituteId: conversation.instituteId,

      conversationId: conversation._id,

      senderId: req.user._id,

      senderName: req.user.name,

      senderRole: req.user.role,

      type: type || (files.length && !cleanText ? "file" : "text"),

      text: cleanText || null,

      attachments: files.map((file) => ({
        fileId: file.publicId,
        name: file.originalName,
        url: fileDownloadPath(file.publicId),
        mimeType: file.mimeType,
        size: file.size,
      })),

      // The text index reads `language` as its language override and
      // rejects the schema default of null, so give it a real value.
      language: "english",

      status: "sent",
    });

    await Promise.all(files.map((file) => linkFile(file, "message", message._id)));

    await conversation.updateLastMessage({
      messageId: message._id,

      senderId: req.user._id,

      senderName: req.user.name,

      type: message.type,

      preview: cleanText
        ? cleanText.slice(0, 200)
        : `📎 ${files[0].originalName}${files.length > 1 ? ` +${files.length - 1}` : ""}`.slice(0, 200),

      createdAt: message.createdAt,
    });

    await conversation.incrementUnread(
      req.user._id
    );

    pushMessageEvent(conversation, "message:new", {
      message: message.toJSON(),
    });

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

    const conversation = await Conversation.findById(
      message.conversationId
    ).select("_id publicId participants");

    if (conversation) {
      pushMessageEvent(conversation, "message:deleted", {
        messageId: message.publicId || String(message._id),
      });
    }

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

    const conversation = await Conversation.findById(
      message.conversationId
    ).select("_id publicId participants");

    if (conversation) {
      pushMessageEvent(conversation, "message:updated", {
        message: message.toJSON(),
      });
    }

    return sendSuccess(res, {
      message: "Message updated",

      data: message,
    });
  }
);
