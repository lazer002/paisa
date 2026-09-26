// server/src/models/Message.js

import mongoose from "mongoose";

const MESSAGE_TYPES = [
  "text",
  "image",
  "video",
  "audio",
  "file",
  "document",
  "voice",
  "location",
  "contact",
  "system",
  "announcement",
  "sticker",
  "poll",
];

const MESSAGE_STATUSES = [
  "sending",
  "sent",
  "delivered",
  "read",
  "failed",
  "deleted",
  "hidden",
];

const DELIVERY_STATUSES = [
  "pending",
  "sent",
  "delivered",
  "read",
  "failed",
];

const REACTION_TYPES = [
  "like",
  "love",
  "laugh",
  "sad",
  "angry",
  "wow",
  "custom",
];

const attachmentSchema =
  new mongoose.Schema(
    {
      fileId: {
        type: String,
        trim: true,
        maxlength: 500,
        default: null,
      },

      name: {
        type: String,
        trim: true,
        maxlength: 500,
        default: null,
      },

      url: {
        type: String,
        trim: true,
        maxlength: 2000,
        default: null,
      },

      mimeType: {
        type: String,
        trim: true,
        maxlength: 200,
        default: null,
      },

      size: {
        type: Number,
        min: 0,
        default: null,
      },

      width: {
        type: Number,
        min: 0,
        default: null,
      },

      height: {
        type: Number,
        min: 0,
        default: null,
      },

      durationSeconds: {
        type: Number,
        min: 0,
        default: null,
      },

      thumbnailUrl: {
        type: String,
        trim: true,
        maxlength: 2000,
        default: null,
      },

      checksum: {
        type: String,
        trim: true,
        maxlength: 200,
        default: null,
      },
    },
    {
      _id: true,
    }
  );

const reactionSchema =
  new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      type: {
        type: String,
        enum: REACTION_TYPES,
        default: "custom",
      },

      emoji: {
        type: String,
        trim: true,
        maxlength: 50,
        default: null,
      },

      createdAt: {
        type: Date,
        default: Date.now,
      },

      updatedAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      _id: false,
    }
  );

const deliverySchema =
  new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      status: {
        type: String,
        enum: DELIVERY_STATUSES,
        default: "pending",
      },

      sentAt: {
        type: Date,
        default: null,
      },

      deliveredAt: {
        type: Date,
        default: null,
      },

      readAt: {
        type: Date,
        default: null,
      },

      failedAt: {
        type: Date,
        default: null,
      },

      failureReason: {
        type: String,
        trim: true,
        maxlength: 2000,
        default: null,
      },

      deviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Device",
        default: null,
      },

      attempts: {
        type: Number,
        min: 0,
        default: 0,
      },
    },
    {
      _id: false,
    }
  );

const mentionSchema =
  new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      displayName: {
        type: String,
        trim: true,
        maxlength: 300,
        default: null,
      },

      startIndex: {
        type: Number,
        min: 0,
        default: null,
      },

      endIndex: {
        type: Number,
        min: 0,
        default: null,
      },

      notified: {
        type: Boolean,
        default: false,
      },
    },
    {
      _id: false,
    }
  );

const replySchema =
  new mongoose.Schema(
    {
      messageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
        required: true,
      },

      senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      type: {
        type: String,
        enum: MESSAGE_TYPES,
        default: "text",
      },

      preview: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: null,
      },
    },
    {
      _id: false,
    }
  );

const locationSchema =
  new mongoose.Schema(
    {
      latitude: {
        type: Number,
        min: -90,
        max: 90,
        default: null,
      },

      longitude: {
        type: Number,
        min: -180,
        max: 180,
        default: null,
      },

      address: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: null,
      },

      name: {
        type: String,
        trim: true,
        maxlength: 300,
        default: null,
      },
    },
    {
      _id: false,
    }
  );

const contactPayloadSchema =
  new mongoose.Schema(
    {
      name: {
        type: String,
        trim: true,
        maxlength: 300,
        default: null,
      },

      phone: {
        type: String,
        trim: true,
        maxlength: 50,
        default: null,
      },

      email: {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: 320,
        default: null,
      },

      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      contactId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Contact",
        default: null,
      },
    },
    {
      _id: false,
    }
  );

