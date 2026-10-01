// server/src/models/UserAchievement.js

import mongoose from "mongoose";

import crypto from "node:crypto";
const USER_ACHIEVEMENT_STATUSES = [
  "in_progress",
  "earned",
  "claimed",
  "revoked",
  "expired",
  "cancelled",
];

const AWARD_SOURCES = [
  "automatic",
  "manual",
  "admin",
  "system",
  "import",
  "migration",
  "event",
  "rule",
];

const PROGRESS_TYPES = [
  "counter",
  "percentage",
  "boolean",
  "score",
  "streak",
  "milestone",
];

const evidenceSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      trim: true,
      maxlength: 100,
      required: true,
    },

    referenceType: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    referenceCode: {
      type: String,
      trim: true,
      maxlength: 300,
      default: null,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    recordedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true,
  }
);

const progressHistorySchema = new mongoose.Schema(
  {
    previousValue: {
      type: Number,
      min: 0,
      default: 0,
    },

    newValue: {
      type: Number,
      min: 0,
      required: true,
    },

    targetValue: {
      type: Number,
      min: 0,
      default: null,
    },

    percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    source: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
    },

    referenceType: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
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

const rewardSnapshotSchema = new mongoose.Schema(
  {
    points: {
      type: Number,
      min: 0,
      default: 0,
    },

    badge: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
    },

    title: {
      type: String,
      trim: true,
      maxlength: 300,
      default: null,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    _id: false,
  }
);

const achievementSnapshotSchema = new mongoose.Schema(
  {
    achievementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Achievement",
      required: true,
    },

    code: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    name: {
      type: String,
      trim: true,
      maxlength: 300,
      default: null,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: null,
    },

    type: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    rarity: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    version: {
      type: Number,
      min: 1,
      default: 1,
    },

    reward: {
      type: rewardSnapshotSchema,
      default: () => ({}),
    },

    badge: {
      icon: {
        type: String,
        trim: true,
        maxlength: 2000,
        default: null,
      },

      imageUrl: {
        type: String,
        trim: true,
        maxlength: 2000,
        default: null,
      },

      color: {
        type: String,
        trim: true,
        maxlength: 50,
        default: null,
      },

      label: {
        type: String,
        trim: true,
        maxlength: 200,
        default: null,
      },
    },
  },
  {
    _id: false,
  }
);

