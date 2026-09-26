// server/src/models/Event.js

import mongoose from "mongoose";

const EVENT_TYPES = [
  "user.created",
  "user.updated",
  "user.deleted",
  "user.restored",
  "user.role_changed",

  "organization.created",
  "organization.updated",
  "organization.activated",
  "organization.suspended",
  "organization.deleted",

  "employee.created",
  "employee.updated",
  "employee.deleted",
  "employee.joined",
  "employee.exited",

  "student.created",
  "student.updated",
  "student.enrolled",
  "student.withdrawn",

  "teacher.created",
  "teacher.updated",

  "class.created",
  "class.updated",
  "class.enrolled",
  "class.unenrolled",
  "class.completed",

  "assignment.created",
  "assignment.published",
  "assignment.submitted",
  "assignment.graded",
  "assignment.closed",

  "test.created",
  "test.published",
  "test.started",
  "test.submitted",
  "test.completed",
  "test.graded",

  "attendance.marked",
  "attendance.corrected",
  "attendance.verified",
  "attendance.checked_in",
  "attendance.checked_out",

  "leave.created",
  "leave.approved",
  "leave.rejected",
  "leave.cancelled",

  "payroll.created",
  "payroll.processed",
  "payroll.approved",
  "payroll.paid",
  "payroll.cancelled",

  "announcement.created",
  "announcement.published",
  "announcement.updated",
  "announcement.archived",

  "notification.created",
  "notification.sent",
  "notification.delivered",
  "notification.read",

  "lead.created",
  "lead.updated",
  "lead.converted",
  "lead.lost",

  "contact.created",
  "contact.updated",

  "deal.created",
  "deal.updated",
  "deal.won",
  "deal.lost",

  "task.created",
  "task.assigned",
  "task.completed",
  "task.cancelled",

  "ticket.created",
  "ticket.assigned",
  "ticket.resolved",
  "ticket.closed",

  "payment.created",
  "payment.completed",
  "payment.failed",
  "payment.refunded",

  "course.created",
  "course.published",
  "course.completed",

  "enrollment.created",
  "enrollment.cancelled",
  "enrollment.completed",

  "certificate.issued",
  "certificate.revoked",

  "achievement.earned",
  "points.awarded",
  "leaderboard.updated",

  "live_session.created",
  "live_session.started",
  "live_session.ended",
  "live_session.cancelled",

  "integration.connected",
  "integration.disconnected",
  "integration.sync_started",
  "integration.sync_completed",
  "integration.sync_failed",

  "workflow.started",
  "workflow.completed",
  "workflow.failed",

  "system.job_started",
  "system.job_completed",
  "system.job_failed",

  "other",
];

const EVENT_CATEGORIES = [
  "identity",
  "organization",
  "education",
  "attendance",
  "hr",
  "payroll",
  "finance",
  "crm",
  "communication",
  "support",
  "gamification",
  "content",
  "live_learning",
  "integration",
  "workflow",
  "system",
  "security",
  "other",
];

const EVENT_SOURCES = [
  "web",
  "mobile",
  "api",
  "admin",
  "system",
  "worker",
  "cron",
  "webhook",
  "integration",
  "import",
  "unknown",
];

const EVENT_STATUS = [
  "pending",
  "processing",
  "completed",
  "failed",
  "cancelled",
];

const EVENT_ACTOR_TYPES = [
  "user",
  "admin",
  "super_admin",
  "system",
  "service",
  "worker",
  "cron",
  "webhook",
  "integration",
  "anonymous",
];

const eventActorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    type: {
      type: String,
      enum: EVENT_ACTOR_TYPES,
      default: "system",
    },

    role: {
      type: String,
      trim: true,
      maxlength: 50,
      default: null,
    },

    name: {
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

const entitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    model: {
      type: String,
      trim: true,
      maxlength: 150,
      default: null,
    },

    id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    name: {
      type: String,
      trim: true,
      maxlength: 300,
      default: null,
    },

    parentType: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  {
    _id: false,
  }
);

