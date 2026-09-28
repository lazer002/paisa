// server/src/models/Ticket.js

import mongoose from "mongoose";

import crypto from "node:crypto";
const TICKET_TYPES = [
  "support",
  "technical",
  "billing",
  "academic",
  "attendance",
  "hr",
  "payroll",
  "crm",
  "complaint",
  "feedback",
  "bug",
  "feature_request",
  "access",
  "security",
  "other",
];

const TICKET_STATUSES = [
  "open",
  "pending",
  "in_progress",
  "waiting_for_user",
  "waiting_for_internal",
  "resolved",
  "closed",
  "reopened",
  "cancelled",
];

const TICKET_PRIORITIES = [
  "low",
  "normal",
  "high",
  "urgent",
  "critical",
];

const TICKET_SOURCES = [
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

const CONTACT_METHODS = [
  "email",
  "phone",
  "sms",
  "whatsapp",
  "chat",
  "in_app",
];

const SLA_STATUSES = [
  "not_started",
  "active",
  "warning",
  "breached",
  "paused",
  "completed",
];

const resolutionSchema = new mongoose.Schema(
  {
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },

    code: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    summary: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: null,
    },

    customerConfirmed: {
      type: Boolean,
      default: false,
    },

    customerConfirmedAt: {
      type: Date,
      default: null,
    },

    reopened: {
      type: Boolean,
      default: false,
    },

    reopenedAt: {
      type: Date,
      default: null,
    },

    reopenedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reopenReason: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },
  },
  {
    _id: false,
  }
);

const slaSchema = new mongoose.Schema(
  {
    policyId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    policyCode: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    status: {
      type: String,
      enum: SLA_STATUSES,
      default: "not_started",
    },

    responseTargetMinutes: {
      type: Number,
      min: 0,
      default: null,
    },

    resolutionTargetMinutes: {
      type: Number,
      min: 0,
      default: null,
    },

    responseDueAt: {
      type: Date,
      default: null,
    },

    resolutionDueAt: {
      type: Date,
      default: null,
    },

    firstRespondedAt: {
      type: Date,
      default: null,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },

    responseBreached: {
      type: Boolean,
      default: false,
    },

    resolutionBreached: {
      type: Boolean,
      default: false,
    },

    responsePausedMinutes: {
      type: Number,
      min: 0,
      default: 0,
    },

    resolutionPausedMinutes: {
      type: Number,
      min: 0,
      default: 0,
    },

    lastCalculatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    _id: false,
  }
);

const assignmentSchema = new mongoose.Schema(
  {
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    assignedAt: {
      type: Date,
      default: null,
    },

    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },

    teamName: {
      type: String,
      trim: true,
      maxlength: 300,
      default: null,
    },

    queue: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
    },

    roundRobinKey: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
    },
  },
  {
    _id: false,
  }
);

const statusHistorySchema = new mongoose.Schema(
  {
    from: {
      type: String,
      enum: TICKET_STATUSES,
      default: null,
    },

    to: {
      type: String,
      enum: TICKET_STATUSES,
      required: true,
    },

    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reason: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },

    changedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  }
);

const priorityHistorySchema = new mongoose.Schema(
  {
    from: {
      type: String,
      enum: TICKET_PRIORITIES,
      default: null,
    },

    to: {
      type: String,
      enum: TICKET_PRIORITIES,
      required: true,
    },

    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reason: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },

    changedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  }
);

const watcherSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    addedAt: {
      type: Date,
      default: Date.now,
    },

    notificationsEnabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    _id: false,
  }
);

const tagSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 100,
      required: true,
    },

    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  }
);

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

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    uploadedAt: {
      type: Date,
      default: Date.now,
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

const customerSnapshotSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      maxlength: 300,
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

    externalId: {
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

const customFieldSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      trim: true,
      maxlength: 100,
      required: true,
    },

    value: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
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

const ticketSchema = new mongoose.Schema(
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
publicId: {
  type: String,
  required: true,
  unique: true,
  immutable: true,
  index: true,
  default: () =>
    `tic_${crypto.randomBytes(16).toString("base64url")}`,
},
    /* ====================================================================== */
    /* IDENTITY                                                               */
    /* ====================================================================== */

    ticketCode: {
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

    source: {
      type: String,
      enum: TICKET_SOURCES,
      default: "web",
      index: true,
    },

    /* ====================================================================== */
    /* CORE                                                                    */
    /* ====================================================================== */

    subject: {
      type: String,
      trim: true,
      minlength: 3,
      maxlength: 500,
      required: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 20000,
      default: null,
    },

    type: {
      type: String,
      enum: TICKET_TYPES,
      default: "support",
      index: true,
    },

    status: {
      type: String,
      enum: TICKET_STATUSES,
      default: "open",
      index: true,
    },

    priority: {
      type: String,
      enum: TICKET_PRIORITIES,
      default: "normal",
      index: true,
    },

    category: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
    },

    subcategory: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
    },

    /* ====================================================================== */
    /* REQUESTER / CUSTOMER                                                   */
    /* ====================================================================== */

    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
      index: true,
    },

    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contact",
      default: null,
      index: true,
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      default: null,
      index: true,
    },

    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
      index: true,
    },

    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      default: null,
      index: true,
    },

    dealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Deal",
      default: null,
      index: true,
    },

    requesterSnapshot: {
      type: customerSnapshotSchema,
      default: null,
    },

    /* ====================================================================== */
    /* RELATED RESOURCES                                                       */
    /* ====================================================================== */

    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      default: null,
      index: true,
    },

    parentTicketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      default: null,
      index: true,
    },

    relatedTicketIds: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Ticket",
        },
      ],
      default: [],
    },

    relatedAssignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      default: null,
    },

    relatedAttendanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attendance",
      default: null,
    },

    relatedLeaveId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Leave",
      default: null,
    },

    relatedPayrollId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payroll",
      default: null,
    },

    /* ====================================================================== */
    /* ASSIGNMENT                                                             */
    /* ====================================================================== */

    assignment: {
      type: assignmentSchema,
      default: () => ({}),
    },

    watchers: {
      type: [watcherSchema],
      default: [],
    },

    /* ====================================================================== */
    /* SLA                                                                     */
    /* ====================================================================== */

    sla: {
      type: slaSchema,
      default: () => ({}),
    },

    /* ====================================================================== */
    /* CONTACT PREFERENCES                                                     */
    /* ====================================================================== */

    preferredContactMethod: {
      type: String,
      enum: CONTACT_METHODS,
      default: null,
    },

    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 320,
      default: null,
    },

    contactPhone: {
      type: String,
      trim: true,
      maxlength: 50,
      default: null,
    },

    timezone: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "Asia/Kolkata",
    },

    /* ====================================================================== */
    /* STATUS / PRIORITY HISTORY                                               */
    /* ====================================================================== */

    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },

    priorityHistory: {
      type: [priorityHistorySchema],
      default: [],
    },

    /* ====================================================================== */
    /* RESOLUTION                                                              */
    /* ====================================================================== */

    resolution: {
      type: resolutionSchema,
      default: () => ({}),
    },

    firstResponseAt: {
      type: Date,
      default: null,
    },

    lastResponseAt: {
      type: Date,
      default: null,
    },

    lastCustomerResponseAt: {
      type: Date,
      default: null,
    },

    lastAgentResponseAt: {
      type: Date,
      default: null,
    },

    responseCount: {
      type: Number,
      min: 0,
      default: 0,
    },

    customerResponseCount: {
      type: Number,
      min: 0,
      default: 0,
    },

    agentResponseCount: {
      type: Number,
      min: 0,
      default: 0,
    },

    /* ====================================================================== */
    /* SATISFACTION                                                           */
    /* ====================================================================== */

    satisfaction: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
        default: null,
      },

      comment: {
        type: String,
        trim: true,
        maxlength: 5000,
        default: null,
      },

      submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      submittedAt: {
        type: Date,
        default: null,
      },

      source: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
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
    /* TAGGING                                                                 */
    /* ====================================================================== */

    tags: {
      type: [tagSchema],
      default: [],
    },

    /* ====================================================================== */
    /* CUSTOM DATA                                                             */
    /* ====================================================================== */

    customFields: {
      type: [customFieldSchema],
      default: [],
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    /* ====================================================================== */
    /* AUDIT                                                                   */
    /* ====================================================================== */

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    closedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    closedAt: {
      type: Date,
      default: null,
    },

    /* ====================================================================== */
    /* SYSTEM                                                                  */
    /* ====================================================================== */

    correlationId: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
      index: true,
    },

    idempotencyKey: {
      type: String,
      trim: true,
      maxlength: 300,
      default: null,
    },

    /* ====================================================================== */
    /* RETENTION / SOFT DELETE                                                 */
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

    deletionReason: {
      type: String,
      trim: true,
      maxlength: 2000,
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

ticketSchema.index(
  {
    instituteId: 1,
    ticketCode: 1,
  },
  {
    unique: true,
    sparse: true,
    name: "tenant_ticket_code",
  }
);

ticketSchema.index(
  {
    instituteId: 1,
    status: 1,
    priority: -1,
    updatedAt: -1,
  },
  {
    name: "ticket_queue",
  }
);

ticketSchema.index(
  {
    instituteId: 1,
    "assignment.assignedTo": 1,
    status: 1,
    priority: -1,
    updatedAt: -1,
  },
  {
    name: "agent_ticket_queue",
  }
);

ticketSchema.index(
  {
    instituteId: 1,
    "assignment.teamId": 1,
    status: 1,
    priority: -1,
    updatedAt: -1,
  },
  {
    name: "team_ticket_queue",
  }
);

ticketSchema.index(
  {
    instituteId: 1,
    requesterId: 1,
    createdAt: -1,
  },
  {
    name: "requester_tickets",
  }
);

ticketSchema.index(
  {
    instituteId: 1,
    customerId: 1,
    createdAt: -1,
  },
  {
    name: "customer_tickets",
  }
);

ticketSchema.index(
  {
    instituteId: 1,
    contactId: 1,
    createdAt: -1,
  },
  {
    name: "contact_tickets",
  }
);

ticketSchema.index(
  {
    instituteId: 1,
    studentId: 1,
    createdAt: -1,
  },
  {
    name: "student_tickets",
  }
);

ticketSchema.index(
  {
    instituteId: 1,
    employeeId: 1,
    createdAt: -1,
  },
  {
    name: "employee_tickets",
  }
);

ticketSchema.index(
  {
    instituteId: 1,
    leadId: 1,
    createdAt: -1,
  },
  {
    name: "lead_tickets",
  }
);

ticketSchema.index(
  {
    instituteId: 1,
    dealId: 1,
    createdAt: -1,
  },
  {
    name: "deal_tickets",
  }
);

ticketSchema.index(
  {
    instituteId: 1,
    conversationId: 1,
    createdAt: -1,
  },
  {
    name: "conversation_tickets",
  }
);

ticketSchema.index(
  {
    instituteId: 1,
    "sla.responseDueAt": 1,
    status: 1,
  },
  {
    sparse: true,
    name: "sla_response_due",
  }
);

ticketSchema.index(
  {
    instituteId: 1,
    "sla.resolutionDueAt": 1,
    status: 1,
  },
  {
    sparse: true,
    name: "sla_resolution_due",
  }
);

ticketSchema.index(
  {
    instituteId: 1,
    "sla.status": 1,
    status: 1,
    priority: -1,
  },
  {
    name: "sla_queue",
  }
);

ticketSchema.index(
  {
    instituteId: 1,
    type: 1,
    category: 1,
    status: 1,
    createdAt: -1,
  },
  {
    name: "ticket_category_queue",
  }
);

ticketSchema.index(
  {
    instituteId: 1,
    tags: 1,
    createdAt: -1,
  },
  {
    name: "ticket_tags",
  }
);

ticketSchema.index(
  {
    instituteId: 1,
    statusHistory: 1,
  },
  {
    sparse: true,
    name: "ticket_status_history",
  }
);

ticketSchema.index(
  {
    instituteId: 1,
    isDeleted: 1,
    updatedAt: -1,
  },
  {
    name: "active_tickets",
  }
);

ticketSchema.index(
  {
    instituteId: 1,
    text: "text",
    description: "text",
    ticketCode: "text",
  },
  {
    name: "ticket_text_search",
    weights: {
      ticketCode: 10,
      subject: 8,
      description: 3,
    },
  }
);

/* ============================================================================
 * VALIDATION
 * ========================================================================== */

ticketSchema.pre(
  "validate",
  function (next) {
    if (
      this.watchers.length >
      500
    ) {
      return next(
        new Error(
          "A ticket cannot have more than 500 watchers"
        )
      );
    }

    if (
      this.tags.length >
      100
    ) {
      return next(
        new Error(
          "A ticket cannot have more than 100 tags"
        )
      );
    }

    if (
      this.attachments.length >
      100
    ) {
      return next(
        new Error(
          "A ticket cannot have more than 100 attachments"
        )
      );
    }

    if (
      this.relatedTicketIds.length >
      100
    ) {
      return next(
        new Error(
          "A ticket cannot have more than 100 related tickets"
        )
      );
    }

    if (
      this.customFields.length >
      200
    ) {
      return next(
        new Error(
          "A ticket cannot have more than 200 custom fields"
        )
      );
    }

    this.attachmentCount =
      this.attachments.length;

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
        "closed" &&
      !this.closedBy &&
      this.updatedBy
    ) {
      this.closedBy =
        this.updatedBy;
    }

    if (
      this.resolution.customerConfirmed &&
      !this.resolution.customerConfirmedAt
    ) {
      this.resolution.customerConfirmedAt =
        new Date();
    }

    next();
  }
);