const pollSchema =
  new mongoose.Schema(
    {
      question: {
        type: String,
        trim: true,
        maxlength: 1000,
        required: true,
      },

      options: {
        type: [
          {
            id: {
              type: String,
              trim: true,
              maxlength: 100,
              required: true,
            },

            label: {
              type: String,
              trim: true,
              maxlength: 500,
              required: true,
            },

            voteCount: {
              type: Number,
              min: 0,
              default: 0,
            },
          },
        ],
        default: [],
      },

      allowMultiple: {
        type: Boolean,
        default: false,
      },

      anonymous: {
        type: Boolean,
        default: false,
      },

      expiresAt: {
        type: Date,
        default: null,
      },

      closedAt: {
        type: Date,
        default: null,
      },
    },
    {
      _id: false,
    }
  );

const messageSchema =
  new mongoose.Schema(
    {
      /* ==================================================================== */
      /* TENANCY                                                             */
      /* ==================================================================== */

      instituteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
        index: true,
      },

      /* ==================================================================== */
      /* IDENTITY                                                            */
      /* ==================================================================== */

      messageCode: {
        type: String,
        trim: true,
        uppercase: true,
        maxlength: 100,
        index: true,
      },

      externalId: {
        type: String,
        trim: true,
        maxlength: 300,
        default: null,
      },

      idempotencyKey: {
        type: String,
        trim: true,
        maxlength: 300,
        default: null,
      },

      /* ==================================================================== */
      /* CONVERSATION                                                        */
      /* ==================================================================== */

      conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation",
        required: true,
        index: true,
      },

      /* ==================================================================== */
      /* SENDER                                                              */
      /* ==================================================================== */

      senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      senderName: {
        type: String,
        trim: true,
        maxlength: 300,
        default: null,
      },

      senderRole: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      deviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Device",
        default: null,
      },

      /* ==================================================================== */
      /* MESSAGE                                                             */
      /* ==================================================================== */

      type: {
        type: String,
        enum: MESSAGE_TYPES,
        default: "text",
        index: true,
      },

      status: {
        type: String,
        enum: MESSAGE_STATUSES,
        default: "sent",
        index: true,
      },

      text: {
        type: String,
        trim: true,
        maxlength: 50000,
        default: null,
      },

      formattedText: {
        type: String,
        trim: true,
        maxlength: 50000,
        default: null,
      },

      language: {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: 20,
        default: null,
      },

      /* ==================================================================== */
      /* REPLY / THREAD                                                      */
      /* ==================================================================== */

      replyTo: {
        type: replySchema,
        default: null,
      },

      threadRootId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
        default: null,
        index: true,
      },

      threadReplyCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      forwardedFrom: {
        messageId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Message",
          default: null,
        },

        conversationId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Conversation",
          default: null,
        },

        senderId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },

        originalCreatedAt: {
          type: Date,
          default: null,
        },
      },

      forwardCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      /* ==================================================================== */
      /* CONTENT                                                              */
      /* ==================================================================== */

      attachments: {
        type: [attachmentSchema],
        default: [],
      },

      location: {
        type: locationSchema,
        default: null,
      },

      contact: {
        type: contactPayloadSchema,
        default: null,
      },

      poll: {
        type: pollSchema,
        default: null,
      },

      /* ==================================================================== */
      /* MENTIONS                                                             */
      /* ==================================================================== */

      mentions: {
        type: [mentionSchema],
        default: [],
      },

      /* ==================================================================== */
      /* REACTIONS                                                            */
      /* ==================================================================== */

      reactions: {
        type: [reactionSchema],
        default: [],
      },

      reactionSummary: {
        type: Map,
        of: Number,
        default: {},
      },

      /* ==================================================================== */
      /* DELIVERY                                                             */
      /* ==================================================================== */

      delivery: {
        type: [deliverySchema],
        default: [],
      },

      deliveredCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      readCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      /* ==================================================================== */
      /* EDIT / DELETE                                                        */
      /* ==================================================================== */

      editHistory: {
        type: [
          {
            previousText: {
              type: String,
              maxlength: 50000,
            },

            editedAt: {
              type: Date,
              default: Date.now,
            },

            editedBy: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
              default: null,
            },
          },
        ],
        default: [],
      },

      editedAt: {
        type: Date,
        default: null,
      },

      editedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      deletedAt: {
        type: Date,
        default: null,
      },

      deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      deletionReason: {
        type: String,
        trim: true,
        maxlength: 2000,
        default: null,
      },

      deletionMode: {
        type: String,
        enum: [
          "soft",
          "hard",
          "moderation",
          "retention",
        ],
        default: "soft",
      },

      /* ==================================================================== */
      /* MODERATION                                                           */
      /* ==================================================================== */

      moderation: {
        flagged: {
          type: Boolean,
          default: false,
          index: true,
        },

        flagReason: {
          type: String,
          trim: true,
          maxlength: 2000,
          default: null,
        },

        flaggedAt: {
          type: Date,
          default: null,
        },

        flaggedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },

        reviewed: {
          type: Boolean,
          default: false,
        },

        reviewedAt: {
          type: Date,
          default: null,
        },

        reviewedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },

        action: {
          type: String,
          enum: [
            "none",
            "warn",
            "hide",
            "delete",
            "block",
          ],
          default: "none",
        },

        score: {
          type: Number,
          min: 0,
          max: 1,
          default: null,
        },
      },

      /* ==================================================================== */
      /* SECURITY                                                             */
      /* ==================================================================== */

      security: {
        encrypted: {
          type: Boolean,
          default: false,
        },

        encryptionVersion: {
          type: String,
          trim: true,
          maxlength: 50,
          default: null,
        },

        contentHash: {
          type: String,
          trim: true,
          maxlength: 200,
          default: null,
        },

        clientMessageId: {
          type: String,
          trim: true,
          maxlength: 300,
          default: null,
        },

        signature: {
          type: String,
          trim: true,
          maxlength: 2000,
          default: null,
        },
      },

      /* ==================================================================== */
      /* SYSTEM CONTEXT                                                       */
      /* ==================================================================== */

      source: {
        type: String,
        trim: true,
        maxlength: 100,
        default: "app",
      },

      correlationId: {
        type: String,
        trim: true,
        maxlength: 200,
        default: null,
        index: true,
      },

      /* ==================================================================== */
      /* METADATA                                                             */
      /* ==================================================================== */

      tags: {
        type: [
          {
            type: String,
            trim: true,
            lowercase: true,
            maxlength: 100,
          },
        ],
        default: [],
      },

      metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },

      /* ==================================================================== */
      /* RETENTION                                                            */
      /* ==================================================================== */

      expiresAt: {
        type: Date,
        default: null,
        index: true,
      },

      legalHold: {
        type: Boolean,
        default: false,
        index: true,
      },
    },
    {
      timestamps: true,
      versionKey: true,

      toJSON: {
        virtuals: true,
      },

      toObject: {
        virtuals: true,
      },
    }
  );

