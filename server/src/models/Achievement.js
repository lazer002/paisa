// server/src/models/Achievement.js

import mongoose from "mongoose";

import crypto from "node:crypto";
const ACHIEVEMENT_TYPES = [
  "academic",
  "attendance",
  "assignment",
  "test",
  "participation",
  "behavior",
  "skill",
  "streak",
  "leadership",
  "social",
  "event",
  "custom",
];

const ACHIEVEMENT_STATUSES = [
  "draft",
  "active",
  "inactive",
  "archived",
];

const ACHIEVEMENT_RARITIES = [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
];

const CRITERIA_OPERATORS = [
  "gte",
  "gt",
  "lte",
  "lt",
  "eq",
  "neq",
  "between",
  "count",
  "all",
  "any",
];

const CRITERIA_SOURCES = [
  "points",
  "attendance",
  "assignments",
  "submissions",
  "tests",
  "test_score",
  "test_percentage",
  "streak",
  "live_sessions",
  "events",
  "courses",
  "enrollments",
  "manual",
  "custom",
];

const criteriaSchema = new mongoose.Schema(
  {
    source: {
      type: String,
      enum: CRITERIA_SOURCES,
      required: true,
    },

    metric: {
      type: String,
      trim: true,
      maxlength: 200,
      required: true,
    },

    operator: {
      type: String,
      enum: CRITERIA_OPERATORS,
      required: true,
    },

    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    secondaryValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      default: null,
    },

    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    _id: true,
  }
);

const rewardSchema = new mongoose.Schema(
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

const requirementSchema = new mongoose.Schema(
  {
    minimumLevel: {
      type: Number,
      min: 0,
      default: null,
    },

    prerequisiteAchievementIds: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Achievement",
        },
      ],
      default: [],
    },

    requiredPoints: {
      type: Number,
      min: 0,
      default: null,
    },

    requiredStreak: {
      type: Number,
      min: 0,
      default: null,
    },

    requiredAttendancePercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
  },
  {
    _id: false,
  }
);

