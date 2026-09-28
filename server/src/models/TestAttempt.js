// server/src/models/TestAttempt.js

import mongoose from "mongoose";

import crypto from "node:crypto";
const ATTEMPT_STATUS = [
  "created",
  "started",
  "paused",
  "submitted",
  "auto_submitted",
  "under_review",
  "graded",
  "passed",
  "failed",
  "abandoned",
  "terminated",
  "cancelled",
];

const SUBMISSION_SOURCES = [
  "student",
  "auto_submit",
  "teacher",
  "system",
  "timeout",
];

const ANSWER_STATUS = [
  "unanswered",
  "answered",
  "marked_for_review",
  "skipped",
];

const ANSWER_TYPES = [
  "text",
  "numeric",
  "boolean",
  "option",
  "options",
  "file",
  "code",
  "structured",
];

const PROCTORING_EVENTS = [
  "tab_switch",
  "window_blur",
  "fullscreen_exit",
  "copy",
  "paste",
  "cut",
  "right_click",
  "devtools_detected",
  "camera_disabled",
  "microphone_disabled",
  "face_not_detected",
  "multiple_faces",
  "identity_mismatch",
  "device_changed",
  "network_changed",
  "ip_changed",
  "geofence_violation",
  "screen_share_stopped",
  "suspicious_activity",
  "other",
];

const PROCTORING_SEVERITIES = [
  "info",
  "warning",
  "high",
  "critical",
];

const proctoringEventSchema =
  new mongoose.Schema(
    {
      _id: false,

      type: {
        type: String,
        enum: PROCTORING_EVENTS,
        required: true,
      },

      severity: {
        type: String,
        enum: PROCTORING_SEVERITIES,
        default: "warning",
      },

      timestamp: {
        type: Date,
        default: Date.now,
      },

      durationSeconds: {
        type: Number,
        min: 0,
        default: 0,
      },

      questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
        default: null,
      },

      metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },

      acknowledged: {
        type: Boolean,
        default: false,
      },
    },
    {
      _id: false,
    }
  );

const answerSchema =
  new mongoose.Schema(
    {
      questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
        required: true,
        index: true,
      },

      questionVersion: {
        type: Number,
        min: 1,
        default: 1,
      },

      type: {
        type: String,
        enum: ANSWER_TYPES,
        default: "text",
      },

      value: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },

      selectedOptions: {
        type: [
          {
            type: String,
            maxlength: 20,
          },
        ],
        default: [],
      },

      textAnswer: {
        type: String,
        maxlength: 20000,
        default: null,
      },

      numericAnswer: {
        type: Number,
        default: null,
      },

      booleanAnswer: {
        type: Boolean,
        default: null,
      },

      codeAnswer: {
        language: {
          type: String,
          trim: true,
          maxlength: 50,
          default: null,
        },

        source: {
          type: String,
          maxlength: 30000,
          default: null,
        },

        executionId: {
          type: String,
          trim: true,
          maxlength: 200,
          default: null,
        },
      },

      attachments: [
        {
          _id: false,

          name: {
            type: String,
            trim: true,
            maxlength: 255,
          },

          url: {
            type: String,
            trim: true,
            maxlength: 2048,
          },

          mimeType: {
            type: String,
            trim: true,
            maxlength: 150,
          },

          sizeBytes: {
            type: Number,
            min: 0,
          },
        },
      ],

      status: {
        type: String,
        enum: ANSWER_STATUS,
        default: "unanswered",
      },

      isCorrect: {
        type: Boolean,
        default: null,
      },

      isPartiallyCorrect: {
        type: Boolean,
        default: false,
      },

      score: {
        type: Number,
        min: 0,
        default: 0,
      },

      maxScore: {
        type: Number,
        min: 0,
        default: 0,
      },

      percentage: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },

      timeSpentSeconds: {
        type: Number,
        min: 0,
        default: 0,
      },

      firstAnsweredAt: {
        type: Date,
        default: null,
      },

      lastAnsweredAt: {
        type: Date,
        default: null,
      },

      markedAt: {
        type: Date,
        default: null,
      },

      feedback: {
        type: String,
        trim: true,
        maxlength: 5000,
        default: null,
      },

      rubricScores: [
        {
          _id: false,

          criterion: {
            type: String,
            trim: true,
            maxlength: 300,
          },

          points: {
            type: Number,
            min: 0,
            default: 0,
          },

          maxPoints: {
            type: Number,
            min: 0,
            default: 0,
          },

          feedback: {
            type: String,
            trim: true,
            maxlength: 2000,
            default: null,
          },
        },
      ],
    },
    {
      _id: false,
    }
  );