const userAchievementSchema = new mongoose.Schema(
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
    `leader_${crypto.randomBytes(16).toString("base64url")}`,
},
    /* ====================================================================== */
    /* IDENTITY                                                               */
    /* ====================================================================== */

    recordCode: {
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
    /* USER                                                                     */
    /* ====================================================================== */

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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

    /* ====================================================================== */
    /* ACHIEVEMENT                                                             */
    /* ====================================================================== */

    achievementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Achievement",
      required: true,
      index: true,
    },

    achievementSnapshot: {
      type: achievementSnapshotSchema,
      required: true,
    },

    /* ====================================================================== */
    /* STATUS                                                                   */
    /* ====================================================================== */

    status: {
      type: String,
      enum: USER_ACHIEVEMENT_STATUSES,
      default: "in_progress",
      index: true,
    },

    awardSource: {
      type: String,
      enum: AWARD_SOURCES,
      default: "automatic",
      index: true,
    },

    /* ====================================================================== */
    /* PROGRESS                                                                 */
    /* ====================================================================== */

    progress: {
      type: {
        type: String,
        enum: PROGRESS_TYPES,
        default: "counter",
      },

      current: {
        type: Number,
        min: 0,
        default: 0,
      },

      target: {
        type: Number,
        min: 0,
        default: null,
      },

      percentage: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },

      unit: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      lastUpdatedAt: {
        type: Date,
        default: null,
      },
    },

    progressHistory: {
      type: [progressHistorySchema],
      default: [],
    },

    /* ====================================================================== */
    /* AWARD                                                                     */
    /* ====================================================================== */

    earnedAt: {
      type: Date,
      default: null,
      index: true,
    },

    claimedAt: {
      type: Date,
      default: null,
    },

    awardCount: {
      type: Number,
      min: 0,
      default: 0,
    },

    rewardSnapshot: {
      type: rewardSnapshotSchema,
      default: () => ({}),
    },

    /* ====================================================================== */
    /* POINTS                                                                    */
    /* ====================================================================== */

    pointsAwarded: {
      type: Number,
      min: 0,
      default: 0,
    },

    pointLedgerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PointLedger",
      default: null,
      index: true,
    },

    /* ====================================================================== */
    /* EVIDENCE                                                                  */
    /* ====================================================================== */

    evidence: {
      type: [evidenceSchema],
      default: [],
    },

    evidenceCount: {
      type: Number,
      min: 0,
      default: 0,
    },

    /* ====================================================================== */
    /* REVOCATION                                                                */
    /* ====================================================================== */

    revokedAt: {
      type: Date,
      default: null,
    },

    revokedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    revocationReason: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },

    /* ====================================================================== */
    /* EXPIRATION                                                                */
    /* ====================================================================== */

    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },

    expiredAt: {
      type: Date,
      default: null,
    },

    /* ====================================================================== */
    /* SOURCE                                                                    */
    /* ====================================================================== */

    source: {
      referenceType: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      referenceId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },

      referenceCode: {
        type: String,
        trim: true,
        maxlength: 300,
        default: null,
      },

      eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
        default: null,
      },

      description: {
        type: String,
        trim: true,
        maxlength: 2000,
        default: null,
      },
    },

    /* ====================================================================== */
    /* CONTEXT                                                                   */
    /* ====================================================================== */

    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      default: null,
      index: true,
    },

    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
      index: true,
    },

    /* ====================================================================== */
    /* RANKING                                                                   */
    /* ====================================================================== */

    ranking: {
      eligible: {
        type: Boolean,
        default: true,
      },

      leaderboardIncluded: {
        type: Boolean,
        default: true,
      },

      pointsContribution: {
        type: Number,
        min: 0,
        default: 0,
      },

      seasonId: {
        type: String,
        trim: true,
        maxlength: 200,
        default: null,
      },

      seasonName: {
        type: String,
        trim: true,
        maxlength: 300,
        default: null,
      },
    },

    /* ====================================================================== */
    /* NOTIFICATION                                                             */
    /* ====================================================================== */

    notification: {
      notified: {
        type: Boolean,
        default: false,
      },

      notifiedAt: {
        type: Date,
        default: null,
      },

      notificationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Notification",
        default: null,
      },

      channels: {
        type: [
          {
            type: String,
            trim: true,
            maxlength: 50,
          },
        ],
        default: [],
      },
    },

    /* ====================================================================== */
    /* TAGS / METADATA                                                          */
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
    /* AUDIT                                                                     */
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

    awardedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /* ====================================================================== */
    /* LIFECYCLE                                                                 */
    /* ====================================================================== */

    legalHold: {
      type: Boolean,
      default: false,
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

userAchievementSchema.index(
  {
    instituteId: 1,
    recordCode: 1,
  },
  {
    unique: true,
    sparse: true,
    name: "tenant_user_achievement_code",
  }
);

userAchievementSchema.index(
  {
    instituteId: 1,
    userId: 1,
    achievementId: 1,
    createdAt: -1,
  },
  {
    name: "user_achievement_history",
  }
);

userAchievementSchema.index(
  {
    instituteId: 1,
    userId: 1,
    status: 1,
    createdAt: -1,
  },
  {
    name: "user_achievement_status",
  }
);

userAchievementSchema.index(
  {
    instituteId: 1,
    achievementId: 1,
    status: 1,
    earnedAt: -1,
  },
  {
    name: "achievement_awards",
  }
);

userAchievementSchema.index(
  {
    instituteId: 1,
    studentId: 1,
    status: 1,
    earnedAt: -1,
  },
  {
    sparse: true,
    name: "student_achievements",
  }
);

userAchievementSchema.index(
  {
    instituteId: 1,
    employeeId: 1,
    status: 1,
    earnedAt: -1,
  },
  {
    sparse: true,
    name: "employee_achievements",
  }
);

userAchievementSchema.index(
  {
    instituteId: 1,
    classId: 1,
    achievementId: 1,
    status: 1,
  },
  {
    sparse: true,
    name: "class_achievements",
  }
);

userAchievementSchema.index(
  {
    instituteId: 1,
    departmentId: 1,
    achievementId: 1,
    status: 1,
  },
  {
    sparse: true,
    name: "department_achievements",
  }
);

userAchievementSchema.index(
  {
    instituteId: 1,
    "ranking.seasonId": 1,
    userId: 1,
    earnedAt: -1,
  },
  {
    sparse: true,
    name: "season_user_achievements",
  }
);

userAchievementSchema.index(
  {
    instituteId: 1,
    expiresAt: 1,
    status: 1,
  },
  {
    sparse: true,
    name: "achievement_expiration",
  }
);

userAchievementSchema.index(
  {
    instituteId: 1,
    pointLedgerId: 1,
  },
  {
    sparse: true,
    name: "achievement_point_ledger",
  }
);

userAchievementSchema.index(
  {
    instituteId: 1,
    "source.referenceType": 1,
    "source.referenceId": 1,
  },
  {
    sparse: true,
    name: "achievement_source_reference",
  }
);

userAchievementSchema.index(
  {
    instituteId: 1,
    isDeleted: 1,
    createdAt: -1,
  },
  {
    name: "active_user_achievements",
  }
);

/* ============================================================================
 * VALIDATION
 * ========================================================================== */

userAchievementSchema.pre(
  "validate",
  function (next) {
    if (
      this.progressHistory.length >
      1000
    ) {
      return next(
        new Error(
          "Progress history cannot contain more than 1000 entries"
        )
      );
    }

    if (
      this.evidence.length >
      100
    ) {
      return next(
        new Error(
          "Achievement cannot contain more than 100 evidence records"
        )
      );
    }

    if (
      this.tags.length >
      100
    ) {
      return next(
        new Error(
          "Achievement cannot contain more than 100 tags"
        )
      );
    }

    if (
      this.notification.channels.length >
      20
    ) {
      return next(
        new Error(
          "Achievement notification cannot contain more than 20 channels"
        )
      );
    }

    this.evidenceCount =
      this.evidence.length;

    if (
      this.progress.target !== null &&
      this.progress.target !== undefined
    ) {
      if (
        this.progress.target ===
          0
      ) {
        this.progress.percentage =
          this.progress.current >
          0
            ? 100
            : 0;
      } else {
        this.progress.percentage =
          Math.min(
            100,
            Math.max(
              0,
              (
                this.progress.current /
                this.progress.target
              ) *
                100
            )
          );
      }
    }

    if (
      this.status ===
        "earned" &&
      !this.earnedAt
    ) {
      this.earnedAt =
        new Date();
    }

    if (
      this.status ===
        "claimed" &&
      !this.claimedAt
    ) {
      this.claimedAt =
        new Date();
    }

    if (
      this.status ===
        "revoked" &&
      !this.revokedAt
    ) {
      this.revokedAt =
        new Date();
    }

    if (
      this.status ===
        "expired" &&
      !this.expiredAt
    ) {
      this.expiredAt =
        new Date();
    }

    if (
      this.isDeleted &&
      !this.deletedAt
    ) {
      this.deletedAt =
        new Date();
    }

    next();
  }
);

/* ============================================================================
 * VIRTUALS
 * ========================================================================== */

userAchievementSchema.virtual(
  "isEarned"
).get(function () {
  return [
    "earned",
    "claimed",
  ].includes(
    this.status
  );
});

userAchievementSchema.virtual(
  "isClaimed"
).get(function () {
  return (
    this.status ===
    "claimed"
  );
});

userAchievementSchema.virtual(
  "isRevoked"
).get(function () {
  return (
    this.status ===
    "revoked"
  );
});

userAchievementSchema.virtual(
  "isExpired"
).get(function () {
  return (
    this.status ===
      "expired" ||
    (
      this.expiresAt &&
      this.expiresAt <=
        new Date()
    )
  );
});

userAchievementSchema.virtual(
  "isCompleted"
).get(function () {
  return (
    this.progress.percentage >=
    100
  );
});

userAchievementSchema.virtual(
  "remainingProgress"
).get(function () {
  if (
    this.progress.target ===
      null ||
    this.progress.target ===
      undefined
  ) {
    return 0;
  }

  return Math.max(
    0,
    this.progress.target -
      this.progress.current
  );
});

userAchievementSchema.virtual(
  "daysUntilExpiry"
).get(function () {
  if (
    !this.expiresAt
  ) {
    return null;
  }

  const diff =
    this.expiresAt.getTime() -
    Date.now();

  return Math.ceil(
    diff /
      (1000 * 60 * 60 * 24)
  );
});

/* ============================================================================
 * QUERY HELPERS
 * ========================================================================== */

userAchievementSchema.query.byInstitute =
  function (instituteId) {
    return this.where({
      instituteId,
      isDeleted: false,
    });
  };

userAchievementSchema.query.byUser =
  function (userId) {
    return this.where({
      userId,
      isDeleted: false,
    });
  };

userAchievementSchema.query.earned =
  function () {
    return this.where({
      status: {
        $in: [
          "earned",
          "claimed",
        ],
      },
      isDeleted: false,
    });
  };

userAchievementSchema.query.inProgress =
  function () {
    return this.where({
      status: "in_progress",
      isDeleted: false,
    });
  };

userAchievementSchema.query.active =
  function () {
    return this.where({
      status: {
        $in: [
          "in_progress",
          "earned",
          "claimed",
        ],
      },
      isDeleted: false,
    });
  };

userAchievementSchema.query.byAchievement =
  function (
    achievementId
  ) {
    return this.where({
      achievementId,
      isDeleted: false,
    });
  };

userAchievementSchema.query.bySeason =
  function (
    seasonId
  ) {
    return this.where({
      "ranking.seasonId":
        seasonId,
      isDeleted: false,
    });
  };

/* ============================================================================
 * INSTANCE METHODS
 * ========================================================================== */

userAchievementSchema.methods.updateProgress =
  async function ({
    current,
    source = null,
    referenceType = null,
    referenceId = null,
    updatedBy = null,
    target = null,
  } = {}) {
    if (
      this.status !==
      "in_progress"
    ) {
      throw new Error(
        "Only in-progress achievements can update progress"
      );
    }

    const previousValue =
      this.progress.current;

    const nextValue =
      Math.max(
        0,
        Number(current)
      );

    if (
      target !== null &&
      target !== undefined
    ) {
      this.progress.target =
        Math.max(
          0,
          Number(target)
        );
    }

    this.progress.current =
      nextValue;

    if (
      this.progress.target !==
        null &&
      this.progress.target !==
        undefined
    ) {
      this.progress.percentage =
        this.progress.target ===
          0
          ? nextValue > 0
            ? 100
            : 0
          : Math.min(
              100,
              Math.max(
                0,
                (
                  nextValue /
                  this.progress.target
                ) *
                  100
              )
            );
    }

    this.progress.lastUpdatedAt =
      new Date();

    this.progressHistory.push({
      previousValue,
      newValue:
        nextValue,
      targetValue:
        this.progress.target,
      percentage:
        this.progress.percentage,
      source,
      referenceType,
      referenceId,
      updatedBy,
      updatedAt:
        new Date(),
    });

    if (
      this.progress.percentage >=
      100
    ) {
      this.status =
        "earned";

      this.earnedAt =
        this.earnedAt ||
        new Date();

      this.awardCount +=
        1;
    }

    return this.save();
  };

userAchievementSchema.methods.incrementProgress =
  async function ({
    amount = 1,
    source = null,
    referenceType = null,
    referenceId = null,
    updatedBy = null,
  } = {}) {
    const current =
      this.progress.current;

    return this.updateProgress({
      current:
        current +
        Number(amount),
      source,
      referenceType,
      referenceId,
      updatedBy,
    });
  };

userAchievementSchema.methods.markEarned =
  async function ({
    awardedBy = null,
    pointsAwarded = null,
  } = {}) {
    if (
      this.status ===
      "revoked"
    ) {
      throw new Error(
        "Revoked achievement cannot be earned"
      );
    }

    this.status =
      "earned";

    this.earnedAt =
      this.earnedAt ||
      new Date();

    this.awardedBy =
      awardedBy ||
      this.awardedBy;

    this.awardCount +=
      1;

    if (
      pointsAwarded !== null &&
      pointsAwarded !==
        undefined
    ) {
      this.pointsAwarded =
        Math.max(
          0,
          Number(
            pointsAwarded
          )
        );
    }

    this.progress.percentage =
      100;

    if (
      this.progress.target !==
        null &&
      this.progress.target !==
        undefined
    ) {
      this.progress.current =
        Math.max(
          this.progress.current,
          this.progress.target
        );
    }

    return this.save();
  };

userAchievementSchema.methods.claim =
  async function () {
    if (
      ![
        "earned",
        "claimed",
      ].includes(
        this.status
      )
    ) {
      throw new Error(
        "Only earned achievements can be claimed"
      );
    }

    this.status =
      "claimed";

    this.claimedAt =
      this.claimedAt ||
      new Date();

    return this.save();
  };

userAchievementSchema.methods.revoke =
  async function ({
    revokedBy = null,
    reason = null,
  } = {}) {
    if (
      this.status ===
      "revoked"
    ) {
      return this;
    }

    this.status =
      "revoked";

    this.revokedAt =
      new Date();

    this.revokedBy =
      revokedBy;

    this.revocationReason =
      reason;

    return this.save();
  };

userAchievementSchema.methods.expire =
  async function () {
    if (
      this.status ===
      "revoked"
    ) {
      throw new Error(
        "Revoked achievement cannot expire"
      );
    }

    this.status =
      "expired";

    this.expiredAt =
      new Date();

    return this.save();
  };

userAchievementSchema.methods.addEvidence =
  async function (
    evidence
  ) {
    if (
      this.evidence.length >=
      100
    ) {
      throw new Error(
        "Maximum evidence limit reached"
      );
    }

    this.evidence.push(
      evidence
    );

    this.evidenceCount =
      this.evidence.length;

    return this.save();
  };

userAchievementSchema.methods.markNotified =
  async function ({
    notificationId = null,
    channels = [],
  } = {}) {
    this.notification.notified =
      true;

    this.notification.notifiedAt =
      new Date();

    this.notification.notificationId =
      notificationId;

    this.notification.channels =
      channels;

    return this.save();
  };

userAchievementSchema.methods.addTag =
  async function (
    tag
  ) {
    const normalized =
      String(tag)
        .trim()
        .toLowerCase();

    if (
      !normalized
    ) {
      throw new Error(
        "Tag is required"
      );
    }

    if (
      this.tags.includes(
        normalized
      )
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

    this.tags.push(
      normalized
    );

    return this.save();
  };

userAchievementSchema.methods.removeTag =
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
          item !==
          normalized
      );

    return this.save();
  };

