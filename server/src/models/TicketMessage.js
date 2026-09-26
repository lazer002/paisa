// server/src/models/TicketMessage.js

import mongoose from "mongoose";

const TICKET_MESSAGE_TYPES = [
  "text",
  "internal_note",
  "system",
  "attachment",
  "email",
  "phone",
  "sms",
  "whatsapp",
  "template",
];

const TICKET_MESSAGE_STATUSES = [
  "draft",
  "sent",
  "delivered",
  "read",
  "failed",
  "deleted",
  "hidden",
];

const TICKET_MESSAGE_SOURCES = [
  "web",
  "mobile",
  "email",
  "phone",
  "chat",
  "crm",
  "api",
  "system",
  "internal",
];

const attachmentSchema = new mongoose.Schema(
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
      required: true,
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

    checksum: {
      type: String,
      trim: true,
      maxlength: 200,
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

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true,
  }
);

const recipientSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 320,
      default: null,
    },

    phone: {
      type: String,
      trim: true,
      maxlength: 50,
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

const deliverySchema = new mongoose.Schema(
  {
    channel: {
      type: String,
      enum: [
        "in_app",
        "email",
        "sms",
        "whatsapp",
      ],
      default: "in_app",
    },

    status: {
      type: String,
      enum: [
        "pending",
        "sent",
        "delivered",
        "read",
        "failed",
      ],
      default: "pending",
    },

    provider: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    providerMessageId: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
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

    attempts: {
      type: Number,
      min: 0,
      default: 0,
    },

    lastAttemptAt: {
      type: Date,
      default: null,
    },
  },
  {
    _id: false,
  }
);

const editHistorySchema = new mongoose.Schema(
  {
    previousBody: {
      type: String,
      maxlength: 50000,
      default: null,
    },

    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    editedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  }
);

const mentionSchema = new mongoose.Schema(
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

    notified: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  }
);