const deviceSnapshotSchema =
  new mongoose.Schema(
    {
      _id: false,

      deviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Device",
        default: null,
      },

      fingerprintHash: {
        type: String,
        trim: true,
        maxlength: 128,
        default: null,
      },

      platform: {
        type: String,
        trim: true,
        maxlength: 50,
        default: null,
      },

      browser: {
        type: String,
        trim: true,
        maxlength: 150,
        default: null,
      },

      operatingSystem: {
        type: String,
        trim: true,
        maxlength: 150,
        default: null,
      },

      appVersion: {
        type: String,
        trim: true,
        maxlength: 50,
        default: null,
      },

      ipAddress: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      userAgent: {
        type: String,
        trim: true,
        maxlength: 2000,
        default: null,
      },
    }
  );

const locationSnapshotSchema =
  new mongoose.Schema(
    {
      _id: false,

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

      accuracyMeters: {
        type: Number,
        min: 0,
        default: null,
      },

      geofenceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Geofence",
        default: null,
      },

      verified: {
        type: Boolean,
        default: false,
      },

      capturedAt: {
        type: Date,
        default: null,
      },
    }
  );

const gradingSchema =
  new mongoose.Schema(
    {
      mode: {
        type: String,
        enum: [
          "automatic",
          "manual",
          "hybrid",
          "ai_assisted",
        ],
        default: "automatic",
      },

      gradedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      gradedAt: {
        type: Date,
        default: null,
      },

      score: {
        type: Number,
        min: 0,
        default: 0,
      },

      maxScore: {
        type: Number,
        min: 0,
        default: 0,
      },

      percentage: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },

      passed: {
        type: Boolean,
        default: false,
      },

      feedback: {
        type: String,
        trim: true,
        maxlength: 10000,
        default: null,
      },

      privateNotes: {
        type: String,
        trim: true,
        maxlength: 10000,
        default: null,
      },

      aiAssisted: {
        type: Boolean,
        default: false,
      },

      aiConfidence: {
        type: Number,
        min: 0,
        max: 1,
        default: null,
      },

      manuallyReviewed: {
        type: Boolean,
        default: false,
      },
    },
    {
      _id: false,
    }
  );

