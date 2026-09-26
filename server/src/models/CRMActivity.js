// server/src/models/CRMActivity.js

import mongoose from "mongoose";

const ACTIVITY_TYPES = [
  "call",
  "email",
  "sms",
  "whatsapp",
  "meeting",
  "demo",
  "site_visit",
  "follow_up",
  "task",
  "note",
  "proposal",
  "quote",
  "contract",
  "payment",
  "other",
];

const ACTIVITY_STATUSES = [
  "planned",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
  "failed",
  "skipped",
];

const PRIORITIES = [
  "low",
  "normal",
  "high",
  "urgent",
];

const OUTCOMES = [
  "connected",
  "not_connected",
  "interested",
  "not_interested",
  "callback_requested",
  "meeting_booked",
  "proposal_requested",
  "proposal_sent",
  "negotiation",
  "won",
  "lost",
  "no_show",
  "rescheduled",
  "follow_up_required",
  "other",
];

const CHANNELS = [
  "phone",
  "email",
  "sms",
  "whatsapp",
  "in_person",
  "video",
  "website",
  "system",
  "other",
];

const participantSchema = new mongoose.Schema(
  {
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

    role: {
      type: String,
      trim: true,
      maxlength: 150,
      default: null,
    },

    attended: {
      type: Boolean,
      default: false,
    },

    joinedAt: {
      type: Date,
      default: null,
    },

    leftAt: {
      type: Date,
      default: null,
    },
  },
  {
    _id: false,
  }
);

const reminderSchema = new mongoose.Schema(
  {
    enabled: {
      type: Boolean,
      default: false,
    },

    remindAt: {
      type: Date,
      default: null,
    },

    channel: {
      type: String,
      enum: [
        "notification",
        "email",
        "sms",
        "whatsapp",
      ],
      default: "notification",
    },

    sent: {
      type: Boolean,
      default: false,
    },

    sentAt: {
      type: Date,
      default: null,
    },
  },
  {
    _id: false,
  }
);

const locationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "online",
        "office",
        "customer",
        "other",
      ],
      default: "online",
    },

    name: {
      type: String,
      trim: true,
      maxlength: 300,
      default: null,
    },

    address: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },

    meetingUrl: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },

    meetingId: {
      type: String,
      trim: true,
      maxlength: 300,
      default: null,
    },

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
  },
  {
    _id: false,
  }
);

