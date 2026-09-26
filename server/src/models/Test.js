// server/src/models/Test.js

import mongoose from "mongoose";

const TEST_TYPES = [
  "quiz",
  "class_test",
  "unit_test",
  "midterm",
  "final_exam",
  "mock_exam",
  "practice_test",
  "assessment",
  "entrance_exam",
  "competitive_exam",
  "certification",
  "survey",
  "other",
];

const TEST_MODES = [
  "online",
  "offline",
  "hybrid",
];

const TEST_STATUS = [
  "draft",
  "scheduled",
  "published",
  "live",
  "completed",
  "closed",
  "cancelled",
  "archived",
];

const QUESTION_MODES = [
  "single_choice",
  "multiple_choice",
  "true_false",
  "short_answer",
  "long_answer",
  "numeric",
  "fill_blank",
  "matching",
  "ordering",
  "coding",
  "file_upload",
  "audio",
  "video",
  "case_study",
  "mixed",
];

const GRADING_MODES = [
  "automatic",
  "manual",
  "hybrid",
  "ai_assisted",
];

const RESULT_VISIBILITY = [
  "immediate",
  "after_submission_window",
  "after_manual_review",
  "scheduled",
  "private",
];

const RANKING_SCOPES = [
  "none",
  "class",
  "course",
  "department",
  "institute",
  "organization",
  "global",
];

const RANKING_PERIODS = [
  "test",
  "weekly",
  "monthly",
  "quarterly",
  "yearly",
  "all_time",
];

const ANTI_CHEAT_METHODS = [
  "none",
  "fullscreen",
  "tab_switch_detection",
  "copy_paste_detection",
  "browser_lock",
  "camera",
  "microphone",
  "face_verification",
  "face_presence",
  "screen_monitoring",
  "identity_verification",
  "question_randomization",
  "option_randomization",
  "time_limit",
  "ip_restriction",
  "device_restriction",
  "geofence",
  "proctoring",
];

const questionSectionSchema =
  new mongoose.Schema(
    {
      _id: false,

      name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
      },

      description: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: null,
      },

      questionIds: {
        type: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Question",
          },
        ],
        default: [],
      },

      questionCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      marksPerQuestion: {
        type: Number,
        min: 0,
        default: 1,
      },

      negativeMarks: {
        type: Number,
        min: 0,
        default: 0,
      },

      durationMinutes: {
        type: Number,
        min: 1,
        max: 1440,
        default: null,
      },
    },
    {
      _id: false,
    }
  );

const schedulingSchema =
  new mongoose.Schema(
    {
      _id: false,

      availableFrom: {
        type: Date,
        default: null,
      },

      availableUntil: {
        type: Date,
        default: null,
      },

      scheduledStartAt: {
        type: Date,
        default: null,
      },

      scheduledEndAt: {
        type: Date,
        default: null,
      },

      timezone: {
        type: String,
        trim: true,
        maxlength: 100,
        default: "Asia/Kolkata",
      },

      durationMinutes: {
        type: Number,
        min: 1,
        max: 1440,
        default: null,
      },

      lateEntryAllowed: {
        type: Boolean,
        default: false,
      },

      lateEntryMinutes: {
        type: Number,
        min: 0,
        max: 1440,
        default: 0,
      },

      autoSubmitAtEnd: {
        type: Boolean,
        default: true,
      },
    },
    {
      _id: false,
    }
  );

const attemptPolicySchema =
  new mongoose.Schema(
    {
      _id: false,

      maxAttempts: {
        type: Number,
        min: 1,
        max: 100,
        default: 1,
      },

      attemptsPerDay: {
        type: Number,
        min: 1,
        max: 100,
        default: null,
      },

      bestAttemptCounts: {
        type: Boolean,
        default: true,
      },

      latestAttemptCounts: {
        type: Boolean,
        default: false,
      },

      firstAttemptCounts: {
        type: Boolean,
        default: false,
      },

      allowRetakeAfterFailure: {
        type: Boolean,
        default: true,
      },

      cooldownMinutes: {
        type: Number,
        min: 0,
        max: 10080,
        default: 0,
      },
    },
    {
      _id: false,
    }
  );

