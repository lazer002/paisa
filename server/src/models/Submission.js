// server/src/models/Submission.js

import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
  {
    _id: false,

    name: {
      type: String,
      trim: true,
      maxlength: 255,
      default: null,
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
      max: 100 * 1024 * 1024,
      default: 0,
    },

    mimeType: {
      type: String,
      trim: true,
      maxlength: 150,
      default: null,
    },
  }
);

const rubricScoreSchema = new mongoose.Schema(
  {
    _id: false,

    criterion: {
      type: String,
      trim: true,
      maxlength: 300,
      required: true,
    },

    points: {
      type: Number,
      min: 0,
      required: true,
    },

    maxPoints: {
      type: Number,
      min: 0,
      required: true,
    },

    comment: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },
  }
);

const submissionSchema = new mongoose.Schema(
  {
    /* ---------------------------------------------------------------------- */
    /* RELATIONSHIPS                                                           */
    /* ---------------------------------------------------------------------- */

    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
      index: true,
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    /* ---------------------------------------------------------------------- */
    /* GROUP WORK                                                              */
    /* ---------------------------------------------------------------------- */

    groupId: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    groupMembers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    /* ---------------------------------------------------------------------- */
    /* WORK                                                                     */
    /* ---------------------------------------------------------------------- */

    content: {
      type: String,
      trim: true,
      maxlength: 20000,
      default: null,
    },

    attachments: {
      type: [attachmentSchema],
      default: [],
      validate: {
        validator: (value) =>
          Array.isArray(value) && value.length <= 20,
        message: "A submission cannot contain more than 20 attachments",
      },
    },

    /* ---------------------------------------------------------------------- */
    /* TIMELINE                                                                */
    /* ---------------------------------------------------------------------- */

    submittedAt: {
      type: Date,
      default: null,
      index: true,
    },

    isLate: {
      type: Boolean,
      default: false,
      index: true,
    },

    latePenaltyApplied: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    attempt: {
      type: Number,
      min: 1,
      max: 100,
      default: 1,
    },

    status: {
      type: String,
      enum: {
        values: [
          "pending",
          "submitted",
          "graded",
          "returned",
          "missing",
        ],
        message: "Invalid submission status",
      },
      default: "pending",
      index: true,
    },

    /* ---------------------------------------------------------------------- */
    /* GRADING                                                                 */
    /* ---------------------------------------------------------------------- */

    score: {
      type: Number,
      min: 0,
      default: null,
    },

    maxScore: {
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

    rubricScores: {
      type: [rubricScoreSchema],
      default: [],
    },

    feedback: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },

    privateNotes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },

    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    gradedAt: {
      type: Date,
      default: null,
      index: true,
    },

    /* ---------------------------------------------------------------------- */
    /* ORIGINALITY / PLAGIARISM                                               */
    /* ---------------------------------------------------------------------- */

    originalityScore: {
      type: Number,
      min: 0,
      max: 100,
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
/* Indexes                                                                    */
/* -------------------------------------------------------------------------- */

submissionSchema.index(
  {
    assignmentId: 1,
    studentId: 1,
  },
  {
    unique: true,
    name: "submission_assignment_student_unique",
  }
);

submissionSchema.index({
  instituteId: 1,
  status: 1,
  createdAt: -1,
});

submissionSchema.index({
  instituteId: 1,
  studentId: 1,
  createdAt: -1,
});

submissionSchema.index({
  instituteId: 1,
  assignmentId: 1,
  status: 1,
});

submissionSchema.index({
  instituteId: 1,
  gradedBy: 1,
  gradedAt: -1,
});

/* -------------------------------------------------------------------------- */
/* Validation                                                                 */
/* -------------------------------------------------------------------------- */

submissionSchema.pre("validate", function (next) {
  if (
    this.score != null &&
    this.maxScore != null &&
    this.score > this.maxScore
  ) {
    return next(
      new Error("Score cannot exceed maximum score")
    );
  }

  if (
    this.rubricScores?.length &&
    this.rubricScores.some(
      (item) =>
        item.points > item.maxPoints
    )
  ) {
    return next(
      new Error(
        "Rubric points cannot exceed maximum points"
      )
    );
  }

  if (
    this.status === "graded" &&
    (this.score == null ||
      this.maxScore == null)
  ) {
    return next(
      new Error(
        "A graded submission must have a score and maximum score"
      )
    );
  }

  if (
    this.status === "graded" &&
    !this.gradedBy
  ) {
    return next(
      new Error(
        "A graded submission must have a grader"
      )
    );
  }

  next();
});

/* -------------------------------------------------------------------------- */
/* Percentage calculation                                                     */
/* -------------------------------------------------------------------------- */

submissionSchema.pre("save", function (next) {
  if (
    this.score != null &&
    this.maxScore != null &&
    this.maxScore > 0
  ) {
    this.percentage =
      Math.round(
        (this.score / this.maxScore) * 10000
      ) / 100;
  } else {
    this.percentage = null;
  }

  if (
    this.status === "graded" &&
    !this.gradedAt
  ) {
    this.gradedAt = new Date();
  }

  if (
    this.status === "submitted" &&
    !this.submittedAt
  ) {
    this.submittedAt = new Date();
  }

  next();
});

/* -------------------------------------------------------------------------- */
/* Query helpers                                                              */
/* -------------------------------------------------------------------------- */

submissionSchema.query.byInstitute =
  function (instituteId) {
    return this.where({
      instituteId,
    });
  };

submissionSchema.query.byStudent =
  function (studentId) {
    return this.where({
      studentId,
    });
  };

submissionSchema.query.byAssignment =
  function (assignmentId) {
    return this.where({
      assignmentId,
    });
  };

submissionSchema.query.graded =
  function () {
    return this.where({
      status: "graded",
    });
  };

submissionSchema.query.pending =
  function () {
    return this.where({
      status: "pending",
    });
  };

/* -------------------------------------------------------------------------- */
/* Virtuals                                                                   */
/* -------------------------------------------------------------------------- */

submissionSchema.virtual("hasGrade").get(
  function () {
    return (
      this.score != null &&
      this.maxScore != null
    );
  }
);

submissionSchema.virtual("isGraded").get(
  function () {
    return this.status === "graded";
  }
);

/* -------------------------------------------------------------------------- */
/* Instance methods                                                           */
/* -------------------------------------------------------------------------- */

submissionSchema.methods.grade = function ({
  score,
  maxScore = this.maxScore,
  feedback = null,
  privateNotes = null,
  gradedBy,
  rubricScores = [],
} = {}) {
  if (
    score == null ||
    maxScore == null
  ) {
    throw new Error(
      "Score and maxScore are required"
    );
  }

  if (score < 0 || score > maxScore) {
    throw new Error(
      "Score must be between 0 and maxScore"
    );
  }

  if (!gradedBy) {
    throw new Error(
      "gradedBy is required"
    );
  }

  this.score = score;
  this.maxScore = maxScore;
  this.feedback = feedback;
  this.privateNotes = privateNotes;
  this.gradedBy = gradedBy;
  this.gradedAt = new Date();
  this.rubricScores = rubricScores;
  this.status = "graded";

  this.percentage =
    Math.round(
      (score / maxScore) * 10000
    ) / 100;

  return this;
};

submissionSchema.methods.markSubmitted =
  function () {
    this.status = "submitted";
    this.submittedAt =
      this.submittedAt || new Date();

    return this;
  };

submissionSchema.methods.returnToStudent =
  function (feedback = null) {
    this.status = "returned";

    if (feedback !== null) {
      this.feedback = feedback;
    }

    return this;
  };

/* -------------------------------------------------------------------------- */
/* Model                                                                      */
/* -------------------------------------------------------------------------- */

export const Submission =
  mongoose.models.Submission ||
  mongoose.model(
    "Submission",
    submissionSchema
  );

export default Submission;