/* ============================================================================
 * INDEXES
 * ========================================================================== */

messageSchema.index(
  {
    instituteId: 1,
    messageCode: 1,
  },
  {
    unique: true,
    sparse: true,
    name: "tenant_message_code",
  }
);

messageSchema.index(
  {
    instituteId: 1,
    conversationId: 1,
    createdAt: -1,
  },
  {
    name: "conversation_messages",
  }
);

messageSchema.index(
  {
    instituteId: 1,
    conversationId: 1,
    status: 1,
    createdAt: -1,
  },
  {
    name: "conversation_message_status",
  }
);

messageSchema.index(
  {
    instituteId: 1,
    senderId: 1,
    createdAt: -1,
  },
  {
    name: "sender_messages",
  }
);

messageSchema.index(
  {
    instituteId: 1,
    threadRootId: 1,
    createdAt: 1,
  },
  {
    sparse: true,
    name: "message_threads",
  }
);

messageSchema.index(
  {
    instituteId: 1,
    "moderation.flagged": 1,
    "moderation.reviewed": 1,
    createdAt: -1,
  },
  {
    name: "moderation_queue",
  }
);

messageSchema.index(
  {
    instituteId: 1,
    correlationId: 1,
  },
  {
    sparse: true,
    name: "message_correlation",
  }
);