const gradingSchema =
  new mongoose.Schema(
    {
      _id: false,

      mode: {
        type: String,
        enum: GRADING_MODES,
        default: "automatic",
      },

      maxScore: {
        type: Number,
        min: 0,
        max: 1000000,
        default: 100,
      },

      passingScore: {
        type: Number,
        min: 0,
        default: 40,
      },

      passingPercentage: {
        type: Number,
        min: 0,
        max: 100,
        default: 40,
      },

      gradingScale: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      negativeMarking: {
        enabled: {
          type: Boolean,
          default: false,
        },

        mode: {
          type: String,
          enum: [
            "fixed",
            "percentage",
          ],
          default: "fixed",
        },

        value: {
          type: Number,
          min: 0,
          default: 0,
        },

        maxPenalty: {
          type: Number,
          min: 0,
          default: null,
        },
      },

      partialCredit: {
        type: Boolean,
        default: false,
      },

      roundScores: {
        type: Boolean,
        default: true,
      },

      decimalPlaces: {
        type: Number,
        min: 0,
        max: 4,
        default: 2,
      },
    },
    {
      _id: false,
    }
  );

const rankingSchema =
  new mongoose.Schema(
    {
      _id: false,

      enabled: {
        type: Boolean,
        default: false,
      },

      scope: {
        type: String,
        enum: RANKING_SCOPES,
        default: "none",
      },

      period: {
        type: String,
        enum: RANKING_PERIODS,
        default: "test",
      },

      leaderboardEnabled: {
        type: Boolean,
        default: false,
      },

      showRankToStudent: {
        type: Boolean,
        default: true,
      },

      showScoreToOthers: {
        type: Boolean,
        default: false,
      },

      anonymizeStudents: {
        type: Boolean,
        default: false,
      },
    },
    {
      _id: false,
    }
  );

const antiCheatSchema =
  new mongoose.Schema(
    {
      _id: false,

      enabled: {
        type: Boolean,
        default: false,
      },

      methods: {
        type: [
          {
            type: String,
            enum: ANTI_CHEAT_METHODS,
          },
        ],
        default: [],
      },

      randomizeQuestions: {
        type: Boolean,
        default: false,
      },

      randomizeOptions: {
        type: Boolean,
        default: false,
      },

      questionPoolSize: {
        type: Number,
        min: 0,
        default: null,
      },

      preventMultipleDevices: {
        type: Boolean,
        default: false,
      },

      maxTabSwitches: {
        type: Number,
        min: 0,
        default: null,
      },

      maxWarnings: {
        type: Number,
        min: 0,
        max: 100,
        default: 3,
      },

      autoTerminateOnViolation: {
        type: Boolean,
        default: false,
      },

      requireIdentityVerification: {
        type: Boolean,
        default: false,
      },

      requireCamera: {
        type: Boolean,
        default: false,
      },

      requireMicrophone: {
        type: Boolean,
        default: false,
      },
    },
    {
      _id: false,
    }
  );