const ticketMessageSchema = new mongoose.Schema(
  {
    /* ====================================================================== */
    /* TENANCY                                                                */
    /* ====================================================================== */

    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    /* ====================================================================== */
    /* IDENTITY                                                               */
    /* ====================================================================== */

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

    /* ====================================================================== */
    /* TICKET                                                                  */
    /* ====================================================================== */

    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
      index: true,
    },

    parentMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TicketMessage",
      default: null,
      index: true,
    },

    /* ====================================================================== */
    /* AUTHOR                                                                  */
    /* ====================================================================== */

    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    authorName: {
      type: String,
      trim: true,
      maxlength: 300,
      default: null,
    },

    authorRole: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    isCustomerMessage: {
      type: Boolean,
      default: false,
      index: true,
    },

    isAgentMessage: {
      type: Boolean,
      default: false,
      index: true,
    },

    /* ====================================================================== */
    /* MESSAGE                                                                 */
    /* ====================================================================== */

    type: {
      type: String,
      enum: TICKET_MESSAGE_TYPES,
      default: "text",
      index: true,
    },

    status: {
      type: String,
      enum: TICKET_MESSAGE_STATUSES,
      default: "sent",
      index: true,
    },

    source: {
      type: String,
      enum: TICKET_MESSAGE_SOURCES,
      default: "web",
      index: true,
    },

    body: {
      type: String,
      trim: true,
      maxlength: 50000,
      default: null,
    },

    htmlBody: {
      type: String,
      maxlength: 100000,
      default: null,
    },

    language: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 20,
      default: null,
    },

    /* ====================================================================== */
    /* EMAIL                                                                    */
    /* ====================================================================== */

    email: {
      subject: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: null,
      },

      from: {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: 320,
        default: null,
      },

      to: {
        type: [recipientSchema],
        default: [],
      },

      cc: {
        type: [recipientSchema],
        default: [],
      },

      bcc: {
        type: [recipientSchema],
        default: [],
      },

      replyTo: {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: 320,
        default: null,
      },

      messageId: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: null,
      },

      inReplyTo: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: null,
      },

      references: {
        type: [
          {
            type: String,
            trim: true,
            maxlength: 1000,
          },
        ],
        default: [],
      },
    },

    /* ====================================================================== */
    /* ATTACHMENTS                                                             */
    /* ====================================================================== */

    attachments: {
      type: [attachmentSchema],
      default: [],
    },

    attachmentCount: {
      type: Number,
      min: 0,
      default: 0,
    },

    /* ====================================================================== */
    /* MENTIONS                                                                */
    /* ====================================================================== */

    mentions: {
      type: [mentionSchema],
      default: [],
    },

    /* ====================================================================== */
    /* DELIVERY                                                                */
    /* ====================================================================== */

    delivery: {
      type: [deliverySchema],
      default: [],
    },

    /* ====================================================================== */
    /* EDITING                                                                 */
    /* ====================================================================== */

    editHistory: {
      type: [editHistorySchema],
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

    /* ====================================================================== */
    /* DELETE                                                                   */
    /* ====================================================================== */

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

    /* ====================================================================== */
    /* INTERNAL NOTE                                                            */
    /* ====================================================================== */

    internal: {
      visibleToCustomer: {
        type: Boolean,
        default: false,
      },

      visibleToAgents: {
        type: Boolean,
        default: true,
      },

      departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
        default: null,
      },
    },

    /* ====================================================================== */
    /* TEMPLATE                                                                 */
    /* ====================================================================== */

    template: {
      templateId: {
        type: String,
        trim: true,
        maxlength: 300,
        default: null,
      },

      templateName: {
        type: String,
        trim: true,
        maxlength: 300,
        default: null,
      },

      variables: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },

      version: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },
    },

    /* ====================================================================== */
    /* MODERATION                                                               */
    /* ====================================================================== */

    moderation: {
      flagged: {
        type: Boolean,
        default: false,
        index: true,
      },

      reason: {
        type: String,
        trim: true,
        maxlength: 2000,
        default: null,
      },

      score: {
        type: Number,
        min: 0,
        max: 1,
        default: null,
      },

      reviewed: {
        type: Boolean,
        default: false,
      },

      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      reviewedAt: {
        type: Date,
        default: null,
      },

      action: {
        type: String,
        enum: [
          "none",
          "warn",
          "hide",
          "delete",
        ],
        default: "none",
      },
    },

    /* ====================================================================== */
    /* TAGS                                                                     */
    /* ====================================================================== */

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

    /* ====================================================================== */
    /* SYSTEM                                                                   */
    /* ====================================================================== */

    correlationId: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
      index: true,
    },

    requestId: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
    },

    /* ====================================================================== */
    /* RETENTION                                                                */
    /* ====================================================================== */

    legalHold: {
      type: Boolean,
      default: false,
      index: true,
    },

    expiresAt: {
      type: Date,
      default: null,
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

ticketMessageSchema.index(
  {
    instituteId: 1,
    messageCode: 1,
  },
  {
    unique: true,
    sparse: true,
    name: "tenant_ticket_message_code",
  }
);

ticketMessageSchema.index(
  {
    instituteId: 1,
    ticketId: 1,
    createdAt: 1,
  },
  {
    name: "ticket_messages",
  }
);

ticketMessageSchema.index(
  {
    instituteId: 1,
    ticketId: 1,
    status: 1,
    createdAt: -1,
  },
  {
    name: "ticket_message_status",
  }
);

ticketMessageSchema.index(
  {
    instituteId: 1,
    authorId: 1,
    createdAt: -1,
  },
  {
    name: "author_ticket_messages",
  }
);

ticketMessageSchema.index(
  {
    instituteId: 1,
    parentMessageId: 1,
    createdAt: 1,
  },
  {
    sparse: true,
    name: "ticket_message_thread",
  }
);

ticketMessageSchema.index(
  {
    instituteId: 1,
    "moderation.flagged": 1,
    "moderation.reviewed": 1,
    createdAt: -1,
  },
  {
    name: "ticket_message_moderation",
  }
);

ticketMessageSchema.index(
  {
    instituteId: 1,
    "delivery.status": 1,
    createdAt: -1,
  },
  {
    sparse: true,
    name: "ticket_message_delivery",
  }
);

ticketMessageSchema.index(
  {
    instituteId: 1,
    correlationId: 1,
  },
  {
    sparse: true,
    name: "ticket_message_correlation",
  }
);

ticketMessageSchema.index(
  {
    instituteId: 1,
    expiresAt: 1,
  },
  {
    sparse: true,
    name: "ticket_message_expiration",
  }
);

ticketMessageSchema.index(
  {
    instituteId: 1,
    body: "text",
    "email.subject": "text",
  },
  {
    name: "ticket_message_text_search",
    weights: {
      body: 5,
      "email.subject": 8,
    },
  }
);

/* ============================================================================
 * VALIDATION
 * ========================================================================== */

ticketMessageSchema.pre(
  "validate",
  function (next) {
    if (
      this.attachments.length >
      100
    ) {
      return next(
        new Error(
          "A ticket message cannot contain more than 100 attachments"
        )
      );
    }

    if (
      this.mentions.length >
      100
    ) {
      return next(
        new Error(
          "A ticket message cannot contain more than 100 mentions"
        )
      );
    }

    if (
      this.tags.length >
      100
    ) {
      return next(
        new Error(
          "A ticket message cannot contain more than 100 tags"
        )
      );
    }

    if (
      this.email.to.length >
      100
    ) {
      return next(
        new Error(
          "A message cannot have more than 100 email recipients"
        )
      );
    }

    if (
      this.email.cc.length >
      100
    ) {
      return next(
        new Error(
          "A message cannot have more than 100 CC recipients"
        )
      );
    }

    if (
      this.email.bcc.length >
      100
    ) {
      return next(
        new Error(
          "A message cannot have more than 100 BCC recipients"
        )
      );
    }

    this.attachmentCount =
      this.attachments.length;

    if (
      [
        "text",
        "email",
        "sms",
        "whatsapp",
        "template",
      ].includes(this.type) &&
      !this.body &&
      !this.htmlBody &&
      !this.template?.templateId
    ) {
      return next(
        new Error(
          "Message body is required"
        )
      );
    }

    if (
      this.type ===
        "internal_note" &&
      this.internal.visibleToCustomer
    ) {
      return next(
        new Error(
          "Internal notes cannot be visible to customers"
        )
      );
    }

    if (
      this.status ===
        "read" &&
      this.delivery.length ===
        0
    ) {
      this.delivery.push({
        channel:
          "in_app",
        status:
          "read",
        readAt:
          new Date(),
      });
    }

    next();
  }
);

/* ============================================================================
 * VIRTUALS
 * ========================================================================== */

ticketMessageSchema.virtual(
  "isEdited"
).get(function () {
  return Boolean(
    this.editedAt
  );
});

ticketMessageSchema.virtual(
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

ticketMessageSchema.virtual(
  "isInternal"
).get(function () {
  return (
    this.type ===
    "internal_note"
  );
});

ticketMessageSchema.virtual(
  "hasAttachments"
).get(function () {
  return (
    this.attachments.length >
    0
  );
});

ticketMessageSchema.virtual(
  "preview"
).get(function () {
  if (
    this.body
  ) {
    return this.body.slice(
      0,
      500
    );
  }

  if (
    this.htmlBody
  ) {
    return this.htmlBody
      .replace(
        /<[^>]*>/g,
        ""
      )
      .slice(
        0,
        500
      );
  }

  if (
    this.attachments.length
  ) {
    return `Attachment: ${
      this.attachments[0].name
    }`;
  }

  if (
    this.type ===
    "internal_note"
  ) {
    return "Internal note";
  }

  return this.type;
});

/* ============================================================================
 * QUERY HELPERS
 * ========================================================================== */

ticketMessageSchema.query.byInstitute =
  function (instituteId) {
    return this.where({
      instituteId,
    });
  };

ticketMessageSchema.query.byTicket =
  function (ticketId) {
    return this.where({
      ticketId,
    });
  };

ticketMessageSchema.query.visibleToCustomer =
  function () {
    return this.where({
      status: {
        $nin: [
          "deleted",
          "hidden",
        ],
      },
      $or: [
        {
          type: {
            $ne: "internal_note",
          },
        },
        {
          "internal.visibleToCustomer":
            true,
        },
      ],
    });
  };

ticketMessageSchema.query.agentMessages =
  function () {
    return this.where({
      isAgentMessage:
        true,
      status: {
        $nin: [
          "deleted",
          "hidden",
        ],
      },
    });
  };

ticketMessageSchema.query.customerMessages =
  function () {
    return this.where({
      isCustomerMessage:
        true,
      status: {
        $nin: [
          "deleted",
          "hidden",
        ],
      },
    });
  };

ticketMessageSchema.query.internalNotes =
  function () {
    return this.where({
      type:
        "internal_note",
      status: {
        $nin: [
          "deleted",
          "hidden",
        ],
      },
    });
  };

/* ============================================================================
 * INSTANCE METHODS
 * ========================================================================== */

ticketMessageSchema.methods.edit =
  async function ({
    body,
    htmlBody = null,
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
      !body ||
      !String(body).trim()
    ) {
      throw new Error(
        "Message body is required"
      );
    }

    if (
      this.editHistory.length >=
      100
    ) {
      throw new Error(
        "Maximum edit history reached"
      );
    }

    this.editHistory.push({
      previousBody:
        this.body,
      editedBy,
      editedAt:
        new Date(),
    });

    this.body =
      String(body).trim();

    this.htmlBody =
      htmlBody;

    this.editedBy =
      editedBy;

    this.editedAt =
      new Date();

    return this.save();
  };

ticketMessageSchema.methods.softDelete =
  async function ({
    deletedBy = null,
    reason = null,
  } = {}) {
    this.status =
      "deleted";

    this.deletedAt =
      new Date();

    this.deletedBy =
      deletedBy;

    this.deletionReason =
      reason;

    return this.save();
  };

ticketMessageSchema.methods.restore =
  async function () {
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

ticketMessageSchema.methods.addAttachment =
  async function (
    attachment
  ) {
    if (
      this.attachments.length >=
      100
    ) {
      throw new Error(
        "Maximum attachment limit reached"
      );
    }

    this.attachments.push(
      attachment
    );

    this.attachmentCount =
      this.attachments.length;

    return this.save();
  };

ticketMessageSchema.methods.addMention =
  async function ({
    userId,
    displayName = null,
  } = {}) {
    if (
      !userId
    ) {
      throw new Error(
        "User ID is required"
      );
    }

    const exists =
      this.mentions.some(
        (mention) =>
          mention.userId.equals(
            userId
          )
      );

    if (
      exists
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
      notified: false,
    });

    return this.save();
  };

ticketMessageSchema.methods.markMentionNotified =
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

ticketMessageSchema.methods.markDelivered =
  async function ({
    channel = "in_app",
    provider = null,
    providerMessageId = null,
  } = {}) {
    let delivery =
      this.delivery.find(
        (item) =>
          item.channel ===
            channel &&
          item.provider ===
            provider
      );

    if (
      !delivery
    ) {
      delivery = {
        channel,
        status:
          "delivered",
        provider,
        providerMessageId,
        sentAt:
          new Date(),
        deliveredAt:
          new Date(),
        attempts: 1,
        lastAttemptAt:
          new Date(),
      };

      this.delivery.push(
        delivery
      );
    } else {
      delivery.status =
        "delivered";

      delivery.providerMessageId =
        providerMessageId ||
        delivery.providerMessageId;

      delivery.sentAt =
        delivery.sentAt ||
        new Date();

      delivery.deliveredAt =
        new Date();

      delivery.attempts +=
        1;

      delivery.lastAttemptAt =
        new Date();
    }

    return this.save();
  };

ticketMessageSchema.methods.markRead =
  async function (
    channel = "in_app"
  ) {
    const delivery =
      this.delivery.find(
        (item) =>
          item.channel ===
          channel
      );

    if (
      !delivery
    ) {
      this.delivery.push({
        channel,
        status:
          "read",
        sentAt:
          new Date(),
        deliveredAt:
          new Date(),
        readAt:
          new Date(),
      });
    } else {
      delivery.status =
        "read";

      delivery.readAt =
        new Date();

      delivery.deliveredAt =
        delivery.deliveredAt ||
        new Date();
    }

    return this.save();
  };

ticketMessageSchema.methods.markFailed =
  async function ({
    channel = "in_app",
    reason = null,
  } = {}) {
    const delivery =
      this.delivery.find(
        (item) =>
          item.channel ===
          channel
      );

    if (
      !delivery
    ) {
      this.delivery.push({
        channel,
        status:
          "failed",
        failedAt:
          new Date(),
        failureReason:
          reason,
        attempts: 1,
        lastAttemptAt:
          new Date(),
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

      delivery.lastAttemptAt =
        new Date();
    }

    return this.save();
  };

ticketMessageSchema.methods.flag =
  async function ({
    reason = null,
    score = null,
  } = {}) {
    this.moderation.flagged =
      true;

    this.moderation.reason =
      reason;

    this.moderation.score =
      score;

    this.moderation.reviewed =
      false;

    return this.save();
  };

ticketMessageSchema.methods.reviewModeration =
  async function ({
    reviewedBy = null,
    action = "none",
  } = {}) {
    this.moderation.reviewed =
      true;

    this.moderation.reviewedBy =
      reviewedBy;

    this.moderation.reviewedAt =
      new Date();

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

ticketMessageSchema.methods.setLegalHold =
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

ticketMessageSchema.statics.findForTicket =
  function (
    instituteId,
    ticketId,
    {
      includeInternal = true,
      limit = 100,
      before = null,
    } = {}
  ) {
    const query = {
      instituteId,
      ticketId,
      status: {
        $nin: [
          "hidden",
        ],
      },
    };

    if (
      !includeInternal
    ) {
      query.$or = [
        {
          type: {
            $ne: "internal_note",
          },
        },
        {
          "internal.visibleToCustomer":
            true,
        },
      ];
    }

    if (
      before
    ) {
      query.createdAt = {
        $lt: before,
      };
    }

    return this.find(query)
      .sort({
        createdAt: -1,
      })
      .limit(
        Math.min(
          500,
          Math.max(
            1,
            limit
          )
        )
      );
  };

ticketMessageSchema.statics.findCustomerMessages =
  function (
    instituteId,
    ticketId,
    limit = 100
  ) {
    return this.find({
      instituteId,
      ticketId,
      isCustomerMessage:
        true,
      status: {
        $nin: [
          "deleted",
          "hidden",
        ],
      },
    })
      .sort({
        createdAt: -1,
      })
      .limit(limit);
  };

ticketMessageSchema.statics.findInternalNotes =
  function (
    instituteId,
    ticketId,
    limit = 100
  ) {
    return this.find({
      instituteId,
      ticketId,
      type:
        "internal_note",
      status: {
        $nin: [
          "deleted",
          "hidden",
        ],
      },
    })
      .sort({
        createdAt: -1,
      })
      .limit(limit);
  };

ticketMessageSchema.statics.findPendingDelivery =
  function (
    instituteId,
    channel,
    limit = 100
  ) {
    const query = {
      instituteId,
      status: "sent",
      "delivery": {
        $elemMatch: {
          channel,
          status: "pending",
        },
      },
    };

    return this.find(query)
      .sort({
        createdAt: 1,
      })
      .limit(limit);
  };

ticketMessageSchema.statics.findFlagged =
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

export const TicketMessage =
  mongoose.models.TicketMessage ||
  mongoose.model(
    "TicketMessage",
    ticketMessageSchema
  );

export {
  TICKET_MESSAGE_TYPES,
  TICKET_MESSAGE_STATUSES,
  TICKET_MESSAGE_SOURCES,
};