// server/src/models/CRMTask.js

import mongoose from "mongoose";

import crypto from "node:crypto";
const TASK_STATUSES = [
  "pending",
  "in_progress",
  "completed",
  "cancelled",
  "deferred",
  "overdue",
];

const TASK_PRIORITIES = [
  "low",
  "normal",
  "high",
  "urgent",
];

const TASK_TYPES = [
  "follow_up",
  "call",
  "email",
  "meeting",
  "demo",
  "proposal",
  "quote",
  "contract",
  "payment",
  "document",
  "review",
  "approval",
  "internal",
  "other",
];

const RECURRENCE_TYPES = [
  "none",
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "yearly",
];

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

    minutesBefore: {
      type: Number,
      min: 0,
      max: 525600,
      default: null,
    },

    channels: {
      type: [
        {
          type: String,
          enum: [
            "notification",
            "email",
            "sms",
            "whatsapp",
          ],
        },
      ],
      default: ["notification"],
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

const recurrenceSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: RECURRENCE_TYPES,
      default: "none",
    },

    interval: {
      type: Number,
      min: 1,
      max: 365,
      default: 1,
    },

    daysOfWeek: {
      type: [
        {
          type: Number,
          min: 0,
          max: 6,
        },
      ],
      default: [],
    },

    dayOfMonth: {
      type: Number,
      min: 1,
      max: 31,
      default: null,
    },

    maxOccurrences: {
      type: Number,
      min: 1,
      max: 10000,
      default: null,
    },

    occurrenceCount: {
      type: Number,
      min: 0,
      default: 0,
    },

    startDate: {
      type: Date,
      default: null,
    },

    endDate: {
      type: Date,
      default: null,
    },

    nextRunAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    _id: false,
  }
);

const checklistSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      required: true,
      maxlength: 500,
    },

    completed: {
      type: Boolean,
      default: false,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    order: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    _id: true,
  }
);

