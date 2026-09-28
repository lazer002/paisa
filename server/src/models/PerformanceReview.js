// server/src/models/PerformanceReview.js

import mongoose from "mongoose";

import crypto from "node:crypto";
const REVIEW_STATUSES = [
  "draft",
  "scheduled",
  "in_progress",
  "submitted",
  "under_review",
  "completed",
  "acknowledged",
  "cancelled",
  "archived",
];

const REVIEW_TYPES = [
  "probation",
  "quarterly",
  "half_yearly",
  "annual",
  "promotion",
  "salary_revision",
  "project",
  "exit",
  "self",
  "peer",
  "manager",
  "custom",
];

const RATING_SCALES = [
  "five",
  "ten",
  "hundred",
  "percentage",
  "custom",
];

const REVIEWER_TYPES = [
  "self",
  "manager",
  "hr",
  "peer",
  "subordinate",
  "external",
  "system",
];

const GOAL_STATUSES = [
  "not_started",
  "in_progress",
  "completed",
  "partially_completed",
  "cancelled",
  "deferred",
];

const FEEDBACK_TYPES = [
  "strength",
  "improvement",
  "general",
  "achievement",
  "concern",
];

const REVIEW_OUTCOMES = [
  "exceeds_expectations",
  "meets_expectations",
  "partially_meets_expectations",
  "does_not_meet_expectations",
  "promotion_recommended",
  "promotion_not_recommended",
  "salary_revision_recommended",
  "salary_revision_not_recommended",
  "pip_recommended",
  "no_change",
];

const reviewerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },

    type: {
      type: String,
      enum: REVIEWER_TYPES,
      required: true,
    },

    role: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
    },

    assignedAt: {
      type: Date,
      default: Date.now,
    },

    startedAt: {
      type: Date,
      default: null,
    },

    submittedAt: {
      type: Date,
      default: null,
    },

    completed: {
      type: Boolean,
      default: false,
    },

    rating: {
      type: Number,
      min: 0,
      default: null,
    },

    comments: {
      type: String,
      trim: true,
      maxlength: 10000,
      default: null,
    },

    weight: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
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

const competencySchema = new mongoose.Schema(
  {
    code: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 100,
      default: null,
    },

    name: {
      type: String,
      trim: true,
      maxlength: 300,
      required: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: null,
    },

    category: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
    },

    weight: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    rating: {
      type: Number,
      min: 0,
      default: null,
    },

    maxRating: {
      type: Number,
      min: 1,
      default: 5,
    },

    comments: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: null,
    },

    strengths: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: 1000,
        },
      ],
      default: [],
    },

    improvements: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: 1000,
        },
      ],
      default: [],
    },

    evidence: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: 2000,
        },
      ],
      default: [],
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

const goalSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      maxlength: 500,
      required: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: null,
    },

    category: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
    },

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },

    startDate: {
      type: Date,
      default: null,
    },

    dueDate: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: GOAL_STATUSES,
      default: "not_started",
    },

    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    weight: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    targetValue: {
      type: Number,
      default: null,
    },

    actualValue: {
      type: Number,
      default: null,
    },

    unit: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    rating: {
      type: Number,
      min: 0,
      default: null,
    },

    comments: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    evidence: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: 2000,
        },
      ],
      default: [],
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

const feedbackSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: FEEDBACK_TYPES,
      default: "general",
    },

    title: {
      type: String,
      trim: true,
      maxlength: 300,
      default: null,
    },

    content: {
      type: String,
      trim: true,
      maxlength: 10000,
      required: true,
    },

    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    authorType: {
      type: String,
      enum: REVIEWER_TYPES,
      default: "manager",
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },

    acknowledged: {
      type: Boolean,
      default: false,
    },

    acknowledgedAt: {
      type: Date,
      default: null,
    },

    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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

const ratingHistorySchema = new mongoose.Schema(
  {
    rating: {
      type: Number,
      min: 0,
      required: true,
    },

    maxRating: {
      type: Number,
      min: 1,
      required: true,
    },

    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    changedAt: {
      type: Date,
      default: Date.now,
    },

    reason: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },
  },
  {
    _id: false,
  }
);

