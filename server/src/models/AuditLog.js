import mongoose from "mongoose";

/**
 * ============================================================================
 * PAISA — AUDIT LOG
 * ============================================================================
 *
 * Immutable security / compliance / business audit trail.
 *
 * Design goals:
 * - Multi-tenant safe
 * - High-volume write optimized
 * - Query optimized for admin/compliance/reporting
 * - Immutable by application design
 * - Supports user actions, system actions, integrations and jobs
 * - Before/after change tracking
 * - Request/device/IP metadata
 * - Entity/resource tracking
 * - Security events
 * - Authentication events
 * - Compliance-ready metadata
 * - Correlation / request tracing
 * - Future event-driven architecture
 *
 * IMPORTANT:
 * Do NOT store:
 * - passwords
 * - access tokens
 * - refresh tokens
 * - OTPs
 * - API secrets
 * - raw biometric data
 * - full payment card data
 * - unnecessary sensitive personal data
 *
 * AuditLog should generally be append-only.
 * Business entities should NEVER update/delete audit records.
 * ============================================================================
 */

const AUDIT_ACTIONS = [
  /* Authentication */
  "login",
  "logout",
  "login_failed",
  "login_locked",
  "password_changed",
  "password_reset_requested",
  "password_reset",
  "email_verified",
  "two_factor_enabled",
  "two_factor_disabled",
  "two_factor_verified",
  "two_factor_failed",
  "session_created",
  "session_revoked",
  "session_reused",
  "account_locked",
  "account_unlocked",

  /* CRUD */
  "create",
  "read",
  "update",
  "delete",
  "restore",
  "archive",
  "duplicate",

  /* Workflow */
  "submit",
  "approve",
  "reject",
  "cancel",
  "publish",
  "unpublish",
  "schedule",
  "complete",
  "reopen",
  "assign",
  "unassign",
  "activate",
  "deactivate",
  "suspend",
  "unsuspend",

  /* Data */
  "import",
  "export",
  "bulk_create",
  "bulk_update",
  "bulk_delete",
  "bulk_restore",

  /* Communication */
  "send",
  "deliver",
  "read",
  "acknowledge",
  "dismiss",

  /* Attendance */
  "check_in",
  "check_out",
  "attendance_marked",
  "attendance_corrected",
  "attendance_verified",

  /* Finance */
  "payment_initiated",
  "payment_completed",
  "payment_failed",
  "refund",
  "payroll_processed",
  "payroll_approved",
  "payroll_paid",

  /* Security */
  "permission_granted",
  "permission_revoked",
  "role_changed",
  "access_denied",
  "security_alert",

  /* Integration / automation */
  "webhook_received",
  "webhook_sent",
  "sync_started",
  "sync_completed",
  "sync_failed",
  "automation_triggered",
  "job_started",
  "job_completed",
  "job_failed",

  /* System */
  "system_action",
  "configuration_changed",
  "feature_enabled",
  "feature_disabled",
  "other",
];

const AUDIT_ACTORS = [
  "user",
  "admin",
  "super_admin",
  "system",
  "service",
  "worker",
  "cron",
  "webhook",
  "integration",
  "mobile",
  "api",
  "unknown",
];

const AUDIT_SEVERITIES = [
  "debug",
  "info",
  "notice",
  "warning",
  "error",
  "critical",
];

const AUDIT_CATEGORIES = [
  "authentication",
  "authorization",
  "user_management",
  "organization",
  "education",
  "attendance",
  "hr",
  "payroll",
  "finance",
  "crm",
  "communication",
  "support",
  "content",
  "reporting",
  "integration",
  "security",
  "system",
  "configuration",
  "other",
];

const AUDIT_SOURCES = [
  "web",
  "mobile",
  "api",
  "admin",
  "system",
  "worker",
  "cron",
  "webhook",
  "integration",
  "unknown",
];

const AUDIT_OUTCOMES = [
  "success",
  "failure",
  "denied",
  "partial",
  "pending",
];

const CHANGE_OPERATIONS = [
  "set",
  "unset",
  "add",
  "remove",
  "increment",
  "decrement",
  "replace",
];