const attachmentSchema = new mongoose.Schema(
  {
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

    fileId: {
      type: String,
      trim: true,
      maxlength: 500,
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
  },
  {
    _id: true,
  }
);

const crmTaskSchema = new mongoose.Schema(
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
publicId: {
  type: String,
  required: true,
  unique: true,
  immutable: true,
  index: true,
  default: () =>
    `crmt_${crypto.randomBytes(16).toString("base64url")}`,
},
    /* ====================================================================== */
    /* IDENTITY                                                              */
    /* ====================================================================== */

    taskCode: {
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
    /* BASIC INFORMATION                                                      */
    /* ====================================================================== */

    title: {
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

    type: {
      type: String,
      enum: TASK_TYPES,
      default: "follow_up",
      index: true,
    },

    status: {
      type: String,
      enum: TASK_STATUSES,
      default: "pending",
      index: true,
    },

    priority: {
      type: String,
      enum: TASK_PRIORITIES,
      default: "normal",
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
      required: true,
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

    watchers: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
    },

    /* ====================================================================== */
    /* SCHEDULING                                                             */
    /* ====================================================================== */

    startAt: {
      type: Date,
      default: null,
      index: true,
    },

    dueAt: {
      type: Date,
      default: null,
      index: true,
    },

    completedAt: {
      type: Date,
      default: null,
      index: true,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    deferredUntil: {
      type: Date,
      default: null,
      index: true,
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

    estimatedMinutes: {
      type: Number,
      min: 0,
      max: 100000,
      default: null,
    },

    actualMinutes: {
      type: Number,
      min: 0,
      max: 100000,
      default: null,
    },

    /* ====================================================================== */
    /* REMINDERS                                                              */
    /* ====================================================================== */

    reminders: {
      type: [reminderSchema],
      default: [],
    },

    /* ====================================================================== */
    /* RECURRENCE                                                             */
    /* ====================================================================== */

    recurrence: {
      type: recurrenceSchema,
      default: () => ({}),
    },

    parentTaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CRMTask",
      default: null,
      index: true,
    },

    /* ====================================================================== */
    /* CHECKLIST                                                              */
    /* ====================================================================== */

    checklist: {
      type: [checklistSchema],
      default: [],
    },

    /* ====================================================================== */
    /* RELATED ACTIVITY                                                       */
    /* ====================================================================== */

    activityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CRMActivity",
      default: null,
      index: true,
    },

    previousTaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CRMTask",
      default: null,
    },

    nextTaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CRMTask",
      default: null,
    },

    /* ====================================================================== */
    /* LOCATION / MEETING                                                     */
    /* ====================================================================== */

    location: {
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

    /* ====================================================================== */
    /* COMPLETION                                                             */
    /* ====================================================================== */

    completion: {
      notes: {
        type: String,
        trim: true,
        maxlength: 10000,
        default: null,
      },

      outcome: {
        type: String,
        trim: true,
        maxlength: 500,
        default: null,
      },

      completedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      completionPercentage: {
        type: Number,
        min: 0,
        max: 100,
        default: 100,
      },
    },

    /* ====================================================================== */
    /* ATTACHMENTS                                                            */
    /* ====================================================================== */

    attachments: {
      type: [attachmentSchema],
      default: [],
    },

    /* ====================================================================== */
    /* TAGS / CUSTOM DATA                                                     */
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
      maxlength: 3000,
      default: null,
    },

    /* ====================================================================== */
    /* SYSTEM                                                                 */
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
    versionKey: false,

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

crmTaskSchema.index(
  {
    instituteId: 1,
    taskCode: 1,
  },
  {
    unique: true,
    sparse: true,
    name: "tenant_task_code",
  }
);

crmTaskSchema.index(
  {
    instituteId: 1,
    ownerId: 1,
    status: 1,
    dueAt: 1,
  },
  {
    name: "owner_task_queue",
  }
);

crmTaskSchema.index(
  {
    instituteId: 1,
    status: 1,
    priority: -1,
    dueAt: 1,
  },
  {
    name: "task_queue",
  }
);

crmTaskSchema.index(
  {
    instituteId: 1,
    dealId: 1,
    dueAt: -1,
  },
  {
    sparse: true,
    name: "deal_tasks",
  }
);

crmTaskSchema.index(
  {
    instituteId: 1,
    leadId: 1,
    dueAt: -1,
  },
  {
    sparse: true,
    name: "lead_tasks",
  }
);

crmTaskSchema.index(
  {
    instituteId: 1,
    contactId: 1,
    dueAt: -1,
  },
  {
    sparse: true,
    name: "contact_tasks",
  }
);

crmTaskSchema.index(
  {
    instituteId: 1,
    customerId: 1,
    dueAt: -1,
  },
  {
    sparse: true,
    name: "customer_tasks",
  }
);

crmTaskSchema.index(
  {
    instituteId: 1,
    "recurrence.nextRunAt": 1,
    status: 1,
  },
  {
    name: "recurring_task_queue",
  }
);

crmTaskSchema.index(
  {
    instituteId: 1,
    deferredUntil: 1,
    status: 1,
  },
  {
    name: "deferred_task_queue",
  }
);

crmTaskSchema.index(
  {
    instituteId: 1,
    parentTaskId: 1,
  },
  {
    sparse: true,
    name: "recurring_task_children",
  }
);

crmTaskSchema.index(
  {
    instituteId: 1,
    watchers: 1,
    status: 1,
  },
  {
    name: "watched_tasks",
  }
);

crmTaskSchema.index(
  {
    instituteId: 1,
    subject: "text",
    description: "text",
    "completion.notes": "text",
  },
  {
    name: "task_search",
    weights: {
      subject: 10,
      description: 5,
      "completion.notes": 3,
    },
  }
);

/* ============================================================================
 * VALIDATION
 * ========================================================================== */

crmTaskSchema.pre(
  "validate",
  function (next) {
    if (
      this.watchers.length >
      100
    ) {
      return next(
        new Error(
          "Task cannot have more than 100 watchers"
        )
      );
    }

    if (
      this.reminders.length >
      20
    ) {
      return next(
        new Error(
          "Task cannot have more than 20 reminders"
        )
      );
    }

    if (
      this.checklist.length >
      200
    ) {
      return next(
        new Error(
          "Task cannot contain more than 200 checklist items"
        )
      );
    }

    if (
      this.attachments.length >
      50
    ) {
      return next(
        new Error(
          "Task cannot contain more than 50 attachments"
        )
      );
    }

    if (
      this.tags.length >
      100
    ) {
      return next(
        new Error(
          "Task cannot contain more than 100 tags"
        )
      );
    }

    if (
      this.startAt &&
      this.dueAt &&
      this.dueAt <
        this.startAt
    ) {
      return next(
        new Error(
          "Due date cannot be before start date"
        )
      );
    }

    if (
      this.recurrence.type ===
        "none" &&
      this.recurrence.nextRunAt
    ) {
      this.recurrence.nextRunAt =
        null;
    }

    if (
      this.recurrence.type !==
        "none" &&
      !this.recurrence.startDate
    ) {
      this.recurrence.startDate =
        this.startAt ||
        new Date();
    }

    if (
      this.status ===
        "completed" &&
      !this.completedAt
    ) {
      this.completedAt =
        new Date();
    }

    next();
  }
);

/* ============================================================================
 * VIRTUALS
 * ========================================================================== */

crmTaskSchema.virtual(
  "isCompleted"
).get(function () {
  return (
    this.status ===
    "completed"
  );
});

crmTaskSchema.virtual(
  "isPending"
).get(function () {
  return [
    "pending",
    "in_progress",
    "deferred",
  ].includes(
    this.status
  );
});

crmTaskSchema.virtual(
  "isOverdue"
).get(function () {
  if (
    !this.dueAt ||
    [
      "completed",
      "cancelled",
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

crmTaskSchema.virtual(
  "checklistProgress"
).get(function () {
  if (
    !this.checklist.length
  ) {
    return this.status ===
      "completed"
      ? 100
      : 0;
  }

  const completed =
    this.checklist.filter(
      (item) =>
        item.completed
    ).length;

  return Math.round(
    (completed /
      this.checklist.length) *
      100
  );
});

crmTaskSchema.virtual(
  "hasRecurrence"
).get(function () {
  return (
    this.recurrence.type !==
    "none"
  );
});

/* ============================================================================
 * QUERY HELPERS
 * ========================================================================== */

crmTaskSchema.query.byInstitute =
  function (
    instituteId
  ) {
    return this.where({
      instituteId,
      isDeleted: false,
    });
  };

crmTaskSchema.query.pending =
  function () {
    return this.where({
      isDeleted: false,
      status: {
        $in: [
          "pending",
          "in_progress",
        ],
      },
    });
  };

crmTaskSchema.query.completed =
  function () {
    return this.where({
      isDeleted: false,
      status: "completed",
    });
  };

crmTaskSchema.query.byOwner =
  function (
    ownerId
  ) {
    return this.where({
      isDeleted: false,
      ownerId,
    });
  };

crmTaskSchema.query.byDeal =
  function (
    dealId
  ) {
    return this.where({
      isDeleted: false,
      dealId,
    });
  };

crmTaskSchema.query.byLead =
  function (
    leadId
  ) {
    return this.where({
      isDeleted: false,
      leadId,
    });
  };

crmTaskSchema.query.overdue =
  function () {
    return this.where({
      isDeleted: false,
      status: {
        $in: [
          "pending",
          "in_progress",
          "deferred",
        ],
      },
      dueAt: {
        $lt: new Date(),
      },
    });
  };

/* ============================================================================
 * INSTANCE METHODS
 * ========================================================================== */

crmTaskSchema.methods.start =
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
        "Task cannot be started"
      );
    }

    this.status =
      "in_progress";

    return this.save();
  };

crmTaskSchema.methods.complete =
  async function ({
    notes = null,
    outcome = null,
    completedBy = null,
  } = {}) {
    if (
      this.status ===
      "cancelled"
    ) {
      throw new Error(
        "Cancelled task cannot be completed"
      );
    }

    this.status =
      "completed";

    this.completedAt =
      new Date();

    this.completion.notes =
      notes;

    this.completion.outcome =
      outcome;

    this.completion.completedBy =
      completedBy;

    this.completionPercentage =
      100;

    this.completion.completionPercentage =
      100;

    return this.save();
  };

crmTaskSchema.methods.cancel =
  async function ({
    cancelledBy = null,
    reason = null,
  } = {}) {
    if (
      this.status ===
      "completed"
    ) {
      throw new Error(
        "Completed task cannot be cancelled"
      );
    }

    this.status =
      "cancelled";

    this.cancelledAt =
      new Date();

    this.cancelledBy =
      cancelledBy;

    this.cancellationReason =
      reason;

    return this.save();
  };

crmTaskSchema.methods.defer =
  async function (
    deferredUntil
  ) {
    if (
      [
        "completed",
        "cancelled",
      ].includes(
        this.status
      )
    ) {
      throw new Error(
        "Closed task cannot be deferred"
      );
    }

    this.status =
      "deferred";

    this.deferredUntil =
      deferredUntil;

    return this.save();
  };

crmTaskSchema.methods.reopen =
  async function () {
    if (
      ![
        "completed",
        "cancelled",
      ].includes(
        this.status
      )
    ) {
      return this;
    }

    this.status =
      "pending";

    this.completedAt =
      null;

    this.cancelledAt =
      null;

    this.cancelledBy =
      null;

    this.cancellationReason =
      null;

    return this.save();
  };

crmTaskSchema.methods.addChecklistItem =
  async function (
    title
  ) {
    if (
      this.checklist.length >=
      200
    ) {
      throw new Error(
        "Maximum checklist limit reached"
      );
    }

    const maxOrder =
      this.checklist.length
        ? Math.max(
            ...this.checklist.map(
              (item) =>
                item.order
            )
          )
        : -1;

    this.checklist.push({
      title,
      order:
        maxOrder + 1,
    });

    return this.save();
  };

crmTaskSchema.methods.completeChecklistItem =
  async function (
    itemId,
    completedBy = null
  ) {
    const item =
      this.checklist.id(
        itemId
      );

    if (
      !item
    ) {
      throw new Error(
        "Checklist item not found"
      );
    }

    item.completed =
      true;

    item.completedAt =
      new Date();

    item.completedBy =
      completedBy;

    return this.save();
  };

crmTaskSchema.methods.uncompleteChecklistItem =
  async function (
    itemId
  ) {
    const item =
      this.checklist.id(
        itemId
      );

    if (
      !item
    ) {
      throw new Error(
        "Checklist item not found"
      );
    }

    item.completed =
      false;

    item.completedAt =
      null;

    item.completedBy =
      null;

    return this.save();
  };

crmTaskSchema.methods.addWatcher =
  async function (
    userId
  ) {
    if (
      !userId
    ) {
      throw new Error(
        "User ID is required"
      );
    }

    if (
      this.watchers.some(
        (id) =>
          id.equals(
            userId
          )
      )
    ) {
      return this;
    }

    if (
      this.watchers.length >=
      100
    ) {
      throw new Error(
        "Maximum watcher limit reached"
      );
    }

    this.watchers.push(
      userId
    );

    return this.save();
  };

crmTaskSchema.methods.removeWatcher =
  async function (
    userId
  ) {
    this.watchers =
      this.watchers.filter(
        (id) =>
          !id.equals(
            userId
          )
      );

    return this.save();
  };

crmTaskSchema.methods.addReminder =
  async function ({
    remindAt,
    minutesBefore = null,
    channels = [
      "notification",
    ],
  } = {}) {
    if (
      this.reminders.length >=
      20
    ) {
      throw new Error(
        "Maximum reminder limit reached"
      );
    }

    this.reminders.push({
      enabled: true,
      remindAt,
      minutesBefore,
      channels,
      sent: false,
      sentAt: null,
    });

    return this.save();
  };

crmTaskSchema.methods.markReminderSent =
  async function (
    reminderId
  ) {
    const reminder =
      this.reminders.id(
        reminderId
      );

    if (
      !reminder
    ) {
      throw new Error(
        "Reminder not found"
      );
    }

    reminder.sent =
      true;

    reminder.sentAt =
      new Date();

    return this.save();
  };

crmTaskSchema.methods.addTag =
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

crmTaskSchema.methods.removeTag =
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

crmTaskSchema.methods.softDelete =
  async function () {
    this.isDeleted =
      true;

    this.deletedAt =
      new Date();

    return this.save();
  };

crmTaskSchema.methods.restore =
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

crmTaskSchema.statics.findPendingForOwner =
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
          "pending",
          "in_progress",
          "deferred",
        ],
      },
    })
      .sort({
        priority: -1,
        dueAt: 1,
      })
      .limit(limit);
  };