messageSchema.index(
  {
    instituteId: 1,
    expiresAt: 1,
  },
  {
    sparse: true,
    name: "message_expiration",
  }
);

messageSchema.index(
  {
    instituteId: 1,
    text: "text",
  },
  {
    name: "message_text_search",
  }
);

/* ============================================================================
 * VALIDATION
 * ========================================================================== */

messageSchema.pre(
  "validate",
  function (next) {
    if (
      this.attachments.length >
      50
    ) {
      return next(
        new Error(
          "Message cannot contain more than 50 attachments"
        )
      );
    }

    if (
      this.mentions.length >
      100
    ) {
      return next(
        new Error(
          "Message cannot contain more than 100 mentions"
        )
      );
    }

    if (
      this.reactions.length >
      500
    ) {
      return next(
        new Error(
          "Message cannot contain more than 500 reactions"
        )
      );
    }

    if (
      this.delivery.length >
      10000
    ) {
      return next(
        new Error(
          "Message cannot contain more than 10000 delivery records"
        )
      );
    }

    if (
      this.editHistory.length >
      100
    ) {
      return next(
        new Error(
          "Message cannot contain more than 100 edit history records"
        )
      );
    }

    if (
      this.tags.length >
      100
    ) {
      return next(
        new Error(
          "Message cannot contain more than 100 tags"
        )
      );
    }

    const contentTypes = [
      "text",
      "image",
      "video",
      "audio",
      "file",
      "document",
      "voice",
      "location",
      "contact",
      "sticker",
      "poll",
    ];

    if (
      contentTypes.includes(
        this.type
      )
    ) {
      const hasContent =
        Boolean(
          this.text
        ) ||
        this.attachments.length >
          0 ||
        Boolean(
          this.location
        ) ||
        Boolean(
          this.contact
        ) ||
        Boolean(
          this.poll
        );

      if (
        !hasContent
      ) {
        return next(
          new Error(
            "Message content is required"
          )
        );
      }
    }

    if (
      this.type ===
        "poll" &&
      (
        !this.poll ||
        this.poll.options.length <
          2
      )
    ) {
      return next(
        new Error(
          "Poll messages require at least two options"
        )
      );
    }

    if (
      this.type ===
        "text" &&
      !this.text
    ) {
      return next(
        new Error(
          "Text message requires text content"
        )
      );
    }

    if (
      this.status ===
        "read" &&
      this.readCount ===
        0 &&
      this.delivery.length
    ) {
      this.readCount =
        this.delivery.filter(
          (item) =>
            item.status ===
              "read" ||
            item.readAt
        ).length;
    }

    next();
  }
);

/* ============================================================================
 * VIRTUALS
 * ========================================================================== */

messageSchema.virtual(
  "isEdited"
).get(function () {
  return Boolean(
    this.editedAt
  );
});

messageSchema.virtual(
  "isDeleted"
).get(function () {
  return (
    this.status ===
      "deleted" ||
    Boolean(
      this.deletedAt
    )
  );
});

messageSchema.virtual(
  "isThreadReply"
).get(function () {
  return Boolean(
    this.threadRootId
  );
});

messageSchema.virtual(
  "hasAttachments"
).get(function () {
  return (
    this.attachments.length >
    0
  );
});

messageSchema.virtual(
  "hasReactions"
).get(function () {
  return (
    this.reactions.length >
    0
  );
});

messageSchema.virtual(
  "preview"
).get(function () {
  if (
    this.text
  ) {
    return this.text.slice(
      0,
      500
    );
  }

  if (
    this.attachments.length
  ) {
    return `${this.type}: ${this.attachments[0].name || "attachment"}`;
  }

  if (
    this.type ===
    "location"
  ) {
    return "Location";
  }

  if (
    this.type ===
    "contact"
  ) {
    return "Contact";
  }

  if (
    this.type ===
    "poll"
  ) {
    return this.poll?.question ||
      "Poll";
  }

  return this.type;
});

/* ============================================================================
 * QUERY HELPERS
 * ========================================================================== */