const badgeSchema = new mongoose.Schema(
  {
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

    shape: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    label: {
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

const achievementSchema = new mongoose.Schema(
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
    `achi${crypto.randomBytes(16).toString("base64url")}`,
},
    /* ====================================================================== */
    /* IDENTITY                                                               */
    /* ====================================================================== */

    achievementCode: {
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

    version: {
      type: Number,
      min: 1,
      default: 1,
    },

    /* ====================================================================== */
    /* CORE                                                                    */
    /* ====================================================================== */

    name: {
      type: String,
      trim: true,
      minlength: 2,
      maxlength: 300,
      required: true,
    },

    slug: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 300,
      default: null,
    },

    shortDescription: {
      type: String,
      trim: true,
      maxlength: 500,
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
      enum: ACHIEVEMENT_TYPES,
      default: "custom",
      index: true,
    },

    status: {
      type: String,
      enum: ACHIEVEMENT_STATUSES,
      default: "draft",
      index: true,
    },

    rarity: {
      type: String,
      enum: ACHIEVEMENT_RARITIES,
      default: "common",
      index: true,
    },

    /* ====================================================================== */
    /* DISPLAY                                                                 */
    /* ====================================================================== */

    badge: {
      type: badgeSchema,
      default: () => ({}),
    },

    displayOrder: {
      type: Number,
      default: 0,
      index: true,
    },

    featured: {
      type: Boolean,
      default: false,
      index: true,
    },

    hidden: {
      type: Boolean,
      default: false,
    },

    /* ====================================================================== */
    /* ELIGIBILITY                                                             */
    /* ====================================================================== */

    targetRoles: {
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

    classIds: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Class",
        },
      ],
      default: [],
    },

    departmentIds: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Department",
        },
      ],
      default: [],
    },

    criteria: {
      type: [criteriaSchema],
      default: [],
    },

    criteriaMode: {
      type: String,
      enum: [
        "all",
        "any",
      ],
      default: "all",
    },

    requirement: {
      type: requirementSchema,
      default: () => ({}),
    },

    /* ====================================================================== */
    /* REWARD                                                                  */
    /* ====================================================================== */

    reward: {
      type: rewardSchema,
      default: () => ({}),
    },

    points: {
      type: Number,
      min: 0,
      default: 0,
    },

    /* ====================================================================== */
    /* LIMITS                                                                  */
    /* ====================================================================== */

    repeatable: {
      type: Boolean,
      default: false,
    },

    maxAwardsPerUser: {
      type: Number,
      min: 1,
      default: 1,
    },

    maxTotalAwards: {
      type: Number,
      min: 1,
      default: null,
    },

    cooldownDays: {
      type: Number,
      min: 0,
      default: 0,
    },

    /* ====================================================================== */
    /* SCHEDULING                                                              */
    /* ====================================================================== */

    availableFrom: {
      type: Date,
      default: null,
      index: true,
    },

    availableUntil: {
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

    /* ====================================================================== */
    /* AUTOMATION                                                              */
    /* ====================================================================== */

    automation: {
      enabled: {
        type: Boolean,
        default: true,
      },

      trigger: {
        type: String,
        trim: true,
        maxlength: 200,
        default: null,
      },

      evaluateOn: {
        type: [
          {
            type: String,
            trim: true,
            maxlength: 100,
          },
        ],
        default: [],
      },

      autoAward: {
        type: Boolean,
        default: true,
      },

      notifyUser: {
        type: Boolean,
        default: true,
      },

      createPointLedgerEntry: {
        type: Boolean,
        default: true,
      },
    },

    /* ====================================================================== */
    /* STATISTICS                                                              */
    /* ====================================================================== */

    statistics: {
      totalAwards: {
        type: Number,
        min: 0,
        default: 0,
      },

      uniqueRecipients: {
        type: Number,
        min: 0,
        default: 0,
      },

      totalPointsAwarded: {
        type: Number,
        min: 0,
        default: 0,
      },

      lastAwardedAt: {
        type: Date,
        default: null,
      },

      averageCompletionTimeHours: {
        type: Number,
        min: 0,
        default: null,
      },
    },

    /* ====================================================================== */
    /* TAGS                                                                    */
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

    skills: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: 200,
        },
      ],
      default: [],
    },

    /* ====================================================================== */
    /* CUSTOM / METADATA                                                       */
    /* ====================================================================== */

    customFields: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    /* ====================================================================== */
    /* OWNERSHIP / AUDIT                                                       */
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

    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    publishedAt: {
      type: Date,
      default: null,
    },

    archivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    archivedAt: {
      type: Date,
      default: null,
    },

    /* ====================================================================== */
    /* LIFECYCLE                                                               */
    /* ====================================================================== */

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

    legalHold: {
      type: Boolean,
      default: false,
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

achievementSchema.index(
  {
    instituteId: 1,
    achievementCode: 1,
  },
  {
    unique: true,
    sparse: true,
    name: "tenant_achievement_code",
  }
);

achievementSchema.index(
  {
    instituteId: 1,
    slug: 1,
  },
  {
    unique: true,
    sparse: true,
    name: "tenant_achievement_slug",
  }
);

achievementSchema.index(
  {
    instituteId: 1,
    status: 1,
    displayOrder: 1,
  },
  {
    name: "achievement_catalog",
  }
);

achievementSchema.index(
  {
    instituteId: 1,
    type: 1,
    status: 1,
    rarity: 1,
  },
  {
    name: "achievement_type_status",
  }
);

achievementSchema.index(
  {
    instituteId: 1,
    featured: 1,
    status: 1,
    displayOrder: 1,
  },
  {
    name: "featured_achievements",
  }
);

achievementSchema.index(
  {
    instituteId: 1,
    targetRoles: 1,
    status: 1,
  },
  {
    name: "achievement_roles",
  }
);

achievementSchema.index(
  {
    instituteId: 1,
    classIds: 1,
    status: 1,
  },
  {
    name: "achievement_classes",
  }
);

achievementSchema.index(
  {
    instituteId: 1,
    departmentIds: 1,
    status: 1,
  },
  {
    name: "achievement_departments",
  }
);

achievementSchema.index(
  {
    instituteId: 1,
    availableFrom: 1,
    availableUntil: 1,
    status: 1,
  },
  {
    name: "achievement_schedule",
  }
);

achievementSchema.index(
  {
    instituteId: 1,
    tags: 1,
    status: 1,
  },
  {
    name: "achievement_tags",
  }
);

achievementSchema.index(
  {
    instituteId: 1,
    isDeleted: 1,
    status: 1,
  },
  {
    name: "active_achievements",
  }
);

achievementSchema.index(
  {
    instituteId: 1,
    name: "text",
    description: "text",
    shortDescription: "text",
  },
  {
    name: "achievement_text_search",
    weights: {
      name: 10,
      shortDescription: 6,
      description: 3,
    },
  }
);

/* ============================================================================
 * VALIDATION
 * ========================================================================== */

achievementSchema.pre(
  "validate",
  function (next) {
    if (
      this.criteria.length >
      100
    ) {
      return next(
        new Error(
          "Achievement cannot contain more than 100 criteria"
        )
      );
    }

    if (
      this.targetRoles.length >
      50
    ) {
      return next(
        new Error(
          "Achievement cannot target more than 50 roles"
        )
      );
    }

    if (
      this.classIds.length >
      500
    ) {
      return next(
        new Error(
          "Achievement cannot target more than 500 classes"
        )
      );
    }

    if (
      this.departmentIds.length >
      100
    ) {
      return next(
        new Error(
          "Achievement cannot target more than 100 departments"
        )
      );
    }

    if (
      this.tags.length >
      100
    ) {
      return next(
        new Error(
          "Achievement cannot have more than 100 tags"
        )
      );
    }

    if (
      this.skills.length >
      100
    ) {
      return next(
        new Error(
          "Achievement cannot have more than 100 skills"
        )
      );
    }

    if (
      this.availableFrom &&
      this.availableUntil &&
      this.availableUntil <=
        this.availableFrom
    ) {
      return next(
        new Error(
          "availableUntil must be after availableFrom"
        )
      );
    }

    if (
      !this.repeatable
    ) {
      this.maxAwardsPerUser =
        1;
    }

    if (
      this.points === 0 &&
      this.reward.points > 0
    ) {
      this.points =
        this.reward.points;
    }

    if (
      this.reward.points === 0 &&
      this.points > 0
    ) {
      this.reward.points =
        this.points;
    }

    if (
      this.status ===
        "active" &&
      !this.publishedAt
    ) {
      this.publishedAt =
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

achievementSchema.virtual(
  "isActive"
).get(function () {
  if (
    this.isDeleted ||
    this.status !==
      "active"
  ) {
    return false;
  }

  const now =
    new Date();

  if (
    this.availableFrom &&
    now <
      this.availableFrom
  ) {
    return false;
  }

  if (
    this.availableUntil &&
    now >
      this.availableUntil
  ) {
    return false;
  }

  return true;
});

achievementSchema.virtual(
  "isScheduled"
).get(function () {
  return Boolean(
    this.availableFrom &&
      this.availableFrom >
        new Date()
  );
});

achievementSchema.virtual(
  "isExpired"
).get(function () {
  return Boolean(
    this.availableUntil &&
      this.availableUntil <
        new Date()
  );
});

achievementSchema.virtual(
  "hasCriteria"
).get(function () {
  return (
    this.criteria.length >
    0
  );
});

achievementSchema.virtual(
  "prerequisiteCount"
).get(function () {
  return (
    this.requirement
      ?.prerequisiteAchievementIds
      ?.length || 0
  );
});

/* ============================================================================
 * QUERY HELPERS
 * ========================================================================== */

achievementSchema.query.byInstitute =
  function (instituteId) {
    return this.where({
      instituteId,
      isDeleted: false,
    });
  };

achievementSchema.query.active =
  function () {
    const now =
      new Date();

    return this.where({
      status: "active",
      isDeleted: false,
      $and: [
        {
          $or: [
            {
              availableFrom: null,
            },
            {
              availableFrom: {
                $lte: now,
              },
            },
          ],
        },
        {
          $or: [
            {
              availableUntil: null,
            },
            {
              availableUntil: {
                $gte: now,
              },
            },
          ],
        },
      ],
    });
  };

achievementSchema.query.featured =
  function () {
    return this.where({
      featured: true,
      status: "active",
      isDeleted: false,
    });
  };

achievementSchema.query.byType =
  function (type) {
    return this.where({
      type,
      isDeleted: false,
    });
  };

achievementSchema.query.byRarity =
  function (rarity) {
    return this.where({
      rarity,
      isDeleted: false,
    });
  };

achievementSchema.query.byRole =
  function (role) {
    return this.where({
      targetRoles: role,
      status: "active",
      isDeleted: false,
    });
  };

/* ============================================================================
 * INSTANCE METHODS
 * ========================================================================== */

achievementSchema.methods.publish =
  async function ({
    publishedBy = null,
  } = {}) {
    if (
      this.isDeleted
    ) {
      throw new Error(
        "Deleted achievement cannot be published"
      );
    }

    if (
      !this.name
    ) {
      throw new Error(
        "Achievement name is required"
      );
    }

    if (
      this.criteria.length ===
        0 &&
      this.type !==
        "custom"
    ) {
      throw new Error(
        "Achievement requires at least one criteria"
      );
    }

    this.status =
      "active";

    this.publishedBy =
      publishedBy;

    this.publishedAt =
      new Date();

    return this.save();
  };

achievementSchema.methods.activate =
  async function () {
    if (
      this.isDeleted
    ) {
      throw new Error(
        "Deleted achievement cannot be activated"
      );
    }

    this.status =
      "active";

    if (
      !this.publishedAt
    ) {
      this.publishedAt =
        new Date();
    }

    return this.save();
  };

achievementSchema.methods.deactivate =
  async function () {
    this.status =
      "inactive";

    return this.save();
  };

achievementSchema.methods.archive =
  async function ({
    archivedBy = null,
  } = {}) {
    this.status =
      "archived";

    this.archivedBy =
      archivedBy;

    this.archivedAt =
      new Date();

    return this.save();
  };

achievementSchema.methods.restore =
  async function () {
    this.status =
      "inactive";

    this.archivedBy =
      null;

    this.archivedAt =
      null;

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

achievementSchema.methods.addCriteria =
  async function (
    criteria
  ) {
    if (
      this.criteria.length >=
      100
    ) {
      throw new Error(
        "Maximum criteria limit reached"
      );
    }

    this.criteria.push(
      criteria
    );

    return this.save();
  };

achievementSchema.methods.removeCriteria =
  async function (
    criteriaId
  ) {
    this.criteria =
      this.criteria.filter(
        (item) =>
          !item._id.equals(
            criteriaId
          )
      );

    return this.save();
  };

achievementSchema.methods.addTag =
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

achievementSchema.methods.removeTag =
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

achievementSchema.methods.updateStatistics =
  async function ({
    awardedCount = 0,
    uniqueRecipients = 0,
    totalPointsAwarded = 0,
    lastAwardedAt = null,
    averageCompletionTimeHours = null,
  } = {}) {
    this.statistics.totalAwards =
      Math.max(
        0,
        awardedCount
      );

    this.statistics.uniqueRecipients =
      Math.max(
        0,
        uniqueRecipients
      );

    this.statistics.totalPointsAwarded =
      Math.max(
        0,
        totalPointsAwarded
      );

    this.statistics.lastAwardedAt =
      lastAwardedAt;

    this.statistics.averageCompletionTimeHours =
      averageCompletionTimeHours;

    return this.save();
  };

achievementSchema.methods.setFeatured =
  async function (
    featured = true
  ) {
    this.featured =
      featured;

    return this.save();
  };

achievementSchema.methods.softDelete =
  async function ({
    deletedBy = null,
    reason = null,
  } = {}) {
    if (
      this.legalHold
    ) {
      throw new Error(
        "Achievement is under legal hold"
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

achievementSchema.methods.setLegalHold =
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

achievementSchema.statics.findByCode =
  function (
    instituteId,
    achievementCode
  ) {
    return this.findOne({
      instituteId,
      achievementCode:
        String(
          achievementCode
        )
          .trim()
          .toUpperCase(),
      isDeleted: false,
    });
  };

achievementSchema.statics.findBySlug =
  function (
    instituteId,
    slug
  ) {
    return this.findOne({
      instituteId,
      slug:
        String(slug)
          .trim()
          .toLowerCase(),
      isDeleted: false,
    });
  };

achievementSchema.statics.findAvailableForUser =
  function (
    instituteId,
    {
      role = null,
      classId = null,
      departmentId = null,
      limit = 100,
    } = {}
  ) {
    const now =
      new Date();

    const query = {
      instituteId,
      status: "active",
      isDeleted: false,
      $and: [
        {
          $or: [
            {
              availableFrom: null,
            },
            {
              availableFrom: {
                $lte: now,
              },
            },
          ],
        },
        {
          $or: [
            {
              availableUntil: null,
            },
            {
              availableUntil: {
                $gte: now,
              },
            },
          ],
        },
      ],
    };

    const eligibility =
      [];

    if (
      role
    ) {
      eligibility.push({
        $or: [
          {
            targetRoles: {
              $size: 0,
            },
          },
          {
            targetRoles: role,
          },
        ],
      });
    }

    if (
      classId
    ) {
      eligibility.push({
        $or: [
          {
            classIds: {
              $size: 0,
            },
          },
          {
            classIds: classId,
          },
        ],
      });
    }

    if (
      departmentId
    ) {
      eligibility.push({
        $or: [
          {
            departmentIds: {
              $size: 0,
            },
          },
          {
            departmentIds:
              departmentId,
          },
        ],
      });
    }

    if (
      eligibility.length
    ) {
      query.$and.push(
        ...eligibility
      );
    }

    return this.find(query)
      .sort({
        featured: -1,
        displayOrder: 1,
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

achievementSchema.statics.findByType =
  function (
    instituteId,
    type,
    limit = 100
  ) {
    return this.find({
      instituteId,
      type,
      isDeleted: false,
    })
      .sort({
        displayOrder: 1,
        createdAt: -1,
      })
      .limit(limit);
  };

achievementSchema.statics.findPrerequisites =
  function (
    instituteId,
    achievementId
  ) {
    return this.find({
      instituteId,
      "requirement.prerequisiteAchievementIds":
        achievementId,
      isDeleted: false,
    });
  };

achievementSchema.statics.getStatistics =
  async function (
    instituteId
  ) {
    const result =
      await this.aggregate([
        {
          $match: {
            instituteId:
              new mongoose.Types.ObjectId(
                instituteId
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
            active: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "active",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            totalAwards: {
              $sum: "$statistics.totalAwards",
            },
            uniqueRecipients: {
              $sum: "$statistics.uniqueRecipients",
            },
            totalPointsAwarded: {
              $sum: "$statistics.totalPointsAwarded",
            },
          },
        },
        {
          $project: {
            _id: 0,
            total: 1,
            active: 1,
            totalAwards: 1,
            uniqueRecipients: 1,
            totalPointsAwarded: 1,
          },
        },
      ]);

    return (
      result[0] || {
        total: 0,
        active: 0,
        totalAwards: 0,
        uniqueRecipients: 0,
        totalPointsAwarded: 0,
      }
    );
  };

/* ============================================================================
 * MODEL
 * ========================================================================== */

export const Achievement =
  mongoose.models.Achievement ||
  mongoose.model(
    "Achievement",
    achievementSchema
  );

export {
  ACHIEVEMENT_TYPES,
  ACHIEVEMENT_STATUSES,
  ACHIEVEMENT_RARITIES,
  CRITERIA_OPERATORS,
  CRITERIA_SOURCES,
};
