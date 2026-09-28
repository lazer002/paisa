// server/src/models/Announcement.js

import mongoose from "mongoose";

import crypto from "node:crypto";
const ANNOUNCEMENT_STATUS = [
  "draft",
  "scheduled",
  "published",
  "expired",
  "archived",
];

const ANNOUNCEMENT_PRIORITY = [
  "low",
  "medium",
  "high",
  "critical",
];

const ANNOUNCEMENT_CATEGORIES = [
  "general",
  "event",
  "holiday",
  "exam",
  "assignment",
  "attendance",
  "result",
  "fee",
  "payroll",
  "policy",
  "maintenance",
  "emergency",
  "system",
  "other",
];

const TARGET_ROLES = [
  "all",
  "admin",
  "teacher",
  "student",
  "hr",
  "employee",
];

const DELIVERY_CHANNELS = [
  "in_app",
  "push",
  "email",
  "sms",
  "web",
];

const attachmentSchema = new mongoose.Schema(
  {
    _id: false,

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },

    url: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2048,
    },

    mimeType: {
      type: String,
      trim: true,
      maxlength: 150,
      default: null,
    },

    sizeBytes: {
      type: Number,
      min: 0,
      default: null,
    },

    type: {
      type: String,
      enum: [
        "document",
        "image",
        "video",
        "audio",
        "other",
      ],
      default: "document",
    },

    thumbnailUrl: {
      type: String,
      trim: true,
      maxlength: 2048,
      default: null,
    },
  }
);

const deliveryChannelSchema = new mongoose.Schema(
  {
    _id: false,

    channel: {
      type: String,
      enum: DELIVERY_CHANNELS,
      required: true,
    },

    enabled: {
      type: Boolean,
      default: true,
    },

    scheduledAt: {
      type: Date,
      default: null,
    },

    sentAt: {
      type: Date,
      default: null,
    },

    deliveredCount: {
      type: Number,
      min: 0,
      default: 0,
    },

    failedCount: {
      type: Number,
      min: 0,
      default: 0,
    },

    lastError: {
      type: String,
      maxlength: 1000,
      default: null,
    },
  }
);