const SENSITIVE_FIELD_NAMES = new Set([
  "password",
  "passwordHash",
  "passwordHistory",
  "currentPassword",
  "newPassword",
  "confirmPassword",
  "accessToken",
  "refreshToken",
  "token",
  "tokenHash",
  "secret",
  "clientSecret",
  "apiKey",
  "privateKey",
  "otp",
  "otpCode",
  "verificationCode",
  "twoFactorSecret",
  "backupCodes",
  "securityAnswer",
  "cardNumber",
  "cvv",
  "cvc",
  "pin",
  "faceTemplate",
  "faceEmbedding",
  "biometricTemplate",
]);

/* ============================================================================
 * NESTED SCHEMAS
 * ========================================================================== */

const actorSnapshotSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    type: {
      type: String,
      enum: AUDIT_ACTORS,
      default: "unknown",
    },

    role: {
      type: String,
      trim: true,
      maxlength: 50,
      default: null,
    },

    roles: {
      type: [
        {
          type: String,
          maxlength: 50,
        },
      ],
      default: [],
    },

    name: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 320,
      default: null,
    },

    userCode: {
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

const requestContextSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      trim: true,
      maxlength: 150,
      index: false,
      default: null,
    },

    correlationId: {
      type: String,
      trim: true,
      maxlength: 150,
      default: null,
    },

    parentEventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AuditLog",
      default: null,
    },

    method: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 20,
      default: null,
    },

    route: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },

    endpoint: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },

    statusCode: {
      type: Number,
      min: 100,
      max: 599,
      default: null,
    },

    ipAddress: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    forwardedFor: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },

    userAgent: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },

    origin: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },

    referer: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },

    host: {
      type: String,
      trim: true,
      maxlength: 255,
      default: null,
    },

    protocol: {
      type: String,
      trim: true,
      maxlength: 20,
      default: null,
    },

    deviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Device",
      default: null,
    },

    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RefreshSession",
      default: null,
    },

    platform: {
      type: String,
      trim: true,
      maxlength: 50,
      default: null,
    },

    appVersion: {
      type: String,
      trim: true,
      maxlength: 50,
      default: null,
    },
  },
  {
    _id: false,
  }
);

const resourceSchema = new mongoose.Schema(
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

    collection: {
      type: String,
      trim: true,
      maxlength: 150,
      default: null,
    },

    id: {
      type: mongoose.Schema.Types.ObjectId,
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

    name: {
      type: String,
      trim: true,
      maxlength: 300,
      default: null,
    },

    identifier: {
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

const changeSchema = new mongoose.Schema(
  {
    field: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    operation: {
      type: String,
      enum: CHANGE_OPERATIONS,
      default: "set",
    },

    oldValue: {
      type: mongoose.Schema.Types.Mixed,
      default: undefined,
    },

    newValue: {
      type: mongoose.Schema.Types.Mixed,
      default: undefined,
    },

    oldValueHash: {
      type: String,
      trim: true,
      maxlength: 128,
      default: null,
    },

    newValueHash: {
      type: String,
      trim: true,
      maxlength: 128,
      default: null,
    },

    sensitive: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  }
);

const errorSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      trim: true,
      maxlength: 150,
      default: null,
    },

    name: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
    },

    message: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },

    statusCode: {
      type: Number,
      min: 400,
      max: 599,
      default: null,
    },

    stackHash: {
      type: String,
      trim: true,
      maxlength: 128,
      default: null,
    },
  },
  {
    _id: false,
  }
);

/* ============================================================================
 * SCHEMA
 * ========================================================================== */

