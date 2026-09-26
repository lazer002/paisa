// server/src/models/Deal.js

import mongoose from "mongoose";

const DEAL_STATUSES = [
  "draft",
  "open",
  "won",
  "lost",
  "cancelled",
];

const DEAL_STAGES = [
  "qualification",
  "discovery",
  "needs_analysis",
  "proposal",
  "negotiation",
  "contract",
  "closed_won",
  "closed_lost",
];

const DEAL_PRIORITIES = [
  "low",
  "normal",
  "high",
  "urgent",
];

const DEAL_TYPES = [
  "new_business",
  "renewal",
  "upsell",
  "cross_sell",
  "subscription",
  "one_time",
  "enterprise",
  "other",
];

const DEAL_LOSS_REASONS = [
  "price",
  "budget",
  "competitor",
  "no_need",
  "timing",
  "not_qualified",
  "no_response",
  "lost_contact",
  "internal_change",
  "other",
];

const productSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
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

    quantity: {
      type: Number,
      min: 0.01,
      default: 1,
    },

    unitPrice: {
      type: Number,
      min: 0,
      default: 0,
    },

    discount: {
      type: Number,
      min: 0,
      default: 0,
    },

    tax: {
      type: Number,
      min: 0,
      default: 0,
    },

    total: {
      type: Number,
      min: 0,
      default: 0,
    },

    currency: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 10,
      default: "INR",
    },
  },
  {
    _id: true,
  }
);

const stageHistorySchema = new mongoose.Schema(
  {
    fromStage: {
      type: String,
      enum: DEAL_STAGES,
      default: null,
    },

    toStage: {
      type: String,
      enum: DEAL_STAGES,
      required: true,
    },

    changedAt: {
      type: Date,
      default: Date.now,
    },

    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reason: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },

    durationInStageSeconds: {
      type: Number,
      min: 0,
      default: null,
    },
  },
  {
    _id: true,
  }
);

const contactSnapshotSchema = new mongoose.Schema(
  {
    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contact",
      default: null,
    },

    name: {
      type: String,
      trim: true,
      maxlength: 300,
      default: null,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 320,
      default: null,
    },

    phone: {
      type: String,
      trim: true,
      maxlength: 50,
      default: null,
    },

    designation: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
    },

    role: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },
  },
  {
    _id: false,
  }
);

const assignmentSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
      index: true,
    },

    assignedAt: {
      type: Date,
      default: null,
    },

    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    autoAssigned: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  }
);