messageSchema.query.byInstitute =
  function (
    instituteId
  ) {
    return this.where({
      instituteId,
    });
  };

messageSchema.query.byConversation =
  function (
    conversationId
  ) {
    return this.where({
      conversationId,
    });
  };

messageSchema.query.visible =
  function () {
    return this.where({
      status: {
        $nin: [
          "deleted",
          "hidden",
        ],
      },
    });
  };

messageSchema.query.bySender =
  function (
    senderId
  ) {
    return this.where({
      senderId,
    });
  };

messageSchema.query.thread =
  function (
    threadRootId
  ) {
    return this.where({
      threadRootId,
    });
  };

messageSchema.query.flagged =
  function () {
    return this.where({
      "moderation.flagged":
        true,
      "moderation.reviewed":
        false,
    });
  };

/* ============================================================================
 * INSTANCE METHODS
 * ========================================================================== */

messageSchema.methods.edit =
  async function ({
    text,
    editedBy = null,
  } = {}) {
    if (
      this.isDeleted
    ) {
      throw new Error(
        "Deleted message cannot be edited"
      );
    }

    if (
      this.type !==
        "text" &&
      this.type !==
        "announcement"
    ) {
      throw new Error(
        "Only text messages can be edited"
      );
    }

    if (
      !text ||
      !String(
        text
      ).trim()
    ) {
      throw new Error(
        "Message text is required"
      );
    }

    if (
      this.editHistory.length >=
      100
    ) {
      throw new Error(
        "Maximum edit history limit reached"
      );
    }

    this.editHistory.push({
      previousText:
        this.text,
      editedAt:
        new Date(),
      editedBy,
    });

    this.text =
      String(text).trim();

    this.editedAt =
      new Date();

    this.editedBy =
      editedBy;

    return this.save();
  };

messageSchema.methods.softDelete =
  async function ({
    deletedBy = null,
    reason = null,
    mode = "soft",
  } = {}) {
    this.status =
      "deleted";

    this.deletedAt =
      new Date();

    this.deletedBy =
      deletedBy;

    this.deletionReason =
      reason;

    this.deletionMode =
      mode;

    return this.save();
  };

messageSchema.methods.restore =
  async function () {
    if (
      this.deletionMode ===
      "hard"
    ) {
      throw new Error(
        "Hard-deleted message cannot be restored"
      );
    }

    this.status =
      "sent";

    this.deletedAt =
      null;

    this.deletedBy =
      null;

    this.deletionReason =
      null;

    return this.save();
  };

messageSchema.methods.addReaction =
  async function ({
    userId,
    type = "custom",
    emoji = null,
  } = {}) {
    if (
      !userId
    ) {
      throw new Error(
        "User ID is required"
      );
    }

    const existing =
      this.reactions.find(
        (reaction) =>
          reaction.userId.equals(
            userId
          )
      );

    if (
      existing
    ) {
      const oldType =
        existing.type;

      if (
        oldType !==
        type
      ) {
        const oldKey =
          oldType ===
          "custom"
            ? `custom:${existing.emoji || ""}`
            : oldType;

        const newKey =
          type ===
          "custom"
            ? `custom:${emoji || ""}`
            : type;

        const oldCount =
          this.reactionSummary.get(
            oldKey
          ) || 0;

        this.reactionSummary.set(
          oldKey,
          Math.max(
            0,
            oldCount - 1
          )
        );

        const newCount =
          this.reactionSummary.get(
            newKey
          ) || 0;

        this.reactionSummary.set(
          newKey,
          newCount + 1
        );
      }

      existing.type =
        type;

      existing.emoji =
        emoji;

      existing.updatedAt =
        new Date();

      return this.save();
    }

    if (
      this.reactions.length >=
      500
    ) {
      throw new Error(
        "Maximum reaction limit reached"
      );
    }

    this.reactions.push({
      userId,
      type,
      emoji,
      createdAt:
        new Date(),
      updatedAt:
        new Date(),
    });

    const key =
      type ===
      "custom"
        ? `custom:${emoji || ""}`
        : type;

    const count =
      this.reactionSummary.get(
        key
      ) || 0;

    this.reactionSummary.set(
      key,
      count + 1
    );

    return this.save();
  };