const auditLogSchema = new mongoose.Schema(
  {
    /* ------------------------------------------------------------------------
     * TENANCY
     * ---------------------------------------------------------------------- */

    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
      index: true,
    },

    /* ------------------------------------------------------------------------
     * ACTOR
     * ---------------------------------------------------------------------- */

    actor: {
      type: actorSnapshotSchema,
      required: true,
    },

    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    actorType: {
      type: String,
      enum: AUDIT_ACTORS,
      default: "unknown",
      index: true,
    },

    /* ------------------------------------------------------------------------
     * ACTION
     * ---------------------------------------------------------------------- */

    action: {
      type: String,
      enum: AUDIT_ACTIONS,
      required: true,
      index: true,
    },

    category: {
      type: String,
      enum: AUDIT_CATEGORIES,
      required: true,
      index: true,
    },

    severity: {
      type: String,
      enum: AUDIT_SEVERITIES,
      default: "info",
      index: true,
    },

    outcome: {
      type: String,
      enum: AUDIT_OUTCOMES,
      default: "success",
      index: true,
    },

    source: {
      type: String,
      enum: AUDIT_SOURCES,
      default: "api",
      index: true,
    },

    /* ------------------------------------------------------------------------
     * RESOURCE
     * ---------------------------------------------------------------------- */

    resource: {
      type: resourceSchema,
      default: null,
    },

    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },

    resourceType: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
      index: true,
    },

    /* ------------------------------------------------------------------------
     * HUMAN READABLE DESCRIPTION
     * ---------------------------------------------------------------------- */

    message: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: null,
    },

    /* ------------------------------------------------------------------------
     * DATA CHANGES
     * ---------------------------------------------------------------------- */

    changes: {
      type: [changeSchema],
      default: [],
    },

    changedFields: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: 200,
        },
      ],
      default: [],
    },

    /* ------------------------------------------------------------------------
     * REQUEST / SECURITY CONTEXT
     * ---------------------------------------------------------------------- */

    request: {
      type: requestContextSchema,
      default: null,
    },

    /* ------------------------------------------------------------------------
     * ERROR INFORMATION
     * ---------------------------------------------------------------------- */

    error: {
      type: errorSchema,
      default: null,
    },

    /* ------------------------------------------------------------------------
     * BUSINESS CONTEXT
     * ---------------------------------------------------------------------- */

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

    sourceSystem: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "paisa",
    },

    service: {
      type: String,
      trim: true,
      maxlength: 150,
      default: null,
    },

    version: {
      type: String,
      trim: true,
      maxlength: 50,
      default: null,
    },

    /* ------------------------------------------------------------------------
     * EVENT / TRACE CORRELATION
     * ---------------------------------------------------------------------- */

    eventId: {
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

    /* ------------------------------------------------------------------------
     * COMPLIANCE / RETENTION
     * ---------------------------------------------------------------------- */

    retentionUntil: {
      type: Date,
      default: null,
      index: true,
    },

    compliance: {
      framework: {
        type: String,
        trim: true,
        maxlength: 150,
        default: null,
      },

      classification: {
        type: String,
        trim: true,
        maxlength: 100,
        default: "internal",
      },

      reason: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: null,
      },

      legalHold: {
        type: Boolean,
        default: false,
      },

      legalHoldReference: {
        type: String,
        trim: true,
        maxlength: 255,
        default: null,
      },
    },

    /* ------------------------------------------------------------------------
     * INTEGRITY
     * ---------------------------------------------------------------------- */

    integrity: {
      algorithm: {
        type: String,
        trim: true,
        maxlength: 50,
        default: "sha256",
      },

      hash: {
        type: String,
        trim: true,
        maxlength: 128,
        default: null,
        index: false,
      },

      previousHash: {
        type: String,
        trim: true,
        maxlength: 128,
        default: null,
      },
    },

    /* ------------------------------------------------------------------------
     * INTERNAL FLAGS
     * ---------------------------------------------------------------------- */

    isSystemGenerated: {
      type: Boolean,
      default: false,
      index: true,
    },

    isSecurityEvent: {
      type: Boolean,
      default: false,
      index: true,
    },

    isSensitive: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,

    /*
     * Audit records should not use automatic versioning.
     */
    versionKey: false,

    /*
     * Audit records are append-only. No soft-delete field is intentionally
     * provided because deleting audit history defeats its purpose.
     */
    strict: true,

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

/*
 * Most common query:
 *
 * "Show me everything that happened inside this organization."
 */
auditLogSchema.index(
  {
    instituteId: 1,
    createdAt: -1,
  },
  {
    name: "audit_institute_timeline",
  }
);

/*
 * User activity timeline.
 */
auditLogSchema.index(
  {
    instituteId: 1,
    actorId: 1,
    createdAt: -1,
  },
  {
    name: "audit_actor_timeline",
  }
);

/*
 * Resource history.
 */
auditLogSchema.index(
  {
    instituteId: 1,
    resourceType: 1,
    resourceId: 1,
    createdAt: -1,
  },
  {
    name: "audit_resource_history",
  }
);

/*
 * Security investigation.
 */
auditLogSchema.index(
  {
    instituteId: 1,
    category: 1,
    severity: 1,
    createdAt: -1,
  },
  {
    name: "audit_security_investigation",
  }
);

/*
 * Action-based reporting.
 */