const probabilitySchema = new mongoose.Schema(
  {
    value: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    source: {
      type: String,
      enum: [
        "manual",
        "stage",
        "historical",
        "model",
        "ai",
      ],
      default: "stage",
    },

    updatedAt: {
      type: Date,
      default: null,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    _id: false,
  }
);

const dealSchema = new mongoose.Schema(
  {
    /* ====================================================================== */
    /* TENANCY                                                               */
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

    dealCode: {
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

    /* ====================================================================== */
    /* BASIC INFORMATION                                                      */
    /* ====================================================================== */

    title: {
      type: String,
      trim: true,
      maxlength: 500,
      required: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 10000,
      default: null,
    },

    type: {
      type: String,
      enum: DEAL_TYPES,
      default: "new_business",
      index: true,
    },

    status: {
      type: String,
      enum: DEAL_STATUSES,
      default: "draft",
      index: true,
    },

    stage: {
      type: String,
      enum: DEAL_STAGES,
      default: "qualification",
      index: true,
    },

    priority: {
      type: String,
      enum: DEAL_PRIORITIES,
      default: "normal",
      index: true,
    },

    /* ====================================================================== */
    /* RELATIONSHIPS                                                          */
    /* ====================================================================== */

    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      default: null,
      index: true,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
      index: true,
    },

    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contact",
      default: null,
      index: true,
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      default: null,
      index: true,
    },

    enrollmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enrollment",
      default: null,
    },

    /* ====================================================================== */
    /* CONTACT SNAPSHOT                                                       */
    /* ====================================================================== */

    primaryContact: {
      type: contactSnapshotSchema,
      default: () => ({}),
    },

    additionalContacts: {
      type: [contactSnapshotSchema],
      default: [],
    },

    /* ====================================================================== */
    /* ASSIGNMENT                                                             */
    /* ====================================================================== */

    assignment: {
      type: assignmentSchema,
      default: () => ({}),
    },

    /* ====================================================================== */
    /* PIPELINE                                                               */
    /* ====================================================================== */

    pipelineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pipeline",
      default: null,
      index: true,
    },

    pipelineStageId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },

    stageEnteredAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    stageHistory: {
      type: [stageHistorySchema],
      default: [],
    },

    /* ====================================================================== */
    /* FINANCIAL                                                              */
    /* ====================================================================== */

    amount: {
      type: Number,
      min: 0,
      default: 0,
      index: true,
    },

    currency: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 10,
      default: "INR",
    },

    recurring: {
      enabled: {
        type: Boolean,
        default: false,
      },

      interval: {
        type: String,
        enum: [
          "monthly",
          "quarterly",
          "half_yearly",
          "yearly",
        ],
        default: null,
      },

      intervalCount: {
        type: Number,
        min: 1,
        max: 120,
        default: 1,
      },

      recurringAmount: {
        type: Number,
        min: 0,
        default: 0,
      },

      annualizedValue: {
        type: Number,
        min: 0,
        default: 0,
      },

      startDate: {
        type: Date,
        default: null,
      },

      endDate: {
        type: Date,
        default: null,
      },
    },

    discount: {
      type: Number,
      min: 0,
      default: 0,
    },

    tax: {
      type: Number,
      min: 0,
      default: 0,
    },

    netAmount: {
      type: Number,
      min: 0,
      default: 0,
    },

    weightedAmount: {
      type: Number,
      min: 0,
      default: 0,
      index: true,
    },

    products: {
      type: [productSchema],
      default: [],
    },

    /* ====================================================================== */
    /* PROBABILITY                                                            */
    /* ====================================================================== */

    probability: {
      type: probabilitySchema,
      default: () => ({}),
    },

    /* ====================================================================== */
    /* DATES                                                                  */
    /* ====================================================================== */

    expectedCloseDate: {
      type: Date,
      default: null,
      index: true,
    },

    actualCloseDate: {
      type: Date,
      default: null,
      index: true,
    },

    nextActionDate: {
      type: Date,
      default: null,
      index: true,
    },

    /* ====================================================================== */
    /* WIN / LOSS                                                             */
    /* ====================================================================== */

    won: {
      type: Boolean,
      default: false,
      index: true,
    },

    wonAt: {
      type: Date,
      default: null,
    },

    wonBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    lostAt: {
      type: Date,
      default: null,
    },

    lostBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    lossReason: {
      type: String,
      enum: DEAL_LOSS_REASONS,
      default: null,
    },

    lossNotes: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: null,
    },

    /* ====================================================================== */
    /* FORECAST                                                               */
    /* ====================================================================== */

    forecast: {
      category: {
        type: String,
        enum: [
          "pipeline",
          "best_case",
          "commit",
          "closed",
          "omitted",
        ],
        default: "pipeline",
        index: true,
      },

      included: {
        type: Boolean,
        default: true,
      },

      amount: {
        type: Number,
        min: 0,
        default: 0,
      },

      updatedAt: {
        type: Date,
        default: null,
      },

      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    },

    /* ====================================================================== */
    /* COMPETITION                                                            */
    /* ====================================================================== */

    competition: {
      hasCompetition: {
        type: Boolean,
        default: false,
      },

      competitors: {
        type: [String],
        default: [],
      },

      competitorDetails: {
        type: [
          {
            name: {
              type: String,
              trim: true,
              maxlength: 300,
            },

            strength: {
              type: String,
              trim: true,
              maxlength: 1000,
              default: null,
            },

            weakness: {
              type: String,
              trim: true,
              maxlength: 1000,
              default: null,
            },

            notes: {
              type: String,
              trim: true,
              maxlength: 2000,
              default: null,
            },
          },
        ],
        default: [],
      },
    },

    /* ====================================================================== */
    /* REQUIREMENTS                                                           */
    /* ====================================================================== */

    requirements: {
      need: {
        type: String,
        trim: true,
        maxlength: 5000,
        default: null,
      },

      painPoints: {
        type: [String],
        default: [],
      },

      goals: {
        type: [String],
        default: [],
      },

      decisionCriteria: {
        type: [String],
        default: [],
      },

      budgetConfirmed: {
        type: Boolean,
        default: false,
      },

      decisionMakerConfirmed: {
        type: Boolean,
        default: false,
      },

      timelineConfirmed: {
        type: Boolean,
        default: false,
      },
    },

    /* ====================================================================== */
    /* ACTIVITIES SNAPSHOT                                                    */
    /* ====================================================================== */

    activitySummary: {
      totalActivities: {
        type: Number,
        min: 0,
        default: 0,
      },

      calls: {
        type: Number,
        min: 0,
        default: 0,
      },

      emails: {
        type: Number,
        min: 0,
        default: 0,
      },

      meetings: {
        type: Number,
        min: 0,
        default: 0,
      },

      tasks: {
        type: Number,
        min: 0,
        default: 0,
      },

      notes: {
        type: Number,
        min: 0,
        default: 0,
      },

      lastActivityAt: {
        type: Date,
        default: null,
        index: true,
      },
    },

    /* ====================================================================== */
    /* TAGS / METADATA                                                        */
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

    customFields: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    /* ====================================================================== */
    /* AUDIT                                                                  */
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
    /* LIFECYCLE                                                              */
    /* ====================================================================== */

    cancelledAt: {
      type: Date,
      default: null,
    },

    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    cancellationReason: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },

    archivedAt: {
      type: Date,
      default: null,
    },

    archivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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

