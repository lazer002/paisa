// server/src/models/Conversation.js

import mongoose from "mongoose";

import crypto from "node:crypto";
const CONVERSATION_TYPES = [
  "direct",
  "group",
  "support",
  "crm",
  "announcement",
  "system",
];

const CONVERSATION_STATUSES = [
  "active",
  "archived",
  "closed",
  "blocked",
];

const PARTICIPANT_ROLES = [
  "owner",
  "admin",
  "member",
  "agent",
  "viewer",
];

const PARTICIPANT_STATUSES = [
  "active",
  "left",
  "removed",
  "blocked",
];

const MESSAGE_POLICIES = [
  "everyone",
  "members",
  "admins",
];

const participantSchema =
  new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      role: {
        type: String,
        enum: PARTICIPANT_ROLES,
        default: "member",
      },

      status: {
        type: String,
        enum: PARTICIPANT_STATUSES,
        default: "active",
      },

      joinedAt: {
        type: Date,
        default: Date.now,
      },

      leftAt: {
        type: Date,
        default: null,
      },

      removedAt: {
        type: Date,
        default: null,
      },

      removedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      lastReadAt: {
        type: Date,
        default: null,
      },

      lastReadMessageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
        default: null,
      },

      lastDeliveredAt: {
        type: Date,
        default: null,
      },

      lastDeliveredMessageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
        default: null,
      },

      unreadCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      muted: {
        type: Boolean,
        default: false,
      },

      mutedUntil: {
        type: Date,
        default: null,
      },

      notificationsEnabled: {
        type: Boolean,
        default: true,
      },

      pinned: {
        type: Boolean,
        default: false,
      },

      nickname: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },
    },
    {
      _id: false,
    }
  );

const participantSnapshotSchema =
  new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      name: {
        type: String,
        trim: true,
        maxlength: 300,
        default: null,
      },

      avatar: {
        type: String,
        trim: true,
        maxlength: 2000,
        default: null,
      },

      role: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },
    },
    {
      _id: false,
    }
  );

const lastMessageSchema =
  new mongoose.Schema(
    {
      messageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
        default: null,
      },

      senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      senderName: {
        type: String,
        trim: true,
        maxlength: 300,
        default: null,
      },

      type: {
        type: String,
        trim: true,
        maxlength: 100,
        default: "text",
      },

      preview: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: null,
      },

      createdAt: {
        type: Date,
        default: null,
      },

      isDeleted: {
        type: Boolean,
        default: false,
      },
    },
    {
      _id: false,
    }
  );

const settingsSchema =
  new mongoose.Schema(
    {
      messagePolicy: {
        type: String,
        enum: MESSAGE_POLICIES,
        default: "members",
      },

      allowReplies: {
        type: Boolean,
        default: true,
      },

      allowAttachments: {
        type: Boolean,
        default: true,
      },

      allowLinks: {
        type: Boolean,
        default: true,
      },

      allowReactions: {
        type: Boolean,
        default: true,
      },

      allowMessageEditing: {
        type: Boolean,
        default: true,
      },

      allowMessageDeletion: {
        type: Boolean,
        default: true,
      },

      allowForwarding: {
        type: Boolean,
        default: true,
      },

      allowThreadReplies: {
        type: Boolean,
        default: true,
      },

      allowMentions: {
        type: Boolean,
        default: true,
      },

      allowPinning: {
        type: Boolean,
        default: true,
      },

      allowParticipantChanges: {
        type: Boolean,
        default: true,
      },

      typingIndicators: {
        type: Boolean,
        default: true,
      },

      readReceipts: {
        type: Boolean,
        default: true,
      },

      deliveryReceipts: {
        type: Boolean,
        default: true,
      },

      disappearingMessages: {
        enabled: {
          type: Boolean,
          default: false,
        },

        durationSeconds: {
          type: Number,
          min: 60,
          max: 31536000,
          default: null,
        },
      },
    },
    {
      _id: false,
    }
  );