const performanceReviewSchema = new mongoose.Schema(
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
    `perf_${crypto.randomBytes(16).toString("base64url")}`,
},
    /* ====================================================================== */
    /* IDENTITY                                                               */
    /* ====================================================================== */

    reviewCode: {
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

    title: {
      type: String,
      trim: true,
      maxlength: 500,
      required: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: null,
    },

    /* ====================================================================== */
    /* REVIEW TYPE / STATUS                                                    */
    /* ====================================================================== */

    type: {
      type: String,
      enum: REVIEW_TYPES,
      default: "annual",
      index: true,
    },

    status: {
      type: String,
      enum: REVIEW_STATUSES,
      default: "draft",
      index: true,
    },

    /* ====================================================================== */
    /* EMPLOYEE                                                                */
    /* ====================================================================== */

    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },

    employeeUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
      index: true,
    },

    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    /* ====================================================================== */
    /* EMPLOYEE SNAPSHOT                                                       */
    /* ====================================================================== */

    employeeSnapshot: {
      employeeCode: {
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

      designation: {
        type: String,
        trim: true,
        maxlength: 300,
        default: null,
      },

      department: {
        type: String,
        trim: true,
        maxlength: 300,
        default: null,
      },

      joiningDate: {
        type: Date,
        default: null,
      },

      employmentType: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      grade: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },
    },

    /* ====================================================================== */
    /* REVIEW PERIOD                                                           */
    /* ====================================================================== */

    period: {
      startDate: {
        type: Date,
        required: true,
      },

      endDate: {
        type: Date,
        required: true,
      },

      timezone: {
        type: String,
        trim: true,
        maxlength: 100,
        default: "UTC",
      },
    },

    scheduledAt: {
      type: Date,
      default: null,
      index: true,
    },

    dueAt: {
      type: Date,
      default: null,
      index: true,
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

    acknowledgedAt: {
      type: Date,
      default: null,
    },

    /* ====================================================================== */
    /* REVIEWERS                                                               */
    /* ====================================================================== */

    reviewers: {
      type: [reviewerSchema],
      default: [],
    },

    primaryReviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /* ====================================================================== */
    /* RATING                                                                  */
    /* ====================================================================== */

    ratingScale: {
      type: String,
      enum: RATING_SCALES,
      default: "five",
    },

    maxRating: {
      type: Number,
      min: 1,
      default: 5,
    },

    overallRating: {
      type: Number,
      min: 0,
      default: null,
    },

    normalizedRating: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    ratingHistory: {
      type: [ratingHistorySchema],
      default: [],
    },

    /* ====================================================================== */
    /* COMPETENCIES                                                            */
    /* ====================================================================== */

    competencies: {
      type: [competencySchema],
      default: [],
    },

    competencyScore: {
      type: Number,
      min: 0,
      default: null,
    },

    /* ====================================================================== */
    /* GOALS                                                                   */
    /* ====================================================================== */

    goals: {
      type: [goalSchema],
      default: [],
    },

    goalScore: {
      type: Number,
      min: 0,
      default: null,
    },

    /* ====================================================================== */
    /* FEEDBACK                                                                */
    /* ====================================================================== */

    feedback: {
      type: [feedbackSchema],
      default: [],
    },

    strengths: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: 2000,
        },
      ],
      default: [],
    },

    areasForImprovement: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: 2000,
        },
      ],
      default: [],
    },

    /* ====================================================================== */
    /* OUTCOME                                                                 */
    /* ====================================================================== */

    outcome: {
      type: String,
      enum: REVIEW_OUTCOMES,
      default: null,
    },

    outcomeComments: {
      type: String,
      trim: true,
      maxlength: 10000,
      default: null,
    },

    promotion: {
      recommended: {
        type: Boolean,
        default: false,
      },

      currentDesignation: {
        type: String,
        trim: true,
        maxlength: 300,
        default: null,
      },

      proposedDesignation: {
        type: String,
        trim: true,
        maxlength: 300,
        default: null,
      },

      proposedGrade: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      effectiveDate: {
        type: Date,
        default: null,
      },
    },

    salaryRevision: {
      recommended: {
        type: Boolean,
        default: false,
      },

      currentSalary: {
        type: Number,
        min: 0,
        default: null,
      },

      proposedSalary: {
        type: Number,
        min: 0,
        default: null,
      },

      increasePercentage: {
        type: Number,
        default: null,
      },

      effectiveDate: {
        type: Date,
        default: null,
      },

      reason: {
        type: String,
        trim: true,
        maxlength: 5000,
        default: null,
      },
    },

    /* ====================================================================== */
    /* DEVELOPMENT                                                             */
    /* ====================================================================== */

    developmentPlan: {
      required: {
        type: Boolean,
        default: false,
      },

      objectives: {
        type: [
          {
            title: {
              type: String,
              trim: true,
              maxlength: 500,
            },

            description: {
              type: String,
              trim: true,
              maxlength: 3000,
            },

            targetDate: {
              type: Date,
              default: null,
            },

            ownerId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
              default: null,
            },

            status: {
              type: String,
              enum: [
                "planned",
                "in_progress",
                "completed",
                "cancelled",
              ],
              default: "planned",
            },

            progress: {
              type: Number,
              min: 0,
              max: 100,
              default: 0,
            },
          },
        ],
        default: [],
      },

      trainingRequired: {
        type: Boolean,
        default: false,
      },

      trainingTopics: {
        type: [
          {
            type: String,
            trim: true,
            maxlength: 500,
          },
        ],
        default: [],
      },
    },

    /* ====================================================================== */
    /* PIP                                                                     */
    /* ====================================================================== */

    performanceImprovementPlan: {
      enabled: {
        type: Boolean,
        default: false,
      },

      startDate: {
        type: Date,
        default: null,
      },

      endDate: {
        type: Date,
        default: null,
      },

      objectives: {
        type: [
          {
            type: String,
            trim: true,
            maxlength: 2000,
          },
        ],
        default: [],
      },

      reviewFrequency: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      status: {
        type: String,
        enum: [
          "planned",
          "active",
          "completed",
          "failed",
          "cancelled",
        ],
        default: "planned",
      },

      outcome: {
        type: String,
        trim: true,
        maxlength: 5000,
        default: null,
      },
    },

    /* ====================================================================== */
    /* ATTACHMENTS                                                             */
    /* ====================================================================== */

    attachments: {
      type: [
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
            maxlength: 3000,
            required: true,
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

          uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
          },

          uploadedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      default: [],
    },

    /* ====================================================================== */
    /* CONFIDENTIALITY                                                         */
    /* ====================================================================== */

    visibility: {
      type: String,
      enum: [
        "private",
        "employee",
        "manager",
        "hr",
        "management",
      ],
      default: "manager",
    },

    employeeAcknowledgementRequired: {
      type: Boolean,
      default: true,
    },

    employeeAcknowledged: {
      type: Boolean,
      default: false,
    },

    employeeAcknowledgementComment: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: null,
    },

    /* ====================================================================== */
    /* SOURCE / METADATA                                                       */
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
    },

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
    /* AUDIT                                                                   */
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

    /* ====================================================================== */
    /* LIFECYCLE                                                               */
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

    archivedAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
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