dealSchema.index(
  {
    instituteId: 1,
    dealCode: 1,
  },
  {
    unique: true,
    sparse: true,
    name: "tenant_deal_code",
  }
);

dealSchema.index(
  {
    instituteId: 1,
    pipelineId: 1,
    stage: 1,
    status: 1,
  },
  {
    name: "pipeline_deal_listing",
  }
);

dealSchema.index(
  {
    instituteId: 1,
    "assignment.ownerId": 1,
    status: 1,
    expectedCloseDate: 1,
  },
  {
    name: "owner_deal_pipeline",
  }
);

dealSchema.index(
  {
    instituteId: 1,
    "assignment.teamId": 1,
    status: 1,
    amount: -1,
  },
  {
    name: "team_deal_pipeline",
  }
);

dealSchema.index(
  {
    instituteId: 1,
    status: 1,
    stage: 1,
    weightedAmount: -1,
  },
  {
    name: "deal_forecast",
  }
);

dealSchema.index(
  {
    instituteId: 1,
    expectedCloseDate: 1,
    status: 1,
  },
  {
    name: "deal_expected_close",
  }
);

dealSchema.index(
  {
    instituteId: 1,
    nextActionDate: 1,
    status: 1,
  },
  {
    name: "deal_next_action",
  }
);

dealSchema.index(
  {
    instituteId: 1,
    leadId: 1,
  },
  {
    sparse: true,
    name: "lead_deals",
  }
);

dealSchema.index(
  {
    instituteId: 1,
    customerId: 1,
  },
  {
    sparse: true,
    name: "customer_deals",
  }
);

dealSchema.index(
  {
    instituteId: 1,
    contactId: 1,
  },
  {
    sparse: true,
    name: "contact_deals",
  }
);

dealSchema.index(
  {
    instituteId: 1,
    won: 1,
    actualCloseDate: -1,
  },
  {
    name: "won_deals",
  }
);

dealSchema.index(
  {
    instituteId: 1,
    tags: 1,
  },
  {
    name: "deal_tags",
  }
);