const crmContextSchema =
  new mongoose.Schema(
    {
      leadId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lead",
        default: null,
      },

      dealId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Deal",
        default: null,
      },

      contactId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Contact",
        default: null,
      },

      customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        default: null,
      },

      studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
        default: null,
      },

      employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        default: null,
      },

      enrollmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Enrollment",
        default: null,
      },

      assignedAgentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
        default: null,
      },
    },
    {
      _id: false,
    }
  );

const conversationSchema =
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
publicId: {
  type: String,
  required: true,
  unique: true,
  immutable: true,
  index: true,
  default: () =>
    `conv_${crypto.randomBytes(16).toString("base64url")}`,
},
      /* ==================================================================== */
      /* IDENTITY                                                            */
      /* ==================================================================== */

      conversationCode: {
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

      type: {
        type: String,
        enum: CONVERSATION_TYPES,
        default: "direct",
        index: true,
      },

      status: {
        type: String,
        enum: CONVERSATION_STATUSES,
        default: "active",
        index: true,
      },

      title: {
        type: String,
        trim: true,
        maxlength: 500,
        default: null,
      },

      description: {
        type: String,
        trim: true,
        maxlength: 3000,
        default: null,
      },

      avatar: {
        type: String,
        trim: true,
        maxlength: 2000,
        default: null,
      },

      /* ==================================================================== */
      /* PARTICIPANTS                                                        */
      /* ==================================================================== */

      participants: {
        type: [participantSchema],
        default: [],
      },

      participantSnapshots: {
        type: [participantSnapshotSchema],
        default: [],
      },

      participantCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      /* ==================================================================== */
      /* OWNERSHIP                                                           */
      /* ==================================================================== */

      ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
        index: true,
      },

      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      /* ==================================================================== */
      /* CRM CONTEXT                                                         */
      /* ==================================================================== */

      crm: {
        type: crmContextSchema,
        default: () => ({}),
      },

      /* ==================================================================== */
      /* MESSAGE SNAPSHOT                                                    */
      /* ==================================================================== */

      lastMessage: {
        type: lastMessageSchema,
        default: () => ({}),
      },

      messageCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      attachmentCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      /* ==================================================================== */
      /* SETTINGS                                                            */
      /* ==================================================================== */

      settings: {
        type: settingsSchema,
        default: () => ({}),
      },

      /* ==================================================================== */
      /* MODERATION                                                          */
      /* ==================================================================== */

      moderation: {
        enabled: {
          type: Boolean,
          default: false,
        },

        blockedUsers: {
          type: [
            {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
            },
          ],
          default: [],
        },

        restrictedWords: {
          type: [String],
          default: [],
        },

        requireApproval: {
          type: Boolean,
          default: false,
        },

        lastModeratedAt: {
          type: Date,
          default: null,
        },

        lastModeratedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },
      },

      /* ==================================================================== */
      /* SEARCH / DISCOVERY                                                   */
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

      customFields: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: {},
      },

      metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },

      /* ==================================================================== */
      /* ACTIVITY                                                             */
      /* ==================================================================== */

      lastActivityAt: {
        type: Date,
        default: null,
        index: true,
      },

      lastReadActivityAt: {
        type: Date,
        default: null,
      },

      /* ==================================================================== */
      /* AUDIT                                                               */
      /* ==================================================================== */

      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      archivedAt: {
        type: Date,
        default: null,
      },

      archivedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      closedAt: {
        type: Date,
        default: null,
      },

      closedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      closeReason: {
        type: String,
        trim: true,
        maxlength: 2000,
        default: null,
      },

      isDeleted: {
        type: Boolean,
        default: false,
        index: true,
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

conversationSchema.index(
  {
    instituteId: 1,
    conversationCode: 1,
  },
  {
    unique: true,
    sparse: true,
    name: "tenant_conversation_code",
  }
);

conversationSchema.index(
  {
    instituteId: 1,
    type: 1,
    status: 1,
    lastActivityAt: -1,
  },
  {
    name: "conversation_listing",
  }
);

conversationSchema.index(
  {
    instituteId: 1,
    "participants.userId": 1,
    "participants.status": 1,
    lastActivityAt: -1,
  },
  {
    name: "user_conversations",
  }
);

conversationSchema.index(
  {
    instituteId: 1,
    ownerId: 1,
    status: 1,
    lastActivityAt: -1,
  },
  {
    sparse: true,
    name: "owner_conversations",
  }
);

conversationSchema.index(
  {
    instituteId: 1,
    "crm.leadId": 1,
    lastActivityAt: -1,
  },
  {
    sparse: true,
    name: "lead_conversations",
  }
);

conversationSchema.index(
  {
    instituteId: 1,
    "crm.dealId": 1,
    lastActivityAt: -1,
  },
  {
    sparse: true,
    name: "deal_conversations",
  }
);

conversationSchema.index(
  {
    instituteId: 1,
    "crm.contactId": 1,
    lastActivityAt: -1,
  },
  {
    sparse: true,
    name: "contact_conversations",
  }
);

conversationSchema.index(
  {
    instituteId: 1,
    "crm.customerId": 1,
    lastActivityAt: -1,
  },
  {
    sparse: true,
    name: "customer_conversations",
  }
);

conversationSchema.index(
  {
    instituteId: 1,
    "crm.studentId": 1,
    lastActivityAt: -1,
  },
  {
    sparse: true,
    name: "student_conversations",
  }
);

conversationSchema.index(
  {
    instituteId: 1,
    tags: 1,
    lastActivityAt: -1,
  },
  {
    name: "conversation_tags",
  }
);

conversationSchema.index(
  {
    instituteId: 1,
    title: "text",
    description: "text",
    "lastMessage.preview": "text",
  },
  {
    name: "conversation_search",
    weights: {
      title: 10,
      description: 5,
      "lastMessage.preview": 3,
    },
  }
);

/* ============================================================================
 * VALIDATION
 * ========================================================================== */

conversationSchema.pre(
  "validate",
  function (next) {
    const participantLimit =
      this.type === "direct"
        ? 2
        : 10000;

    if (
      this.participants.length >
      participantLimit
    ) {
      return next(
        new Error(
          `Conversation cannot contain more than ${participantLimit} participants`
        )
      );
    }

    if (
      this.tags.length >
      100
    ) {
      return next(
        new Error(
          "Conversation cannot contain more than 100 tags"
        )
      );
    }

    if (
      this.moderation.blockedUsers
        .length >
      1000
    ) {
      return next(
        new Error(
          "Conversation cannot contain more than 1000 blocked users"
        )
      );
    }

    if (
      this.moderation.restrictedWords
        .length >
      1000
    ) {
      return next(
        new Error(
          "Conversation cannot contain more than 1000 restricted words"
        )
      );
    }

    const participantIds =
      new Set();

    for (
      const participant of this
        .participants
    ) {
      const key =
        String(
          participant.userId
        );

      if (
        participantIds.has(
          key
        )
      ) {
        return next(
          new Error(
            "Duplicate conversation participant"
          )
        );
      }

      participantIds.add(
        key
      );
    }

    this.participantCount =
      this.participants.filter(
        (participant) =>
          participant.status ===
          "active"
      ).length;

    if (
      this.status ===
        "closed" &&
      !this.closedAt
    ) {
      this.closedAt =
        new Date();
    }

    if (
      this.status ===
        "archived" &&
      !this.archivedAt
    ) {
      this.archivedAt =
        new Date();
    }

    next();
  }
);

/* ============================================================================
 * VIRTUALS
 * ========================================================================== */

conversationSchema.virtual(
  "isActive"
).get(function () {
  return (
    this.status ===
      "active" &&
    !this.isDeleted
  );
});

conversationSchema.virtual(
  "isClosed"
).get(function () {
  return (
    this.status ===
      "closed"
  );
});

conversationSchema.virtual(
  "isArchived"
).get(function () {
  return (
    this.status ===
      "archived"
  );
});

conversationSchema.virtual(
  "activeParticipants"
).get(function () {
  return this.participants.filter(
    (participant) =>
      participant.status ===
      "active"
  );
});

conversationSchema.virtual(
  "hasMessages"
).get(function () {
  return (
    this.messageCount >
    0
  );
});

/* ============================================================================
 * QUERY HELPERS
 * ========================================================================== */

conversationSchema.query.byInstitute =
  function (
    instituteId
  ) {
    return this.where({
      instituteId,
      isDeleted: false,
    });
  };

conversationSchema.query.active =
  function () {
    return this.where({
      status: "active",
      isDeleted: false,
    });
  };

conversationSchema.query.byUser =
  function (
    userId
  ) {
    return this.where({
      "participants.userId":
        userId,
      "participants.status":
        "active",
      isDeleted: false,
    });
  };

conversationSchema.query.byLead =
  function (
    leadId
  ) {
    return this.where({
      "crm.leadId":
        leadId,
      isDeleted: false,
    });
  };

conversationSchema.query.byDeal =
  function (
    dealId
  ) {
    return this.where({
      "crm.dealId":
        dealId,
      isDeleted: false,
    });
  };

conversationSchema.query.byContact =
  function (
    contactId
  ) {
    return this.where({
      "crm.contactId":
        contactId,
      isDeleted: false,
    });
  };

conversationSchema.query.byCustomer =
  function (
    customerId
  ) {
    return this.where({
      "crm.customerId":
        customerId,
      isDeleted: false,
    });
  };

/* ============================================================================
 * INSTANCE METHODS
 * ========================================================================== */

conversationSchema.methods.addParticipant =
  async function ({
    userId,
    role = "member",
    nickname = null,
  } = {}) {
    if (
      !userId
    ) {
      throw new Error(
        "User ID is required"
      );
    }

    if (
      this.type === "direct" &&
      this.participants.length >=
        2
    ) {
      throw new Error(
        "Direct conversation cannot have more than two participants"
      );
    }

    const existing =
      this.participants.find(
        (participant) =>
          participant.userId.equals(
            userId
          )
      );

    if (
      existing
    ) {
      if (
        existing.status !==
        "active"
      ) {
        existing.status =
          "active";

        existing.joinedAt =
          new Date();

        existing.leftAt =
          null;

        existing.removedAt =
          null;

        existing.removedBy =
          null;

        existing.role =
          role;

        existing.nickname =
          nickname;
      }

      return this.save();
    }

    this.participants.push({
      userId,
      role,
      status: "active",
      joinedAt:
        new Date(),
      nickname,
    });

    this.participantCount =
      this.participants.filter(
        (participant) =>
          participant.status ===
          "active"
      ).length;

    this.lastActivityAt =
      new Date();

    return this.save();
  };

conversationSchema.methods.removeParticipant =
  async function ({
    userId,
    removedBy = null,
  } = {}) {
    const participant =
      this.participants.find(
        (item) =>
          item.userId.equals(
            userId
          ) &&
          item.status ===
            "active"
      );

    if (
      !participant
    ) {
      throw new Error(
        "Active participant not found"
      );
    }

    participant.status =
      "removed";

    participant.removedAt =
      new Date();

    participant.removedBy =
      removedBy;

    participant.leftAt =
      new Date();

    this.participantCount =
      this.participants.filter(
        (item) =>
          item.status ===
          "active"
      ).length;

    this.lastActivityAt =
      new Date();

    return this.save();
  };

conversationSchema.methods.leave =
  async function (
    userId
  ) {
    const participant =
      this.participants.find(
        (item) =>
          item.userId.equals(
            userId
          ) &&
          item.status ===
            "active"
      );

    if (
      !participant
    ) {
      throw new Error(
        "Active participant not found"
      );
    }

    participant.status =
      "left";

    participant.leftAt =
      new Date();

    this.participantCount =
      this.participants.filter(
        (item) =>
          item.status ===
          "active"
      ).length;

    this.lastActivityAt =
      new Date();

    return this.save();
  };

conversationSchema.methods.promoteParticipant =
  async function (
    userId,
    role = "admin"
  ) {
    const participant =
      this.participants.find(
        (item) =>
          item.userId.equals(
            userId
          ) &&
          item.status ===
            "active"
      );

    if (
      !participant
    ) {
      throw new Error(
        "Active participant not found"
      );
    }

    participant.role =
      role;

    return this.save();
  };

conversationSchema.methods.updateReadState =
  async function (
    userId,
    messageId = null
  ) {
    const participant =
      this.participants.find(
        (item) =>
          item.userId.equals(
            userId
          ) &&
          item.status ===
            "active"
      );

    if (
      !participant
    ) {
      throw new Error(
        "Active participant not found"
      );
    }

    participant.lastReadAt =
      new Date();

    if (
      messageId
    ) {
      participant.lastReadMessageId =
        messageId;
    }

    participant.unreadCount =
      0;

    this.lastReadActivityAt =
      new Date();

    return this.save();
  };

conversationSchema.methods.markDelivered =
  async function (
    userId,
    messageId = null
  ) {
    const participant =
      this.participants.find(
        (item) =>
          item.userId.equals(
            userId
          ) &&
          item.status ===
            "active"
      );

    if (
      !participant
    ) {
      throw new Error(
        "Active participant not found"
      );
    }

    participant.lastDeliveredAt =
      new Date();

    if (
      messageId
    ) {
      participant.lastDeliveredMessageId =
        messageId;
    }

    return this.save();
  };

conversationSchema.methods.incrementUnread =
  async function (
    senderId
  ) {
    this.participants.forEach(
      (participant) => {
        if (
          participant.status ===
            "active" &&
          !participant.userId.equals(
            senderId
          )
        ) {
          participant.unreadCount +=
            1;
        }
      }
    );

    return this.save();
  };

conversationSchema.methods.updateLastMessage =
  async function ({
    messageId,
    senderId,
    senderName = null,
    type = "text",
    preview = null,
    createdAt = new Date(),
  } = {}) {
    this.lastMessage = {
      messageId,
      senderId,
      senderName,
      type,
      preview,
      createdAt,
      isDeleted: false,
    };

    this.messageCount +=
      1;

    this.lastActivityAt =
      createdAt;

    return this.save();
  };

conversationSchema.methods.incrementAttachmentCount =
  async function (
    count = 1
  ) {
    this.attachmentCount =
      Math.max(
        0,
        this.attachmentCount +
          count
      );

    return this.save();
  };

conversationSchema.methods.muteUser =
  async function (
    userId,
    mutedUntil = null
  ) {
    const participant =
      this.participants.find(
        (item) =>
          item.userId.equals(
            userId
          )
      );

    if (
      !participant
    ) {
      throw new Error(
        "Participant not found"
      );
    }

    participant.muted =
      true;

    participant.mutedUntil =
      mutedUntil;

    return this.save();
  };

conversationSchema.methods.unmuteUser =
  async function (
    userId
  ) {
    const participant =
      this.participants.find(
        (item) =>
          item.userId.equals(
            userId
          )
      );

    if (
      !participant
    ) {
      throw new Error(
        "Participant not found"
      );
    }

    participant.muted =
      false;

    participant.mutedUntil =
      null;

    return this.save();
  };

conversationSchema.methods.blockUser =
  async function (
    userId
  ) {
    const exists =
      this.moderation.blockedUsers.some(
        (id) =>
          id.equals(
            userId
          )
      );

    if (
      !exists
    ) {
      if (
        this.moderation
          .blockedUsers.length >=
        1000
      ) {
        throw new Error(
          "Maximum blocked-user limit reached"
        );
      }

      this.moderation.blockedUsers.push(
        userId
      );
    }

    const participant =
      this.participants.find(
        (item) =>
          item.userId.equals(
            userId
          )
      );

    if (
      participant
    ) {
      participant.status =
        "blocked";

      participant.leftAt =
        new Date();
    }

    this.participantCount =
      this.participants.filter(
        (item) =>
          item.status ===
          "active"
      ).length;

    return this.save();
  };

conversationSchema.methods.unblockUser =
  async function (
    userId
  ) {
    this.moderation.blockedUsers =
      this.moderation.blockedUsers.filter(
        (id) =>
          !id.equals(
            userId
          )
      );

    return this.save();
  };

conversationSchema.methods.close =
  async function ({
    closedBy = null,
    reason = null,
  } = {}) {
    this.status =
      "closed";

    this.closedAt =
      new Date();

    this.closedBy =
      closedBy;

    this.closeReason =
      reason;

    this.lastActivityAt =
      new Date();

    return this.save();
  };

conversationSchema.methods.reopen =
  async function () {
    this.status =
      "active";

    this.closedAt =
      null;

    this.closedBy =
      null;

    this.closeReason =
      null;

    this.lastActivityAt =
      new Date();

    return this.save();
  };

conversationSchema.methods.archive =
  async function ({
    archivedBy = null,
  } = {}) {
    this.status =
      "archived";

    this.archivedAt =
      new Date();

    this.archivedBy =
      archivedBy;

    return this.save();
  };

conversationSchema.methods.restore =
  async function () {
    this.status =
      "active";

    this.archivedAt =
      null;

    this.archivedBy =
      null;

    this.isDeleted =
      false;

    this.deletedAt =
      null;

    this.deletedBy =
      null;

    return this.save();
  };

conversationSchema.methods.softDelete =
  async function ({
    deletedBy = null,
  } = {}) {
    this.isDeleted =
      true;

    this.deletedAt =
      new Date();

    this.deletedBy =
      deletedBy;

    return this.save();
  };

/* ============================================================================
 * STATIC METHODS
 * ========================================================================== */

conversationSchema.statics.findForUser =
  function (
    instituteId,
    userId,
    limit = 100,
    skip = 0
  ) {
    return this.find({
      instituteId,
      "participants.userId":
        userId,
      "participants.status":
        "active",
      isDeleted: false,
      status: {
        $in: [
          "active",
          "archived",
        ],
      },
    })
      .sort({
        lastActivityAt: -1,
      })
      .skip(skip)
      .limit(limit);
  };

conversationSchema.statics.findDirectConversation =
  async function (
    instituteId,
    userId,
    otherUserId
  ) {
    return this.findOne({
      instituteId,
      type: "direct",
      isDeleted: false,
      "participants.userId": {
        $all: [
          userId,
          otherUserId,
        ],
      },
      $expr: {
        $eq: [
          {
            $size:
              "$participants",
          },
          2,
        ],
      },
    });
  };

conversationSchema.statics.findForDeal =
  function (
    instituteId,
    dealId,
    limit = 100
  ) {
    return this.find({
      instituteId,
      "crm.dealId":
        dealId,
      isDeleted: false,
    })
      .sort({
        lastActivityAt: -1,
      })
      .limit(limit);
  };

conversationSchema.statics.findForLead =
  function (
    instituteId,
    leadId,
    limit = 100
  ) {
    return this.find({
      instituteId,
      "crm.leadId":
        leadId,
      isDeleted: false,
    })
      .sort({
        lastActivityAt: -1,
      })
      .limit(limit);
  };

conversationSchema.statics.findForContact =
  function (
    instituteId,
    contactId,
    limit = 100
  ) {
    return this.find({
      instituteId,
      "crm.contactId":
        contactId,
      isDeleted: false,
    })
      .sort({
        lastActivityAt: -1,
      })
      .limit(limit);
  };

conversationSchema.statics.findForCustomer =
  function (
    instituteId,
    customerId,
    limit = 100
  ) {
    return this.find({
      instituteId,
      "crm.customerId":
        customerId,
      isDeleted: false,
    })
      .sort({
        lastActivityAt: -1,
      })
      .limit(limit);
  };

conversationSchema.statics.findUnreadForUser =
  function (
    instituteId,
    userId,
    limit = 100
  ) {
    return this.find({
      instituteId,
      "participants": {
        $elemMatch: {
          userId,
          status: "active",
          unreadCount: {
            $gt: 0,
          },
        },
      },
      isDeleted: false,
      status: "active",
    })
      .sort({
        lastActivityAt: -1,
      })
      .limit(limit);
  };

/* ============================================================================
 * MODEL
 * ========================================================================== */

export const Conversation =
  mongoose.models.Conversation ||
  mongoose.model(
    "Conversation",
    conversationSchema
  );

export {
  CONVERSATION_TYPES,
  CONVERSATION_STATUSES,
  PARTICIPANT_ROLES,
  PARTICIPANT_STATUSES,
  MESSAGE_POLICIES,
};