messageSchema.methods.removeReaction =
  async function (
    userId
  ) {
    const index =
      this.reactions.findIndex(
        (reaction) =>
          reaction.userId.equals(
            userId
          )
      );

    if (
      index === -1
    ) {
      return this;
    }

    const reaction =
      this.reactions[
        index
      ];

    const key =
      reaction.type ===
      "custom"
        ? `custom:${reaction.emoji || ""}`
        : reaction.type;

    const count =
      this.reactionSummary.get(
        key
      ) || 0;

    this.reactionSummary.set(
      key,
      Math.max(
        0,
        count - 1
      )
    );

    this.reactions.splice(
      index,
      1
    );

    return this.save();
  };

messageSchema.methods.markDelivered =
  async function (
    userId,
    deviceId = null
  ) {
    let delivery =
      this.delivery.find(
        (item) =>
          item.userId.equals(
            userId
          )
      );

    if (
      !delivery
    ) {
      if (
        this.delivery.length >=
        10000
      ) {
        throw new Error(
          "Maximum delivery record limit reached"
        );
      }

      this.delivery.push({
        userId,
        status:
          "delivered",
        sentAt:
          new Date(),
        deliveredAt:
          new Date(),
        deviceId,
        attempts: 1,
      });
    } else {
      delivery.status =
        "delivered";

      delivery.deliveredAt =
        delivery.deliveredAt ||
        new Date();

      delivery.deviceId =
        deviceId ||
        delivery.deviceId;

      delivery.attempts +=
        1;
    }

    this.deliveredCount =
      this.delivery.filter(
        (item) =>
          item.status ===
            "delivered" ||
          item.status ===
            "read"
      ).length;

    return this.save();
  };

messageSchema.methods.markRead =
  async function (
    userId
  ) {
    let delivery =
      this.delivery.find(
        (item) =>
          item.userId.equals(
            userId
          )
      );

    if (
      !delivery
    ) {
      this.delivery.push({
        userId,
        status:
          "read",
        sentAt:
          new Date(),
        deliveredAt:
          new Date(),
        readAt:
          new Date(),
        attempts: 1,
      });
    } else {
      delivery.status =
        "read";

      delivery.deliveredAt =
        delivery.deliveredAt ||
        new Date();

      delivery.readAt =
        delivery.readAt ||
        new Date();
    }

    this.readCount =
      this.delivery.filter(
        (item) =>
          item.status ===
            "read" ||
          item.readAt
      ).length;

    return this.save();
  };

messageSchema.methods.markFailed =
  async function (
    userId,
    reason = null
  ) {
    const delivery =
      this.delivery.find(
        (item) =>
          item.userId.equals(
            userId
          )
      );

    if (
      !delivery
    ) {
      this.delivery.push({
        userId,
        status:
          "failed",
        failedAt:
          new Date(),
        failureReason:
          reason,
        attempts: 1,
      });
    } else {
      delivery.status =
        "failed";

      delivery.failedAt =
        new Date();

      delivery.failureReason =
        reason;

      delivery.attempts +=
        1;
    }

    return this.save();
  };

messageSchema.methods.flag =
  async function ({
    reason = null,
    flaggedBy = null,
    score = null,
  } = {}) {
    this.moderation.flagged =
      true;

    this.moderation.flagReason =
      reason;

    this.moderation.flaggedAt =
      new Date();

    this.moderation.flaggedBy =
      flaggedBy;

    this.moderation.reviewed =
      false;

    this.moderation.score =
      score;

    return this.save();
  };

messageSchema.methods.reviewModeration =
  async function ({
    reviewedBy = null,
    action = "none",
  } = {}) {
    this.moderation.reviewed =
      true;

    this.moderation.reviewedAt =
      new Date();

    this.moderation.reviewedBy =
      reviewedBy;

    this.moderation.action =
      action;

    if (
      action ===
      "hide"
    ) {
      this.status =
        "hidden";
    }

    if (
      action ===
      "delete"
    ) {
      this.status =
        "deleted";

      this.deletedAt =
        new Date();

      this.deletedBy =
        reviewedBy;
    }

    return this.save();
  };