auditLogSchema.index(
  {
    instituteId: 1,
    action: 1,
    createdAt: -1,
  },
  {
    name: "audit_action_history",
  }
);

/*
 * Correlation across services / requests / jobs.
 */
auditLogSchema.index(
  {
    correlationId: 1,
    createdAt: -1,
  },
  {
    name: "audit_correlation",
    sparse: true,
  }
);

auditLogSchema.index(
  {
    eventId: 1,
    createdAt: -1,
  },
  {
    name: "audit_event",
    sparse: true,
  }
);

auditLogSchema.index(
  {
    request: {
      requestId: 1,
    },
    createdAt: -1,
  },
  {
    name: "audit_request",
    sparse: true,
  }
);

/*
 * Security dashboard.
 */
auditLogSchema.index(
  {
    isSecurityEvent: 1,
    createdAt: -1,
  },
  {
    name: "audit_security_events",
  }
);

/*
 * Retention processing.
 *
 * This is intentionally NOT a TTL index.
 *
 * A scheduled cleanup worker should inspect retentionUntil and legalHold
 * before deleting/archiving anything.
 */
auditLogSchema.index(
  {
    retentionUntil: 1,
    "compliance.legalHold": 1,
  },
  {
    name: "audit_retention_queue",
    sparse: true,
  }
);

/*
 * Idempotency support.
 *
 * Sparse because most audit events won't have an idempotency key.
 *
 * NOTE:
 * This is intentionally NOT unique because the same idempotency key can
 * legitimately appear across different tenants/services/actions.
 */
auditLogSchema.index(
  {
    instituteId: 1,
    idempotencyKey: 1,
  },
  {
    name: "audit_idempotency",
    sparse: true,
  }
);

/* ============================================================================
 * VALIDATION
 * ========================================================================== */

auditLogSchema.pre(
  "validate",
  function (next) {
    /*
     * Keep actorId and actor.userId synchronized.
     */
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

    /*
     * Keep resourceId/resourceType synchronized.
     */
    if (
      !this.resourceId &&
      this.resource?.id
    ) {
      this.resourceId =
        this.resource.id;
    }

    if (
      !this.resourceType &&
      this.resource?.type
    ) {
      this.resourceType =
        this.resource.type;
    }

    /*
     * Automatically classify security events.
     */
    if (
      this.category ===
        "security" ||
      this.category ===
        "authentication" ||
      this.category ===
        "authorization"
    ) {
      this.isSecurityEvent =
        true;
    }

    /*
     * Failed / denied security events should never appear as normal info.
     */
    if (
      ["failure", "denied"].includes(
        this.outcome
      ) &&
      this.severity === "info"
    ) {
      this.severity =
        "warning";
    }

    /*
     * Keep changedFields synchronized.
     */
    if (
      this.changes?.length
    ) {
      this.changedFields =
        [
          ...new Set(
            this.changes
              .map(
                (change) =>
                  change.field
              )
              .filter(Boolean)
          ),
        ];
    }

    /*
     * Never permit a normal audit record to accidentally become an
     * unbounded MongoDB document.
     */
    if (
      this.changes?.length >
      100
    ) {
      return next(
        new Error(
          "Audit log cannot contain more than 100 field changes"
        )
      );
    }

    if (
      this.tags?.length >
      30
    ) {
      return next(
        new Error(
          "Audit log cannot contain more than 30 tags"
        )
      );
    }

    next();
  }
);

/* ============================================================================
 * INSTANCE METHODS
 * ========================================================================== */

/**
 * Mark this event as a security event.
 */
auditLogSchema.methods.markSecurityEvent =
  function () {
    this.isSecurityEvent =
      true;

    if (
      this.category !==
      "security"
    ) {
      this.category =
        "security";
    }

    return this;
  };

/**
 * Add a changed field.
 */
auditLogSchema.methods.addChange =
  function ({
    field,
    operation = "set",
    oldValue,
    newValue,
    oldValueHash = null,
    newValueHash = null,
    sensitive = false,
  }) {
    if (!field) {
      throw new Error(
        "Audit change field is required"
      );
    }

    this.changes.push({
      field,
      operation,
      oldValue: sensitive
        ? undefined
        : oldValue,
      newValue: sensitive
        ? undefined
        : newValue,
      oldValueHash,
      newValueHash,
      sensitive,
    });

    if (
      !this.changedFields.includes(
        field
      )
    ) {
      this.changedFields.push(
        field
      );
    }

    if (sensitive) {
      this.isSensitive =
        true;
    }

    return this;
  };