const crmActivitySchema = new mongoose.Schema(
  {
    /* ====================================================================== */
    /* TENANCY                                                               */
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

    activityCode: {
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

    /* ====================================================================== */
    /* ACTIVITY                                                               */
    /* ====================================================================== */

    type: {
      type: String,
      enum: ACTIVITY_TYPES,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ACTIVITY_STATUSES,
      default: "planned",
      index: true,
    },

    priority: {
      type: String,
      enum: PRIORITIES,
      default: "normal",
      index: true,
    },

    subject: {
      type: String,
      trim: true,
      required: true,
      maxlength: 500,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 10000,
      default: null,
    },

    outcome: {
      type: String,
      enum: OUTCOMES,
      default: null,
      index: true,
    },

    outcomeNotes: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: null,
    },

    channel: {
      type: String,
      enum: CHANNELS,
      default: "system",
      index: true,
    },

    /* ====================================================================== */
    /* CRM RELATIONSHIPS                                                      */
    /* ====================================================================== */

    dealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Deal",
      default: null,
      index: true,
    },

    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      default: null,
      index: true,
    },

    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contact",
      default: null,
      index: true,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
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

    enrollmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enrollment",
      default: null,
      index: true,
    },

    /* ====================================================================== */
    /* ASSIGNMENT                                                             */
    /* ====================================================================== */

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
      index: true,
    },

    /* ====================================================================== */
    /* SCHEDULING                                                             */
    /* ====================================================================== */

    scheduledAt: {
      type: Date,
      default: null,
      index: true,
    },

    startedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
      index: true,
    },

    dueAt: {
      type: Date,
      default: null,
      index: true,
    },

    durationMinutes: {
      type: Number,
      min: 0,
      max: 100000,
      default: null,
    },

    timezone: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "Asia/Kolkata",
    },

    allDay: {
      type: Boolean,
      default: false,
    },

    /* ====================================================================== */
    /* REMINDER                                                               */
    /* ====================================================================== */

    reminder: {
      type: reminderSchema,
      default: () => ({}),
    },

    /* ====================================================================== */
    /* PARTICIPANTS                                                           */
    /* ====================================================================== */

    participants: {
      type: [participantSchema],
      default: [],
    },

    /* ====================================================================== */
    /* LOCATION                                                               */
    /* ====================================================================== */

    location: {
      type: locationSchema,
      default: () => ({}),
    },

    /* ====================================================================== */
    /* COMMUNICATION                                                          */
    /* ====================================================================== */

    communication: {
      direction: {
        type: String,
        enum: [
          "inbound",
          "outbound",
          "internal",
          "unknown",
        ],
        default: "unknown",
      },

      from: {
        type: String,
        trim: true,
        maxlength: 320,
        default: null,
      },

      to: {
        type: [String],
        default: [],
      },

      cc: {
        type: [String],
        default: [],
      },

      bcc: {
        type: [String],
        default: [],
      },

      messageId: {
        type: String,
        trim: true,
        maxlength: 500,
        default: null,
      },

      threadId: {
        type: String,
        trim: true,
        maxlength: 500,
        default: null,
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

      callDurationSeconds: {
        type: Number,
        min: 0,
        default: null,
      },

      recordingUrl: {
        type: String,
        trim: true,
        maxlength: 2000,
        default: null,
      },
    },

    /* ====================================================================== */
    /* ATTACHMENTS                                                            */
    /* ====================================================================== */

    attachments: {
      type: [
        {
          name: {
            type: String,
            trim: true,
            maxlength: 500,
          },

          url: {
            type: String,
            trim: true,
            maxlength: 2000,
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

          fileId: {
            type: String,
            trim: true,
            maxlength: 500,
            default: null,
          },
        },
      ],
      default: [],
    },

    /* ====================================================================== */
    /* TASK / FOLLOW-UP                                                      */
    /* ====================================================================== */

    followUp: {
      required: {
        type: Boolean,
        default: false,
      },

      date: {
        type: Date,
        default: null,
        index: true,
      },

      note: {
        type: String,
        trim: true,
        maxlength: 5000,
        default: null,
      },

      ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      activityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CRMActivity",
        default: null,
      },
    },

    /* ====================================================================== */
    /* RESULT / CONVERSION                                                     */
    /* ====================================================================== */

    conversion: {
      createdDealId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Deal",
        default: null,
      },

      createdCustomerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        default: null,
      },

      createdEnrollmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Enrollment",
        default: null,
      },

      convertedAt: {
        type: Date,
        default: null,
      },
    },

    /* ====================================================================== */
    /* SOURCE                                                                 */
    /* ====================================================================== */

    source: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
      index: true,
    },

    campaign: {
      type: String,
      trim: true,
      maxlength: 300,
      default: null,
    },

    /* ====================================================================== */
    /* METADATA                                                               */
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

    customFields: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    /* ====================================================================== */
    /* AUDIT                                                                  */
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

    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    cancellationReason: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },

    /* ====================================================================== */
    /* SYSTEM CONTEXT                                                         */
    /* ====================================================================== */

    sourceSystem: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "paisa",
    },

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
    /* LIFECYCLE                                                              */
    /* ====================================================================== */

    archivedAt: {
      type: Date,
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

crmActivitySchema.index(
  {
    instituteId: 1,
    activityCode: 1,
  },
  {
    unique: true,
    sparse: true,
    name: "tenant_activity_code",
  }
);

crmActivitySchema.index(
  {
    instituteId: 1,
    dealId: 1,
    scheduledAt: -1,
  },
  {
    sparse: true,
    name: "deal_activities",
  }
);

crmActivitySchema.index(
  {
    instituteId: 1,
    leadId: 1,
    scheduledAt: -1,
  },
  {
    sparse: true,
    name: "lead_activities",
  }
);

crmActivitySchema.index(
  {
    instituteId: 1,
    contactId: 1,
    scheduledAt: -1,
  },
  {
    sparse: true,
    name: "contact_activities",
  }
);

crmActivitySchema.index(
  {
    instituteId: 1,
    customerId: 1,
    scheduledAt: -1,
  },
  {
    sparse: true,
    name: "customer_activities",
  }
);

crmActivitySchema.index(
  {
    instituteId: 1,
    ownerId: 1,
    status: 1,
    scheduledAt: 1,
  },
  {
    sparse: true,
    name: "owner_activity_queue",
  }
);

crmActivitySchema.index(
  {
    instituteId: 1,
    status: 1,
    dueAt: 1,
  },
  {
    name: "activity_due_queue",
  }
);

crmActivitySchema.index(
  {
    instituteId: 1,
    type: 1,
    status: 1,
    scheduledAt: -1,
  },
  {
    name: "activity_type_status",
  }
);

crmActivitySchema.index(
  {
    instituteId: 1,
    "followUp.date": 1,
    "followUp.required": 1,
  },
  {
    name: "follow_up_queue",
  }
);

crmActivitySchema.index(
  {
    instituteId: 1,
    correlationId: 1,
  },
  {
    sparse: true,
    name: "activity_correlation",
  }
);

crmActivitySchema.index(
  {
    instituteId: 1,
    subject: "text",
    description: "text",
    outcomeNotes: "text",
  },
  {
    name: "activity_search",
    weights: {
      subject: 10,
      description: 5,
      outcomeNotes: 3,
    },
  }
);

/* ============================================================================
 * VALIDATION
 * ========================================================================== */

crmActivitySchema.pre(
  "validate",
  function (next) {
    if (
      this.participants.length >
      100
    ) {
      return next(
        new Error(
          "Activity cannot contain more than 100 participants"
        )
      );
    }

    if (
      this.attachments.length >
      50
    ) {
      return next(
        new Error(
          "Activity cannot contain more than 50 attachments"
        )
      );
    }

    if (
      this.tags.length >
      100
    ) {
      return next(
        new Error(
          "Activity cannot contain more than 100 tags"
        )
      );
    }

    if (
      this.status ===
        "completed" &&
      !this.completedAt
    ) {
      this.completedAt =
        new Date();
    }

    if (
      this.status ===
        "cancelled" &&
      !this.cancelledBy
    ) {
      this.cancelledBy =
        this.updatedBy ||
        this.createdBy ||
        null;
    }

    if (
      this.scheduledAt &&
      this.dueAt &&
      this.dueAt <
        this.scheduledAt
    ) {
      return next(
        new Error(
          "Due date cannot be before scheduled date"
        )
      );
    }

    next();
  }
);

/* ============================================================================
 * VIRTUALS
 * ========================================================================== */

crmActivitySchema.virtual(
  "isCompleted"
).get(function () {
  return (
    this.status ===
    "completed"
  );
});

crmActivitySchema.virtual(
  "isPending"
).get(function () {
  return [
    "planned",
    "in_progress",
  ].includes(
    this.status
  );
});

crmActivitySchema.virtual(
  "isCancelled"
).get(function () {
  return (
    this.status ===
    "cancelled"
  );
});

crmActivitySchema.virtual(
  "isOverdue"
).get(function () {
  if (
    !this.dueAt ||
    [
      "completed",
      "cancelled",
      "skipped",
    ].includes(
      this.status
    )
  ) {
    return false;
  }

  return (
    this.dueAt <
    new Date()
  );
});

crmActivitySchema.virtual(
  "durationSeconds"
).get(function () {
  if (
    this.startedAt &&
    this.completedAt
  ) {
    return Math.max(
      0,
      Math.floor(
        (
          this.completedAt.getTime() -
          this.startedAt.getTime()
        ) /
          1000
      )
    );
  }

  if (
    this.communication
      ?.callDurationSeconds
  ) {
    return this.communication
      .callDurationSeconds;
  }

  return null;
});

/* ============================================================================
 * QUERY HELPERS
 * ========================================================================== */

crmActivitySchema.query.byInstitute =
  function (
    instituteId
  ) {
    return this.where({
      instituteId,
      isDeleted: false,
    });
  };

crmActivitySchema.query.pending =
  function () {
    return this.where({
      isDeleted: false,
      status: {
        $in: [
          "planned",
          "in_progress",
        ],
      },
    });
  };

crmActivitySchema.query.completed =
  function () {
    return this.where({
      isDeleted: false,
      status: "completed",
    });
  };

crmActivitySchema.query.byOwner =
  function (
    ownerId
  ) {
    return this.where({
      isDeleted: false,
      ownerId,
    });
  };

crmActivitySchema.query.byDeal =
  function (
    dealId
  ) {
    return this.where({
      isDeleted: false,
      dealId,
    });
  };

crmActivitySchema.query.byLead =
  function (
    leadId
  ) {
    return this.where({
      isDeleted: false,
      leadId,
    });
  };

crmActivitySchema.query.due =
  function () {
    return this.where({
      isDeleted: false,
      status: {
        $in: [
          "planned",
          "in_progress",
        ],
      },
      dueAt: {
        $lte: new Date(),
      },
    });
  };

/* ============================================================================
 * INSTANCE METHODS
 * ========================================================================== */

crmActivitySchema.methods.start =
  async function () {
    if (
      [
        "completed",
        "cancelled",
      ].includes(
        this.status
      )
    ) {
      throw new Error(
        "Activity cannot be started"
      );
    }

    this.status =
      "in_progress";

    this.startedAt =
      new Date();

    return this.save();
  };

crmActivitySchema.methods.complete =
  async function ({
    outcome = null,
    outcomeNotes = null,
    completedBy = null,
  } = {}) {
    if (
      this.status ===
      "cancelled"
    ) {
      throw new Error(
        "Cancelled activity cannot be completed"
      );
    }

    this.status =
      "completed";

    this.completedAt =
      new Date();

    this.completedBy =
      completedBy;

    this.outcome =
      outcome;

    this.outcomeNotes =
      outcomeNotes;

    return this.save();
  };

crmActivitySchema.methods.cancel =
  async function ({
    cancelledBy = null,
    reason = null,
  } = {}) {
    if (
      this.status ===
      "completed"
    ) {
      throw new Error(
        "Completed activity cannot be cancelled"
      );
    }

    this.status =
      "cancelled";

    this.cancelledBy =
      cancelledBy;

    this.cancellationReason =
      reason;

    return this.save();
  };

crmActivitySchema.methods.reschedule =
  async function (
    scheduledAt
  ) {
    if (
      this.status ===
        "completed" ||
      this.status ===
        "cancelled"
    ) {
      throw new Error(
        "Closed activity cannot be rescheduled"
      );
    }

    this.scheduledAt =
      scheduledAt;

    this.status =
      "planned";

    return this.save();
  };

crmActivitySchema.methods.addParticipant =
  async function (
    participant
  ) {
    if (
      this.participants.length >=
      100
    ) {
      throw new Error(
        "Maximum participant limit reached"
      );
    }

    this.participants.push(
      participant
    );

    return this.save();
  };

crmActivitySchema.methods.removeParticipant =
  async function (
    index
  ) {
    if (
      index < 0 ||
      index >=
        this.participants.length
    ) {
      throw new Error(
        "Participant not found"
      );
    }

    this.participants.splice(
      index,
      1
    );

    return this.save();
  };

crmActivitySchema.methods.markAttended =
  async function (
    index,
    attended = true
  ) {
    const participant =
      this.participants[
        index
      ];

    if (
      !participant
    ) {
      throw new Error(
        "Participant not found"
      );
    }

    participant.attended =
      attended;

    if (
      attended &&
      !participant.joinedAt
    ) {
      participant.joinedAt =
        new Date();
    }

    return this.save();
  };

crmActivitySchema.methods.scheduleReminder =
  async function ({
    remindAt,
    channel = "notification",
  } = {}) {
    this.reminder.enabled =
      true;

    this.reminder.remindAt =
      remindAt;

    this.reminder.channel =
      channel;

    this.reminder.sent =
      false;

    this.reminder.sentAt =
      null;

    return this.save();
  };

crmActivitySchema.methods.markReminderSent =
  async function () {
    this.reminder.sent =
      true;

    this.reminder.sentAt =
      new Date();

    return this.save();
  };

crmActivitySchema.methods.addTag =
  async function (
    tag
  ) {
    const normalized =
      String(tag)
        .trim()
        .toLowerCase();

    if (
      normalized &&
      !this.tags.includes(
        normalized
      )
    ) {
      this.tags.push(
        normalized
      );
    }

    return this.save();
  };

crmActivitySchema.methods.removeTag =
  async function (
    tag
  ) {
    const normalized =
      String(tag)
        .trim()
        .toLowerCase();

    this.tags =
      this.tags.filter(
        (item) =>
          item !== normalized
      );

    return this.save();
  };

crmActivitySchema.methods.softDelete =
  async function () {
    this.isDeleted =
      true;

    this.deletedAt =
      new Date();

    return this.save();
  };

crmActivitySchema.methods.restore =
  async function () {
    this.isDeleted =
      false;

    this.deletedAt =
      null;

    return this.save();
  };

/* ============================================================================
 * STATIC METHODS
 * ========================================================================== */

crmActivitySchema.statics.findPendingForOwner =
  function (
    instituteId,
    ownerId,
    limit = 100
  ) {
    return this.find({
      instituteId,
      ownerId,
      isDeleted: false,
      status: {
        $in: [
          "planned",
          "in_progress",
        ],
      },
    })
      .sort({
        dueAt: 1,
        scheduledAt: 1,
        priority: -1,
      })
      .limit(limit);
  };

crmActivitySchema.statics.findDue =
  function (
    instituteId,
    limit = 100
  ) {
    return this.find({
      instituteId,
      isDeleted: false,
      status: {
        $in: [
          "planned",
          "in_progress",
        ],
      },
      dueAt: {
        $lte: new Date(),
      },
    })
      .sort({
        dueAt: 1,
        priority: -1,
      })
      .limit(limit);
  };

crmActivitySchema.statics.findUpcoming =
  function (
    instituteId,
    from,
    to,
    limit = 100
  ) {
    return this.find({
      instituteId,
      isDeleted: false,
      scheduledAt: {
        $gte: from,
        $lte: to,
      },
    })
      .sort({
        scheduledAt: 1,
      })
      .limit(limit);
  };

crmActivitySchema.statics.findForDeal =
  function (
    instituteId,
    dealId
  ) {
    return this.find({
      instituteId,
      dealId,
      isDeleted: false,
    }).sort({
      scheduledAt: -1,
      createdAt: -1,
    });
  };

crmActivitySchema.statics.findForLead =
  function (
    instituteId,
    leadId
  ) {
    return this.find({
      instituteId,
      leadId,
      isDeleted: false,
    }).sort({
      scheduledAt: -1,
      createdAt: -1,
    });
  };

crmActivitySchema.statics.findForContact =
  function (
    instituteId,
    contactId
  ) {
    return this.find({
      instituteId,
      contactId,
      isDeleted: false,
    }).sort({
      scheduledAt: -1,
      createdAt: -1,
    });
  };

/* ============================================================================
 * MODEL
 * ========================================================================== */

export const CRMActivity =
  mongoose.models.CRMActivity ||
  mongoose.model(
    "CRMActivity",
    crmActivitySchema
  );

export {
  ACTIVITY_TYPES,
  ACTIVITY_STATUSES,
  PRIORITIES,
  OUTCOMES,
  CHANNELS,
};