// server/src/models/Question.js

import mongoose from "mongoose";

import crypto from "node:crypto";
const QUESTION_TYPES = [
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
];

const QUESTION_DIFFICULTIES = [
  "very_easy",
  "easy",
  "medium",
  "hard",
  "very_hard",
];

const QUESTION_STATUS = [
  "draft",
  "active",
  "inactive",
  "archived",
  "review",
];

const QUESTION_VISIBILITY = [
  "private",
  "institute",
  "public",
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

const OPTION_SCHEMA = new mongoose.Schema(
  {
    _id: false,

    key: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 10,
    },

    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },

    imageUrl: {
      type: String,
      trim: true,
      maxlength: 2048,
      default: null,
    },

    isCorrect: {
      type: Boolean,
      default: false,
    },

    explanation: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: null,
    },

    order: {
      type: Number,
      min: 0,
      default: 0,
    },

    disabled: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  }
);

const answerSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ANSWER_TYPES,
      default: "text",
    },

    acceptedValues: {
      type: [
        {
          type: String,
          maxlength: 2000,
        },
      ],
      default: [],
    },

    acceptedOptions: {
      type: [
        {
          type: String,
          maxlength: 20,
        },
      ],
      default: [],
    },

    numericRange: {
      min: {
        type: Number,
        default: null,
      },

      max: {
        type: Number,
        default: null,
      },

      tolerance: {
        type: Number,
        min: 0,
        default: 0,
      },
    },

    caseSensitive: {
      type: Boolean,
      default: false,
    },

    trimWhitespace: {
      type: Boolean,
      default: true,
    },

    partialCredit: {
      type: Boolean,
      default: false,
    },

    explanation: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: null,
    },
  },
  {
    _id: false,
  }
);

const rubricSchema = new mongoose.Schema(
  {
    _id: false,

    criterion: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },

    maxPoints: {
      type: Number,
      min: 0,
      required: true,
    },

    learningOutcome: {
      type: String,
      trim: true,
      maxlength: 300,
      default: null,
    },

    skill: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
    },

    order: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    _id: false,
  }
);

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
        "image",
        "document",
        "audio",
        "video",
        "other",
      ],
      default: "document",
    },
  },
  {
    _id: false,
  }
);

const codeExecutionSchema = new mongoose.Schema(
  {
    enabled: {
      type: Boolean,
      default: false,
    },

    language: {
      type: String,
      trim: true,
      maxlength: 50,
      default: null,
    },

    allowedLanguages: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: 50,
        },
      ],
      default: [],
    },

    timeLimitMs: {
      type: Number,
      min: 100,
      max: 600000,
      default: 2000,
    },

    memoryLimitMb: {
      type: Number,
      min: 16,
      max: 4096,
      default: 256,
    },

    testCaseCount: {
      type: Number,
      min: 0,
      default: 0,
    },

    hiddenTestCases: {
      type: Boolean,
      default: true,
    },
  },
  {
    _id: false,
  }
);