const testAttemptSchema =
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
publicId: {
  type: String,
  required: true,
  unique: true,
  immutable: true,
  index: true,
  default: () =>
    `test_${crypto.randomBytes(16).toString("base64url")}`,
},
      /* ==================================================================== */
      /* TEST                                                                  */
      /* ==================================================================== */

      testId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Test",
        required: true,
        index: true,
      },

      testVersion: {
        type: Number,
        min: 1,
        default: 1,
      },

      /* ==================================================================== */
      /* STUDENT                                                               */
      /* ==================================================================== */

      studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class",
        default: null,
        index: true,
      },

      enrollmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Enrollment",
        default: null,
      },

      /* ==================================================================== */
      /* ATTEMPT                                                               */
      /* ==================================================================== */

      attemptNumber: {
        type: Number,
        min: 1,
        required: true,
      },

      status: {
        type: String,
        enum: ATTEMPT_STATUS,
        default: "created",
        index: true,
      },

      submissionSource: {
        type: String,
        enum: SUBMISSION_SOURCES,
        default: "student",
      },

      startedAt: {
        type: Date,
        default: null,
      },

      submittedAt: {
        type: Date,
        default: null,
      },

      completedAt: {
        type: Date,
        default: null,
      },

      lastActivityAt: {
        type: Date,
        default: null,
        index: true,
      },

      pausedAt: {
        type: Date,
        default: null,
      },

      totalPausedSeconds: {
        type: Number,
        min: 0,
        default: 0,
      },

      durationSeconds: {
        type: Number,
        min: 0,
        default: 0,
      },

      timeLimitSeconds: {
        type: Number,
        min: 0,
        default: null,
      },

      deadlineAt: {
        type: Date,
        default: null,
        index: true,
      },

      /* ==================================================================== */
      /* QUESTIONS                                                            */
      /* ==================================================================== */

      questionIds: {
        type: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Question",
          },
        ],
        default: [],
      },

      answers: {
        type: [answerSchema],
        default: [],
      },

      currentQuestionIndex: {
        type: Number,
        min: 0,
        default: 0,
      },

      questionsVisited: {
        type: Number,
        min: 0,
        default: 0,
      },

      questionsAnswered: {
        type: Number,
        min: 0,
        default: 0,
      },

      questionsSkipped: {
        type: Number,
        min: 0,
        default: 0,
      },

      questionsMarkedForReview: {
        type: Number,
        min: 0,
        default: 0,
      },

      /* ==================================================================== */
      /* GRADING                                                              */
      /* ==================================================================== */

      grading: {
        type: gradingSchema,
        default: () => ({}),
      },

      score: {
        type: Number,
        min: 0,
        default: 0,
      },

      maxScore: {
        type: Number,
        min: 0,
        default: 0,
      },

      percentage: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },

      passed: {
        type: Boolean,
        default: false,
      },

      rank: {
        type: Number,
        min: 1,
        default: null,
      },

      percentile: {
        type: Number,
        min: 0,
        max: 100,
        default: null,
      },

      /* ==================================================================== */
      /* REVIEW / FEEDBACK                                                    */
      /* ==================================================================== */

      feedback: {
        type: String,
        trim: true,
        maxlength: 10000,
        default: null,
      },

      reviewRequired: {
        type: Boolean,
        default: false,
        index: true,
      },

      reviewedAt: {
        type: Date,
        default: null,
      },

      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      /* ==================================================================== */
      /* PROCTORING                                                           */
      /* ==================================================================== */

      proctoring: {
        enabled: {
          type: Boolean,
          default: false,
        },

        identityVerified: {
          type: Boolean,
          default: false,
        },

        identityVerificationMethod: {
          type: String,
          enum: [
            "none",
            "password",
            "otp",
            "face",
            "biometric",
            "manual",
            "other",
          ],
          default: "none",
        },

        identityConfidence: {
          type: Number,
          min: 0,
          max: 1,
          default: null,
        },

        warningCount: {
          type: Number,
          min: 0,
          default: 0,
        },

        violationCount: {
          type: Number,
          min: 0,
          default: 0,
        },

        riskScore: {
          type: Number,
          min: 0,
          max: 100,
          default: 0,
        },

        riskLevel: {
          type: String,
          enum: [
            "low",
            "medium",
            "high",
            "critical",
          ],
          default: "low",
        },

        events: {
          type: [proctoringEventSchema],
          default: [],
        },

        terminatedReason: {
          type: String,
          trim: true,
          maxlength: 2000,
          default: null,
        },
      },

      /* ==================================================================== */
      /* DEVICE                                                               */
      /* ==================================================================== */

      device: {
        type: deviceSnapshotSchema,
        default: null,
      },

      /* ==================================================================== */
      /* LOCATION                                                             */
      /* ==================================================================== */

      location: {
        type: locationSnapshotSchema,
        default: null,
      },

      /* ==================================================================== */
      /* NETWORK / SECURITY                                                   */
      /* ==================================================================== */

      security: {
        sessionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "RefreshSession",
          default: null,
        },

        initialIpHash: {
          type: String,
          trim: true,
          maxlength: 128,
          default: null,
        },

        currentIpHash: {
          type: String,
          trim: true,
          maxlength: 128,
          default: null,
        },

        deviceChangeDetected: {
          type: Boolean,
          default: false,
        },

        networkChangeDetected: {
          type: Boolean,
          default: false,
        },
      },

      /* ==================================================================== */
      /* SNAPSHOT                                                              */
      /* ==================================================================== */

      configurationSnapshot: {
        questionOrder: {
          type: [Number],
          default: [],
        },

        maxAttempts: {
          type: Number,
          min: 1,
          default: 1,
        },

        passingPercentage: {
          type: Number,
          min: 0,
          max: 100,
          default: 40,
        },

        negativeMarkingEnabled: {
          type: Boolean,
          default: false,
        },

        negativeMarkingValue: {
          type: Number,
          min: 0,
          default: 0,
        },

        timeLimitSeconds: {
          type: Number,
          min: 0,
          default: null,
        },

        capturedAt: {
          type: Date,
          default: Date.now,
        },
      },

      /* ==================================================================== */
      /* GAMIFICATION                                                         */
      /* ==================================================================== */

      gamification: {
        pointsAwarded: {
          type: Number,
          min: 0,
          default: 0,
        },

        xpAwarded: {
          type: Number,
          min: 0,
          default: 0,
        },

        achievementsAwarded: {
          type: [
            {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Achievement",
            },
          ],
          default: [],
        },
      },

      /* ==================================================================== */
      /* AUDIT / LIFECYCLE                                                    */
      /* ==================================================================== */

      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      terminatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      terminationReason: {
        type: String,
        trim: true,
        maxlength: 2000,
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

testAttemptSchema.index(
  {
    instituteId: 1,
    testId: 1,
    studentId: 1,
    attemptNumber: 1,
  },
  {
    name: "attempt_identity",
    unique: true,
  }
);

testAttemptSchema.index(
  {
    instituteId: 1,
    testId: 1,
    status: 1,
    createdAt: -1,
  },
  {
    name: "test_attempt_feed",
  }
);

testAttemptSchema.index(
  {
    instituteId: 1,
    studentId: 1,
    createdAt: -1,
  },
  {
    name: "student_attempt_history",
  }
);

testAttemptSchema.index(
  {
    instituteId: 1,
    testId: 1,
    score: -1,
    percentage: -1,
  },
  {
    name: "test_ranking",
  }
);

testAttemptSchema.index(
  {
    instituteId: 1,
    status: 1,
    deadlineAt: 1,
  },
  {
    name: "attempt_deadline_queue",
  }
);

testAttemptSchema.index(
  {
    instituteId: 1,
    reviewRequired: 1,
    createdAt: -1,
  },
  {
    name: "attempt_review_queue",
  }
);

testAttemptSchema.index(
  {
    instituteId: 1,
    "proctoring.riskLevel": 1,
    createdAt: -1,
  },
  {
    name: "attempt_proctoring_risk",
  }
);

testAttemptSchema.index(
  {
    instituteId: 1,
    lastActivityAt: 1,
    status: 1,
  },
  {
    name: "attempt_activity_monitor",
  }
);

/* ============================================================================
 * VALIDATION
 * ========================================================================== */

testAttemptSchema.pre(
  "validate",
  function (next) {
    if (
      this.grading.score >
      this.grading.maxScore
    ) {
      return next(
        new Error(
          "Attempt score cannot exceed maximum score"
        )
      );
    }

    if (
      this.percentage < 0 ||
      this.percentage > 100
    ) {
      return next(
        new Error(
          "Attempt percentage must be between 0 and 100"
        )
      );
    }

    if (
      this.proctoring.warningCount >
      1000
    ) {
      return next(
        new Error(
          "Invalid proctoring warning count"
        )
      );
    }

    if (
      this.proctoring.violationCount >
      1000
    ) {
      return next(
        new Error(
          "Invalid proctoring violation count"
        )
      );
    }

    if (
      this.status ===
        "submitted" ||
      this.status ===
        "auto_submitted" ||
      this.status ===
        "graded" ||
      this.status ===
        "passed" ||
      this.status ===
        "failed"
    ) {
      if (!this.submittedAt) {
        this.submittedAt =
          new Date();
      }
    }

    if (
      [
        "graded",
        "passed",
        "failed",
      ].includes(
        this.status
      ) &&
      !this.grading.gradedAt
    ) {
      this.grading.gradedAt =
        new Date();
    }

    if (
      this.status ===
        "passed" ||
      this.status ===
        "failed"
    ) {
      this.passed =
        this.status ===
        "passed";
    }

    this.questionsAnswered =
      this.answers.filter(
        (answer) =>
          answer.status ===
            "answered" ||
          answer.status ===
            "marked_for_review"
      ).length;

    this.questionsSkipped =
      this.answers.filter(
        (answer) =>
          answer.status ===
          "skipped"
      ).length;

    this.questionsMarkedForReview =
      this.answers.filter(
        (answer) =>
          answer.status ===
          "marked_for_review"
      ).length;

    if (
      this.questionsVisited >
      this.questionIds.length
    ) {
      this.questionsVisited =
        this.questionIds.length;
    }

    if (
      this.answers.length >
      10000
    ) {
      return next(
        new Error(
          "An attempt cannot contain more than 10,000 answers"
        )
      );
    }

    if (
      this.proctoring.events
        .length > 5000
    ) {
      return next(
        new Error(
          "An attempt cannot contain more than 5,000 proctoring events"
        )
      );
    }

    next();
  }
);

/* ============================================================================
 * VIRTUALS
 * ========================================================================== */

testAttemptSchema.virtual(
  "isActive"
).get(function () {
  return [
    "created",
    "started",
    "paused",
  ].includes(
    this.status
  );
});

testAttemptSchema.virtual(
  "isFinished"
).get(function () {
  return [
    "submitted",
    "auto_submitted",
    "graded",
    "passed",
    "failed",
    "abandoned",
    "terminated",
    "cancelled",
  ].includes(
    this.status
  );
});

testAttemptSchema.virtual(
  "isGraded"
).get(function () {
  return [
    "graded",
    "passed",
    "failed",
  ].includes(
    this.status
  );
});

testAttemptSchema.virtual(
  "isLate"
).get(function () {
  if (!this.deadlineAt) {
    return false;
  }

  if (!this.submittedAt) {
    return (
      new Date() >
      this.deadlineAt
    );
  }

  return (
    this.submittedAt >
    this.deadlineAt
  );
});

testAttemptSchema.virtual(
  "answerRate"
).get(function () {
  const total =
    this.questionIds.length;

  if (!total) {
    return 0;
  }

  return Math.round(
    (this.questionsAnswered /
      total) *
      10000
  ) / 100;
});

testAttemptSchema.virtual(
  "riskScore"
).get(function () {
  return (
    this.proctoring
      ?.riskScore || 0
  );
});

/* ============================================================================
 * QUERY HELPERS
 * ========================================================================== */

testAttemptSchema.query.byInstitute =
  function (
    instituteId
  ) {
    return this.where({
      instituteId,
      isDeleted: false,
    });
  };

testAttemptSchema.query.byTest =
  function (
    testId
  ) {
    return this.where({
      testId,
      isDeleted: false,
    });
  };

testAttemptSchema.query.byStudent =
  function (
    studentId
  ) {
    return this.where({
      studentId,
      isDeleted: false,
    });
  };

testAttemptSchema.query.active =
  function () {
    return this.where({
      isDeleted: false,
      status: {
        $in: [
          "created",
          "started",
          "paused",
        ],
      },
    });
  };

testAttemptSchema.query.needsReview =
  function () {
    return this.where({
      isDeleted: false,
      reviewRequired: true,
    });
  };

testAttemptSchema.query.highRisk =
  function () {
    return this.where({
      isDeleted: false,
      "proctoring.riskLevel": {
        $in: [
          "high",
          "critical",
        ],
      },
    });
  };

/* ============================================================================
 * INSTANCE METHODS
 * ========================================================================== */

testAttemptSchema.methods.start =
  async function () {
    if (
      ![
        "created",
        "paused",
      ].includes(
        this.status
      )
    ) {
      throw new Error(
        "This attempt cannot be started"
      );
    }

    const now =
      new Date();

    if (!this.startedAt) {
      this.startedAt =
        now;
    }

    this.status =
      "started";

    this.lastActivityAt =
      now;

    if (
      this.timeLimitSeconds
    ) {
      this.deadlineAt =
        new Date(
          now.getTime() +
            this.timeLimitSeconds *
              1000
        );
    }

    return this.save();
  };

testAttemptSchema.methods.pause =
  async function () {
    if (
      this.status !==
      "started"
    ) {
      throw new Error(
        "Only active attempts can be paused"
      );
    }

    this.status =
      "paused";

    this.pausedAt =
      new Date();

    this.lastActivityAt =
      new Date();

    return this.save();
  };

testAttemptSchema.methods.resume =
  async function () {
    if (
      this.status !==
      "paused"
    ) {
      throw new Error(
        "Only paused attempts can be resumed"
      );
    }

    if (this.pausedAt) {
      this.totalPausedSeconds +=
        Math.max(
          0,
          Math.floor(
            (Date.now() -
              this.pausedAt.getTime()) /
              1000
          )
        );
    }

    this.pausedAt =
      null;

    this.status =
      "started";

    this.lastActivityAt =
      new Date();

    return this.save();
  };

testAttemptSchema.methods.recordAnswer =
  async function ({
    questionId,
    value = null,
    selectedOptions = [],
    textAnswer = null,
    numericAnswer = null,
    booleanAnswer = null,
    status = "answered",
    timeSpentSeconds = 0,
  } = {}) {
    if (
      !questionId
    ) {
      throw new Error(
        "Question ID is required"
      );
    }

    if (
      !this.isActive
    ) {
      throw new Error(
        "Cannot answer an inactive attempt"
      );
    }

    const questionIdString =
      questionId.toString();

    let answer =
      this.answers.find(
        (item) =>
          item.questionId?.toString() ===
          questionIdString
      );

    if (!answer) {
      answer = {
        questionId,
        type: "text",
        status: "unanswered",
        score: 0,
        maxScore: 0,
        timeSpentSeconds: 0,
      };

      this.answers.push(
        answer
      );

      answer =
        this.answers[
          this.answers.length - 1
        ];
    }

    const now =
      new Date();

    if (
      !answer.firstAnsweredAt
    ) {
      answer.firstAnsweredAt =
        now;
    }

    answer.lastAnsweredAt =
      now;

    answer.value =
      value;

    answer.selectedOptions =
      selectedOptions;

    answer.textAnswer =
      textAnswer;

    answer.numericAnswer =
      numericAnswer;

    answer.booleanAnswer =
      booleanAnswer;

    answer.status =
      status;

    answer.timeSpentSeconds =
      Math.max(
        0,
        Number(
          timeSpentSeconds
        ) || 0
      );

    this.lastActivityAt =
      now;

    return this.save();
  };

testAttemptSchema.methods.markForReview =
  async function (
    questionId
  ) {
    const answer =
      this.answers.find(
        (item) =>
          item.questionId?.toString() ===
          questionId.toString()
      );

    if (!answer) {
      throw new Error(
        "Answer not found"
      );
    }

    answer.status =
      "marked_for_review";

    answer.markedAt =
      new Date();

    this.lastActivityAt =
      new Date();

    return this.save();
  };

testAttemptSchema.methods.submit =
  async function (
    source = "student"
  ) {
    if (
      !this.isActive
    ) {
      throw new Error(
        "This attempt cannot be submitted"
      );
    }

    this.status =
      source ===
      "auto_submit"
        ? "auto_submitted"
        : "submitted";

    this.submissionSource =
      source;

    this.submittedAt =
      new Date();

    this.completedAt =
      new Date();

    this.lastActivityAt =
      new Date();

    return this.save();
  };

testAttemptSchema.methods.grade =
  async function ({
    score,
    maxScore,
    feedback = null,
    gradedBy = null,
    passed = null,
    aiAssisted = false,
    aiConfidence = null,
  } = {}) {
    if (
      score === undefined ||
      maxScore === undefined
    ) {
      throw new Error(
        "Score and maxScore are required"
      );
    }

    const numericScore =
      Number(score);

    const numericMax =
      Number(maxScore);

    if (
      numericScore < 0 ||
      numericMax <= 0 ||
      numericScore >
        numericMax
    ) {
      throw new Error(
        "Invalid grading values"
      );
    }

    const percentage =
      (numericScore /
        numericMax) *
      100;

    this.score =
      numericScore;

    this.maxScore =
      numericMax;

    this.percentage =
      Math.round(
        percentage *
          100
      ) / 100;

    this.passed =
      passed === null
        ? this.passed
        : Boolean(passed);

    this.grading.score =
      numericScore;

    this.grading.maxScore =
      numericMax;

    this.grading.percentage =
      this.percentage;

    this.grading.passed =
      this.passed;

    this.grading.feedback =
      feedback;

    this.grading.gradedBy =
      gradedBy;

    this.grading.gradedAt =
      new Date();

    this.grading.aiAssisted =
      aiAssisted;

    this.grading.aiConfidence =
      aiConfidence;

    this.status =
      this.passed
        ? "passed"
        : "failed";

    this.reviewRequired =
      false;

    return this.save();
  };

testAttemptSchema.methods.addProctoringEvent =
  async function ({
    type,
    severity = "warning",
    questionId = null,
    durationSeconds = 0,
    metadata = null,
  } = {}) {
    if (!type) {
      throw new Error(
        "Proctoring event type is required"
      );
    }

    this.proctoring.events.push({
      type,
      severity,
      questionId,
      durationSeconds,
      metadata,
      timestamp:
        new Date(),
    });

    this.proctoring.violationCount +=
      severity ===
        "high" ||
      severity ===
        "critical"
        ? 1
        : 0;

    this.proctoring.warningCount +=
      severity ===
      "warning"
        ? 1
        : 0;

    const severityWeight = {
      info: 1,
      warning: 5,
      high: 15,
      critical: 30,
    };

    this.proctoring.riskScore =
      Math.min(
        100,
        this.proctoring.riskScore +
          (
            severityWeight[
              severity
            ] || 0
          )
      );

    if (
      this.proctoring.riskScore >=
      80
    ) {
      this.proctoring.riskLevel =
        "critical";
    } else if (
      this.proctoring.riskScore >=
      50
    ) {
      this.proctoring.riskLevel =
        "high";
    } else if (
      this.proctoring.riskScore >=
      20
    ) {
      this.proctoring.riskLevel =
        "medium";
    } else {
      this.proctoring.riskLevel =
        "low";
    }

    this.lastActivityAt =
      new Date();

    return this.save();
  };

testAttemptSchema.methods.terminate =
  async function ({
    reason,
    terminatedBy = null,
  } = {}) {
    if (
      this.isFinished
    ) {
      throw new Error(
        "Finished attempts cannot be terminated"
      );
    }

    this.status =
      "terminated";

    this.terminationReason =
      reason || null;

    this.terminatedBy =
      terminatedBy;

    this.completedAt =
      new Date();

    this.lastActivityAt =
      new Date();

    return this.save();
  };

testAttemptSchema.methods.abandon =
  async function () {
    if (
      this.isFinished
    ) {
      return this;
    }

    this.status =
      "abandoned";

    this.completedAt =
      new Date();

    this.lastActivityAt =
      new Date();

    return this.save();
  };

testAttemptSchema.methods.updateActivity =
  async function () {
    this.lastActivityAt =
      new Date();

    return this.save();
  };

/* ============================================================================
 * MODEL
 * ========================================================================== */

export const TestAttempt =
  mongoose.models.TestAttempt ||
  mongoose.model(
    "TestAttempt",
    testAttemptSchema
  );

export {
  ATTEMPT_STATUS,
  SUBMISSION_SOURCES,
  ANSWER_STATUS,
  ANSWER_TYPES,
  PROCTORING_EVENTS,
  PROCTORING_SEVERITIES,
};