/* ============================================================================
 * VIRTUALS
 * ========================================================================== */

ticketSchema.virtual(
  "isOpen"
).get(function () {
  return [
    "open",
    "pending",
    "in_progress",
    "waiting_for_user",
    "waiting_for_internal",
    "reopened",
  ].includes(this.status);
});

ticketSchema.virtual(
  "isClosed"
).get(function () {
  return [
    "closed",
    "cancelled",
  ].includes(this.status);
});

ticketSchema.virtual(
  "isResolved"
).get(function () {
  return (
    this.status ===
      "resolved" ||
    this.resolution.resolvedAt !==
      null
  );
});

ticketSchema.virtual(
  "isSlaBreached"
).get(function () {
  return (
    this.sla.responseBreached ||
    this.sla.resolutionBreached
  );
});

ticketSchema.virtual(
  "hasAssignee"
).get(function () {
  return Boolean(
    this.assignment?.assignedTo
  );
});

ticketSchema.virtual(
  "watcherCount"
).get(function () {
  return this.watchers.length;
});

ticketSchema.virtual(
  "ageInMinutes"
).get(function () {
  if (!this.createdAt) {
    return 0;
  }

  const end =
    this.closedAt ||
    new Date();

  return Math.max(
    0,
    Math.floor(
      (end.getTime() -
        this.createdAt.getTime()) /
        60000
    )
  );
});