crmTaskSchema.statics.findOverdue =
  function (
    instituteId,
    limit = 100
  ) {
    return this.find({
      instituteId,
      isDeleted: false,
      status: {
        $in: [
          "pending",
          "in_progress",
          "deferred",
        ],
      },
      dueAt: {
        $lt: new Date(),
      },
    })
      .sort({
        dueAt: 1,
        priority: -1,
      })
      .limit(limit);
  };

crmTaskSchema.statics.findDueToday =
  function (
    instituteId,
    startOfDay,
    endOfDay,
    limit = 100
  ) {
    return this.find({
      instituteId,
      isDeleted: false,
      status: {
        $in: [
          "pending",
          "in_progress",
          "deferred",
        ],
      },
      dueAt: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    })
      .sort({
        dueAt: 1,
        priority: -1,
      })
      .limit(limit);
  };

crmTaskSchema.statics.findRecurringDue =
  function (
    instituteId,
    limit = 100
  ) {
    return this.find({
      instituteId,
      isDeleted: false,
      "recurrence.type": {
        $ne: "none",
      },
      "recurrence.nextRunAt": {
        $lte: new Date(),
      },
      status: {
        $ne: "cancelled",
      },
    })
      .sort({
        "recurrence.nextRunAt": 1,
      })
      .limit(limit);
  };

crmTaskSchema.statics.findForDeal =
  function (
    instituteId,
    dealId
  ) {
    return this.find({
      instituteId,
      dealId,
      isDeleted: false,
    }).sort({
      dueAt: 1,
      createdAt: -1,
    });
  };

crmTaskSchema.statics.findForLead =
  function (
    instituteId,
    leadId
  ) {
    return this.find({
      instituteId,
      leadId,
      isDeleted: false,
    }).sort({
      dueAt: 1,
      createdAt: -1,
    });
  };

crmTaskSchema.statics.findForContact =
  function (
    instituteId,
    contactId
  ) {
    return this.find({
      instituteId,
      contactId,
      isDeleted: false,
    }).sort({
      dueAt: 1,
      createdAt: -1,
    });
  };

/* ============================================================================
 * MODEL
 * ========================================================================== */

export const CRMTask =
  mongoose.models.CRMTask ||
  mongoose.model(
    "CRMTask",
    crmTaskSchema
  );

export {
  TASK_STATUSES,
  TASK_PRIORITIES,
  TASK_TYPES,
  RECURRENCE_TYPES,
};