const announcementSchema = new mongoose.Schema(
  {
    /* ---------------------------------------------------------------------- */
    /* TENANCY / OWNERSHIP                                                    */
    /* ---------------------------------------------------------------------- */
publicId: {
  type: String,
  required: true,
  unique: true,
  immutable: true,
  index: true,
  default: () =>
    `ann_${crypto.randomBytes(16).toString("base64url")}`,
},
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /* ---------------------------------------------------------------------- */
    /* BASIC INFORMATION                                                      */
    /* ---------------------------------------------------------------------- */

    title: {
      type: String,
      required: [
        true,
        "Announcement title is required",
      ],
      trim: true,
      minlength: 2,
      maxlength: 200,
    },

    content: {
      type: String,
      required: [
        true,
        "Announcement content is required",
      ],
      trim: true,
      maxlength: 20000,
    },

    summary: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },

    category: {
      type: String,
      enum: ANNOUNCEMENT_CATEGORIES,
      default: "general",
      index: true,
    },

    priority: {
      type: String,
      enum: ANNOUNCEMENT_PRIORITY,
      default: "medium",
      index: true,
    },

    status: {
      type: String,
      enum: ANNOUNCEMENT_STATUS,
      default: "draft",
      index: true,
    },

    /* ---------------------------------------------------------------------- */
    /* TARGETING                                                              */
    /* ---------------------------------------------------------------------- */

    targetRoles: {
      type: [
        {
          type: String,
          enum: TARGET_ROLES,
        },
      ],
      default: [],
    },

    targetClasses: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Class",
        },
      ],
      default: [],
    },

    targetDepartments: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Department",
        },
      ],
      default: [],
    },

    targetUsers: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
    },

    /* ---------------------------------------------------------------------- */
    /* SCHEDULING                                                             */
    /* ---------------------------------------------------------------------- */

    publishAt: {
      type: Date,
      default: null,
      index: true,
    },

    publishedAt: {
      type: Date,
      default: null,
    },

    expiresAt: {
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

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },

    /* ---------------------------------------------------------------------- */
    /* DELIVERY                                                               */
    /* ---------------------------------------------------------------------- */

    deliveryChannels: {
      type: [deliveryChannelSchema],
      default: [
        {
          channel: "in_app",
          enabled: true,
        },
      ],
    },

    delivery: {
      targetedCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      deliveredCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      failedCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      readCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      acknowledgedCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      requiresAcknowledgment: {
        type: Boolean,
        default: false,
      },

      lastCalculatedAt: {
        type: Date,
        default: null,
      },
    },

    /* ---------------------------------------------------------------------- */
    /* ATTACHMENTS                                                            */
    /* ---------------------------------------------------------------------- */

    attachments: {
      type: [attachmentSchema],
      default: [],
    },

    /* ---------------------------------------------------------------------- */
    /* ACTION / CTA                                                           */
    /* ---------------------------------------------------------------------- */

    action: {
      enabled: {
        type: Boolean,
        default: false,
      },

      label: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      url: {
        type: String,
        trim: true,
        maxlength: 2048,
        default: null,
      },

      route: {
        type: String,
        trim: true,
        maxlength: 500,
        default: null,
      },

      openInNewTab: {
        type: Boolean,
        default: false,
      },
    },

    /* ---------------------------------------------------------------------- */
    /* NOTIFICATION BEHAVIOUR                                                 */
    /* ---------------------------------------------------------------------- */

    notification: {
      enabled: {
        type: Boolean,
        default: true,
      },

      pushTitle: {
        type: String,
        trim: true,
        maxlength: 120,
        default: null,
      },

      pushBody: {
        type: String,
        trim: true,
        maxlength: 500,
        default: null,
      },

      sound: {
        type: Boolean,
        default: true,
      },

      silent: {
        type: Boolean,
        default: false,
      },

      badge: {
        type: Boolean,
        default: true,
      },
    },

    /* ---------------------------------------------------------------------- */
    /* ANALYTICS CACHE                                                        */
    /* ---------------------------------------------------------------------- */

    analytics: {
      impressions: {
        type: Number,
        min: 0,
        default: 0,
      },

      uniqueViews: {
        type: Number,
        min: 0,
        default: 0,
      },

      reads: {
        type: Number,
        min: 0,
        default: 0,
      },

      acknowledgments: {
        type: Number,
        min: 0,
        default: 0,
      },

      clicks: {
        type: Number,
        min: 0,
        default: 0,
      },

      pushSent: {
        type: Number,
        min: 0,
        default: 0,
      },

      pushDelivered: {
        type: Number,
        min: 0,
        default: 0,
      },

      pushOpened: {
        type: Number,
        min: 0,
        default: 0,
      },

      emailSent: {
        type: Number,
        min: 0,
        default: 0,
      },

      emailDelivered: {
        type: Number,
        min: 0,
        default: 0,
      },

      emailOpened: {
        type: Number,
        min: 0,
        default: 0,
      },

      lastComputedAt: {
        type: Date,
        default: null,
      },
    },

    /* ---------------------------------------------------------------------- */
    /* SOFT DELETE                                                            */
    /* ---------------------------------------------------------------------- */

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

/* ==========================================================================
   INDEXES
   ========================================================================== */

announcementSchema.index(
  {
    instituteId: 1,
    status: 1,
    publishAt: 1,
  },
  {
    name: "announcement_publish_queue",
  }
);

announcementSchema.index(
  {
    instituteId: 1,
    isActive: 1,
    isDeleted: 1,
    createdAt: -1,
  },
  {
    name: "announcement_feed",
  }
);

announcementSchema.index(
  {
    instituteId: 1,
    priority: 1,
    createdAt: -1,
  },
  {
    name: "announcement_priority_feed",
  }
);

announcementSchema.index(
  {
    instituteId: 1,
    category: 1,
    createdAt: -1,
  },
  {
    name: "announcement_category_feed",
  }
);

announcementSchema.index(
  {
    targetRoles: 1,
    publishAt: 1,
  },
  {
    name: "announcement_role_targeting",
  }
);

announcementSchema.index(
  {
    targetClasses: 1,
    publishAt: 1,
  },
  {
    name: "announcement_class_targeting",
  }
);

announcementSchema.index(
  {
    targetDepartments: 1,
    publishAt: 1,
  },
  {
    name: "announcement_department_targeting",
  }
);

announcementSchema.index(
  {
    targetUsers: 1,
    publishAt: 1,
  },
  {
    name: "announcement_user_targeting",
  }
);