/* ============================================================================
 * QUERY HELPERS
 * ========================================================================== */

ticketSchema.query.byInstitute =
  function (instituteId) {
    return this.where({
      instituteId,
      isDeleted: false,
    });
  };

ticketSchema.query.active =
  function () {
    return this.where({
      isDeleted: false,
      status: {
        $nin: [
          "closed",
          "cancelled",
        ],
      },
    });
  };

ticketSchema.query.open =
  function () {
    return this.where({
      isDeleted: false,
      status: {
        $in: [
          "open",
          "pending",
          "in_progress",
          "waiting_for_user",
          "waiting_for_internal",
          "reopened",
        ],
      },
    });
  };

ticketSchema.query.assignedTo =
  function (userId) {
    return this.where({
      "assignment.assignedTo":
        userId,
      isDeleted: false,
    });
  };

ticketSchema.query.byCustomer =
  function (customerId) {
    return this.where({
      customerId,
      isDeleted: false,
    });
  };

ticketSchema.query.byStudent =
  function (studentId) {
    return this.where({
      studentId,
      isDeleted: false,
    });
  };

ticketSchema.query.byEmployee =
  function (employeeId) {
    return this.where({
      employeeId,
      isDeleted: false,
    });
  };

ticketSchema.query.slaBreached =
  function () {
    return this.where({
      isDeleted: false,
      $or: [
        {
          "sla.responseBreached": true,
        },
        {
          "sla.resolutionBreached": true,
        },
      ],
    });
  };

ticketSchema.query.unassigned =
  function () {
    return this.where({
      isDeleted: false,
      "assignment.assignedTo": null,
      status: {
        $nin: [
          "closed",
          "cancelled",
        ],
      },
    });
  };

/* ============================================================================
 * INSTANCE METHODS
 * ========================================================================== */