dealSchema.index(
  {
    instituteId: 1,
    title: "text",
    description: "text",
    "primaryContact.name": "text",
    "primaryContact.email": "text",
  },
  {
    name: "deal_search",
    weights: {
      title: 10,
      description: 5,
      "primaryContact.name": 5,
      "primaryContact.email": 3,
    },
  }
);

/* ============================================================================
 * VALIDATION
 * ========================================================================== */

dealSchema.pre(
  "validate",
  function (next) {
    if (
      this.discount >
      this.amount
    ) {
      return next(
        new Error(
          "Discount cannot exceed deal amount"
        )
      );
    }

    if (
      this.expectedCloseDate &&
      this.actualCloseDate &&
      this.actualCloseDate <
        this.createdAt
    ) {
      return next(
        new Error(
          "Actual close date cannot be before deal creation"
        )
      );
    }

    if (
      this.recurring.enabled &&
      this.recurring.interval ===
        null
    ) {
      return next(
        new Error(
          "Recurring interval is required for recurring deals"
        )
      );
    }

    if (
      this.status ===
        "won" &&
      !this.won
    ) {
      this.won = true;
    }

    if (
      this.won &&
      this.status !==
        "won"
    ) {
      this.status =
        "won";
    }

    if (
      this.status ===
        "lost" &&
      !this.lostAt
    ) {
      this.lostAt =
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
      this.products.length >
      100
    ) {
      return next(
        new Error(
          "Deal cannot contain more than 100 products"
        )
      );
    }

    if (
      this.additionalContacts.length >
      50
    ) {
      return next(
        new Error(
          "Deal cannot contain more than 50 contacts"
        )
      );
    }

    if (
      this.stageHistory.length >
      500
    ) {
      return next(
        new Error(
          "Deal cannot contain more than 500 stage history entries"
        )
      );
    }

    if (
      this.tags.length >
      100
    ) {
      return next(
        new Error(
          "Deal cannot contain more than 100 tags"
        )
      );
    }

    next();
  }
);

/* ============================================================================
 * PRE-SAVE FINANCIAL CALCULATIONS
 * ========================================================================== */

dealSchema.pre(
  "save",
  function (next) {
    const calculatedProductTotal =
      this.products.reduce(
        (sum, product) =>
          sum +
          Math.max(
            0,
            product.total ||
              (
                product.quantity *
                  product.unitPrice
              ) -
                product.discount +
                product.tax
          ),
        0
      );

    if (
      this.products.length &&
      calculatedProductTotal > 0
    ) {
      this.amount =
        calculatedProductTotal;
    }

    this.netAmount =
      Math.max(
        0,
        this.amount -
          this.discount +
          this.tax
      );

    this.weightedAmount =
      Math.round(
        this.netAmount *
          (
            this.probability
              ?.value || 0
          ) /
          100 *
          100
      ) / 100;

    if (
      this.recurring.enabled
    ) {
      const recurringAmount =
        this.recurring
          .recurringAmount ||
        this.netAmount;

      this.recurring.annualizedValue =
        this.calculateAnnualizedValue(
          recurringAmount,
          this.recurring.interval
        );
    } else {
      this.recurring.annualizedValue =
        0;
    }

    next();
  }
);

/* ============================================================================
 * VIRTUALS
 * ========================================================================== */

dealSchema.virtual(
  "isOpen"
).get(function () {
  return (
    this.status ===
      "draft" ||
    this.status ===
      "open"
  );
});

dealSchema.virtual(
  "isClosed"
).get(function () {
  return [
    "won",
    "lost",
    "cancelled",
  ].includes(
    this.status
  );
});

dealSchema.virtual(
  "isWon"
).get(function () {
  return (
    this.status ===
      "won" ||
    this.won
  );
});

dealSchema.virtual(
  "isLost"
).get(function () {
  return (
    this.status ===
    "lost"
  );
});