performanceReviewSchema.index(
  {
    instituteId: 1,
    reviewCode: 1,
  },
  {
    unique: true,
    sparse: true,
    name: "tenant_performance_review_code",
  }
);

performanceReviewSchema.index(
  {
    instituteId: 1,
    employeeId: 1,
    status: 1,
    "period.endDate": -1,
  },
  {
    name: "employee_performance_reviews",
  }
);

performanceReviewSchema.index(
  {
    instituteId: 1,
    employeeUserId: 1,
    status: 1,
    "period.endDate": -1,
  },
  {
    sparse: true,
    name: "employee_user_reviews",
  }
);

performanceReviewSchema.index(
  {
    instituteId: 1,
    managerId: 1,
    status: 1,
    dueAt: 1,
  },
  {
    sparse: true,
    name: "manager_review_queue",
  }
);

performanceReviewSchema.index(
  {
    instituteId: 1,
    departmentId: 1,
    type: 1,
    status: 1,
  },
  {
    sparse: true,
    name: "department_reviews",
  }
);

performanceReviewSchema.index(
  {
    instituteId: 1,
    status: 1,
    scheduledAt: 1,
    dueAt: 1,
  },
  {
    name: "review_schedule",
  }
);

performanceReviewSchema.index(
  {
    instituteId: 1,
    "reviewers.userId": 1,
    status: 1,
  },
  {
    sparse: true,
    name: "reviewer_assignments",
  }
);

performanceReviewSchema.index(
  {
    instituteId: 1,
    outcome: 1,
    completedAt: -1,
  },
  {
    sparse: true,
    name: "review_outcomes",
  }
);