ticketSchema.methods.changeStatus =
  async function ({
    status,
    changedBy = null,
    reason = null,
  } = {}) {
    if (
      !TICKET_STATUSES.includes(
        status
      )
    ) {
      throw new Error(
        "Invalid ticket status"
      );
    }

    if (
      this.status ===
      status
    ) {
      return this;
    }

    const previousStatus =
      this.status;

    this.statusHistory.push({
      from: previousStatus,
      to: status,
      changedBy,
      reason,
      changedAt:
        new Date(),
    });

    this.status =
      status;

    if (
      status ===
        "resolved" &&
      !this.resolution.resolvedAt
    ) {
      this.resolution.resolvedAt =
        new Date();

      this.resolution.resolvedBy =
        changedBy;
    }

    if (
      status ===
        "closed"
    ) {
      this.closedAt =
        new Date();

      this.closedBy =
        changedBy;
    }

    if (
      status ===
        "reopened"
    ) {
      this.resolution.reopened =
        true;

      this.resolution.reopenedAt =
        new Date();

      this.resolution.reopenedBy =
        changedBy;

      this.resolution.resolvedAt =
        null;

      this.resolution.resolvedBy =
        null;

      this.closedAt =
        null;

      this.closedBy =
        null;
    }

    return this.save();
  };

ticketSchema.methods.changePriority =
  async function ({
    priority,
    changedBy = null,
    reason = null,
  } = {}) {
    if (
      !TICKET_PRIORITIES.includes(
        priority
      )
    ) {
      throw new Error(
        "Invalid ticket priority"
      );
    }

    if (
      this.priority ===
      priority
    ) {
      return this;
    }

    this.priorityHistory.push({
      from:
        this.priority,
      to: priority,
      changedBy,
      reason,
      changedAt:
        new Date(),
    });

    this.priority =
      priority;

    return this.save();
  };

ticketSchema.methods.assign =
  async function ({
    assignedTo = null,
    assignedBy = null,
    teamId = null,
    teamName = null,
    queue = null,
  } = {}) {
    this.assignment = {
      assignedTo,
      assignedBy,
      assignedAt:
        assignedTo
          ? new Date()
          : null,
      teamId,
      teamName,
      queue,
      roundRobinKey:
        this.assignment
          ?.roundRobinKey ||
        null,
    };

    if (
      assignedTo &&
      [
        "open",
        "reopened",
      ].includes(
        this.status
      )
    ) {
      this.status =
        "in_progress";
    }

    return this.save();
  };

ticketSchema.methods.unassign =
  async function () {
    this.assignment.assignedTo =
      null;

    this.assignment.assignedBy =
      null;

    this.assignment.assignedAt =
      null;

    return this.save();
  };

ticketSchema.methods.addWatcher =
  async function ({
    userId,
    addedBy = null,
  } = {}) {
    if (
      !userId
    ) {
      throw new Error(
        "Watcher user ID is required"
      );
    }

    const exists =
      this.watchers.some(
        (watcher) =>
          watcher.userId.equals(
            userId
          )
      );

    if (
      exists
    ) {
      return this;
    }

    if (
      this.watchers.length >=
      500
    ) {
      throw new Error(
        "Maximum watcher limit reached"
      );
    }

    this.watchers.push({
      userId,
      addedBy,
      addedAt:
        new Date(),
      notificationsEnabled:
        true,
    });

    return this.save();
  };

ticketSchema.methods.removeWatcher =
  async function (
    userId
  ) {
    this.watchers =
      this.watchers.filter(
        (watcher) =>
          !watcher.userId.equals(
            userId
          )
      );

    return this.save();
  };

ticketSchema.methods.addTag =
  async function ({
    name,
    addedBy = null,
  } = {}) {
    if (
      !name ||
      !String(name).trim()
    ) {
      throw new Error(
        "Tag name is required"
      );
    }

    const normalized =
      String(name)
        .trim()
        .toLowerCase();

    const exists =
      this.tags.some(
        (tag) =>
          tag.name ===
          normalized
      );

    if (
      exists
    ) {
      return this;
    }

    if (
      this.tags.length >=
      100
    ) {
      throw new Error(
        "Maximum tag limit reached"
      );
    }

    this.tags.push({
      name: normalized,
      addedBy,
      addedAt:
        new Date(),
    });

    return this.save();
  };

ticketSchema.methods.removeTag =
  async function (
    name
  ) {
    const normalized =
      String(name)
        .trim()
        .toLowerCase();

    this.tags =
      this.tags.filter(
        (tag) =>
          tag.name !==
          normalized
      );

    return this.save();
  };