userAchievementSchema.methods.setLegalHold =
  async function (
    enabled = true
  ) {
    this.legalHold =
      enabled;

    return this.save();
  };

userAchievementSchema.methods.softDelete =
  async function ({
    deletedBy = null,
    reason = null,
  } = {}) {
    if (
      this.legalHold
    ) {
      throw new Error(
        "User achievement is under legal hold"
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

userAchievementSchema.methods.restore =
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

userAchievementSchema.statics.findByRecordCode =
  function (
    instituteId,
    recordCode
  ) {
    return this.findOne({
      instituteId,
      recordCode:
        String(
          recordCode
        )
          .trim()
          .toUpperCase(),
      isDeleted: false,
    });
  };

userAchievementSchema.statics.findUserAchievements =
  function (
    instituteId,
    userId,
    {
      status = null,
      limit = 100,
      skip = 0,
    } = {}
  ) {
    const query = {
      instituteId,
      userId,
      isDeleted: false,
    };

    if (
      status
    ) {
      query.status =
        status;
    }

    return this.find(query)
      .sort({
        earnedAt: -1,
        createdAt: -1,
      })
      .skip(skip)
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

userAchievementSchema.statics.findEarnedByUser =
  function (
    instituteId,
    userId,
    limit = 100
  ) {
    return this.find({
      instituteId,
      userId,
      status: {
        $in: [
          "earned",
          "claimed",
        ],
      },
      isDeleted: false,
    })
      .sort({
        earnedAt: -1,
      })
      .limit(limit);
  };

userAchievementSchema.statics.findByAchievement =
  function (
    instituteId,
    achievementId,
    {
      status = null,
      limit = 100,
    } = {}
  ) {
    const query = {
      instituteId,
      achievementId,
      isDeleted: false,
    };

    if (
      status
    ) {
      query.status =
        status;
    }

    return this.find(query)
      .sort({
        earnedAt: -1,
        createdAt: -1,
      })
      .limit(limit);
  };

userAchievementSchema.statics.findActiveProgress =
  function (
    instituteId,
    achievementId,
    userId
  ) {
    return this.findOne({
      instituteId,
      achievementId,
      userId,
      status:
        "in_progress",
      isDeleted: false,
    });
  };

userAchievementSchema.statics.hasEarned =
  async function (
    instituteId,
    achievementId,
    userId
  ) {
    const count =
      await this.countDocuments({
        instituteId,
        achievementId,
        userId,
        status: {
          $in: [
            "earned",
            "claimed",
          ],
        },
        isDeleted: false,
      });

    return count > 0;
  };

userAchievementSchema.statics.findExpiring =
  function (
    instituteId,
    beforeDate = new Date(),
    limit = 500
  ) {
    return this.find({
      instituteId,
      status: {
        $in: [
          "in_progress",
          "earned",
          "claimed",
        ],
      },
      isDeleted: false,
      legalHold: false,
      expiresAt: {
        $ne: null,
        $lte: beforeDate,
      },
    })
      .sort({
        expiresAt: 1,
      })
      .limit(
        Math.min(
          1000,
          Math.max(
            1,
            limit
          )
        )
      );
  };

userAchievementSchema.statics.getUserSummary =
  async function (
    instituteId,
    userId
  ) {
    const result =
      await this.aggregate([
        {
          $match: {
            instituteId:
              new mongoose.Types.ObjectId(
                instituteId
              ),
            userId:
              new mongoose.Types.ObjectId(
                userId
              ),
            isDeleted:
              false,
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: 1,
            },
            earned: {
              $sum: {
                $cond: [
                  {
                    $in: [
                      "$status",
                      [
                        "earned",
                        "claimed",
                      ],
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            inProgress: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "in_progress",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            revoked: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "revoked",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            totalPoints: {
              $sum: "$pointsAwarded",
            },
          },
        },
        {
          $project: {
            _id: 0,
            total: 1,
            earned: 1,
            inProgress: 1,
            revoked: 1,
            totalPoints: 1,
          },
        },
      ]);

    return (
      result[0] || {
        total: 0,
        earned: 0,
        inProgress: 0,
        revoked: 0,
        totalPoints: 0,
      }
    );
  };

userAchievementSchema.statics.getAchievementStats =
  async function (
    instituteId,
    achievementId
  ) {
    const result =
      await this.aggregate([
        {
          $match: {
            instituteId:
              new mongoose.Types.ObjectId(
                instituteId
              ),
            achievementId:
              new mongoose.Types.ObjectId(
                achievementId
              ),
            isDeleted:
              false,
          },
        },
        {
          $group: {
            _id: null,
            totalRecords: {
              $sum: 1,
            },
            earned: {
              $sum: {
                $cond: [
                  {
                    $in: [
                      "$status",
                      [
                        "earned",
                        "claimed",
                      ],
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            inProgress: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "in_progress",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            revoked: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "revoked",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            pointsAwarded: {
              $sum: "$pointsAwarded",
            },
          },
        },
        {
          $project: {
            _id: 0,
            totalRecords: 1,
            earned: 1,
            inProgress: 1,
            revoked: 1,
            pointsAwarded: 1,
          },
        },
      ]);

    return (
      result[0] || {
        totalRecords: 0,
        earned: 0,
        inProgress: 0,
        revoked: 0,
        pointsAwarded: 0,
      }
    );
  };

/* ============================================================================
 * MODEL
 * ========================================================================== */

export const UserAchievement =
  mongoose.models.UserAchievement ||
  mongoose.model(
    "UserAchievement",
    userAchievementSchema
  );

export {
  USER_ACHIEVEMENT_STATUSES,
  AWARD_SOURCES,
  PROGRESS_TYPES,
};