dealSchema.virtual(
  "daysOpen"
).get(function () {
  if (!this.createdAt) {
    return 0;
  }

  const end =
    this.actualCloseDate ||
    new Date();

  return Math.max(
    0,
    Math.floor(
      (end.getTime() -
        this.createdAt.getTime()) /
        86400000
    )
  );
});

dealSchema.virtual(
  "isOverdue"
).get(function () {
  if (
    !this.expectedCloseDate ||
    this.isClosed
  ) {
    return false;
  }

  return (
    this.expectedCloseDate <
    new Date()
  );
});

/* ============================================================================
 * QUERY HELPERS
 * ========================================================================== */

dealSchema.query.byInstitute =
  function (instituteId) {
    return this.where({
      instituteId,
      isDeleted: false,
    });
  };

dealSchema.query.open =
  function () {
    return this.where({
      isDeleted: false,
      status: {
        $in: [
          "draft",
          "open",
        ],
      },
    });
  };

dealSchema.query.closed =
  function () {
    return this.where({
      isDeleted: false,
      status: {
        $in: [
          "won",
          "lost",
          "cancelled",
        ],
      },
    });
  };

dealSchema.query.won =
  function () {
    return this.where({
      isDeleted: false,
      status: "won",
    });
  };

dealSchema.query.lost =
  function () {
    return this.where({
      isDeleted: false,
      status: "lost",
    });
  };

dealSchema.query.byOwner =
  function (ownerId) {
    return this.where({
      isDeleted: false,
      "assignment.ownerId":
        ownerId,
    });
  };

dealSchema.query.byPipeline =
  function (pipelineId) {
    return this.where({
      isDeleted: false,
      pipelineId,
    });
  };

dealSchema.query.byStage =
  function (stage) {
    return this.where({
      isDeleted: false,
      stage,
    });
  };

dealSchema.query.overdue =
  function () {
    return this.where({
      isDeleted: false,
      status: {
        $in: [
          "draft",
          "open",
        ],
      },
      expectedCloseDate: {
        $lt: new Date(),
      },
    });
  };

/* ============================================================================
 * INSTANCE METHODS
 * ========================================================================== */

dealSchema.methods.changeStage =
  async function ({
    stage,
    changedBy = null,
    reason = null,
    probability = null,
  } = {}) {
    if (
      !DEAL_STAGES.includes(
        stage
      )
    ) {
      throw new Error(
        "Invalid deal stage"
      );
    }

    if (
      this.stage ===
      stage
    ) {
      return this;
    }

    const now =
      new Date();

    const duration =
      this.stageEnteredAt
        ? Math.max(
            0,
            Math.floor(
              (now.getTime() -
                this.stageEnteredAt.getTime()) /
                1000
            )
          )
        : null;

    this.stageHistory.push({
      fromStage:
        this.stage,
      toStage:
        stage,
      changedAt:
        now,
      changedBy,
      reason,
      durationInStageSeconds:
        duration,
    });

    this.stage =
      stage;

    this.stageEnteredAt =
      now;

    if (
      probability !==
      null
    ) {
      this.probability.value =
        Math.max(
          0,
          Math.min(
            100,
            probability
          )
        );

      this.probability.source =
        "manual";

      this.probability.updatedAt =
        now;

      this.probability.updatedBy =
        changedBy;
    }

    if (
      stage ===
      "closed_won"
    ) {
      this.status =
        "won";

      this.won =
        true;

      this.wonAt =
        now;

      this.wonBy =
        changedBy;

      this.actualCloseDate =
        now;
    }

    if (
      stage ===
      "closed_lost"
    ) {
      this.status =
        "lost";

      this.won =
        false;

      this.lostAt =
        now;

      this.lostBy =
        changedBy;

      this.actualCloseDate =
        now;
    }

    return this.save();
  };

dealSchema.methods.updateProbability =
  async function ({
    value,
    source = "manual",
    updatedBy = null,
  } = {}) {
    if (
      typeof value !==
        "number" ||
      value < 0 ||
      value > 100
    ) {
      throw new Error(
        "Probability must be between 0 and 100"
      );
    }

    this.probability.value =
      value;

    this.probability.source =
      source;

    this.probability.updatedAt =
      new Date();

    this.probability.updatedBy =
      updatedBy;

    return this.save();
  };