ticketSchema.methods.setSla =
  async function ({
    policyId = null,
    policyCode = null,
    responseTargetMinutes = null,
    resolutionTargetMinutes = null,
    responseDueAt = null,
    resolutionDueAt = null,
  } = {}) {
    this.sla.policyId =
      policyId;

    this.sla.policyCode =
      policyCode;

    this.sla.responseTargetMinutes =
      responseTargetMinutes;

    this.sla.resolutionTargetMinutes =
      resolutionTargetMinutes;

    this.sla.responseDueAt =
      responseDueAt;

    this.sla.resolutionDueAt =
      resolutionDueAt;

    this.sla.status =
      "active";

    this.sla.lastCalculatedAt =
      new Date();

    return this.save();
  };

ticketSchema.methods.recordFirstResponse =
  async function ({
    respondedAt = new Date(),
  } = {}) {
    if (
      !this.firstResponseAt
    ) {
      this.firstResponseAt =
        respondedAt;

      this.sla.firstRespondedAt =
        respondedAt;
    }

    this.lastResponseAt =
      respondedAt;

    this.lastAgentResponseAt =
      respondedAt;

    this.responseCount +=
      1;

    this.agentResponseCount +=
      1;

    if (
      this.sla.status ===
      "not_started"
    ) {
      this.sla.status =
        "active";
    }

    return this.save();
  };

ticketSchema.methods.recordCustomerResponse =
  async function ({
    respondedAt = new Date(),
  } = {}) {
    this.lastResponseAt =
      respondedAt;

    this.lastCustomerResponseAt =
      respondedAt;

    this.responseCount +=
      1;

    this.customerResponseCount +=
      1;

    if (
      this.status ===
      "waiting_for_user"
    ) {
      this.status =
        "in_progress";
    }

    return this.save();
  };

ticketSchema.methods.resolve =
  async function ({
    resolvedBy = null,
    summary = null,
    code = null,
  } = {}) {
    this.status =
      "resolved";

    this.resolution.resolvedBy =
      resolvedBy;

    this.resolution.resolvedAt =
      new Date();

    this.resolution.summary =
      summary;

    this.resolution.code =
      code;

    this.sla.resolvedAt =
      new Date();

    this.sla.status =
      "completed";

    return this.save();
  };

ticketSchema.methods.reopen =
  async function ({
    reopenedBy = null,
    reason = null,
  } = {}) {
    this.status =
      "reopened";

    this.resolution.reopened =
      true;

    this.resolution.reopenedAt =
      new Date();

    this.resolution.reopenedBy =
      reopenedBy;

    this.resolution.reopenReason =
      reason;

    this.resolution.resolvedAt =
      null;

    this.resolution.resolvedBy =
      null;

    this.closedAt =
      null;

    this.closedBy =
      null;

    return this.save();
  };

ticketSchema.methods.close =
  async function ({
    closedBy = null,
  } = {}) {
    this.status =
      "closed";

    this.closedAt =
      new Date();

    this.closedBy =
      closedBy;

    return this.save();
  };

ticketSchema.methods.cancel =
  async function ({
    cancelledBy = null,
    reason = null,
  } = {}) {
    this.status =
      "cancelled";

    this.closedAt =
      new Date();

    this.closedBy =
      cancelledBy;

    this.resolution.summary =
      reason;

    return this.save();
  };

ticketSchema.methods.addAttachment =
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

ticketSchema.methods.setSatisfaction =
  async function ({
    rating,
    comment = null,
    submittedBy = null,
    source = null,
  } = {}) {
    if (
      rating < 1 ||
      rating > 5
    ) {
      throw new Error(
        "Satisfaction rating must be between 1 and 5"
      );
    }

    this.satisfaction = {
      rating,
      comment,
      submittedBy,
      submittedAt:
        new Date(),
      source,
    };

    return this.save();
  };

ticketSchema.methods.setCustomField =
  async function ({
    key,
    value,
    updatedBy = null,
  } = {}) {
    if (
      !key ||
      !String(key).trim()
    ) {
      throw new Error(
        "Custom field key is required"
      );
    }

    const normalizedKey =
      String(key).trim();

    const existing =
      this.customFields.find(
        (field) =>
          field.key ===
          normalizedKey
      );

    if (
      existing
    ) {
      existing.value =
        value;

      existing.updatedBy =
        updatedBy;

      existing.updatedAt =
        new Date();
    } else {
      if (
        this.customFields.length >=
        200
      ) {
        throw new Error(
          "Maximum custom field limit reached"
        );
      }

      this.customFields.push({
        key: normalizedKey,
        value,
        updatedBy,
        updatedAt:
          new Date(),
      });
    }

    return this.save();
  };

