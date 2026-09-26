// server/src/models/Assignment.js

import mongoose from "mongoose";

const ASSIGNMENT_STATUS = [
  "draft",
  "published",
  "scheduled",
  "closed",
  "archived",
];

const GRADING_TYPES = [
  "points",
  "percentage",
  "letter",
  "pass_fail",
  "rubric",
  "mixed",
];

const ASSIGNMENT_TYPES = [
  "assignment",
  "homework",
  "classwork",
  "project",
  "practice",
  "lab",
  "case_study",
  "presentation",
  "research",
  "other",
];

const SUBMISSION_MODES = [
  "file",
  "text",
  "link",
  "file_and_text",
  "file_and_link",
  "mixed",
];

const ATTACHMENT_TYPES = [
  "document",
  "image",
  "video",
  "audio",
  "link",
  "other",
];

/**
 * ASSIGNMENT
 *
 * Assignment is intentionally designed as one of the core learning objects
 * of PAISA.
 *
 * Future systems can build on the same assignment:
 *
 * Assignment
 * ├── Students
 * ├── Submissions
 * ├── Rubrics
 * ├── Grades
 * ├── Tests / Questions
 * ├── AI-assisted evaluation
 * ├── Peer review
 * ├── Projects
 * ├── Points / XP
 * ├── Achievements
 * ├── Rankings
 * └── Leaderboards
 *
 * The assignment itself stores configuration and aggregate cache data.
 * Individual student attempts/submissions belong in Submission documents.
 */