performanceReviewSchema.index(
  {
    instituteId: 1,
    "promotion.recommended": 1,
    status: 1,
  },
  {
    sparse: true,
    name: "promotion_recommendations",
  }
);

performanceReviewSchema.index(
  {
    instituteId: 1,
    "salaryRevision.recommended": 1,
    status: 1,
  },
  {
    sparse: true,
    name: "salary_revision_recommendations",
  }
);

performanceReviewSchema.index(
  {
    instituteId: 1,
    "performanceImprovementPlan.enabled": 1,
    "performanceImprovementPlan.status": 1,
  },
  {
    sparse: true,
    name: "performance_improvement_plans",
  }
);

performanceReviewSchema.index(
  {
    instituteId: 1,
    isDeleted: 1,
    createdAt: -1,
  },
  {
    name: "active_performance_reviews",
  }
);

/* ============================================================================
 * VALIDATION
 * ========================================================================== */

performanceReviewSchema.pre(
  "validate",
  function (next) {
    if (
      this.period.startDate &&
      this.period.endDate &&
      this.period.endDate <
        this.period.startDate
    ) {
      return next(
        new Error(
          "Review period end date cannot be before start date"
        )
      );
    }

    if (
      this.dueAt &&
      this.scheduledAt &&
      this.dueAt <
        this.scheduledAt
    ) {
      return next(
        new Error(
          "Review due date cannot be before scheduled date"
        )
      );
    }

    if (
      this.reviewers.length >
      50
    ) {
      return next(
        new Error(
          "A performance review cannot have more than 50 reviewers"
        )
      );
    }

    if (
      this.competencies.length >
      200
    ) {
      return next(
        new Error(
          "A performance review cannot have more than 200 competencies"
        )
      );
    }

    if (
      this.goals.length >
      200
    ) {
      return next(
        new Error(
          "A performance review cannot have more than 200 goals"
        )
      );
    }

    if (
      this.feedback.length >
      500
    ) {
      return next(
        new Error(
          "A performance review cannot have more than 500 feedback entries"
        )
      );
    }

    if (
      this.attachments.length >
      100
    ) {
      return next(
        new Error(
          "A performance review cannot have more than 100 attachments"
        )
      );
    }

    if (
      this.strengths.length >
      100
    ) {
      return next(
        new Error(
          "A performance review cannot have more than 100 strengths"
        )
      );
    }

    if (
      this.areasForImprovement.length >
      100
    ) {
      return next(
        new Error(
          "A performance review cannot have more than 100 improvement areas"
        )
      );
    }

    if (
      this.ratingScale ===
      "five"
    ) {
      this.maxRating = 5;
    } else if (
      this.ratingScale ===
      "ten"
    ) {
      this.maxRating = 10;
    } else if (
      this.ratingScale ===
      "hundred"
    ) {
      this.maxRating = 100;
    }

    if (
      this.overallRating !==
        null &&
      this.overallRating >
        this.maxRating
    ) {
      return next(
        new Error(
          "Overall rating cannot exceed maximum rating"
        )
      );
    }

    if (
      this.overallRating !==
        null &&
      this.overallRating <
        0
    ) {
      return next(
        new Error(
          "Overall rating cannot be negative"
        )
      );
    }

    if (
      this.overallRating !==
        null
    ) {
      this.normalizedRating =
        (
          this.overallRating /
          this.maxRating
        ) *
        100;
    }

    if (
      this.salaryRevision.proposedSalary !==
        null &&
      this.salaryRevision.currentSalary !==
        null &&
      this.salaryRevision.currentSalary >
        0
    ) {
      this.salaryRevision.increasePercentage =
        (
          (
            this.salaryRevision.proposedSalary -
            this.salaryRevision.currentSalary
          ) /
          this.salaryRevision.currentSalary
        ) *
        100;
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
      !this.cancelledAt
    ) {
      this.cancelledAt =
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

performanceReviewSchema.virtual(
  "isCompleted"
).get(function () {
  return [
    "completed",
    "acknowledged",
  ].includes(
    this.status
  );
});

performanceReviewSchema.virtual(
  "isPending"
).get(function () {
  return [
    "scheduled",
    "in_progress",
    "submitted",
    "under_review",
  ].includes(
    this.status
  );
});

performanceReviewSchema.virtual(
  "isOverdue"
).get(function () {
  if (
    !this.dueAt ||
    this.isCompleted
  ) {
    return false;
  }

  return (
    this.dueAt <
    new Date()
  );
});

performanceReviewSchema.virtual(
  "goalCompletionPercentage"
).get(function () {
  if (
    !this.goals.length
  ) {
    return 0;
  }

  return (
    this.goals.reduce(
      (
        total,
        goal
      ) =>
        total +
        goal.progress,
      0
    ) /
    this.goals.length
  );
});

performanceReviewSchema.virtual(
  "competencyCount"
).get(function () {
  return this.competencies.length;
});

performanceReviewSchema.virtual(
  "goalCount"
).get(function () {
  return this.goals.length;
});

performanceReviewSchema.virtual(
  "reviewerCount"
).get(function () {
  return this.reviewers.length;
});

/* ============================================================================
 * QUERY HELPERS
 * ========================================================================== */

performanceReviewSchema.query.byInstitute =
  function (
    instituteId
  ) {
    return this.where({
      instituteId,
      isDeleted: false,
    });
  };

performanceReviewSchema.query.byEmployee =
  function (
    employeeId
  ) {
    return this.where({
      employeeId,
      isDeleted: false,
    });
  };

performanceReviewSchema.query.active =
  function () {
    return this.where({
      status: {
        $nin: [
          "completed",
          "acknowledged",
          "cancelled",
          "archived",
        ],
      },
      isDeleted: false,
    });
  };

performanceReviewSchema.query.completed =
  function () {
    return this.where({
      status: {
        $in: [
          "completed",
          "acknowledged",
        ],
      },
      isDeleted: false,
    });
  };

performanceReviewSchema.query.overdue =
  function (
    date = new Date()
  ) {
    return this.where({
      status: {
        $nin: [
          "completed",
          "acknowledged",
          "cancelled",
          "archived",
        ],
      },
      dueAt: {
        $lt: date,
      },
      isDeleted: false,
    });
  };

/* ============================================================================
 * INSTANCE METHODS
 * ========================================================================== */

performanceReviewSchema.methods.schedule =
  async function ({
    scheduledAt = null,
    dueAt = null,
  } = {}) {
    if (
      this.status ===
        "completed" ||
      this.status ===
        "acknowledged"
    ) {
      throw new Error(
        "Completed review cannot be scheduled"
      );
    }

    if (
      scheduledAt
    ) {
      this.scheduledAt =
        scheduledAt;
    }

    if (
      dueAt
    ) {
      this.dueAt =
        dueAt;
    }

    this.status =
      "scheduled";

    return this.save();
  };

performanceReviewSchema.methods.start =
  async function () {
    if (
      ![
        "scheduled",
        "draft",
      ].includes(
        this.status
      )
    ) {
      throw new Error(
        "Review cannot be started from its current status"
      );
    }

    this.status =
      "in_progress";

    this.startedAt =
      this.startedAt ||
      new Date();

    return this.save();
  };

performanceReviewSchema.methods.submit =
  async function () {
    if (
      ![
        "in_progress",
        "draft",
      ].includes(
        this.status
      )
    ) {
      throw new Error(
        "Review cannot be submitted from its current status"
      );
    }

    this.status =
      "submitted";

    this.submittedAt =
      new Date();

    return this.save();
  };

performanceReviewSchema.methods.startReview =
  async function () {
    if (
      this.status !==
      "submitted"
    ) {
      throw new Error(
        "Only submitted reviews can enter review stage"
      );
    }

    this.status =
      "under_review";

    return this.save();
  };

performanceReviewSchema.methods.complete =
  async function ({
    outcome = null,
    outcomeComments = null,
  } = {}) {
    if (
      ![
        "submitted",
        "under_review",
        "in_progress",
      ].includes(
        this.status
      )
    ) {
      throw new Error(
        "Review cannot be completed from its current status"
      );
    }

    this.calculateScores();

    this.outcome =
      outcome;

    this.outcomeComments =
      outcomeComments;

    this.status =
      "completed";

    this.completedAt =
      new Date();

    return this.save();
  };

performanceReviewSchema.methods.acknowledge =
  async function ({
    comment = null,
  } = {}) {
    if (
      this.status !==
      "completed"
    ) {
      throw new Error(
        "Only completed reviews can be acknowledged"
      );
    }

    this.status =
      "acknowledged";

    this.employeeAcknowledged =
      true;

    this.acknowledgedAt =
      new Date();

    this.employeeAcknowledgementComment =
      comment;

    return this.save();
  };

performanceReviewSchema.methods.cancel =
  async function () {
    if (
      [
        "completed",
        "acknowledged",
      ].includes(
        this.status
      )
    ) {
      throw new Error(
        "Completed review cannot be cancelled"
      );
    }

    this.status =
      "cancelled";

    this.cancelledAt =
      new Date();

    return this.save();
  };

performanceReviewSchema.methods.archive =
  async function () {
    if (
      this.status ===
      "cancelled"
    ) {
      throw new Error(
        "Cancelled review cannot be archived"
      );
    }

    this.status =
      "archived";

    this.archivedAt =
      new Date();

    return this.save();
  };

performanceReviewSchema.methods.addReviewer =
  async function (
    reviewer
  ) {
    if (
      this.reviewers.length >=
      50
    ) {
      throw new Error(
        "Maximum reviewer limit reached"
      );
    }

    const exists =
      this.reviewers.some(
        (item) =>
          String(
            item.userId
          ) ===
          String(
            reviewer.userId
          ) &&
          item.type ===
            reviewer.type
      );

    if (
      exists
    ) {
      throw new Error(
        "Reviewer already assigned"
      );
    }

    this.reviewers.push(
      reviewer
    );

    return this.save();
  };

performanceReviewSchema.methods.submitReviewer =
  async function (
    reviewerId,
    {
      rating = null,
      comments = null,
    } = {}
  ) {
    const reviewer =
      this.reviewers.id(
        reviewerId
      );

    if (
      !reviewer
    ) {
      throw new Error(
        "Reviewer not found"
      );
    }

    reviewer.rating =
      rating;

    reviewer.comments =
      comments;

    reviewer.completed =
      true;

    reviewer.submittedAt =
      new Date();

    return this.save();
  };

performanceReviewSchema.methods.addCompetency =
  async function (
    competency
  ) {
    if (
      this.competencies.length >=
      200
    ) {
      throw new Error(
        "Maximum competency limit reached"
      );
    }

    this.competencies.push(
      competency
    );

    this.calculateScores();

    return this.save();
  };

performanceReviewSchema.methods.updateCompetency =
  async function (
    competencyId,
    updates = {}
  ) {
    const competency =
      this.competencies.id(
        competencyId
      );

    if (
      !competency
    ) {
      throw new Error(
        "Competency not found"
      );
    }

    const allowedFields = [
      "code",
      "name",
      "description",
      "category",
      "weight",
      "rating",
      "maxRating",
      "comments",
      "strengths",
      "improvements",
      "evidence",
      "metadata",
    ];

    for (
      const field of
        allowedFields
    ) {
      if (
        Object.prototype.hasOwnProperty.call(
          updates,
          field
        )
      ) {
        competency[field] =
          updates[field];
      }
    }

    this.calculateScores();

    return this.save();
  };

performanceReviewSchema.methods.addGoal =
  async function (
    goal
  ) {
    if (
      this.goals.length >=
      200
    ) {
      throw new Error(
        "Maximum goal limit reached"
      );
    }

    this.goals.push(
      goal
    );

    this.calculateScores();

    return this.save();
  };

performanceReviewSchema.methods.updateGoal =
  async function (
    goalId,
    updates = {}
  ) {
    const goal =
      this.goals.id(
        goalId
      );

    if (
      !goal
    ) {
      throw new Error(
        "Goal not found"
      );
    }

    const allowedFields = [
      "title",
      "description",
      "category",
      "ownerId",
      "employeeId",
      "startDate",
      "dueDate",
      "status",
      "progress",
      "weight",
      "targetValue",
      "actualValue",
      "unit",
      "rating",
      "comments",
      "completedAt",
      "evidence",
      "metadata",
    ];

    for (
      const field of
        allowedFields
    ) {
      if (
        Object.prototype.hasOwnProperty.call(
          updates,
          field
        )
      ) {
        goal[field] =
          updates[field];
      }
    }

    if (
      goal.progress >=
        100 &&
      !goal.completedAt
    ) {
      goal.completedAt =
        new Date();

      goal.status =
        "completed";
    }

    this.calculateScores();

    return this.save();
  };

performanceReviewSchema.methods.addFeedback =
  async function (
    feedback
  ) {
    if (
      this.feedback.length >=
      500
    ) {
      throw new Error(
        "Maximum feedback limit reached"
      );
    }

    this.feedback.push(
      feedback
    );

    return this.save();
  };

performanceReviewSchema.methods.calculateScores =
  function () {
    let competencyScore =
      0;

    let competencyWeight =
      0;

    for (
      const competency of
        this.competencies
    ) {
      if (
        competency.rating ===
          null ||
        competency.rating ===
          undefined
      ) {
        continue;
      }

      const normalized =
        (
          competency.rating /
          competency.maxRating
        ) *
        100;

      competencyScore +=
        normalized *
        (
          competency.weight ||
          0
        );

      competencyWeight +=
        competency.weight ||
        0;
    }

    this.competencyScore =
      competencyWeight >
      0
        ? competencyScore /
          competencyWeight
        : null;

    let goalScore =
      0;

    let goalWeight =
      0;

    for (
      const goal of
        this.goals
    ) {
      goalScore +=
        goal.progress *
        (
          goal.weight ||
          0
        );

      goalWeight +=
        goal.weight ||
        0;
    }

    this.goalScore =
      goalWeight >
      0
        ? goalScore /
          goalWeight
        : null;

    const competencyPart =
      this.competencyScore ??
      0;

    const goalPart =
      this.goalScore ??
      0;

    const competencyWeightTotal =
      this.competencies.reduce(
        (
          total,
          competency
        ) =>
          total +
          (
            competency.weight ||
            0
          ),
        0
      );

    const goalWeightTotal =
      this.goals.reduce(
        (
          total,
          goal
        ) =>
          total +
          (
            goal.weight ||
            0
          ),
        0
      );

    const totalWeight =
      competencyWeightTotal +
      goalWeightTotal;

    if (
      totalWeight >
      0
    ) {
      this.normalizedRating =
        (
          (
            competencyPart *
            competencyWeightTotal
          ) +
          (
            goalPart *
            goalWeightTotal
          )
        ) /
        totalWeight;

      this.overallRating =
        (
          this.normalizedRating /
          100
        ) *
        this.maxRating;
    }

    return this;
  };

performanceReviewSchema.methods.addStrength =
  async function (
    strength
  ) {
    if (
      this.strengths.length >=
      100
    ) {
      throw new Error(
        "Maximum strengths limit reached"
      );
    }

    this.strengths.push(
      strength
    );

    return this.save();
  };

performanceReviewSchema.methods.addImprovementArea =
  async function (
    improvement
  ) {
    if (
      this.areasForImprovement.length >=
      100
    ) {
      throw new Error(
        "Maximum improvement-area limit reached"
      );
    }

    this.areasForImprovement.push(
      improvement
    );

    return this.save();
  };

performanceReviewSchema.methods.addTag =
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

performanceReviewSchema.methods.removeTag =
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

performanceReviewSchema.methods.setLegalHold =
  async function (
    enabled = true
  ) {
    this.legalHold =
      enabled;

    return this.save();
  };

performanceReviewSchema.methods.softDelete =
  async function ({
    deletedBy = null,
    reason = null,
  } = {}) {
    if (
      this.legalHold
    ) {
      throw new Error(
        "Performance review is under legal hold"
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

performanceReviewSchema.methods.restore =
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

performanceReviewSchema.statics.findByCode =
  function (
    instituteId,
    reviewCode
  ) {
    return this.findOne({
      instituteId,
      reviewCode:
        String(
          reviewCode
        )
          .trim()
          .toUpperCase(),
      isDeleted: false,
    });
  };

performanceReviewSchema.statics.findEmployeeReviews =
  function (
    instituteId,
    employeeId,
    {
      status = null,
      type = null,
      limit = 100,
    } = {}
  ) {
    const query = {
      instituteId,
      employeeId,
      isDeleted: false,
    };

    if (
      status
    ) {
      query.status =
        status;
    }

    if (
      type
    ) {
      query.type =
        type;
    }

    return this.find(
      query
    )
      .sort({
        "period.endDate": -1,
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

performanceReviewSchema.statics.findPendingForManager =
  function (
    instituteId,
    managerId,
    limit = 100
  ) {
    return this.find({
      instituteId,
      managerId,
      status: {
        $in: [
          "scheduled",
          "in_progress",
          "submitted",
          "under_review",
        ],
      },
      isDeleted: false,
    })
      .sort({
        dueAt: 1,
        scheduledAt: 1,
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

performanceReviewSchema.statics.findOverdue =
  function (
    instituteId,
    date = new Date(),
    limit = 100
  ) {
    return this.find({
      instituteId,
      status: {
        $in: [
          "scheduled",
          "in_progress",
          "submitted",
          "under_review",
        ],
      },
      dueAt: {
        $lt: date,
      },
      isDeleted: false,
    })
      .sort({
        dueAt: 1,
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

performanceReviewSchema.statics.findCompleted =
  function (
    instituteId,
    {
      departmentId = null,
      type = null,
      limit = 100,
    } = {}
  ) {
    const query = {
      instituteId,
      status: {
        $in: [
          "completed",
          "acknowledged",
        ],
      },
      isDeleted: false,
    };

    if (
      departmentId
    ) {
      query.departmentId =
        departmentId;
    }

    if (
      type
    ) {
      query.type =
        type;
    }

    return this.find(
      query
    )
      .sort({
        completedAt: -1,
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

performanceReviewSchema.statics.findPromotionRecommendations =
  function (
    instituteId,
    limit = 100
  ) {
    return this.find({
      instituteId,
      "promotion.recommended":
        true,
      status: {
        $in: [
          "completed",
          "acknowledged",
        ],
      },
      isDeleted: false,
    })
      .sort({
        completedAt: -1,
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

performanceReviewSchema.statics.findSalaryRevisionRecommendations =
  function (
    instituteId,
    limit = 100
  ) {
    return this.find({
      instituteId,
      "salaryRevision.recommended":
        true,
      status: {
        $in: [
          "completed",
          "acknowledged",
        ],
      },
      isDeleted: false,
    })
      .sort({
        completedAt: -1,
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

performanceReviewSchema.statics.findActivePIPs =
  function (
    instituteId,
    limit = 100
  ) {
    return this.find({
      instituteId,
      "performanceImprovementPlan.enabled":
        true,
      "performanceImprovementPlan.status":
        "active",
      isDeleted: false,
    })
      .sort({
        "performanceImprovementPlan.endDate": 1,
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

performanceReviewSchema.statics.getEmployeeSummary =
  async function (
    instituteId,
    employeeId
  ) {
    const result =
      await this.aggregate([
        {
          $match: {
            instituteId:
              new mongoose.Types.ObjectId(
                instituteId
              ),
            employeeId:
              new mongoose.Types.ObjectId(
                employeeId
              ),
            status: {
              $in: [
                "completed",
                "acknowledged",
              ],
            },
            isDeleted: false,
          },
        },
        {
          $group: {
            _id: null,

            totalReviews: {
              $sum: 1,
            },

            averageRating: {
              $avg: "$normalizedRating",
            },

            highestRating: {
              $max: "$normalizedRating",
            },

            lowestRating: {
              $min: "$normalizedRating",
            },

            promotionRecommendations: {
              $sum: {
                $cond: [
                  "$promotion.recommended",
                  1,
                  0,
                ],
              },
            },

            salaryRevisionRecommendations: {
              $sum: {
                $cond: [
                  "$salaryRevision.recommended",
                  1,
                  0,
                ],
              },
            },

            pipRecommendations: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$outcome",
                      "pip_recommended",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            totalReviews: 1,
            averageRating: 1,
            highestRating: 1,
            lowestRating: 1,
            promotionRecommendations: 1,
            salaryRevisionRecommendations: 1,
            pipRecommendations: 1,
          },
        },
      ]);

    return (
      result[0] || {
        totalReviews: 0,
        averageRating: 0,
        highestRating: 0,
        lowestRating: 0,
        promotionRecommendations: 0,
        salaryRevisionRecommendations: 0,
        pipRecommendations: 0,
      }
    );
  };

/* ============================================================================
 * MODEL
 * ========================================================================== */

export const PerformanceReview =
  mongoose.models.PerformanceReview ||
  mongoose.model(
    "PerformanceReview",
    performanceReviewSchema
  );

export {
  REVIEW_STATUSES,
  REVIEW_TYPES,
  RATING_SCALES,
  REVIEWER_TYPES,
  GOAL_STATUSES,
  FEEDBACK_TYPES,
  REVIEW_OUTCOMES,
};