const analyticsSchema = new mongoose.Schema(
  {
    attempts: {
      type: Number,
      min: 0,
      default: 0,
    },

    correctAttempts: {
      type: Number,
      min: 0,
      default: 0,
    },

    incorrectAttempts: {
      type: Number,
      min: 0,
      default: 0,
    },

    skippedAttempts: {
      type: Number,
      min: 0,
      default: 0,
    },

    averageScore: {
      type: Number,
      min: 0,
      default: 0,
    },

    averageTimeSeconds: {
      type: Number,
      min: 0,
      default: 0,
    },

    difficultyIndex: {
      type: Number,
      min: 0,
      max: 1,
      default: null,
    },

    discriminationIndex: {
      type: Number,
      min: -1,
      max: 1,
      default: null,
    },

    skipRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    correctRate: {
      type: Number,
      min: 0,
      max: 100,
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

const questionSchema = new mongoose.Schema(
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
    `ques_${crypto.randomBytes(16).toString("base64url")}`,
},
    /* ====================================================================== */
    /* OWNERSHIP                                                              */
    /* ====================================================================== */

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

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /* ====================================================================== */
    /* IDENTITY                                                               */
    /* ====================================================================== */

    questionCode: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 100,
      default: null,
      index: true,
    },

    title: {
      type: String,
      trim: true,
      maxlength: 300,
      default: null,
    },

    text: {
      type: String,
      required: [
        true,
        "Question text is required",
      ],
      trim: true,
      maxlength: 20000,
    },

    explanation: {
      type: String,
      trim: true,
      maxlength: 10000,
      default: null,
    },

    type: {
      type: String,
      enum: QUESTION_TYPES,
      required: true,
      index: true,
    },

    difficulty: {
      type: String,
      enum: QUESTION_DIFFICULTIES,
      default: "medium",
      index: true,
    },

    status: {
      type: String,
      enum: QUESTION_STATUS,
      default: "draft",
      index: true,
    },

    visibility: {
      type: String,
      enum: QUESTION_VISIBILITY,
      default: "private",
    },

    /* ====================================================================== */
    /* EDUCATION CONTEXT                                                       */
    /* ====================================================================== */

    subject: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
      index: true,
    },

    topic: {
      type: String,
      trim: true,
      maxlength: 300,
      default: null,
      index: true,
    },

    subtopic: {
      type: String,
      trim: true,
      maxlength: 300,
      default: null,
    },

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

    /* ====================================================================== */
    /* TAXONOMY                                                                */
    /* ====================================================================== */

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

    bloomLevel: {
      type: String,
      enum: [
        "remember",
        "understand",
        "apply",
        "analyze",
        "evaluate",
        "create",
      ],
      default: null,
    },

    competency: {
      type: String,
      trim: true,
      maxlength: 300,
      default: null,
    },

    /* ====================================================================== */
    /* SCORING                                                                 */
    /* ====================================================================== */

    marks: {
      type: Number,
      min: 0,
      max: 100000,
      default: 1,
    },

    negativeMarks: {
      type: Number,
      min: 0,
      max: 100000,
      default: 0,
    },

    partialCredit: {
      type: Boolean,
      default: false,
    },

    timeLimitSeconds: {
      type: Number,
      min: 0,
      max: 86400,
      default: null,
    },

    /* ====================================================================== */
    /* OPTIONS / ANSWERS                                                       */
    /* ====================================================================== */

    options: {
      type: [OPTION_SCHEMA],
      default: [],
    },

    answer: {
      type: answerSchema,
      default: () => ({}),
    },

    /* ====================================================================== */
    /* RUBRIC                                                                   */
    /* ====================================================================== */

    rubric: {
      type: [rubricSchema],
      default: [],
    },

    rubricTotalPoints: {
      type: Number,
      min: 0,
      default: 0,
    },

    /* ====================================================================== */
    /* CODING                                                                  */
    /* ====================================================================== */

    codeExecution: {
      type: codeExecutionSchema,
      default: () => ({}),
    },

    /* ====================================================================== */
    /* MEDIA                                                                   */
    /* ====================================================================== */

    attachments: {
      type: [attachmentSchema],
      default: [],
    },

    imageUrl: {
      type: String,
      trim: true,
      maxlength: 2048,
      default: null,
    },

    videoUrl: {
      type: String,
      trim: true,
      maxlength: 2048,
      default: null,
    },

    audioUrl: {
      type: String,
      trim: true,
      maxlength: 2048,
      default: null,
    },

    /* ====================================================================== */
    /* CASE STUDY / STRUCTURED CONTENT                                         */
    /* ====================================================================== */

    caseStudy: {
      title: {
        type: String,
        trim: true,
        maxlength: 500,
        default: null,
      },

      content: {
        type: String,
        trim: true,
        maxlength: 30000,
        default: null,
      },

      attachments: {
        type: [attachmentSchema],
        default: [],
      },
    },

    /* ====================================================================== */
    /* QUESTION BANK                                                           */
    /* ====================================================================== */

    bank: {
      name: {
        type: String,
        trim: true,
        maxlength: 300,
        default: null,
      },

      category: {
        type: String,
        trim: true,
        maxlength: 200,
        default: null,
      },

      version: {
        type: Number,
        min: 1,
        default: 1,
      },

      parentQuestionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
        default: null,
      },
    },

    /* ====================================================================== */
    /* AI / ASSISTED CONTENT                                                   */
    /* ====================================================================== */

    ai: {
      generated: {
        type: Boolean,
        default: false,
      },

      assisted: {
        type: Boolean,
        default: false,
      },

      provider: {
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

      generationVersion: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      reviewedByHuman: {
        type: Boolean,
        default: false,
      },

      confidence: {
        type: Number,
        min: 0,
        max: 1,
        default: null,
      },
    },

    /* ====================================================================== */
    /* ANALYTICS                                                               */
    /* ====================================================================== */

    analytics: {
      type: analyticsSchema,
      default: () => ({}),
    },

    /* ====================================================================== */
    /* LIFECYCLE                                                               */
    /* ====================================================================== */

    publishedAt: {
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

questionSchema.index(
  {
    instituteId: 1,
    questionCode: 1,
  },
  {
    name: "question_code",
    unique: true,
    sparse: true,
  }
);

questionSchema.index(
  {
    instituteId: 1,
    status: 1,
    type: 1,
    createdAt: -1,
  },
  {
    name: "question_bank_status",
  }
);

questionSchema.index(
  {
    instituteId: 1,
    subject: 1,
    topic: 1,
    difficulty: 1,
  },
  {
    name: "question_taxonomy",
  }
);

questionSchema.index(
  {
    instituteId: 1,
    classId: 1,
    status: 1,
  },
  {
    name: "question_class",
    sparse: true,
  }
);

questionSchema.index(
  {
    instituteId: 1,
    courseId: 1,
    status: 1,
  },
  {
    name: "question_course",
    sparse: true,
  }
);

questionSchema.index(
  {
    instituteId: 1,
    "bank.name": 1,
    status: 1,
  },
  {
    name: "question_bank_name",
  }
);

questionSchema.index(
  {
    instituteId: 1,
    tags: 1,
  },
  {
    name: "question_tags",
  }
);

questionSchema.index(
  {
    instituteId: 1,
    skills: 1,
  },
  {
    name: "question_skills",
  }
);

/*
 * Text search for question-bank discovery.
 */
questionSchema.index(
  {
    text: "text",
    title: "text",
    explanation: "text",
    subject: "text",
    topic: "text",
  },
  {
    name: "question_text_search",
    weights: {
      title: 10,
      text: 8,
      subject: 5,
      topic: 5,
      explanation: 2,
    },
  }
);

/* ============================================================================
 * VALIDATION
 * ========================================================================== */

questionSchema.pre(
  "validate",
  function (next) {
    const optionTypes = [
      "single_choice",
      "multiple_choice",
      "true_false",
    ];

    if (
      optionTypes.includes(
        this.type
      ) &&
      this.options.length === 0
    ) {
      return next(
        new Error(
          "Choice-based questions require options"
        )
      );
    }

    if (
      this.type ===
        "single_choice" &&
      this.options.filter(
        (option) =>
          option.isCorrect
      ).length !== 1
    ) {
      return next(
        new Error(
          "Single-choice questions must have exactly one correct option"
        )
      );
    }

    if (
      this.type ===
        "multiple_choice" &&
      this.options.filter(
        (option) =>
          option.isCorrect
      ).length < 1
    ) {
      return next(
        new Error(
          "Multiple-choice questions must have at least one correct option"
        )
      );
    }

    if (
      this.type ===
        "true_false"
    ) {
      if (
        this.options.length !==
        2
      ) {
        return next(
          new Error(
            "True/false questions must contain exactly two options"
          )
        );
      }
    }

    if (
      this.type ===
        "coding" &&
      !this.codeExecution.enabled
    ) {
      return next(
        new Error(
          "Coding questions require code execution configuration"
        )
      );
    }

    if (
      this.type ===
        "file_upload" &&
      this.attachments.length >
        0 &&
      this.attachments.length >
        20
    ) {
      return next(
        new Error(
          "Too many question attachments"
        )
      );
    }

    const correctOptions =
      this.options.filter(
        (option) =>
          option.isCorrect
      );

    if (
      correctOptions.some(
        (option) =>
          !option.key ||
          !option.text
      )
    ) {
      return next(
        new Error(
          "Every question option requires a key and text"
        )
      );
    }

    const keys =
      this.options.map(
        (option) =>
          option.key
      );

    if (
      new Set(keys).size !==
      keys.length
    ) {
      return next(
        new Error(
          "Question option keys must be unique"
        )
      );
    }

    const rubricTotal =
      this.rubric.reduce(
        (total, item) =>
          total +
          Number(
            item.maxPoints || 0
          ),
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
      this.tags.length >
      50
    ) {
      return next(
        new Error(
          "A question cannot contain more than 50 tags"
        )
      );
    }

    if (
      this.skills.length >
      50
    ) {
      return next(
        new Error(
          "A question cannot contain more than 50 skills"
        )
      );
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

questionSchema.virtual(
  "isActive"
).get(function () {
  return (
    this.status ===
      "active" &&
    !this.isDeleted
  );
});

questionSchema.virtual(
  "isChoiceQuestion"
).get(function () {
  return [
    "single_choice",
    "multiple_choice",
    "true_false",
  ].includes(this.type);
});

questionSchema.virtual(
  "isManuallyGraded"
).get(function () {
  return [
    "long_answer",
    "file_upload",
    "audio",
    "video",
    "case_study",
    "coding",
  ].includes(this.type);
});

questionSchema.virtual(
  "correctRate"
).get(function () {
  return (
    this.analytics
      ?.correctRate || 0
  );
});

/* ============================================================================
 * QUERY HELPERS
 * ========================================================================== */

questionSchema.query.byInstitute =
  function (
    instituteId
  ) {
    return this.where({
      instituteId,
      isDeleted: false,
    });
  };

questionSchema.query.active =
  function () {
    return this.where({
      status: "active",
      isDeleted: false,
    });
  };

questionSchema.query.bySubject =
  function (
    subject
  ) {
    return this.where({
      subject,
      isDeleted: false,
    });
  };

questionSchema.query.byTopic =
  function (
    topic
  ) {
    return this.where({
      topic,
      isDeleted: false,
    });
  };

questionSchema.query.byDifficulty =
  function (
    difficulty
  ) {
    return this.where({
      difficulty,
      isDeleted: false,
    });
  };

/* ============================================================================
 * INSTANCE METHODS
 * ========================================================================== */

questionSchema.methods.activate =
  async function (
    byUserId = null
  ) {
    this.status =
      "active";

    this.publishedAt =
      this.publishedAt ||
      new Date();

    if (byUserId) {
      this.updatedBy =
        byUserId;
    }

    return this.save();
  };

questionSchema.methods.deactivate =
  async function (
    byUserId = null
  ) {
    this.status =
      "inactive";

    if (byUserId) {
      this.updatedBy =
        byUserId;
    }

    return this.save();
  };

questionSchema.methods.archive =
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

questionSchema.methods.restore =
  async function (
    byUserId = null
  ) {
    this.isDeleted =
      false;

    this.deletedAt =
      null;

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

questionSchema.methods.softDelete =
  async function (
    byUserId = null
  ) {
    this.isDeleted =
      true;

    this.deletedAt =
      new Date();

    this.status =
      "archived";

    if (byUserId) {
      this.updatedBy =
        byUserId;
    }

    return this.save();
  };

questionSchema.methods.updateAnalytics =
  function ({
    attempts,
    correctAttempts,
    incorrectAttempts,
    skippedAttempts,
    averageScore,
    averageTimeSeconds,
    difficultyIndex,
    discriminationIndex,
  } = {}) {
    const analytics =
      this.analytics;

    const values = {
      attempts,
      correctAttempts,
      incorrectAttempts,
      skippedAttempts,
      averageScore,
      averageTimeSeconds,
      difficultyIndex,
      discriminationIndex,
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
        analytics[key] =
          Number(value);
      }
    }

    const totalAttempts =
      Math.max(
        0,
        Number(
          analytics.attempts || 0
        )
      );

    if (totalAttempts) {
      analytics.correctRate =
        Math.round(
          (Number(
            analytics.correctAttempts ||
              0
          ) /
            totalAttempts) *
            10000
        ) / 100;

      analytics.skipRate =
        Math.round(
          (Number(
            analytics.skippedAttempts ||
              0
          ) /
            totalAttempts) *
            10000
        ) / 100;
    }

    analytics.lastCalculatedAt =
      new Date();

    return this;
  };

/* ============================================================================
 * MODEL
 * ========================================================================== */

export const Question =
  mongoose.models.Question ||
  mongoose.model(
    "Question",
    questionSchema
  );

export {
  QUESTION_TYPES,
  QUESTION_DIFFICULTIES,
  QUESTION_STATUS,
  QUESTION_VISIBILITY,
  ANSWER_TYPES,
};