const rubricCriterionSchema =
  new mongoose.Schema(
    {
      _id: false,

      criterion: {
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

      maxPoints: {
        type: Number,
        required: true,
        min: 0,
        max: 100000,
      },

      weight: {
        type: Number,
        min: 0,
        default: 1,
      },

      learningOutcome: {
        type: String,
        trim: true,
        maxlength: 200,
        default: null,
      },

      skill: {
        type: String,
        trim: true,
        maxlength: 150,
        default: null,
      },
    }
  );

const attachmentSchema =
  new mongoose.Schema(
    {
      _id: false,

      type: {
        type: String,
        enum: ATTACHMENT_TYPES,
        default: "document",
      },

      name: {
        type: String,
        trim: true,
        maxlength: 255,
        required: true,
      },

      url: {
        type: String,
        trim: true,
        maxlength: 2048,
        required: true,
      },

      sizeBytes: {
        type: Number,
        min: 0,
        default: null,
      },

      mimeType: {
        type: String,
        trim: true,
        maxlength: 150,
        default: null,
      },

      durationSeconds: {
        type: Number,
        min: 0,
        default: null,
      },

      thumbnailUrl: {
        type: String,
        trim: true,
        maxlength: 2048,
        default: null,
      },
    }
  );

const assignmentSchema =
  new mongoose.Schema(
    {
      /* -------------------------------------------------------------------- */
      /* TENANCY / OWNERSHIP                                                   */
      /* -------------------------------------------------------------------- */

      classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class",
        required: true,
        index: true,
      },

      instituteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
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

      /* -------------------------------------------------------------------- */
      /* BASIC INFORMATION                                                     */
      /* -------------------------------------------------------------------- */

      title: {
        type: String,
        required: [
          true,
          "Assignment title is required",
        ],
        trim: true,
        minlength: 2,
        maxlength: 200,
      },

      description: {
        type: String,
        trim: true,
        maxlength: 5000,
        default: null,
      },

      instructions: {
        type: String,
        trim: true,
        maxlength: 10000,
        default: null,
      },

      assignmentType: {
        type: String,
        enum: ASSIGNMENT_TYPES,
        default: "assignment",
        index: true,
      },

      tags: [
        {
          type: String,
          trim: true,
          lowercase: true,
          maxlength: 50,
        },
      ],

      /* -------------------------------------------------------------------- */
      /* AVAILABILITY / SCHEDULING                                             */
      /* -------------------------------------------------------------------- */

      availableFrom: {
        type: Date,
        default: null,
      },

      dueDate: {
        type: Date,
        default: null,
        index: true,
      },

      lateSubmissionUntil: {
        type: Date,
        default: null,
      },

      allowLateSubmission: {
        type: Boolean,
        default: true,
      },

      latePenaltyPercent: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },

      latePenaltyType: {
        type: String,
        enum: [
          "percentage",
          "fixed_points",
          "none",
        ],
        default: "percentage",
      },

      /* -------------------------------------------------------------------- */
      /* SUBMISSION CONFIGURATION                                              */
      /* -------------------------------------------------------------------- */

      submissionMode: {
        type: String,
        enum: SUBMISSION_MODES,
        default: "file_and_text",
      },

      allowedFileTypes: [
        {
          type: String,
          trim: true,
          lowercase: true,
          maxlength: 100,
        },
      ],

      maxFileSizeMb: {
        type: Number,
        min: 0,
        max: 2048,
        default: 50,
      },

      maxAttachments: {
        type: Number,
        min: 0,
        max: 100,
        default: 10,
      },

      minimumTextLength: {
        type: Number,
        min: 0,
        default: 0,
      },

      plagiarismCheck: {
        enabled: {
          type: Boolean,
          default: false,
        },

        threshold: {
          type: Number,
          min: 0,
          max: 100,
          default: 20,
        },
      },

      /* -------------------------------------------------------------------- */
      /* GRADING                                                                */
      /* -------------------------------------------------------------------- */

      maxScore: {
        type: Number,
        default: 100,
        min: 1,
        max: 100000,
      },

      passingScore: {
        type: Number,
        min: 0,
        max: 100000,
        default: null,
      },

      weight: {
        type: Number,
        min: 0,
        max: 1000,
        default: 1,
      },

      gradingType: {
        type: String,
        enum: GRADING_TYPES,
        default: "points",
      },

      allowNegativeMarking: {
        type: Boolean,
        default: false,
      },

      negativeMarkPerQuestion: {
        type: Number,
        min: 0,
        default: 0,
      },

      /* -------------------------------------------------------------------- */
      /* RUBRIC                                                                  */
      /* -------------------------------------------------------------------- */

      rubric: {
        type: [rubricCriterionSchema],
        default: [],
      },

      rubricTotalPoints: {
        type: Number,
        min: 0,
        default: 0,
      },

      /* -------------------------------------------------------------------- */
      /* ATTACHMENTS                                                            */
      /* -------------------------------------------------------------------- */

      attachments: {
        type: [attachmentSchema],
        default: [],
      },

      /* -------------------------------------------------------------------- */
      /* RESUBMISSION                                                           */
      /* -------------------------------------------------------------------- */

      resubmissionAllowed: {
        type: Boolean,
        default: true,
      },

      maxResubmissions: {
        type: Number,
        min: 0,
        max: 100,
        default: 2,
      },

      /* -------------------------------------------------------------------- */
      /* GROUP WORK                                                             */
      /* -------------------------------------------------------------------- */

      isGroupAssignment: {
        type: Boolean,
        default: false,
      },

      groupSize: {
        type: Number,
        min: 2,
        max: 100,
        default: null,
      },

      groupSubmissionMode: {
        type: String,
        enum: [
          "one_per_group",
          "individual",
        ],
        default: "one_per_group",
      },

      /* -------------------------------------------------------------------- */
      /* PEER REVIEW                                                            */
      /* -------------------------------------------------------------------- */

      peerReview: {
        enabled: {
          type: Boolean,
          default: false,
        },

        reviewsPerSubmission: {
          type: Number,
          min: 1,
          max: 20,
          default: 1,
        },

        anonymous: {
          type: Boolean,
          default: true,
        },

        gradingWeight: {
          type: Number,
          min: 0,
          max: 100,
          default: 0,
        },
      },

      /* -------------------------------------------------------------------- */
      /* AI / AUTOMATION READY                                                  */
      /* -------------------------------------------------------------------- */

      aiEvaluation: {
        enabled: {
          type: Boolean,
          default: false,
        },

        assistOnly: {
          type: Boolean,
          default: true,
        },

        rubricSuggested: {
          type: Boolean,
          default: false,
        },

        feedbackSuggested: {
          type: Boolean,
          default: false,
        },

        lastProcessedAt: {
          type: Date,
          default: null,
        },
      },

      /* -------------------------------------------------------------------- */
      /* GAMIFICATION                                                           */
      /* -------------------------------------------------------------------- */

      gamification: {
        enabled: {
          type: Boolean,
          default: false,
        },

        xpReward: {
          type: Number,
          min: 0,
          default: 0,
        },

        pointsReward: {
          type: Number,
          min: 0,
          default: 0,
        },

        bonusOnTime: {
          type: Number,
          min: 0,
          default: 0,
        },

        bonusOnFullScore: {
          type: Number,
          min: 0,
          default: 0,
        },

        achievementEligible: {
          type: Boolean,
          default: true,
        },
      },

      /* -------------------------------------------------------------------- */
      /* VISIBILITY / WORKFLOW                                                  */
      /* -------------------------------------------------------------------- */

      status: {
        type: String,
        enum: {
          values: ASSIGNMENT_STATUS,
          message: "Invalid assignment status",
        },
        default: "published",
        index: true,
      },

      publishedAt: {
        type: Date,
        default: null,
      },

      closedAt: {
        type: Date,
        default: null,
      },

      archivedAt: {
        type: Date,
        default: null,
      },

      /* -------------------------------------------------------------------- */
      /* STATS CACHE                                                            */
      /* -------------------------------------------------------------------- */

      stats: {
        totalStudents: {
          type: Number,
          min: 0,
          default: 0,
        },

        submitted: {
          type: Number,
          min: 0,
          default: 0,
        },

        graded: {
          type: Number,
          min: 0,
          default: 0,
        },

        pending: {
          type: Number,
          min: 0,
          default: 0,
        },

        lateSubmissions: {
          type: Number,
          min: 0,
          default: 0,
        },

        resubmissions: {
          type: Number,
          min: 0,
          default: 0,
        },

        averageScore: {
          type: Number,
          min: 0,
          default: null,
        },

        averagePercentage: {
          type: Number,
          min: 0,
          max: 100,
          default: null,
        },

        averageCompletionTimeMinutes: {
          type: Number,
          min: 0,
          default: null,
        },

        lastComputedAt: {
          type: Date,
          default: null,
        },
      },

      /* -------------------------------------------------------------------- */
      /* SOFT DELETE                                                            */
      /* -------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* INDEXES                                                                    */
/* -------------------------------------------------------------------------- */

assignmentSchema.index(
  {
    instituteId: 1,
    status: 1,
  },
  {
    name: "assignment_institute_status",
  }
);

assignmentSchema.index(
  {
    instituteId: 1,
    classId: 1,
    dueDate: 1,
  },
  {
    name: "assignment_class_due_date",
  }
);

assignmentSchema.index(
  {
    classId: 1,
    createdAt: -1,
  },
  {
    name: "assignment_class_created",
  }
);

assignmentSchema.index(
  {
    instituteId: 1,
    assignmentType: 1,
    status: 1,
  },
  {
    name: "assignment_type_status",
  }
);

assignmentSchema.index(
  {
    createdBy: 1,
    createdAt: -1,
  },
  {
    name: "assignment_creator_history",
  }
);

assignmentSchema.index(
  {
    instituteId: 1,
    isDeleted: 1,
  },
  {
    name: "assignment_institute_deleted",
  }
);

/* -------------------------------------------------------------------------- */
/* VALIDATION                                                                 */
/* -------------------------------------------------------------------------- */

assignmentSchema.pre(
  "validate",
  function (next) {
    if (
      this.availableFrom &&
      this.dueDate &&
      this.dueDate <
        this.availableFrom
    ) {
      return next(
        new Error(
          "Due date cannot be before availability date"
        )
      );
    }

    if (
      this.dueDate &&
      this.lateSubmissionUntil &&
      this.lateSubmissionUntil <
        this.dueDate
    ) {
      return next(
        new Error(
          "Late submission deadline cannot be before due date"
        )
      );
    }

    if (
      this.passingScore != null &&
      this.passingScore >
        this.maxScore
    ) {
      return next(
        new Error(
          "Passing score cannot exceed maximum score"
        )
      );
    }

    if (
      this.allowNegativeMarking &&
      this.negativeMarkPerQuestion <= 0
    ) {
      return next(
        new Error(
          "Negative marking value must be greater than zero"
        )
      );
    }

    if (
      this.isGroupAssignment &&
      (!this.groupSize ||
        this.groupSize < 2)
    ) {
      return next(
        new Error(
          "Group assignments require a group size of at least 2"
        )
      );
    }

    if (
      !this.isGroupAssignment
    ) {
      this.groupSize = null;
    }

    if (
      this.peerReview?.enabled &&
      this.peerReview.reviewsPerSubmission < 1
    ) {
      return next(
        new Error(
          "Peer review requires at least one reviewer"
        )
      );
    }

    const rubricTotal =
      (this.rubric || []).reduce(
        (total, criterion) =>
          total +
          (Number(
            criterion.maxPoints
          ) || 0),
        0
      );

    this.rubricTotalPoints =
      rubricTotal;

    if (
      this.rubric.length > 0 &&
      rubricTotal <= 0
    ) {
      return next(
        new Error(
          "Rubric must contain positive points"
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
      this.status === "closed" &&
      !this.closedAt
    ) {
      this.closedAt =
        new Date();
    }

    if (
      this.status === "archived" &&
      !this.archivedAt
    ) {
      this.archivedAt =
        new Date();
    }

    next();
  }
);

/* -------------------------------------------------------------------------- */
/* VIRTUALS                                                                   */
/* -------------------------------------------------------------------------- */

assignmentSchema.virtual(
  "isOverdue"
).get(function () {
  return Boolean(
    this.dueDate &&
      this.dueDate <
        new Date() &&
      this.status ===
        "published"
  );
});

assignmentSchema.virtual(
  "isOpen"
).get(function () {
  if (
    this.isDeleted ||
    ![
      "published",
      "scheduled",
    ].includes(
      this.status
    )
  ) {
    return false;
  }

  const now = new Date();

  if (
    this.availableFrom &&
    this.availableFrom > now
  ) {
    return false;
  }

  if (
    this.dueDate &&
    this.dueDate < now
  ) {
    if (
      !this.allowLateSubmission
    ) {
      return false;
    }

    if (
      this.lateSubmissionUntil &&
      this.lateSubmissionUntil <
        now
    ) {
      return false;
    }
  }

  return true;
});

assignmentSchema.virtual(
  "hasRubric"
).get(function () {
  return (
    Array.isArray(
      this.rubric
    ) &&
    this.rubric.length > 0
  );
});

assignmentSchema.virtual(
  "submissionDeadline"
).get(function () {
  if (
    this.allowLateSubmission &&
    this.lateSubmissionUntil
  ) {
    return this.lateSubmissionUntil;
  }

  return this.dueDate;
});

assignmentSchema.virtual(
  "completionRate"
).get(function () {
  const total =
    this.stats?.totalStudents ||
    0;

  if (!total) {
    return 0;
  }

  return Math.round(
    ((this.stats.submitted || 0) /
      total) *
      100
  );
});

assignmentSchema.virtual(
  "gradingRate"
).get(function () {
  const submitted =
    this.stats?.submitted ||
    0;

  if (!submitted) {
    return 0;
  }

  return Math.round(
    ((this.stats.graded || 0) /
      submitted) *
      100
  );
});

/* -------------------------------------------------------------------------- */
/* QUERY HELPERS                                                              */
/* -------------------------------------------------------------------------- */

assignmentSchema.query.byInstitute =
  function (instituteId) {
    return this.where({
      instituteId,
      isDeleted: false,
    });
  };

assignmentSchema.query.byClass =
  function (classId) {
    return this.where({
      classId,
      isDeleted: false,
    });
  };

assignmentSchema.query.published =
  function () {
    return this.where({
      status: "published",
      isDeleted: false,
    });
  };

assignmentSchema.query.open =
  function () {
    const now =
      new Date();

    return this.where({
      isDeleted: false,
      status: {
        $in: [
          "published",
          "scheduled",
        ],
      },
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
    });
  };

/* -------------------------------------------------------------------------- */
/* INSTANCE METHODS                                                           */
/* -------------------------------------------------------------------------- */

assignmentSchema.methods.publish =
  async function (
    byUserId = null
  ) {
    if (
      this.status === "archived"
    ) {
      throw new Error(
        "Archived assignment cannot be published"
      );
    }

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

assignmentSchema.methods.close =
  async function (
    byUserId = null
  ) {
    if (
      this.status === "archived"
    ) {
      throw new Error(
        "Archived assignment cannot be closed"
      );
    }

    this.status =
      "closed";

    this.closedAt =
      new Date();

    if (byUserId) {
      this.updatedBy =
        byUserId;
    }

    return this.save();
  };

assignmentSchema.methods.archive =
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

assignmentSchema.methods.reopen =
  async function (
    byUserId = null
  ) {
    if (
      this.status === "archived"
    ) {
      throw new Error(
        "Archived assignment cannot be reopened"
      );
    }

    this.status =
      "published";

    this.closedAt =
      null;

    if (byUserId) {
      this.updatedBy =
        byUserId;
    }

    return this.save();
  };

assignmentSchema.methods.softDelete =
  async function (
    byUserId = null
  ) {
    this.isDeleted = true;
    this.deletedAt =
      new Date();

    if (byUserId) {
      this.updatedBy =
        byUserId;
    }

    return this.save();
  };

/* -------------------------------------------------------------------------- */
/* STATS METHODS                                                              */
/* -------------------------------------------------------------------------- */

assignmentSchema.methods.updateStats =
  function ({
    totalStudents,
    submitted,
    graded,
    pending,
    lateSubmissions,
    resubmissions,
    averageScore,
    averagePercentage,
    averageCompletionTimeMinutes,
  } = {}) {
    if (
      totalStudents != null
    ) {
      this.stats.totalStudents =
        Math.max(
          0,
          Number(totalStudents)
        );
    }

    if (
      submitted != null
    ) {
      this.stats.submitted =
        Math.max(
          0,
          Number(submitted)
        );
    }

    if (
      graded != null
    ) {
      this.stats.graded =
        Math.max(
          0,
          Number(graded)
        );
    }

    if (
      pending != null
    ) {
      this.stats.pending =
        Math.max(
          0,
          Number(pending)
        );
    }

    if (
      lateSubmissions != null
    ) {
      this.stats.lateSubmissions =
        Math.max(
          0,
          Number(lateSubmissions)
        );
    }

    if (
      resubmissions != null
    ) {
      this.stats.resubmissions =
        Math.max(
          0,
          Number(resubmissions)
        );
    }

    if (
      averageScore != null
    ) {
      this.stats.averageScore =
        Math.max(
          0,
          Number(averageScore)
        );
    }

    if (
      averagePercentage != null
    ) {
      this.stats.averagePercentage =
        Math.min(
          100,
          Math.max(
            0,
            Number(
              averagePercentage
            )
          )
        );
    }

    if (
      averageCompletionTimeMinutes !=
      null
    ) {
      this.stats.averageCompletionTimeMinutes =
        Math.max(
          0,
          Number(
            averageCompletionTimeMinutes
          )
        );
    }

    this.stats.lastComputedAt =
      new Date();

    return this;
  };

/* -------------------------------------------------------------------------- */
/* MODEL                                                                      */
/* -------------------------------------------------------------------------- */

export const Assignment =
  mongoose.models.Assignment ||
  mongoose.model(
    "Assignment",
    assignmentSchema
  );

export {
  ASSIGNMENT_STATUS,
  GRADING_TYPES,
  ASSIGNMENT_TYPES,
  SUBMISSION_MODES,
};