/*
 * IMPORTANT:
 * Do NOT use a MongoDB TTL index on expiresAt here.
 *
 * An expired announcement may still be needed for:
 * - audit history
 * - compliance
 * - analytics
 * - notification history
 * - admin reporting
 *
 * Expiration is therefore handled logically through status/isActive.
 */

/* ==========================================================================
   VALIDATION
   ========================================================================== */

announcementSchema.pre(
  "validate",
  function (next) {
    if (
      this.publishAt &&
      this.expiresAt &&
      this.expiresAt <=
        this.publishAt
    ) {
      return next(
        new Error(
          "Announcement expiration must be after publish time"
        )
      );
    }

    if (
      this.delivery.requiresAcknowledgment &&
      this.targetUsers.length === 0 &&
      this.targetClasses.length === 0 &&
      this.targetDepartments.length === 0 &&
      this.targetRoles.length === 0
    ) {
      return next(
        new Error(
          "Acknowledgment announcements require at least one target"
        )
      );
    }

    if (
      this.action.enabled &&
      !this.action.url &&
      !this.action.route
    ) {
      return next(
        new Error(
          "Enabled announcement action requires a URL or route"
        )
      );
    }

    if (
      this.status === "published" &&
      !this.publishedAt
    ) {
      this.publishedAt =
        new Date();
    }

    if (
      this.status === "expired" &&
      this.isActive
    ) {
      this.isActive = false;
    }

    if (
      this.status === "archived"
    ) {
      this.isActive = false;
    }

    next();
  }
);

/* ==========================================================================
   VIRTUALS
   ========================================================================== */

announcementSchema.virtual(
  "isExpired"
).get(function () {
  return Boolean(
    this.expiresAt &&
      this.expiresAt <=
        new Date()
  );
});

announcementSchema.virtual(
  "isScheduled"
).get(function () {
  return (
    this.status === "scheduled" &&
    Boolean(
      this.publishAt &&
        this.publishAt >
          new Date()
    )
  );
});

announcementSchema.virtual(
  "isPublished"
).get(function () {
  if (
    this.isDeleted ||
    !this.isActive
  ) {
    return false;
  }

  if (
    ![
      "published",
      "scheduled",
    ].includes(
      this.status
    )
  ) {
    return false;
  }

  const now =
    new Date();

  if (
    this.publishAt &&
    this.publishAt > now
  ) {
    return false;
  }

  if (
    this.expiresAt &&
    this.expiresAt <= now
  ) {
    return false;
  }

  return true;
});

announcementSchema.virtual(
  "readRate"
).get(function () {
  const targeted =
    this.delivery?.targetedCount ||
    0;

  if (!targeted) {
    return 0;
  }

  return Math.round(
    ((this.delivery.readCount || 0) /
      targeted) *
      100
  );
});

announcementSchema.virtual(
  "acknowledgmentRate"
).get(function () {
  const targeted =
    this.delivery?.targetedCount ||
    0;

  if (!targeted) {
    return 0;
  }

  return Math.round(
    ((this.delivery.acknowledgedCount || 0) /
      targeted) *
      100
  );
});

announcementSchema.virtual(
  "clickThroughRate"
).get(function () {
  const reads =
    this.analytics?.reads ||
    0;

  if (!reads) {
    return 0;
  }

  return Math.round(
    ((this.analytics.clicks || 0) /
      reads) *
      100
  );
});

/* ==========================================================================
   QUERY HELPERS
   ========================================================================== */

announcementSchema.query.byInstitute =
  function (instituteId) {
    return this.where({
      instituteId,
      isDeleted: false,
    });
  };

announcementSchema.query.active =
  function () {
    const now =
      new Date();

    return this.where({
      isDeleted: false,
      isActive: true,
      status: {
        $in: [
          "published",
          "scheduled",
        ],
      },
      $or: [
        {
          publishAt: null,
        },
        {
          publishAt: {
            $lte: now,
          },
        },
      ],
      $and: [
        {
          $or: [
            {
              expiresAt: null,
            },
            {
              expiresAt: {
                $gt: now,
              },
            },
          ],
        },
      ],
    });
  };

announcementSchema.query.forRole =
  function (role) {
    return this.where({
      isDeleted: false,
      $or: [
        {
          targetRoles: "all",
        },
        {
          targetRoles: role,
        },
      ],
    });
  };

