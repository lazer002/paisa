// server/src/models/Leaderboard.js

import mongoose from "mongoose";

const LEADERBOARD_TYPES = [
  "overall",
  "points",
  "achievements",
  "attendance",
  "academic",
  "assignment",
  "test",
  "streak",
  "class",
  "department",
  "employee",
  "custom",
];

const LEADERBOARD_STATUSES = [
  "draft",
  "active",
  "paused",
  "completed",
  "archived",
  "cancelled",
];

const PARTICIPANT_TYPES = [
  "user",
  "student",
  "employee",
];

const RANKING_DIRECTIONS = [
  "desc",
  "asc",
];

const SCORE_TYPES = [
  "points",
  "score",
  "percentage",
  "count",
  "streak",
  "duration",
];

const participantSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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

    participantType: {
      type: String,
      enum: PARTICIPANT_TYPES,
      default: "user",
    },

    displayName: {
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

    rank: {
      type: Number,
      min: 1,
      default: null,
    },

    previousRank: {
      type: Number,
      min: 1,
      default: null,
    },

    rankChange: {
      type: Number,
      default: 0,
    },

    score: {
      type: Number,
      default: 0,
    },

    points: {
      type: Number,
      default: 0,
    },

    achievements: {
      type: Number,
      min: 0,
      default: 0,
    },

    streak: {
      type: Number,
      min: 0,
      default: 0,
    },

    attendancePercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    testsCompleted: {
      type: Number,
      min: 0,
      default: 0,
    },

    assignmentsCompleted: {
      type: Number,
      min: 0,
      default: 0,
    },

    tieBreakerValue: {
      type: Number,
      default: 0,
    },

    percentile: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    qualified: {
      type: Boolean,
      default: true,
    },

    disqualified: {
      type: Boolean,
      default: false,
    },

    disqualificationReason: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },

    lastCalculatedAt: {
      type: Date,
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

const rankingRuleSchema = new mongoose.Schema(
  {
    field: {
      type: String,
      trim: true,
      maxlength: 100,
      required: true,
    },

    direction: {
      type: String,
      enum: RANKING_DIRECTIONS,
      default: "desc",
    },

    priority: {
      type: Number,
      min: 1,
      default: 1,
    },

    nullsLast: {
      type: Boolean,
      default: true,
    },
  },
  {
    _id: false,
  }
);

const periodSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "all_time",
        "daily",
        "weekly",
        "monthly",
        "quarterly",
        "yearly",
        "custom",
        "season",
      ],
      default: "all_time",
    },

    name: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
    },

    startDate: {
      type: Date,
      default: null,
    },

    endDate: {
      type: Date,
      default: null,
    },

    timezone: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "UTC",
    },

    seasonId: {
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

const eligibilitySchema = new mongoose.Schema(
  {
    participantTypes: {
      type: [
        {
          type: String,
          enum: PARTICIPANT_TYPES,
        },
      ],
      default: [
        "user",
        "student",
        "employee",
      ],
    },

    roles: {
      type: [
        {
          type: String,
          trim: true,
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

    userIds: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
    },

    minimumPoints: {
      type: Number,
      min: 0,
      default: null,
    },

    minimumAchievements: {
      type: Number,
      min: 0,
      default: null,
    },

    minimumAttendancePercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    requireActiveUser: {
      type: Boolean,
      default: true,
    },

    excludeDeletedUsers: {
      type: Boolean,
      default: true,
    },

    customFilter: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    _id: false,
  }
);

const rewardSchema = new mongoose.Schema(
  {
    enabled: {
      type: Boolean,
      default: false,
    },

    type: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    firstPlace: {
      type: Number,
      min: 0,
      default: 0,
    },

    secondPlace: {
      type: Number,
      min: 0,
      default: 0,
    },

    thirdPlace: {
      type: Number,
      min: 0,
      default: 0,
    },

    participation: {
      type: Number,
      min: 0,
      default: 0,
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

const statisticsSchema = new mongoose.Schema(
  {
    participantCount: {
      type: Number,
      min: 0,
      default: 0,
    },

    qualifiedCount: {
      type: Number,
      min: 0,
      default: 0,
    },

    disqualifiedCount: {
      type: Number,
      min: 0,
      default: 0,
    },

    averageScore: {
      type: Number,
      default: 0,
    },

    highestScore: {
      type: Number,
      default: 0,
    },

    lowestScore: {
      type: Number,
      default: 0,
    },

    totalPoints: {
      type: Number,
      default: 0,
    },

    lastCalculatedAt: {
      type: Date,
      default: null,
    },

    calculationVersion: {
      type: Number,
      min: 1,
      default: 1,
    },
  },
  {
    _id: false,
  }
);

const leaderboardSchema = new mongoose.Schema(
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

    leaderboardCode: {
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

    name: {
      type: String,
      trim: true,
      required: true,
      minlength: 2,
      maxlength: 300,
    },

    slug: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 300,
      index: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: null,
    },

    /* ====================================================================== */
    /* TYPE                                                                     */
    /* ====================================================================== */

    type: {
      type: String,
      enum: LEADERBOARD_TYPES,
      default: "overall",
      index: true,
    },

    status: {
      type: String,
      enum: LEADERBOARD_STATUSES,
      default: "draft",
      index: true,
    },

    participantType: {
      type: String,
      enum: PARTICIPANT_TYPES,
      default: "user",
      index: true,
    },

    /* ====================================================================== */
    /* PERIOD                                                                   */
    /* ====================================================================== */

    period: {
      type: periodSchema,
      default: () => ({}),
    },

    startsAt: {
      type: Date,
      default: null,
      index: true,
    },

    endsAt: {
      type: Date,
      default: null,
      index: true,
    },

    timezone: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "UTC",
    },

    /* ====================================================================== */
    /* SCORING                                                                  */
    /* ====================================================================== */

    scoreType: {
      type: String,
      enum: SCORE_TYPES,
      default: "points",
    },

    rankingRules: {
      type: [rankingRuleSchema],
      default: [
        {
          field: "score",
          direction: "desc",
          priority: 1,
          nullsLast: true,
        },
        {
          field: "tieBreakerValue",
          direction: "desc",
          priority: 2,
          nullsLast: true,
        },
      ],
    },

    scoreMultiplier: {
      type: Number,
      min: 0,
      default: 1,
    },

    minimumScore: {
      type: Number,
      default: null,
    },

    maximumScore: {
      type: Number,
      default: null,
    },

    allowNegativeScore: {
      type: Boolean,
      default: false,
    },

    tieHandling: {
      type: String,
      enum: [
        "shared_rank",
        "dense_rank",
        "competition_rank",
        "sequential",
      ],
      default: "competition_rank",
    },

    /* ====================================================================== */
    /* ELIGIBILITY                                                              */
    /* ====================================================================== */

    eligibility: {
      type: eligibilitySchema,
      default: () => ({}),
    },

    /* ====================================================================== */
    /* PARTICIPANTS                                                             */
    /* ====================================================================== */

    participants: {
      type: [participantSchema],
      default: [],
    },

    maxParticipants: {
      type: Number,
      min: 1,
      default: null,
    },

    /* ====================================================================== */
    /* DISPLAY                                                                   */
    /* ====================================================================== */

    display: {
      showAvatar: {
        type: Boolean,
        default: true,
      },

      showScore: {
        type: Boolean,
        default: true,
      },

      showPoints: {
        type: Boolean,
        default: true,
      },

      showRankChange: {
        type: Boolean,
        default: true,
      },

      showPercentile: {
        type: Boolean,
        default: true,
      },

      showAchievements: {
        type: Boolean,
        default: true,
      },

      showStreak: {
        type: Boolean,
        default: true,
      },

      showTopThree: {
        type: Boolean,
        default: true,
      },

      public: {
        type: Boolean,
        default: false,
      },

      topLimit: {
        type: Number,
        min: 1,
        max: 1000,
        default: 100,
      },
    },

    /* ====================================================================== */
    /* REWARDS                                                                  */
    /* ====================================================================== */

    rewards: {
      type: rewardSchema,
      default: () => ({}),
    },

    /* ====================================================================== */
    /* STATISTICS                                                               */
    /* ====================================================================== */

    statistics: {
      type: statisticsSchema,
      default: () => ({}),
    },

    /* ====================================================================== */
    /* CACHE                                                                     */
    /* ====================================================================== */

    cache: {
      enabled: {
        type: Boolean,
        default: true,
      },

      version: {
        type: Number,
        min: 1,
        default: 1,
      },

      lastRefreshAt: {
        type: Date,
        default: null,
      },

      nextRefreshAt: {
        type: Date,
        default: null,
      },

      refreshIntervalSeconds: {
        type: Number,
        min: 0,
        default: 300,
      },

      dirty: {
        type: Boolean,
        default: true,
        index: true,
      },
    },

    /* ====================================================================== */
    /* SOURCE                                                                     */
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
    /* AUTOMATION                                                               */
    /* ====================================================================== */

    automation: {
      enabled: {
        type: Boolean,
        default: false,
      },

      autoStart: {
        type: Boolean,
        default: false,
      },

      autoComplete: {
        type: Boolean,
        default: false,
      },

      autoArchive: {
        type: Boolean,
        default: false,
      },

      refreshOnEvent: {
        type: Boolean,
        default: true,
      },

      eventTypes: {
        type: [
          {
            type: String,
            trim: true,
            maxlength: 200,
          },
        ],
        default: [],
      },
    },

    /* ====================================================================== */
    /* TAGS                                                                      */
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

    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /* ====================================================================== */
    /* LIFECYCLE                                                                 */
    /* ====================================================================== */

    completedAt: {
      type: Date,
      default: null,
    },

    archivedAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

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

leaderboardSchema.index(
  {
    instituteId: 1,
    leaderboardCode: 1,
  },
  {
    unique: true,
    sparse: true,
    name: "tenant_leaderboard_code",
  }
);

leaderboardSchema.index(
  {
    instituteId: 1,
    slug: 1,
  },
  {
    unique: true,
    sparse: true,
    name: "tenant_leaderboard_slug",
  }
);

leaderboardSchema.index(
  {
    instituteId: 1,
    status: 1,
    type: 1,
    startsAt: 1,
    endsAt: 1,
  },
  {
    name: "active_leaderboards",
  }
);

leaderboardSchema.index(
  {
    instituteId: 1,
    "period.seasonId": 1,
    status: 1,
  },
  {
    sparse: true,
    name: "season_leaderboards",
  }
);

leaderboardSchema.index(
  {
    instituteId: 1,
    "participants.userId": 1,
  },
  {
    sparse: true,
    name: "participant_lookup",
  }
);

leaderboardSchema.index(
  {
    instituteId: 1,
    "participants.studentId": 1,
  },
  {
    sparse: true,
    name: "student_participant_lookup",
  }
);

leaderboardSchema.index(
  {
    instituteId: 1,
    "participants.employeeId": 1,
  },
  {
    sparse: true,
    name: "employee_participant_lookup",
  }
);

leaderboardSchema.index(
  {
    instituteId: 1,
    "participants.rank": 1,
  },
  {
    sparse: true,
    name: "leaderboard_rank_lookup",
  }
);

leaderboardSchema.index(
  {
    instituteId: 1,
    "participants.score": -1,
  },
  {
    sparse: true,
    name: "leaderboard_score_lookup",
  }
);

leaderboardSchema.index(
  {
    instituteId: 1,
    "cache.dirty": 1,
    status: 1,
  },
  {
    name: "dirty_leaderboards",
  }
);

leaderboardSchema.index(
  {
    instituteId: 1,
    isDeleted: 1,
    createdAt: -1,
  },
  {
    name: "active_leaderboards_history",
  }
);

/* ============================================================================
 * VALIDATION
 * ========================================================================== */

leaderboardSchema.pre(
  "validate",
  function (next) {
    if (
      this.rankingRules.length === 0
    ) {
      return next(
        new Error(
          "At least one ranking rule is required"
        )
      );
    }

    if (
      this.rankingRules.length >
      20
    ) {
      return next(
        new Error(
          "A leaderboard cannot contain more than 20 ranking rules"
        )
      );
    }

    if (
      this.participants.length >
      100000
    ) {
      return next(
        new Error(
          "Leaderboard cannot contain more than 100000 embedded participants"
        )
      );
    }

    if (
      this.tags.length >
      100
    ) {
      return next(
        new Error(
          "Leaderboard cannot contain more than 100 tags"
        )
      );
    }

    if (
      this.automation.eventTypes.length >
      100
    ) {
      return next(
        new Error(
          "Leaderboard cannot contain more than 100 automation event types"
        )
      );
    }

    if (
      this.startsAt &&
      this.endsAt &&
      this.endsAt <
        this.startsAt
    ) {
      return next(
        new Error(
          "Leaderboard end date cannot be before start date"
        )
      );
    }

    if (
      this.period.startDate &&
      this.period.endDate &&
      this.period.endDate <
        this.period.startDate
    ) {
      return next(
        new Error(
          "Leaderboard period end date cannot be before start date"
        )
      );
    }

    if (
      this.minimumScore !== null &&
      this.minimumScore !==
        undefined &&
      this.maximumScore !== null &&
      this.maximumScore !==
        undefined &&
      this.minimumScore >
        this.maximumScore
    ) {
      return next(
        new Error(
          "Minimum score cannot exceed maximum score"
        )
      );
    }

    const seenUsers =
      new Set();

    for (
      const participant of this
        .participants
    ) {
      const userKey =
        String(
          participant.userId
        );

      if (
        seenUsers.has(
          userKey
        )
      ) {
        return next(
          new Error(
            "A user cannot appear more than once in a leaderboard"
          )
        );
      }

      seenUsers.add(
        userKey
      );

      if (
        participant.score <
          0 &&
        !this.allowNegativeScore
      ) {
        return next(
          new Error(
            "Negative participant scores are not allowed"
          )
        );
      }

      if (
        participant.rank !==
          null &&
        participant.rank !==
          undefined &&
        participant.rank <
          1
      ) {
        return next(
          new Error(
            "Participant rank must be greater than zero"
          )
        );
      }
    }

    if (
      this.participants.length >
      0
    ) {
      this.statistics.participantCount =
        this.participants.length;

      this.statistics.qualifiedCount =
        this.participants.filter(
          (participant) =>
            participant.qualified &&
            !participant.disqualified
        ).length;

      this.statistics.disqualifiedCount =
        this.participants.filter(
          (participant) =>
            participant.disqualified
        ).length;
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
        "archived" &&
      !this.archivedAt
    ) {
      this.archivedAt =
        new Date();
    }

    if (
      this.status ===
        "cancelled" &&
      !this.cancelledAt
    ) {
      this.cancelledAt =
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

leaderboardSchema.virtual(
  "isActive"
).get(function () {
  return (
    this.status ===
    "active"
  );
});

leaderboardSchema.virtual(
  "isCompleted"
).get(function () {
  return (
    this.status ===
    "completed"
  );
});

leaderboardSchema.virtual(
  "isArchived"
).get(function () {
  return (
    this.status ===
    "archived"
  );
});

leaderboardSchema.virtual(
  "isStarted"
).get(function () {
  if (
    !this.startsAt
  ) {
    return false;
  }

  return (
    this.startsAt <=
    new Date()
  );
});

leaderboardSchema.virtual(
  "hasEnded"
).get(function () {
  if (
    !this.endsAt
  ) {
    return false;
  }

  return (
    this.endsAt <=
    new Date()
  );
});

leaderboardSchema.virtual(
  "isRunning"
).get(function () {
  const now =
    new Date();

  return (
    this.status ===
      "active" &&
    (!this.startsAt ||
      this.startsAt <= now) &&
    (!this.endsAt ||
      this.endsAt >= now)
  );
});

leaderboardSchema.virtual(
  "participantCount"
).get(function () {
  return this.participants.length;
});

leaderboardSchema.virtual(
  "topParticipants"
).get(function () {
  return [...this.participants]
    .filter(
      (participant) =>
        participant.qualified &&
        !participant.disqualified
    )
    .sort(
      (a, b) =>
        (a.rank || Infinity) -
        (b.rank || Infinity)
    )
    .slice(
      0,
      this.display.topLimit
    );
});

/* ============================================================================
 * QUERY HELPERS
 * ========================================================================== */

leaderboardSchema.query.byInstitute =
  function (
    instituteId
  ) {
    return this.where({
      instituteId,
      isDeleted: false,
    });
  };

leaderboardSchema.query.active =
  function () {
    return this.where({
      status: "active",
      isDeleted: false,
    });
  };

leaderboardSchema.query.byType =
  function (
    type
  ) {
    return this.where({
      type,
      isDeleted: false,
    });
  };

leaderboardSchema.query.bySeason =
  function (
    seasonId
  ) {
    return this.where({
      "period.seasonId":
        seasonId,
      isDeleted: false,
    });
  };

leaderboardSchema.query.notDeleted =
  function () {
    return this.where({
      isDeleted: false,
    });
  };

/* ============================================================================
 * INSTANCE METHODS
 * ========================================================================== */

leaderboardSchema.methods.start =
  async function () {
    if (
      this.status ===
      "completed"
    ) {
      throw new Error(
        "Completed leaderboard cannot be started"
      );
    }

    if (
      this.status ===
      "archived"
    ) {
      throw new Error(
        "Archived leaderboard cannot be started"
      );
    }

    this.status =
      "active";

    if (
      !this.startsAt
    ) {
      this.startsAt =
        new Date();
    }

    this.cache.dirty =
      true;

    return this.save();
  };

leaderboardSchema.methods.pause =
  async function () {
    if (
      this.status !==
      "active"
    ) {
      throw new Error(
        "Only active leaderboards can be paused"
      );
    }

    this.status =
      "paused";

    this.cache.dirty =
      true;

    return this.save();
  };

leaderboardSchema.methods.resume =
  async function () {
    if (
      this.status !==
      "paused"
    ) {
      throw new Error(
        "Only paused leaderboards can be resumed"
      );
    }

    this.status =
      "active";

    this.cache.dirty =
      true;

    return this.save();
  };

leaderboardSchema.methods.complete =
  async function (
    completedBy = null
  ) {
    if (
      this.status ===
      "cancelled"
    ) {
      throw new Error(
        "Cancelled leaderboard cannot be completed"
      );
    }

    this.status =
      "completed";

    this.completedAt =
      new Date();

    this.completedBy =
      completedBy;

    this.cache.dirty =
      false;

    this.cache.lastRefreshAt =
      new Date();

    return this.save();
  };

leaderboardSchema.methods.cancel =
  async function () {
    if (
      this.status ===
      "completed"
    ) {
      throw new Error(
        "Completed leaderboard cannot be cancelled"
      );
    }

    this.status =
      "cancelled";

    this.cancelledAt =
      new Date();

    return this.save();
  };

leaderboardSchema.methods.archive =
  async function () {
    if (
      this.status ===
      "cancelled"
    ) {
      throw new Error(
        "Cancelled leaderboard cannot be archived"
      );
    }

    this.status =
      "archived";

    this.archivedAt =
      new Date();

    return this.save();
  };

leaderboardSchema.methods.addParticipant =
  async function (
    participant
  ) {
    if (
      this.maxParticipants &&
      this.participants.length >=
        this.maxParticipants
    ) {
      throw new Error(
        "Leaderboard participant limit reached"
      );
    }

    const exists =
      this.participants.some(
        (item) =>
          String(
            item.userId
          ) ===
          String(
            participant.userId
          )
      );

    if (
      exists
    ) {
      throw new Error(
        "User is already a leaderboard participant"
      );
    }

    this.participants.push(
      participant
    );

    this.cache.dirty =
      true;

    return this.save();
  };

leaderboardSchema.methods.removeParticipant =
  async function (
    userId
  ) {
    const before =
      this.participants.length;

    this.participants =
      this.participants.filter(
        (participant) =>
          String(
            participant.userId
          ) !==
          String(userId)
      );

    if (
      this.participants.length ===
      before
    ) {
      return this;
    }

    this.cache.dirty =
      true;

    return this.save();
  };

leaderboardSchema.methods.updateParticipant =
  async function (
    userId,
    updates = {}
  ) {
    const participant =
      this.participants.find(
        (item) =>
          String(
            item.userId
          ) ===
          String(userId)
      );

    if (
      !participant
    ) {
      throw new Error(
        "Leaderboard participant not found"
      );
    }

    const allowedFields = [
      "displayName",
      "avatar",
      "score",
      "points",
      "achievements",
      "streak",
      "attendancePercentage",
      "testsCompleted",
      "assignmentsCompleted",
      "tieBreakerValue",
      "percentile",
      "qualified",
      "disqualified",
      "disqualificationReason",
      "metadata",
    ];

    for (
      const field of allowedFields
    ) {
      if (
        Object.prototype.hasOwnProperty.call(
          updates,
          field
        )
      ) {
        participant[field] =
          updates[field];
      }
    }

    if (
      participant.score <
        0 &&
      !this.allowNegativeScore
    ) {
      throw new Error(
        "Negative participant scores are not allowed"
      );
    }

    participant.lastCalculatedAt =
      new Date();

    this.cache.dirty =
      true;

    return this.save();
  };

leaderboardSchema.methods.updateRankings =
  async function () {
    const qualified =
      this.participants.filter(
        (participant) =>
          participant.qualified &&
          !participant.disqualified
      );

    const previousRanks =
      new Map(
        qualified.map(
          (participant) => [
            String(
              participant.userId
            ),
            participant.rank,
          ]
        )
      );

    const rules =
      [...this.rankingRules].sort(
        (a, b) =>
          a.priority -
          b.priority
      );

    qualified.sort(
      (a, b) => {
        for (
          const rule of rules
        ) {
          const aValue =
            a[rule.field] ??
            null;

          const bValue =
            b[rule.field] ??
            null;

          if (
            aValue ===
            bValue
          ) {
            continue;
          }

          if (
            aValue === null ||
            aValue ===
              undefined
          ) {
            return rule.nullsLast
              ? 1
              : -1;
          }

          if (
            bValue === null ||
            bValue ===
              undefined
          ) {
            return rule.nullsLast
              ? -1
              : 1;
          }

          const comparison =
            aValue >
            bValue
              ? 1
              : -1;

          return rule.direction ===
            "desc"
            ? -comparison
            : comparison;
        }

        return 0;
      }
    );

    let previousScore =
      null;

    let currentRank =
      0;

    qualified.forEach(
      (
        participant,
        index
      ) => {
        const primaryRule =
          rules[0];

        const score =
          primaryRule
            ? participant[
                primaryRule.field
              ]
            : participant.score;

        if (
          this.tieHandling ===
          "sequential"
        ) {
          currentRank =
            index + 1;
        } else if (
          this.tieHandling ===
          "dense_rank"
        ) {
          if (
            index === 0 ||
            score !==
              previousScore
          ) {
            currentRank +=
              1;
          }
        } else {
          if (
            index === 0 ||
            score !==
              previousScore
          ) {
            currentRank =
              index + 1;
          }
        }

        participant.previousRank =
          previousRanks.get(
            String(
              participant.userId
            )
          ) || null;

        participant.rank =
          currentRank;

        participant.rankChange =
          participant.previousRank
            ? participant.previousRank -
              participant.rank
            : 0;

        previousScore =
          score;

        participant.lastCalculatedAt =
          new Date();
      }
    );

    const disqualified =
      this.participants.filter(
        (participant) =>
          participant.disqualified ||
          !participant.qualified
      );

    disqualified.forEach(
      (participant) => {
        participant.previousRank =
          participant.rank;

        participant.rank =
          null;

        participant.rankChange =
          0;

        participant.percentile =
          null;
      }
    );

    const total =
      qualified.length;

    qualified.forEach(
      (participant) => {
        if (
          total <= 1
        ) {
          participant.percentile =
            total === 1
              ? 100
              : 0;
        } else {
          participant.percentile =
            Math.max(
              0,
              Math.min(
                100,
                (
                  (total -
                    participant.rank) /
                    (total -
                      1)
                ) *
                  100
              )
            );
        }
      }
    );

    this.statistics.participantCount =
      this.participants.length;

    this.statistics.qualifiedCount =
      qualified.length;

    this.statistics.disqualifiedCount =
      this.participants.filter(
        (participant) =>
          participant.disqualified
      ).length;

    if (
      qualified.length
    ) {
      const scores =
        qualified.map(
          (participant) =>
            participant.score
        );

      this.statistics.averageScore =
        scores.reduce(
          (sum, value) =>
            sum + value,
          0
        ) /
        scores.length;

      this.statistics.highestScore =
        Math.max(
          ...scores
        );

      this.statistics.lowestScore =
        Math.min(
          ...scores
        );

      this.statistics.totalPoints =
        qualified.reduce(
          (
            sum,
            participant
          ) =>
            sum +
            participant.points,
          0
        );
    } else {
      this.statistics.averageScore =
        0;

      this.statistics.highestScore =
        0;

      this.statistics.lowestScore =
        0;

      this.statistics.totalPoints =
        0;
    }

    this.statistics.lastCalculatedAt =
      new Date();

    this.cache.dirty =
      false;

    this.cache.lastRefreshAt =
      new Date();

    this.cache.version +=
      1;

    return this.save();
  };

leaderboardSchema.methods.markDirty =
  async function () {
    this.cache.dirty =
      true;

    return this.save();
  };

leaderboardSchema.methods.setRefreshSchedule =
  async function ({
    enabled = true,
    intervalSeconds = 300,
  } = {}) {
    this.cache.enabled =
      enabled;

    this.cache.refreshIntervalSeconds =
      Math.max(
        0,
        Number(
          intervalSeconds
        )
      );

    if (
      enabled
    ) {
      this.cache.nextRefreshAt =
        new Date(
          Date.now() +
            this.cache
              .refreshIntervalSeconds *
              1000
        );
    } else {
      this.cache.nextRefreshAt =
        null;
    }

    return this.save();
  };

leaderboardSchema.methods.addTag =
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

leaderboardSchema.methods.removeTag =
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

leaderboardSchema.methods.setLegalHold =
  async function (
    enabled = true
  ) {
    this.legalHold =
      enabled;

    return this.save();
  };

leaderboardSchema.methods.softDelete =
  async function ({
    deletedBy = null,
    reason = null,
  } = {}) {
    if (
      this.legalHold
    ) {
      throw new Error(
        "Leaderboard is under legal hold"
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

leaderboardSchema.methods.restore =
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

leaderboardSchema.statics.findByCode =
  function (
    instituteId,
    leaderboardCode
  ) {
    return this.findOne({
      instituteId,
      leaderboardCode:
        String(
          leaderboardCode
        )
          .trim()
          .toUpperCase(),
      isDeleted: false,
    });
  };

leaderboardSchema.statics.findBySlug =
  function (
    instituteId,
    slug
  ) {
    return this.findOne({
      instituteId,
      slug:
        String(
          slug
        )
          .trim()
          .toLowerCase(),
      isDeleted: false,
    });
  };

leaderboardSchema.statics.findActive =
  function (
    instituteId,
    {
      type = null,
      participantType = null,
    } = {}
  ) {
    const query = {
      instituteId,
      status: "active",
      isDeleted: false,
    };

    if (
      type
    ) {
      query.type =
        type;
    }

    if (
      participantType
    ) {
      query.participantType =
        participantType;
    }

    return this.find(query)
      .sort({
        startsAt: 1,
        createdAt: -1,
      });
  };

leaderboardSchema.statics.findForUser =
  function (
    instituteId,
    userId,
    {
      status = null,
      limit = 100,
    } = {}
  ) {
    const query = {
      instituteId,
      "participants.userId":
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
        startsAt: -1,
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

leaderboardSchema.statics.findCurrent =
  function (
    instituteId,
    {
      type = null,
      participantType = null,
      now = new Date(),
    } = {}
  ) {
    const query = {
      instituteId,
      status: "active",
      isDeleted: false,
      $and: [
        {
          $or: [
            {
              startsAt: null,
            },
            {
              startsAt: {
                $lte: now,
              },
            },
          ],
        },
        {
          $or: [
            {
              endsAt: null,
            },
            {
              endsAt: {
                $gte: now,
              },
            },
          ],
        },
      ],
    };

    if (
      type
    ) {
      query.type =
        type;
    }

    if (
      participantType
    ) {
      query.participantType =
        participantType;
    }

    return this.find(
      query
    );
  };

leaderboardSchema.statics.findDirty =
  function (
    instituteId,
    limit = 100
  ) {
    return this.find({
      instituteId,
      "cache.dirty": true,
      isDeleted: false,
      status: {
        $in: [
          "active",
          "paused",
        ],
      },
    })
      .sort({
        "cache.lastRefreshAt": 1,
        updatedAt: 1,
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

leaderboardSchema.statics.findRefreshDue =
  function (
    instituteId,
    now = new Date(),
    limit = 100
  ) {
    return this.find({
      instituteId,
      "cache.enabled": true,
      "cache.nextRefreshAt": {
        $ne: null,
        $lte: now,
      },
      isDeleted: false,
      status: "active",
    })
      .sort({
        "cache.nextRefreshAt": 1,
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

leaderboardSchema.statics.getUserRank =
  async function (
    instituteId,
    leaderboardId,
    userId
  ) {
    const leaderboard =
      await this.findOne({
        _id: leaderboardId,
        instituteId,
        isDeleted: false,
      }).lean();

    if (
      !leaderboard
    ) {
      return null;
    }

    const participant =
      leaderboard.participants?.find(
        (item) =>
          String(
            item.userId
          ) ===
          String(userId)
      );

    if (
      !participant
    ) {
      return null;
    }

    return {
      leaderboardId:
        leaderboard._id,
      userId:
        participant.userId,
      rank:
        participant.rank,
      previousRank:
        participant.previousRank,
      rankChange:
        participant.rankChange,
      score:
        participant.score,
      points:
        participant.points,
      percentile:
        participant.percentile,
      qualified:
        participant.qualified,
      disqualified:
        participant.disqualified,
    };
  };

leaderboardSchema.statics.getTopParticipants =
  async function (
    instituteId,
    leaderboardId,
    limit = 10
  ) {
    const leaderboard =
      await this.findOne({
        _id: leaderboardId,
        instituteId,
        isDeleted: false,
      })
        .select({
          participants: 1,
          display: 1,
        })
        .lean();

    if (
      !leaderboard
    ) {
      return [];
    }

    return (
      leaderboard.participants || []
    )
      .filter(
        (participant) =>
          participant.qualified &&
          !participant.disqualified
      )
      .sort(
        (a, b) =>
          (a.rank || Infinity) -
          (b.rank || Infinity)
      )
      .slice(
        0,
        Math.min(
          1000,
          Math.max(
            1,
            limit
          )
        )
      );
  };

leaderboardSchema.statics.getStatistics =
  async function (
    instituteId,
    leaderboardId
  ) {
    const leaderboard =
      await this.findOne({
        _id: leaderboardId,
        instituteId,
        isDeleted: false,
      })
        .select({
          statistics: 1,
        })
        .lean();

    return (
      leaderboard?.statistics || {
        participantCount: 0,
        qualifiedCount: 0,
        disqualifiedCount: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        totalPoints: 0,
        lastCalculatedAt: null,
        calculationVersion: 1,
      }
    );
  };

/* ============================================================================
 * MODEL
 * ========================================================================== */

export const Leaderboard =
  mongoose.models.Leaderboard ||
  mongoose.model(
    "Leaderboard",
    leaderboardSchema
  );

export {
  LEADERBOARD_TYPES,
  LEADERBOARD_STATUSES,
  PARTICIPANT_TYPES,
  RANKING_DIRECTIONS,
  SCORE_TYPES,
};