dealSchema.methods.assign =
  async function ({
    ownerId = null,
    teamId = null,
    assignedBy = null,
    autoAssigned = false,
  } = {}) {
    this.assignment.ownerId =
      ownerId;

    this.assignment.teamId =
      teamId;

    this.assignment.assignedAt =
      new Date();

    this.assignment.assignedBy =
      assignedBy;

    this.assignment.autoAssigned =
      autoAssigned;

    return this.save();
  };

dealSchema.methods.addProduct =
  async function ({
    productId = null,
    name,
    description = null,
    quantity = 1,
    unitPrice = 0,
    discount = 0,
    tax = 0,
    currency = "INR",
  } = {}) {
    if (!name) {
      throw new Error(
        "Product name is required"
      );
    }

    const subtotal =
      quantity *
      unitPrice;

    const total =
      Math.max(
        0,
        subtotal -
          discount +
          tax
      );

    this.products.push({
      productId,
      name,
      description,
      quantity,
      unitPrice,
      discount,
      tax,
      total,
      currency,
    });

    return this.save();
  };

dealSchema.methods.removeProduct =
  async function (
    productId
  ) {
    const product =
      this.products.id(
        productId
      );

    if (
      !product
    ) {
      throw new Error(
        "Deal product not found"
      );
    }

    product.deleteOne();

    return this.save();
  };

dealSchema.methods.markWon =
  async function ({
    wonBy = null,
    closeDate = new Date(),
  } = {}) {
    this.status =
      "won";

    this.stage =
      "closed_won";

    this.won =
      true;

    this.wonAt =
      closeDate;

    this.wonBy =
      wonBy;

    this.actualCloseDate =
      closeDate;

    this.probability.value =
      100;

    this.probability.source =
      "stage";

    this.probability.updatedAt =
      closeDate;

    return this.save();
  };

dealSchema.methods.markLost =
  async function ({
    lostBy = null,
    reason = "other",
    notes = null,
    closeDate = new Date(),
  } = {}) {
    if (
      !DEAL_LOSS_REASONS.includes(
        reason
      )
    ) {
      throw new Error(
        "Invalid deal loss reason"
      );
    }

    this.status =
      "lost";

    this.stage =
      "closed_lost";

    this.won =
      false;

    this.lostAt =
      closeDate;

    this.lostBy =
      lostBy;

    this.lossReason =
      reason;

    this.lossNotes =
      notes;

    this.actualCloseDate =
      closeDate;

    this.probability.value =
      0;

    this.probability.source =
      "stage";

    this.probability.updatedAt =
      closeDate;

    return this.save();
  };

dealSchema.methods.cancel =
  async function ({
    cancelledBy = null,
    reason = null,
  } = {}) {
    this.status =
      "cancelled";

    this.cancelledAt =
      new Date();

    this.cancelledBy =
      cancelledBy;

    this.cancellationReason =
      reason;

    return this.save();
  };

dealSchema.methods.reopen =
  async function ({
    stage = "qualification",
    reopenedBy = null,
  } = {}) {
    if (
      ![
        "won",
        "lost",
        "cancelled",
      ].includes(
        this.status
      )
    ) {
      return this;
    }

    this.status =
      "open";

    this.stage =
      stage;

    this.won =
      false;

    this.wonAt =
      null;

    this.wonBy =
      null;

    this.lostAt =
      null;

    this.lostBy =
      null;

    this.cancelledAt =
      null;

    this.cancelledBy =
      null;

    this.cancellationReason =
      null;

    this.actualCloseDate =
      null;

    this.stageEnteredAt =
      new Date();

    this.stageHistory.push({
      fromStage:
        this.stage,
      toStage:
        stage,
      changedAt:
        new Date(),
      changedBy:
        reopenedBy,
      reason:
        "Deal reopened",
    });

    return this.save();
  };