const accessPolicySchema =
  new mongoose.Schema(
    {
      _id: false,

      targetRoles: {
        type: [
          {
            type: String,
            enum: [
              "admin",
              "teacher",
              "student",
              "hr",
              "employee",
            ],
          },
        ],
        default: [
          "student",
        ],
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

      requireEnrollment: {
        type: Boolean,
        default: false,
      },

      requireApproval: {
        type: Boolean,
        default: false,
      },

      passwordProtected: {
        type: Boolean,
        default: false,
      },

      accessCodeHash: {
        type: String,
        select: false,
        default: null,
      },
    },
    {
      _id: false,
    }
  );

const resultPolicySchema =
  new mongoose.Schema(
    {
      _id: false,

      visibility: {
        type: String,
        enum: RESULT_VISIBILITY,
        default: "after_submission_window",
      },

      publishAt: {
        type: Date,
        default: null,
      },

      showScore: {
        type: Boolean,
        default: true,
      },

      showPercentage: {
        type: Boolean,
        default: true,
      },

      showCorrectAnswers: {
        type: Boolean,
        default: false,
      },

      showExplanations: {
        type: Boolean,
        default: false,
      },

      showRank: {
        type: Boolean,
        default: true,
      },

      showSectionScores: {
        type: Boolean,
        default: true,
      },

      allowResultDownload: {
        type: Boolean,
        default: true,
      },

      allowCertificate: {
        type: Boolean,
        default: false,
      },
    },
    {
      _id: false,
    }
  );

const testStatisticsSchema =
  new mongoose.Schema(
    {
      _id: false,

      totalEligibleStudents: {
        type: Number,
        min: 0,
        default: 0,
      },

      totalAttempts: {
        type: Number,
        min: 0,
        default: 0,
      },

      completedAttempts: {
        type: Number,
        min: 0,
        default: 0,
      },

      submittedAttempts: {
        type: Number,
        min: 0,
        default: 0,
      },

      passedAttempts: {
        type: Number,
        min: 0,
        default: 0,
      },

      failedAttempts: {
        type: Number,
        min: 0,
        default: 0,
      },

      abandonedAttempts: {
        type: Number,
        min: 0,
        default: 0,
      },

      averageScore: {
        type: Number,
        min: 0,
        default: 0,
      },

      averagePercentage: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },

      highestScore: {
        type: Number,
        min: 0,
        default: 0,
      },

      lowestScore: {
        type: Number,
        min: 0,
        default: 0,
      },

      medianScore: {
        type: Number,
        min: 0,
        default: 0,
      },

      completionRate: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },

      passRate: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },

      averageDurationMinutes: {
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

const testSchema =
  new mongoose.Schema(
    {
      /* ==================================================================== */
      /* TENANCY                                                              */
      /* ==================================================================== */

      instituteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
        index: true,
      },

      /* ==================================================================== */
      /* OWNERSHIP                                                            */
      /* ==================================================================== */

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

      /* ==================================================================== */
      /* BASIC INFORMATION                                                    */
      /* ==================================================================== */

      title: {
        type: String,
        required: [
          true,
          "Test title is required",
        ],
        trim: true,
        minlength: 2,
        maxlength: 300,
      },

      description: {
        type: String,
        trim: true,
        maxlength: 10000,
        default: null,
      },

      instructions: {
        type: String,
        trim: true,
        maxlength: 20000,
        default: null,
      },

      code: {
        type: String,
        trim: true,
        uppercase: true,
        maxlength: 100,
        default: null,
      },

      type: {
        type: String,
        enum: TEST_TYPES,
        default: "quiz",
        index: true,
      },

      mode: {
        type: String,
        enum: TEST_MODES,
        default: "online",
      },

      status: {
        type: String,
        enum: TEST_STATUS,
        default: "draft",
        index: true,
      },

      /* ==================================================================== */
      /* EDUCATION CONTEXT                                                     */
      /* ==================================================================== */

      classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class",
        default: null,
        index: true,
      },

      courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        default: null,
        index: true,
      },

      subject: {
        type: String,
        trim: true,
        maxlength: 200,
        default: null,
      },

      topic: {
        type: String,
        trim: true,
        maxlength: 300,
        default: null,
      },

      academicYear: {
        type: String,
        trim: true,
        maxlength: 50,
        default: null,
      },

      semester: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      /* ==================================================================== */
      /* QUESTION CONFIGURATION                                                */
      /* ==================================================================== */

      questionMode: {
        type: String,
        enum: QUESTION_MODES,
        default: "single_choice",
      },

      questionIds: {
        type: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Question",
          },
        ],
        default: [],
      },

      sections: {
        type: [questionSectionSchema],
        default: [],
      },

      questionCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      totalMarks: {
        type: Number,
        min: 0,
        default: 0,
      },

      /* ==================================================================== */
      /* SCHEDULING                                                            */
      /* ==================================================================== */

      scheduling: {
        type: schedulingSchema,
        default: () => ({}),
      },

      /* ==================================================================== */
      /* ATTEMPTS                                                              */
      /* ==================================================================== */

      attemptPolicy: {
        type: attemptPolicySchema,
        default: () => ({}),
      },

      /* ==================================================================== */
      /* GRADING                                                               */
      /* ==================================================================== */

      grading: {
        type: gradingSchema,
        default: () => ({}),
      },

      /* ==================================================================== */
      /* ACCESS                                                                */
      /* ==================================================================== */

      access: {
        type: accessPolicySchema,
        default: () => ({}),
      },

      /* ==================================================================== */
      /* RESULTS                                                               */
      /* ==================================================================== */

      results: {
        type: resultPolicySchema,
        default: () => ({}),
      },

      /* ==================================================================== */
      /* ANTI-CHEATING / PROCTORING                                            */
      /* ==================================================================== */

      antiCheat: {
        type: antiCheatSchema,
        default: () => ({}),
      },

      /* ==================================================================== */
      /* RANKING / LEADERBOARD                                                 */
      /* ==================================================================== */

      ranking: {
        type: rankingSchema,
        default: () => ({}),
      },

      /* ==================================================================== */
      /* GAMIFICATION                                                          */
      /* ==================================================================== */

      gamification: {
        enabled: {
          type: Boolean,
          default: false,
        },

        pointsForCompletion: {
          type: Number,
          min: 0,
          default: 0,
        },

        pointsForPassing: {
          type: Number,
          min: 0,
          default: 0,
        },

        pointsForPerfectScore: {
          type: Number,
          min: 0,
          default: 0,
        },

        xpEnabled: {
          type: Boolean,
          default: false,
        },

        achievementEnabled: {
          type: Boolean,
          default: false,
        },
      },

      /* ==================================================================== */
      /* CERTIFICATE                                                           */
      /* ==================================================================== */

      certificate: {
        enabled: {
          type: Boolean,
          default: false,
        },

        templateId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Certificate",
          default: null,
        },

        minimumPercentage: {
          type: Number,
          min: 0,
          max: 100,
          default: 70,
        },
      },

      /* ==================================================================== */
      /* STATISTICS                                                            */
      /* ==================================================================== */

      statistics: {
        type: testStatisticsSchema,
        default: () => ({}),
      },

      /* ==================================================================== */
      /* TAGGING                                                               */
      /* ==================================================================== */

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

      skills: {
        type: [
          {
            type: String,
            trim: true,
            maxlength: 150,
          },
        ],
        default: [],
      },

      learningOutcomes: {
        type: [
          {
            type: String,
            trim: true,
            maxlength: 500,
          },
        ],
        default: [],
      },

      /* ==================================================================== */
      /* LIFECYCLE                                                             */
      /* ==================================================================== */

      publishedAt: {
        type: Date,
        default: null,
      },

      completedAt: {
        type: Date,
        default: null,
      },

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