ticketSchema.methods.softDelete =
  async function ({
    deletedBy = null,
    reason = null,
  } = {}) {
    if (
      this.legalHold
    ) {
      throw new Error(
        "Ticket is under legal hold"
      );
    }

    this.isDeleted =
      true;

    this.deletedAt =
      new Date();

    this.deletedBy =
      deletedBy;

    this.deletionReason =
      reason;

    return this.save();
  };

ticketSchema.methods.restore =
  async function () {
    this.isDeleted =
      false;

    this.deletedAt =
      null;

    this.deletedBy =
      null;

    this.deletionReason =
      null;

    return this.save();
  };

/* ============================================================================
 * STATIC METHODS
 * ========================================================================== */

ticketSchema.statics.findByCode =
  function (
    instituteId,
    ticketCode
  ) {
    return this.findOne({
      instituteId,
      ticketCode:
        String(ticketCode)
          .trim()
          .toUpperCase(),
      isDeleted: false,
    });
  };

ticketSchema.statics.findForUser =
  function (
    instituteId,
    userId,
    {
      includeClosed = false,
      limit = 50,
    } = {}
  ) {
    const query = {
      instituteId,
      isDeleted: false,
      $or: [
        {
          requesterId: userId,
        },
        {
          "assignment.assignedTo":
            userId,
        },
        {
          "watchers.userId":
            userId,
        },
      ],
    };

    if (
      !includeClosed
    ) {
      query.status = {
        $nin: [
          "closed",
          "cancelled",
        ],
      };
    }

    return this.find(query)
      .sort({
        priority: -1,
        updatedAt: -1,
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

ticketSchema.statics.findQueue =
  function (
    instituteId,
    {
      teamId = null,
      assignedTo = null,
      status = null,
      priority = null,
      limit = 100,
    } = {}
  ) {
    const query = {
      instituteId,
      isDeleted: false,
      status: status
        ? status
        : {
            $nin: [
              "closed",
              "cancelled",
            ],
          },
    };

    if (
      teamId
    ) {
      query[
        "assignment.teamId"
      ] = teamId;
    }

    if (
      assignedTo
    ) {
      query[
        "assignment.assignedTo"
      ] = assignedTo;
    }

    if (
      priority
    ) {
      query.priority =
        priority;
    }

    return this.find(query)
      .sort({
        priority: -1,
        createdAt: 1,
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

ticketSchema.statics.findSlaBreached =
  function (
    instituteId,
    limit = 100
  ) {
    return this.find({
      instituteId,
      isDeleted: false,
      $or: [
        {
          "sla.responseBreached":
            true,
        },
        {
          "sla.resolutionBreached":
            true,
        },
      ],
      status: {
        $nin: [
          "closed",
          "cancelled",
        ],
      },
    })
      .sort({
        priority: -1,
        "sla.resolutionDueAt": 1,
      })
      .limit(limit);
  };

ticketSchema.statics.findByRequester =
  function (
    instituteId,
    requesterId,
    limit = 50
  ) {
    return this.find({
      instituteId,
      requesterId,
      isDeleted: false,
    })
      .sort({
        createdAt: -1,
      })
      .limit(limit);
  };

ticketSchema.statics.findByCustomer =
  function (
    instituteId,
    customerId,
    limit = 50
  ) {
    return this.find({
      instituteId,
      customerId,
      isDeleted: false,
    })
      .sort({
        createdAt: -1,
      })
      .limit(limit);
  };

ticketSchema.statics.findByLead =
  function (
    instituteId,
    leadId,
    limit = 50
  ) {
    return this.find({
      instituteId,
      leadId,
      isDeleted: false,
    })
      .sort({
        createdAt: -1,
      })
      .limit(limit);
  };

ticketSchema.statics.findByDeal =
  function (
    instituteId,
    dealId,
    limit = 50
  ) {
    return this.find({
      instituteId,
      dealId,
      isDeleted: false,
    })
      .sort({
        createdAt: -1,
      })
      .limit(limit);
  };

/* ============================================================================
 * MODEL
 * ========================================================================== */

export const Ticket =
  mongoose.models.Ticket ||
  mongoose.model(
    "Ticket",
    ticketSchema
  );

export {
  TICKET_TYPES,
  TICKET_STATUSES,
  TICKET_PRIORITIES,
  TICKET_SOURCES,
  CONTACT_METHODS,
  SLA_STATUSES,
};