messageSchema.methods.addMention =
  async function (
    userId,
    displayName = null,
    startIndex = null,
    endIndex = null
  ) {
    if (
      this.mentions.some(
        (mention) =>
          mention.userId.equals(
            userId
          )
      )
    ) {
      return this;
    }

    if (
      this.mentions.length >=
      100
    ) {
      throw new Error(
        "Maximum mention limit reached"
      );
    }

    this.mentions.push({
      userId,
      displayName,
      startIndex,
      endIndex,
      notified: false,
    });

    return this.save();
  };

messageSchema.methods.markMentionNotified =
  async function (
    userId
  ) {
    const mention =
      this.mentions.find(
        (item) =>
          item.userId.equals(
            userId
          )
      );

    if (
      !mention
    ) {
      throw new Error(
        "Mention not found"
      );
    }

    mention.notified =
      true;

    return this.save();
  };

messageSchema.methods.addAttachment =
  async function (
    attachment
  ) {
    if (
      this.attachments.length >=
      50
    ) {
      throw new Error(
        "Maximum attachment limit reached"
      );
    }

    this.attachments.push(
      attachment
    );

    return this.save();
  };

messageSchema.methods.incrementThreadReplyCount =
  async function () {
    this.threadReplyCount +=
      1;

    return this.save();
  };

messageSchema.methods.setLegalHold =
  async function (
    enabled = true
  ) {
    this.legalHold =
      enabled;

    return this.save();
  };

/* ============================================================================
 * STATIC METHODS
 * ========================================================================== */

messageSchema.statics.findForConversation =
  function (
    instituteId,
    conversationId,
    {
      limit = 50,
      before = null,
      after = null,
    } = {}
  ) {
    const query = {
      instituteId,
      conversationId,
      status: {
        $nin: [
          "hidden",
        ],
      },
    };

    if (
      before
    ) {
      query.createdAt = {
        $lt: before,
      };
    }

    if (
      after
    ) {
      query.createdAt = {
        $gt: after,
      };
    }

    return this.find(
      query
    )
      .sort({
        createdAt: -1,
      })
      .limit(
        Math.min(
          100,
          Math.max(
            1,
            limit
          )
        )
      );
  };

messageSchema.statics.findThread =
  function (
    instituteId,
    threadRootId,
    limit = 100
  ) {
    return this.find({
      instituteId,
      threadRootId,
      status: {
        $nin: [
          "hidden",
        ],
      },
    })
      .sort({
        createdAt: 1,
      })
      .limit(limit);
  };

messageSchema.statics.findUnreadForUser =
  function (
    instituteId,
    conversationId,
    userId
  ) {
    return this.find({
      instituteId,
      conversationId,
      senderId: {
        $ne: userId,
      },
      "delivery": {
        $elemMatch: {
          userId,
          status: {
            $nin: [
              "read",
            ],
          },
        },
      },
      status: {
        $nin: [
          "deleted",
          "hidden",
        ],
      },
    }).sort({
      createdAt: 1,
    });
  };

messageSchema.statics.findPendingDelivery =
  function (
    instituteId,
    userId,
    limit = 100
  ) {
    return this.find({
      instituteId,
      "delivery": {
        $elemMatch: {
          userId,
          status: "pending",
        },
      },
      status: {
        $nin: [
          "deleted",
          "hidden",
        ],
      },
    })
      .sort({
        createdAt: 1,
      })
      .limit(limit);
  };

messageSchema.statics.findFlagged =
  function (
    instituteId,
    limit = 100
  ) {
    return this.find({
      instituteId,
      "moderation.flagged":
        true,
      "moderation.reviewed":
        false,
    })
      .sort({
        createdAt: 1,
      })
      .limit(limit);
  };

/* ============================================================================
 * MODEL
 * ========================================================================== */

export const Message =
  mongoose.models.Message ||
  mongoose.model(
    "Message",
    messageSchema
  );

export {
  MESSAGE_TYPES,
  MESSAGE_STATUSES,
  DELIVERY_STATUSES,
  REACTION_TYPES,
};