const eventSchema = new mongoose.Schema(
  {
    /* ====================================================================== */
    /* TENANCY                                                               */
    /* ====================================================================== */

    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
      index: true,
    },

    /* ====================================================================== */
    /* EVENT IDENTITY                                                         */
    /* ====================================================================== */

    type: {
      type: String,
      enum: EVENT_TYPES,
      required: true,
      index: true,
    },

    category: {
      type: String,
      enum: EVENT_CATEGORIES,
      required: true,
      index: true,
    },

    source: {
      type: String,
      enum: EVENT_SOURCES,
      default: "api",
      index: true,
    },

    status: {
      type: String,
      enum: EVENT_STATUS,
      default: "completed",
      index: true,
    },

    /* ====================================================================== */
    /* ACTOR                                                                  */
    /* ====================================================================== */

    actor: {
      type: eventActorSchema,
      default: null,
    },

    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    actorType: {
      type: String,
      enum: EVENT_ACTOR_TYPES,
      default: "system",
      index: true,
    },

    /* ====================================================================== */
    /* TARGET ENTITY                                                          */
    /* ====================================================================== */

    entity: {
      type: entitySchema,
      default: null,
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },

    entityType: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
      index: true,
    },

    /* ====================================================================== */
    /* RELATED ENTITY                                                         */
    /* ====================================================================== */

    relatedEntity: {
      type: entitySchema,
      default: null,
    },

    relatedEntityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    relatedEntityType: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    /* ====================================================================== */
    /* EVENT PAYLOAD                                                          */
    /* ====================================================================== */

    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    tags: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: 100,
        },
      ],
      default: [],
    },

    /* ====================================================================== */
    /* REQUEST / DISTRIBUTED TRACE                                            */
    /* ====================================================================== */

    requestId: {
      type: String,
      trim: true,
      maxlength: 150,
      default: null,
      index: true,
    },

    correlationId: {
      type: String,
      trim: true,
      maxlength: 150,
      default: null,
      index: true,
    },

    causationId: {
      type: String,
      trim: true,
      maxlength: 150,
      default: null,
      index: true,
    },

    idempotencyKey: {
      type: String,
      trim: true,
      maxlength: 255,
      default: null,
    },

    parentEventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      default: null,
    },

    /* ====================================================================== */
    /* PROCESSING                                                             */
    /* ====================================================================== */

    availableAt: {
      type: Date,
      default: null,
      index: true,
    },

    processedAt: {
      type: Date,
      default: null,
    },

    attempts: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    maxAttempts: {
      type: Number,
      min: 1,
      max: 100,
      default: 5,
    },

    nextAttemptAt: {
      type: Date,
      default: null,
      index: true,
    },

    lockedAt: {
      type: Date,
      default: null,
    },

    lockedBy: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
    },

    /* ====================================================================== */
    /* ERROR / FAILURE                                                        */
    /* ====================================================================== */

    error: {
      code: {
        type: String,
        trim: true,
        maxlength: 150,
        default: null,
      },

      message: {
        type: String,
        trim: true,
        maxlength: 2000,
        default: null,
      },

      stackHash: {
        type: String,
        trim: true,
        maxlength: 128,
        default: null,
      },
    },

    /* ====================================================================== */
    /* RETENTION                                                              */
    /* ====================================================================== */

    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },

    /* ====================================================================== */
    /* SYSTEM FLAGS                                                           */
    /* ====================================================================== */

    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },

    isInternal: {
      type: Boolean,
      default: true,
      index: true,
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

eventSchema.index(
  {
    instituteId: 1,
    createdAt: -1,
  },
  {
    name: "event_institute_timeline",
  }
);

eventSchema.index(
  {
    instituteId: 1,
    type: 1,
    createdAt: -1,
  },
  {
    name: "event_type_timeline",
  }
);

eventSchema.index(
  {
    instituteId: 1,
    category: 1,
    createdAt: -1,
  },
  {
    name: "event_category_timeline",
  }
);

eventSchema.index(
  {
    instituteId: 1,
    actorId: 1,
    createdAt: -1,
  },
  {
    name: "event_actor_timeline",
  }
);

eventSchema.index(
  {
    instituteId: 1,
    entityType: 1,
    entityId: 1,
    createdAt: -1,
  },
  {
    name: "event_entity_history",
  }
);

eventSchema.index(
  {
    correlationId: 1,
    createdAt: -1,
  },
  {
    name: "event_correlation",
    sparse: true,
  }
);

eventSchema.index(
  {
    requestId: 1,
    createdAt: -1,
  },
  {
    name: "event_request",
    sparse: true,
  }
);

eventSchema.index(
  {
    status: 1,
    availableAt: 1,
    nextAttemptAt: 1,
  },
  {
    name: "event_processing_queue",
  }
);

eventSchema.index(
  {
    expiresAt: 1,
  },
  {
    name: "event_retention_queue",
    sparse: true,
  }
);

/*
 * Idempotency lookup.
 */
eventSchema.index(
  {
    instituteId: 1,
    idempotencyKey: 1,
  },
  {
    name: "event_idempotency",
    sparse: true,
  }
);

/* ============================================================================
 * VALIDATION
 * ========================================================================== */

eventSchema.pre(
  "validate",
  function (next) {
    if (
      !this.actorId &&
      this.actor?.userId
    ) {
      this.actorId =
        this.actor.userId;
    }

    if (
      !this.actor?.userId &&
      this.actorId
    ) {
      this.actor.userId =
        this.actorId;
    }

    if (
      !this.entityId &&
      this.entity?.id
    ) {
      this.entityId =
        this.entity.id;
    }

    if (
      !this.entityType &&
      this.entity?.type
    ) {
      this.entityType =
        this.entity.type;
    }

    if (
      !this.relatedEntityId &&
      this.relatedEntity?.id
    ) {
      this.relatedEntityId =
        this.relatedEntity.id;
    }

    if (
      !this.relatedEntityType &&
      this.relatedEntity?.type
    ) {
      this.relatedEntityType =
        this.relatedEntity.type;
    }

    if (
      this.attempts >
      this.maxAttempts
    ) {
      return next(
        new Error(
          "Event attempts cannot exceed maxAttempts"
        )
      );
    }

    if (
      this.status ===
        "completed" &&
      !this.processedAt
    ) {
      this.processedAt =
        new Date();
    }

    if (
      this.status === "failed" &&
      !this.error?.message
    ) {
      return next(
        new Error(
          "Failed events must contain an error message"
        )
      );
    }

    if (
      this.tags?.length >
      30
    ) {
      return next(
        new Error(
          "Event cannot contain more than 30 tags"
        )
      );
    }

    next();
  }
);

/* ============================================================================
 * VIRTUALS
 * ========================================================================== */

eventSchema.virtual(
  "isProcessed"
).get(function () {
  return (
    this.status ===
    "completed"
  );
});

eventSchema.virtual(
  "isFailed"
).get(function () {
  return (
    this.status ===
    "failed"
  );
});

eventSchema.virtual(
  "canRetry"
).get(function () {
  return (
    this.status === "failed" &&
    this.attempts <
      this.maxAttempts
  );
});

eventSchema.virtual(
  "isAvailable"
).get(function () {
  if (
    this.status !==
    "pending"
  ) {
    return false;
  }

  if (
    !this.availableAt
  ) {
    return true;
  }

  return (
    this.availableAt <=
    new Date()
  );
});

eventSchema.virtual(
  "isExpired"
).get(function () {
  return Boolean(
    this.expiresAt &&
      this.expiresAt <=
        new Date()
  );
});

/* ============================================================================
 * INSTANCE METHODS
 * ========================================================================== */

eventSchema.methods.markProcessing =
  async function (
    workerId
  ) {
    if (
      this.status !==
      "pending"
    ) {
      throw new Error(
        "Only pending events can be processed"
      );
    }

    this.status =
      "processing";

    this.lockedAt =
      new Date();

    this.lockedBy =
      workerId || null;

    this.attempts += 1;

    return this.save();
  };

eventSchema.methods.markCompleted =
  async function () {
    this.status =
      "completed";

    this.processedAt =
      new Date();

    this.lockedAt =
      null;

    this.lockedBy =
      null;

    this.error =
      null;

    return this.save();
  };

eventSchema.methods.markFailed =
  async function ({
    code = null,
    message,
    stackHash = null,
    retry = true,
  } = {}) {
    if (!message) {
      throw new Error(
        "Failure message is required"
      );
    }

    this.error = {
      code,
      message,
      stackHash,
    };

    this.lockedAt =
      null;

    this.lockedBy =
      null;

    if (
      retry &&
      this.attempts <
        this.maxAttempts
    ) {
      this.status =
        "pending";

      /*
       * Exponential backoff:
       *
       * 5s → 10s → 20s → 40s → ...
       *
       * capped at 1 hour.
       */
      const delay =
        Math.min(
          60 * 60 * 1000,
          5000 *
            Math.pow(
              2,
              Math.max(
                0,
                this.attempts - 1
              )
            )
        );

      this.nextAttemptAt =
        new Date(
          Date.now() +
            delay
        );
    } else {
      this.status =
        "failed";

      this.processedAt =
        new Date();
    }

    return this.save();
  };

eventSchema.methods.cancel =
  async function () {
    if (
      this.status ===
      "completed"
    ) {
      throw new Error(
        "Completed events cannot be cancelled"
      );
    }

    this.status =
      "cancelled";

    this.lockedAt =
      null;

    this.lockedBy =
      null;

    return this.save();
  };

/* ============================================================================
 * QUERY HELPERS
 * ========================================================================== */

eventSchema.query.byInstitute =
  function (
    instituteId
  ) {
    return this.where({
      instituteId,
    });
  };

eventSchema.query.pending =
  function () {
    const now =
      new Date();

    return this.where({
      status: "pending",
      $or: [
        {
          availableAt: null,
        },
        {
          availableAt: {
            $lte: now,
          },
        },
      ],
      $and: [
        {
          $or: [
            {
              nextAttemptAt:
                null,
            },
            {
              nextAttemptAt: {
                $lte: now,
              },
            },
          ],
        },
      ],
    });
  };

eventSchema.query.forEntity =
  function (
    entityType,
    entityId
  ) {
    return this.where({
      entityType,
      entityId,
    });
  };

eventSchema.query.forActor =
  function (
    actorId
  ) {
    return this.where({
      actorId,
    });
  };

eventSchema.query.byCorrelation =
  function (
    correlationId
  ) {
    return this.where({
      correlationId,
    });
  };

/* ============================================================================
 * STATIC FACTORIES
 * ========================================================================== */

eventSchema.statics.createEvent =
  function ({
    instituteId = null,
    type,
    category,
    source = "api",
    actor = null,
    actorId = null,
    actorType = "system",
    entity = null,
    entityId = null,
    entityType = null,
    relatedEntity = null,
    relatedEntityId = null,
    relatedEntityType = null,
    payload = null,
    metadata = null,
    tags = [],
    requestId = null,
    correlationId = null,
    causationId = null,
    idempotencyKey = null,
    parentEventId = null,
    availableAt = null,
    expiresAt = null,
    maxAttempts = 5,
    isInternal = true,
  }) {
    return this.create({
      instituteId,
      type,
      category,
      source,
      actor,
      actorId,
      actorType,
      entity,
      entityId,
      entityType,
      relatedEntity,
      relatedEntityId,
      relatedEntityType,
      payload,
      metadata,
      tags,
      requestId,
      correlationId,
      causationId,
      idempotencyKey,
      parentEventId,
      availableAt,
      expiresAt,
      maxAttempts,
      isInternal,
    });
  };

/**
 * Find an existing event by idempotency key.
 */
eventSchema.statics.findByIdempotencyKey =
  function (
    instituteId,
    idempotencyKey
  ) {
    if (
      !idempotencyKey
    ) {
      return null;
    }

    return this.findOne({
      instituteId,
      idempotencyKey,
    });
  };

/* ============================================================================
 * MODEL
 * ========================================================================== */

export const Event =
  mongoose.models.Event ||
  mongoose.model(
    "Event",
    eventSchema
  );

export {
  EVENT_TYPES,
  EVENT_CATEGORIES,
  EVENT_SOURCES,
  EVENT_STATUS,
  EVENT_ACTOR_TYPES,
};