/* ============================================================================
 * STATIC HELPERS
 * ========================================================================== */

auditLogSchema.statics.findByOrganization =
  function (
    instituteId,
    options = {}
  ) {
    const {
      limit = 100,
      skip = 0,
      action,
      category,
      severity,
      actorId,
      resourceType,
      resourceId,
      startDate,
      endDate,
    } = options;

    const query = {
      instituteId,
    };

    if (action) {
      query.action =
        action;
    }

    if (category) {
      query.category =
        category;
    }

    if (severity) {
      query.severity =
        severity;
    }

    if (actorId) {
      query.actorId =
        actorId;
    }

    if (resourceType) {
      query.resourceType =
        resourceType;
    }

    if (resourceId) {
      query.resourceId =
        resourceId;
    }

    if (
      startDate ||
      endDate
    ) {
      query.createdAt =
        {};

      if (startDate) {
        query.createdAt.$gte =
          new Date(
            startDate
          );
      }

      if (endDate) {
        query.createdAt.$lte =
          new Date(
            endDate
          );
      }
    }

    return this.find(query)
      .sort({
        createdAt: -1,
      })
      .skip(
        Math.max(
          0,
          Number(skip) || 0
        )
      )
      .limit(
        Math.min(
          500,
          Math.max(
            1,
            Number(limit) || 100
          )
        )
      )
      .lean();
  };

auditLogSchema.statics.findResourceHistory =
  function (
    instituteId,
    resourceType,
    resourceId,
    limit = 100
  ) {
    return this.find({
      instituteId,
      resourceType,
      resourceId,
    })
      .sort({
        createdAt: -1,
      })
      .limit(
        Math.min(
          500,
          Math.max(
            1,
            Number(limit) ||
              100
          )
        )
      )
      .lean();
  };

auditLogSchema.statics.findActorHistory =
  function (
    instituteId,
    actorId,
    limit = 100
  ) {
    return this.find({
      instituteId,
      actorId,
    })
      .sort({
        createdAt: -1,
      })
      .limit(
        Math.min(
          500,
          Math.max(
            1,
            Number(limit) ||
              100
          )
        )
      )
      .lean();
  };

auditLogSchema.statics.findSecurityEvents =
  function (
    instituteId,
    limit = 100
  ) {
    return this.find({
      instituteId,
      isSecurityEvent:
        true,
    })
      .sort({
        createdAt: -1,
      })
      .limit(
        Math.min(
          500,
          Math.max(
            1,
            Number(limit) ||
              100
          )
        )
      )
      .lean();
  };

/* ============================================================================
 * IMMUTABILITY PROTECTION
 * ========================================================================== */

/*
 * Audit records are append-only.
 *
 * Application code should never call:
 * - save() on an existing audit record
 * - updateOne()
 * - updateMany()
 * - findOneAndUpdate()
 * - findOneAndDelete()
 * - deleteOne()
 * - deleteMany()
 *
 * We explicitly reject mutation attempts through the model.
 */

auditLogSchema.pre(
  "save",
  function (next) {
    if (!this.isNew) {
      return next(
        new Error(
          "Audit logs are immutable and cannot be modified"
        )
      );
    }

    next();
  }
);

const IMMUTABLE_QUERY_OPERATIONS = [
  "updateOne",
  "updateMany",
  "findOneAndUpdate",
  "findOneAndReplace",
  "replaceOne",
  "findOneAndDelete",
  "deleteOne",
  "deleteMany",
];

for (
  const operation of IMMUTABLE_QUERY_OPERATIONS
) {
  auditLogSchema.pre(
    operation,
    function (next) {
      next(
        new Error(
          "Audit logs are append-only and cannot be modified or deleted"
        )
      );
    }
  );
}

/* ============================================================================
 * MODEL
 * ========================================================================== */

export const AuditLog =
  mongoose.models.AuditLog ||
  mongoose.model(
    "AuditLog",
    auditLogSchema
  );

export {
  AUDIT_ACTIONS,
  AUDIT_ACTORS,
  AUDIT_SEVERITIES,
  AUDIT_CATEGORIES,
  AUDIT_SOURCES,
  AUDIT_OUTCOMES,
  CHANGE_OPERATIONS,
  SENSITIVE_FIELD_NAMES,
};