announcementSchema.query.forClass =
  function (classId) {
    return this.where({
      isDeleted: false,
      targetClasses: classId,
    });
  };

announcementSchema.query.forDepartment =
  function (departmentId) {
    return this.where({
      isDeleted: false,
      targetDepartments:
        departmentId,
    });
  };

announcementSchema.query.forUser =
  function (userId) {
    return this.where({
      isDeleted: false,
      targetUsers: userId,
    });
  };

/* ==========================================================================
   INSTANCE METHODS
   ========================================================================== */

announcementSchema.methods.publish =
  async function (
    byUserId = null
  ) {
    this.status =
      "published";

    this.isActive = true;

    this.publishedAt =
      new Date();

    if (byUserId) {
      this.updatedBy =
        byUserId;
    }

    return this.save();
  };

announcementSchema.methods.schedule =
  async function (
    publishAt,
    byUserId = null
  ) {
    if (
      !publishAt ||
      Number.isNaN(
        new Date(
          publishAt
        ).getTime()
      )
    ) {
      throw new Error(
        "Valid publish date is required"
      );
    }

    const scheduledDate =
      new Date(
        publishAt
      );

    if (
      scheduledDate <=
      new Date()
    ) {
      throw new Error(
        "Scheduled publish time must be in the future"
      );
    }

    this.publishAt =
      scheduledDate;

    this.status =
      "scheduled";

    this.isActive =
      true;

    if (byUserId) {
      this.updatedBy =
        byUserId;
    }

    return this.save();
  };

announcementSchema.methods.expire =
  async function (
    byUserId = null
  ) {
    this.status =
      "expired";

    this.isActive =
      false;

    if (!this.expiresAt) {
      this.expiresAt =
        new Date();
    }

    if (byUserId) {
      this.updatedBy =
        byUserId;
    }

    return this.save();
  };

announcementSchema.methods.archive =
  async function (
    byUserId = null
  ) {
    this.status =
      "archived";

    this.isActive =
      false;

    if (byUserId) {
      this.updatedBy =
        byUserId;
    }

    return this.save();
  };

announcementSchema.methods.restore =
  async function (
    byUserId = null
  ) {
    if (
      this.isDeleted
    ) {
      this.isDeleted =
        false;

      this.deletedAt =
        null;
    }

    if (
      this.status ===
      "archived"
    ) {
      this.status =
        "draft";
    }

    if (byUserId) {
      this.updatedBy =
        byUserId;
    }

    return this.save();
  };

announcementSchema.methods.softDelete =
  async function (
    byUserId = null
  ) {
    this.isDeleted =
      true;

    this.deletedAt =
      new Date();

    this.isActive =
      false;

    if (byUserId) {
      this.updatedBy =
        byUserId;
    }

    return this.save();
  };

/* ==========================================================================
   DELIVERY / ANALYTICS METHODS
   ========================================================================== */

announcementSchema.methods.updateDeliveryStats =
  function ({
    targetedCount,
    deliveredCount,
    failedCount,
    readCount,
    acknowledgedCount,
  } = {}) {
    if (
      targetedCount != null
    ) {
      this.delivery.targetedCount =
        Math.max(
          0,
          Number(
            targetedCount
          )
        );
    }

    if (
      deliveredCount != null
    ) {
      this.delivery.deliveredCount =
        Math.max(
          0,
          Number(
            deliveredCount
          )
        );
    }

    if (
      failedCount != null
    ) {
      this.delivery.failedCount =
        Math.max(
          0,
          Number(
            failedCount
          )
        );
    }

    if (
      readCount != null
    ) {
      this.delivery.readCount =
        Math.max(
          0,
          Number(
            readCount
          )
        );
    }

    if (
      acknowledgedCount != null
    ) {
      this.delivery.acknowledgedCount =
        Math.max(
          0,
          Number(
            acknowledgedCount
          )
        );
    }

    this.delivery.lastCalculatedAt =
      new Date();

    return this;
  };

/* ==========================================================================
   MODEL
   ========================================================================== */

export const Announcement =
  mongoose.models.Announcement ||
  mongoose.model(
    "Announcement",
    announcementSchema
  );

export {
  ANNOUNCEMENT_STATUS,
  ANNOUNCEMENT_PRIORITY,
  ANNOUNCEMENT_CATEGORIES,
  TARGET_ROLES,
  DELIVERY_CHANNELS,
};