dealSchema.methods.setForecast =
  async function ({
    category,
    included = true,
    amount = null,
    updatedBy = null,
  } = {}) {
    this.forecast.category =
      category;

    this.forecast.included =
      included;

    this.forecast.amount =
      amount === null
        ? this.weightedAmount
        : Math.max(
            0,
            amount
          );

    this.forecast.updatedAt =
      new Date();

    this.forecast.updatedBy =
      updatedBy;

    return this.save();
  };

dealSchema.methods.setNextAction =
  async function (
    nextActionDate
  ) {
    this.nextActionDate =
      nextActionDate;

    return this.save();
  };

dealSchema.methods.addTag =
  async function (
    tag
  ) {
    const normalized =
      String(tag)
        .trim()
        .toLowerCase();

    if (
      normalized &&
      !this.tags.includes(
        normalized
      )
    ) {
      this.tags.push(
        normalized
      );
    }

    return this.save();
  };

dealSchema.methods.removeTag =
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
          item !== normalized
      );

    return this.save();
  };

dealSchema.methods.calculateAnnualizedValue =
  function (
    amount,
    interval
  ) {
    if (
      !amount ||
      !interval
    ) {
      return 0;
    }

    const multipliers = {
      monthly: 12,
      quarterly: 4,
      half_yearly: 2,
      yearly: 1,
    };

    return (
      amount *
      (
        multipliers[
          interval
        ] || 1
      )
    );
  };

dealSchema.methods.softDelete =
  async function () {
    this.isDeleted =
      true;

    this.deletedAt =
      new Date();

    return this.save();
  };

dealSchema.methods.restore =
  async function () {
    this.isDeleted =
      false;

    this.deletedAt =
      null;

    return this.save();
  };

/* ============================================================================
 * STATIC METHODS
 * ========================================================================== */

dealSchema.statics.findOpenForOwner =
  function (
    instituteId,
    ownerId
  ) {
    return this.find({
      instituteId,
      "assignment.ownerId":
        ownerId,
      status: {
        $in: [
          "draft",
          "open",
        ],
      },
      isDeleted: false,
    }).sort({
      priority: -1,
      weightedAmount: -1,
      expectedCloseDate: 1,
    });
  };

dealSchema.statics.findByPipeline =
  function (
    instituteId,
    pipelineId
  ) {
    return this.find({
      instituteId,
      pipelineId,
      isDeleted: false,
    }).sort({
      stageEnteredAt: -1,
    });
  };

dealSchema.statics.findOverdue =
  function (
    instituteId,
    limit = 100
  ) {
    return this.find({
      instituteId,
      isDeleted: false,
      status: {
        $in: [
          "draft",
          "open",
        ],
      },
      expectedCloseDate: {
        $lt: new Date(),
      },
    })
      .sort({
        expectedCloseDate: 1,
        priority: -1,
      })
      .limit(limit);
  };

dealSchema.statics.findClosingSoon =
  function (
    instituteId,
    days = 30,
    limit = 100
  ) {
    const now =
      new Date();

    const future =
      new Date(
        now.getTime() +
          days *
            86400000
      );

    return this.find({
      instituteId,
      isDeleted: false,
      status: {
        $in: [
          "draft",
          "open",
        ],
      },
      expectedCloseDate: {
        $gte: now,
        $lte: future,
      },
    })
      .sort({
        expectedCloseDate: 1,
        weightedAmount: -1,
      })
      .limit(limit);
  };

dealSchema.statics.findByCustomer =
  function (
    instituteId,
    customerId
  ) {
    return this.find({
      instituteId,
      customerId,
      isDeleted: false,
    }).sort({
      createdAt: -1,
    });
  };

/* ============================================================================
 * MODEL
 * ========================================================================== */

export const Deal =
  mongoose.models.Deal ||
  mongoose.model(
    "Deal",
    dealSchema
  );

export {
  DEAL_STATUSES,
  DEAL_STAGES,
  DEAL_PRIORITIES,
  DEAL_TYPES,
  DEAL_LOSS_REASONS,
};