testSchema.index(
  {
    instituteId: 1,
    status: 1,
    createdAt: -1,
  },
  {
    name: "test_institute_status",
  }
);

testSchema.index(
  {
    instituteId: 1,
    classId: 1,
    status: 1,
    createdAt: -1,
  },
  {
    name: "test_class_feed",
  }
);

testSchema.index(
  {
    instituteId: 1,
    courseId: 1,
    status: 1,
    createdAt: -1,
  },
  {
    name: "test_course_feed",
    sparse: true,
  }
);

testSchema.index(
  {
    instituteId: 1,
    "scheduling.scheduledStartAt": 1,
    status: 1,
  },
  {
    name: "test_schedule_queue",
  }
);

testSchema.index(
  {
    instituteId: 1,
    type: 1,
    createdAt: -1,
  },
  {
    name: "test_type_history",
  }
);

testSchema.index(
  {
    instituteId: 1,
    code: 1,
  },
  {
    name: "test_code",
    unique: true,
    sparse: true,
  }
);

/* ============================================================================
 * VALIDATION
 * ========================================================================== */

testSchema.pre(
  "validate",
  function (next) {
    const schedule =
      this.scheduling;

    if (
      schedule.availableFrom &&
      schedule.availableUntil &&
      schedule.availableUntil <=
        schedule.availableFrom
    ) {
      return next(
        new Error(
          "Test availability end must be after availability start"
        )
      );
    }

    if (
      schedule.scheduledStartAt &&
      schedule.scheduledEndAt &&
      schedule.scheduledEndAt <=
        schedule.scheduledStartAt
    ) {
      return next(
        new Error(
          "Test scheduled end must be after scheduled start"
        )
      );
    }

    if (
      schedule.durationMinutes &&
      schedule.durationMinutes <= 0
    ) {
      return next(
        new Error(
          "Test duration must be greater than zero"
        )
      );
    }

    if (
      this.grading.passingScore >
      this.grading.maxScore
    ) {
      return next(
        new Error(
          "Passing score cannot exceed maximum score"
        )
      );
    }

    if (
      this.grading.negativeMarking.enabled &&
      this.grading.negativeMarking.value <= 0
    ) {
      return next(
        new Error(
          "Negative marking value must be greater than zero when enabled"
        )
      );
    }

    if (
      this.ranking.enabled &&
      this.ranking.scope === "none"
    ) {
      return next(
        new Error(
          "Ranking scope is required when ranking is enabled"
        )
      );
    }

    if (
      this.certificate.enabled &&
      !this.certificate.templateId
    ) {
      return next(
        new Error(
          "Certificate template is required when certificates are enabled"
        )
      );
    }

    if (
      this.antiCheat.requireCamera &&
      !this.antiCheat.enabled
    ) {
      return next(
        new Error(
          "Anti-cheat must be enabled when camera verification is required"
        )
      );
    }

    if (
      this.antiCheat.requireMicrophone &&
      !this.antiCheat.enabled
    ) {
      return next(
        new Error(
          "Anti-cheat must be enabled when microphone verification is required"
        )
      );
    }

    if (
      this.questionIds.length >
      10000
    ) {
      return next(
        new Error(
          "A test cannot contain more than 10,000 questions"
        )
      );
    }

    if (
      this.tags.length >
      50
    ) {
      return next(
        new Error(
          "A test cannot contain more than 50 tags"
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
      this.status === "completed" &&
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

testSchema.virtual(
  "isScheduled"
).get(function () {
  return (
    this.status === "scheduled" &&
    Boolean(
      this.scheduling
        ?.scheduledStartAt
    )
  );
});

testSchema.virtual(
  "isLive"
).get(function () {
  const now =
    new Date();

  if (
    ![
      "published",
      "scheduled",
      "live",
    ].includes(
      this.status
    )
  ) {
    return false;
  }

  const start =
    this.scheduling
      ?.scheduledStartAt;

  const end =
    this.scheduling
      ?.scheduledEndAt;

  if (
    start &&
    start > now
  ) {
    return false;
  }

  if (
    end &&
    end <= now
  ) {
    return false;
  }

  return true;
});

testSchema.virtual(
  "isExpired"
).get(function () {
  const end =
    this.scheduling
      ?.availableUntil;

  return Boolean(
    end &&
      end <=
        new Date()
  );
});

testSchema.virtual(
  "isPublished"
).get(function () {
  return (
    this.status ===
      "published" &&
    !this.isDeleted
  );
});

testSchema.virtual(
  "passRate"
).get(function () {
  return (
    this.statistics
      ?.passRate || 0
  );
});

testSchema.virtual(
  "completionRate"
).get(function () {
  return (
    this.statistics
      ?.completionRate || 0
  );
});

/* ============================================================================
 * QUERY HELPERS
 * ========================================================================== */

testSchema.query.byInstitute =
  function (
    instituteId
  ) {
    return this.where({
      instituteId,
      isDeleted: false,
    });
  };

testSchema.query.byClass =
  function (
    classId
  ) {
    return this.where({
      classId,
      isDeleted: false,
    });
  };

testSchema.query.byCourse =
  function (
    courseId
  ) {
    return this.where({
      courseId,
      isDeleted: false,
    });
  };

testSchema.query.published =
  function () {
    return this.where({
      status: "published",
      isDeleted: false,
    });
  };

testSchema.query.active =
  function () {
    const now =
      new Date();

    return this.where({
      isDeleted: false,
      status: {
        $in: [
          "published",
          "scheduled",
          "live",
        ],
      },
      $or: [
        {
          "scheduling.availableFrom":
            null,
        },
        {
          "scheduling.availableFrom":
            {
              $lte: now,
            },
        },
      ],
      $and: [
        {
          $or: [
            {
              "scheduling.availableUntil":
                null,
            },
            {
              "scheduling.availableUntil":
                {
                  $gt: now,
                },
            },
          ],
        },
      ],
    });
  };

/* ============================================================================
 * INSTANCE METHODS
 * ========================================================================== */

testSchema.methods.publish =
  async function (
    byUserId = null
  ) {
    this.status =
      "published";

    this.publishedAt =
      new Date();

    if (byUserId) {
      this.updatedBy =
        byUserId;
    }

    return this.save();
  };

testSchema.methods.schedule =
  async function (
    startAt,
    endAt = null,
    byUserId = null
  ) {
    const start =
      new Date(
        startAt
      );

    if (
      Number.isNaN(
        start.getTime()
      )
    ) {
      throw new Error(
        "Valid test start time is required"
      );
    }

    if (endAt) {
      const end =
        new Date(
          endAt
        );

      if (
        Number.isNaN(
          end.getTime()
        ) ||
        end <= start
      ) {
        throw new Error(
          "Valid test end time after start is required"
        );
      }

      this.scheduling.scheduledEndAt =
        end;
    }

    this.scheduling.scheduledStartAt =
      start;

    this.status =
      "scheduled";

    if (byUserId) {
      this.updatedBy =
        byUserId;
    }

    return this.save();
  };

testSchema.methods.start =
  async function () {
    if (
      ![
        "published",
        "scheduled",
      ].includes(
        this.status
      )
    ) {
      throw new Error(
        "Only published or scheduled tests can be started"
      );
    }

    this.status =
      "live";

    return this.save();
  };

testSchema.methods.complete =
  async function (
    byUserId = null
  ) {
    this.status =
      "completed";

    this.completedAt =
      new Date();

    if (byUserId) {
      this.updatedBy =
        byUserId;
    }

    return this.save();
  };

testSchema.methods.close =
  async function (
    byUserId = null
  ) {
    this.status =
      "closed";

    if (byUserId) {
      this.updatedBy =
        byUserId;
    }

    return this.save();
  };

testSchema.methods.cancel =
  async function (
    byUserId = null
  ) {
    if (
      this.status ===
      "completed"
    ) {
      throw new Error(
        "Completed tests cannot be cancelled"
      );
    }

    this.status =
      "cancelled";

    if (byUserId) {
      this.updatedBy =
        byUserId;
    }

    return this.save();
  };

testSchema.methods.archive =
  async function (
    byUserId = null
  ) {
    this.status =
      "archived";

    this.archivedAt =
      new Date();

    if (byUserId) {
      this.updatedBy =
        byUserId;
    }

    return this.save();
  };

testSchema.methods.softDelete =
  async function (
    byUserId = null
  ) {
    this.isDeleted =
      true;

    this.deletedAt =
      new Date();

    if (byUserId) {
      this.updatedBy =
        byUserId;
    }

    return this.save();
  };

testSchema.methods.updateStatistics =
  function ({
    totalEligibleStudents,
    totalAttempts,
    completedAttempts,
    submittedAttempts,
    passedAttempts,
    failedAttempts,
    abandonedAttempts,
    averageScore,
    averagePercentage,
    highestScore,
    lowestScore,
    medianScore,
    completionRate,
    passRate,
    averageDurationMinutes,
  } = {}) {
    const stats =
      this.statistics;

    const values = {
      totalEligibleStudents,
      totalAttempts,
      completedAttempts,
      submittedAttempts,
      passedAttempts,
      failedAttempts,
      abandonedAttempts,
      averageScore,
      averagePercentage,
      highestScore,
      lowestScore,
      medianScore,
      completionRate,
      passRate,
      averageDurationMinutes,
    };

    for (
      const [key, value] of Object.entries(
        values
      )
    ) {
      if (
        value !== undefined &&
        value !== null
      ) {
        stats[key] =
          Math.max(
            0,
            Number(value)
          );
      }
    }

    stats.lastCalculatedAt =
      new Date();

    return this;
  };

/* ============================================================================
 * MODEL
 * ========================================================================== */

export const Test =
  mongoose.models.Test ||
  mongoose.model(
    "Test",
    testSchema
  );

export {
  TEST_TYPES,
  TEST_MODES,
  TEST_STATUS,
  QUESTION_MODES,
  GRADING_MODES,
  RESULT_VISIBILITY,
  RANKING_SCOPES,
  RANKING_PERIODS,
  ANTI_CHEAT_METHODS,
};