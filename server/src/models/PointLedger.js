// server/src/models/PointLedger.js

import mongoose from "mongoose";

const POINT_TRANSACTION_TYPES = [
  "earn",
  "bonus",
  "adjustment",
  "redeem",
  "expire",
  "refund",
  "reversal",
  "transfer_in",
  "transfer_out",
  "penalty",
  "correction",
];

const POINT_SOURCES = [
  "assignment",
  "test",
  "attendance",
  "live_session",
  "achievement",
  "leaderboard",
  "streak",
  "event",
  "referral",
  "manual",
  "system",
  "admin",
  "campaign",
  "course",
  "enrollment",
  "other",
];

const POINT_STATUSES = [
  "pending",
  "confirmed",
  "reversed",
  "expired",
  "cancelled",
];

const REFERENCE_TYPES = [
  "Assignment",
  "Submission",
  "Test",
  "TestAttempt",
  "Attendance",
  "AttendanceEvent",
  "LiveSession",
  "Achievement",
  "UserAchievement",
  "Leaderboard",
  "Event",
  "Enrollment",
  "User",
  "PointLedger",
];

const pointLedgerSchema = new mongoose.Schema(
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

    transactionCode: {
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
    /* USER                                                                    */
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
    /* TRANSACTION                                                             */
    /* ====================================================================== */

    type: {
      type: String,
      enum: POINT_TRANSACTION_TYPES,
      required: true,
      index: true,
    },

    source: {
      type: String,
      enum: POINT_SOURCES,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: POINT_STATUSES,
      default: "confirmed",
      index: true,
    },

    points: {
      type: Number,
      required: true,
      min: 0,
    },

    balanceBefore: {
      type: Number,
      required: true,
      min: 0,
    },

    balanceAfter: {
      type: Number,
      required: true,
      min: 0,
    },

    /* ====================================================================== */
    /* DESCRIPTION                                                             */
    /* ====================================================================== */

    title: {
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

    reason: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },

    ruleCode: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 200,
      default: null,
    },

    ruleVersion: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    /* ====================================================================== */
    /* REFERENCE                                                              */
    /* ====================================================================== */

    referenceType: {
      type: String,
      enum: REFERENCE_TYPES,
      default: null,
      index: true,
    },

    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },

    referenceCode: {
      type: String,
      trim: true,
      maxlength: 300,
      default: null,
    },

    parentTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PointLedger",
      default: null,
      index: true,
    },

    reversalOfTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PointLedger",
      default: null,
      index: true,
    },

    /* ====================================================================== */
    /* ACTOR                                                                   */
    /* ====================================================================== */

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reversedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /* ====================================================================== */
    /* EXPIRATION                                                              */
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

    expirationPolicy: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
    },

    /* ====================================================================== */
    /* REVERSAL                                                                */
    /* ====================================================================== */

    reversedAt: {
      type: Date,
      default: null,
    },

    reversalReason: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },

    /* ====================================================================== */
    /* TRANSFER                                                                */
    /* ====================================================================== */

    transfer: {
      fromUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      toUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      transferGroupId: {
        type: String,
        trim: true,
        maxlength: 200,
        default: null,
      },
    },

    /* ====================================================================== */
    /* GAMIFICATION                                                            */
    /* ====================================================================== */

    gamification: {
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

      category: {
        type: String,
        trim: true,
        maxlength: 200,
        default: null,
      },

      multiplier: {
        type: Number,
        min: 0,
        default: 1,
      },

      basePoints: {
        type: Number,
        min: 0,
        default: null,
      },

      bonusPoints: {
        type: Number,
        min: 0,
        default: 0,
      },
    },

    /* ====================================================================== */
    /* SNAPSHOT                                                                */
    /* ====================================================================== */

    sourceSnapshot: {
      name: {
        type: String,
        trim: true,
        maxlength: 500,
        default: null,
      },

      type: {
        type: String,
        trim: true,
        maxlength: 200,
        default: null,
      },

      status: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
    },

    /* ====================================================================== */
    /* TAGS / METADATA                                                         */
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
    /* AUDIT                                                                   */
    /* ====================================================================== */

    correlationId: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
      index: true,
    },

    causationId: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
    },

    requestId: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
    },

    sourceSystem: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "application",
    },

    /* ====================================================================== */
    /* RETENTION                                                              */
    /* ====================================================================== */

    legalHold: {
      type: Boolean,
      default: false,
      index: true,
    },

    archived: {
      type: Boolean,
      default: false,
      index: true,
    },

    archivedAt: {
      type: Date,
      default: null,
    },

    /* ====================================================================== */
    /* SOFT DELETE                                                            */
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

pointLedgerSchema.index(
  {
    instituteId: 1,
    transactionCode: 1,
  },
  {
    unique: true,
    sparse: true,
    name: "tenant_transaction_code",
  }
);

pointLedgerSchema.index(
  {
    instituteId: 1,
    userId: 1,
    createdAt: -1,
  },
  {
    name: "user_point_history",
  }
);

pointLedgerSchema.index(
  {
    instituteId: 1,
    userId: 1,
    status: 1,
    createdAt: -1,
  },
  {
    name: "user_point_status_history",
  }
);

pointLedgerSchema.index(
  {
    instituteId: 1,
    studentId: 1,
    createdAt: -1,
  },
  {
    sparse: true,
    name: "student_point_history",
  }
);

pointLedgerSchema.index(
  {
    instituteId: 1,
    employeeId: 1,
    createdAt: -1,
  },
  {
    sparse: true,
    name: "employee_point_history",
  }
);

pointLedgerSchema.index(
  {
    instituteId: 1,
    source: 1,
    type: 1,
    createdAt: -1,
  },
  {
    name: "point_source_history",
  }
);

pointLedgerSchema.index(
  {
    instituteId: 1,
    referenceType: 1,
    referenceId: 1,
  },
  {
    sparse: true,
    name: "point_reference",
  }
);

pointLedgerSchema.index(
  {
    instituteId: 1,
    parentTransactionId: 1,
    createdAt: 1,
  },
  {
    sparse: true,
    name: "point_transaction_chain",
  }
);

pointLedgerSchema.index(
  {
    instituteId: 1,
    reversalOfTransactionId: 1,
  },
  {
    sparse: true,
    name: "point_reversals",
  }
);

pointLedgerSchema.index(
  {
    instituteId: 1,
    expiresAt: 1,
    status: 1,
  },
  {
    sparse: true,
    name: "point_expiration_queue",
  }
);

pointLedgerSchema.index(
  {
    instituteId: 1,
    "gamification.seasonId": 1,
    userId: 1,
    createdAt: -1,
  },
  {
    sparse: true,
    name: "season_user_points",
  }
);

pointLedgerSchema.index(
  {
    instituteId: 1,
    correlationId: 1,
  },
  {
    sparse: true,
    name: "point_correlation",
  }
);

pointLedgerSchema.index(
  {
    instituteId: 1,
    tags: 1,
    createdAt: -1,
  },
  {
    name: "point_tags",
  }
);

pointLedgerSchema.index(
  {
    instituteId: 1,
    isDeleted: 1,
    createdAt: -1,
  },
  {
    name: "active_point_ledger",
  }
);

/* ============================================================================
 * VALIDATION
 * ========================================================================== */

pointLedgerSchema.pre(
  "validate",
  function (next) {
    if (
      this.tags.length >
      100
    ) {
      return next(
        new Error(
          "A point transaction cannot have more than 100 tags"
        )
      );
    }

    if (
      this.points < 0
    ) {
      return next(
        new Error(
          "Points cannot be negative"
        )
      );
    }

    if (
      this.balanceBefore < 0 ||
      this.balanceAfter < 0
    ) {
      return next(
        new Error(
          "Point balances cannot be negative"
        )
      );
    }

    const positiveTypes = [
      "earn",
      "bonus",
      "refund",
      "transfer_in",
    ];

    const negativeTypes = [
      "redeem",
      "expire",
      "reversal",
      "transfer_out",
      "penalty",
    ];

    if (
      positiveTypes.includes(
        this.type
      ) &&
      this.balanceAfter <
        this.balanceBefore
    ) {
      return next(
        new Error(
          "Positive point transactions cannot reduce balance"
        )
      );
    }

    if (
      negativeTypes.includes(
        this.type
      ) &&
      this.balanceAfter >
        this.balanceBefore
    ) {
      return next(
        new Error(
          "Negative point transactions cannot increase balance"
        )
      );
    }

    if (
      this.type ===
        "reversal" &&
      !this.reversalOfTransactionId
    ) {
      return next(
        new Error(
          "Reversal transactions require reversalOfTransactionId"
        )
      );
    }

    if (
      this.type ===
        "transfer_in" &&
      !this.transfer?.fromUserId
    ) {
      return next(
        new Error(
          "Transfer-in transactions require source user"
        )
      );
    }

    if (
      this.type ===
        "transfer_out" &&
      !this.transfer?.toUserId
    ) {
      return next(
        new Error(
          "Transfer-out transactions require destination user"
        )
      );
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
      this.status ===
        "reversed" &&
      !this.reversedAt
    ) {
      this.reversedAt =
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

pointLedgerSchema.virtual(
  "isCredit"
).get(function () {
  return [
    "earn",
    "bonus",
    "refund",
    "transfer_in",
  ].includes(
    this.type
  );
});

pointLedgerSchema.virtual(
  "isDebit"
).get(function () {
  return [
    "redeem",
    "expire",
    "reversal",
    "transfer_out",
    "penalty",
  ].includes(
    this.type
  );
});

pointLedgerSchema.virtual(
  "isReversed"
).get(function () {
  return (
    this.status ===
    "reversed"
  );
});

pointLedgerSchema.virtual(
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

pointLedgerSchema.virtual(
  "netPoints"
).get(function () {
  return this.isCredit
    ? this.points
    : this.isDebit
      ? -this.points
      : 0;
});

/* ============================================================================
 * QUERY HELPERS
 * ========================================================================== */

pointLedgerSchema.query.byInstitute =
  function (instituteId) {
    return this.where({
      instituteId,
      isDeleted: false,
    });
  };

pointLedgerSchema.query.byUser =
  function (userId) {
    return this.where({
      userId,
      isDeleted: false,
    });
  };

pointLedgerSchema.query.confirmed =
  function () {
    return this.where({
      status: "confirmed",
      isDeleted: false,
    });
  };

pointLedgerSchema.query.credits =
  function () {
    return this.where({
      type: {
        $in: [
          "earn",
          "bonus",
          "refund",
          "transfer_in",
        ],
      },
      isDeleted: false,
    });
  };

pointLedgerSchema.query.debits =
  function () {
    return this.where({
      type: {
        $in: [
          "redeem",
          "expire",
          "reversal",
          "transfer_out",
          "penalty",
        ],
      },
      isDeleted: false,
    });
  };

pointLedgerSchema.query.expiring =
  function () {
    return this.where({
      status: "confirmed",
      isDeleted: false,
      expiresAt: {
        $ne: null,
        $lte: new Date(),
      },
    });
  };

/* ============================================================================
 * INSTANCE METHODS
 * ========================================================================== */

pointLedgerSchema.methods.reverse =
  async function ({
    reversedBy = null,
    reason = null,
    transactionCode = null,
  } = {}) {
    if (
      this.status !==
      "confirmed"
    ) {
      throw new Error(
        "Only confirmed point transactions can be reversed"
      );
    }

    if (
      this.type ===
      "reversal"
    ) {
      throw new Error(
        "A reversal transaction cannot be reversed"
      );
    }

    this.status =
      "reversed";

    this.reversedAt =
      new Date();

    this.reversedBy =
      reversedBy;

    this.reversalReason =
      reason;

    if (
      transactionCode
    ) {
      this.externalId =
        transactionCode;
    }

    return this.save();
  };

pointLedgerSchema.methods.expire =
  async function ({
    expiredAt = new Date(),
  } = {}) {
    if (
      this.status !==
      "confirmed"
    ) {
      throw new Error(
        "Only confirmed point transactions can expire"
      );
    }

    this.status =
      "expired";

    this.expiredAt =
      expiredAt;

    return this.save();
  };

pointLedgerSchema.methods.cancel =
  async function ({
    reason = null,
  } = {}) {
    if (
      this.status !==
      "pending"
    ) {
      throw new Error(
        "Only pending point transactions can be cancelled"
      );
    }

    this.status =
      "cancelled";

    this.reversalReason =
      reason;

    return this.save();
  };

pointLedgerSchema.methods.confirm =
  async function () {
    if (
      this.status !==
      "pending"
    ) {
      throw new Error(
        "Only pending point transactions can be confirmed"
      );
    }

    this.status =
      "confirmed";

    return this.save();
  };

pointLedgerSchema.methods.addTag =
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

pointLedgerSchema.methods.removeTag =
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

pointLedgerSchema.methods.setLegalHold =
  async function (
    enabled = true
  ) {
    this.legalHold =
      enabled;

    return this.save();
  };

pointLedgerSchema.methods.archive =
  async function () {
    this.archived =
      true;

    this.archivedAt =
      new Date();

    return this.save();
  };

pointLedgerSchema.methods.restore =
  async function () {
    this.archived =
      false;

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

pointLedgerSchema.methods.softDelete =
  async function ({
    deletedBy = null,
    reason = null,
  } = {}) {
    if (
      this.legalHold
    ) {
      throw new Error(
        "Point transaction is under legal hold"
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

/* ============================================================================
 * STATIC METHODS
 * ========================================================================== */

pointLedgerSchema.statics.findByTransactionCode =
  function (
    instituteId,
    transactionCode
  ) {
    return this.findOne({
      instituteId,
      transactionCode:
        String(
          transactionCode
        )
          .trim()
          .toUpperCase(),
      isDeleted: false,
    });
  };

pointLedgerSchema.statics.findUserHistory =
  function (
    instituteId,
    userId,
    {
      limit = 100,
      skip = 0,
    } = {}
  ) {
    return this.find({
      instituteId,
      userId,
      isDeleted: false,
    })
      .sort({
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

pointLedgerSchema.statics.findUserCredits =
  function (
    instituteId,
    userId,
    limit = 100
  ) {
    return this.find({
      instituteId,
      userId,
      type: {
        $in: [
          "earn",
          "bonus",
          "refund",
          "transfer_in",
        ],
      },
      status: "confirmed",
      isDeleted: false,
    })
      .sort({
        createdAt: -1,
      })
      .limit(limit);
  };

pointLedgerSchema.statics.findUserDebits =
  function (
    instituteId,
    userId,
    limit = 100
  ) {
    return this.find({
      instituteId,
      userId,
      type: {
        $in: [
          "redeem",
          "expire",
          "reversal",
          "transfer_out",
          "penalty",
        ],
      },
      status: "confirmed",
      isDeleted: false,
    })
      .sort({
        createdAt: -1,
      })
      .limit(limit);
  };

pointLedgerSchema.statics.findByReference =
  function (
    instituteId,
    referenceType,
    referenceId
  ) {
    return this.find({
      instituteId,
      referenceType,
      referenceId,
      isDeleted: false,
    }).sort({
      createdAt: -1,
    });
  };

pointLedgerSchema.statics.findExpiring =
  function (
    instituteId,
    beforeDate = new Date(),
    limit = 500
  ) {
    return this.find({
      instituteId,
      status: "confirmed",
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

pointLedgerSchema.statics.getUserNetPoints =
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
            status:
              "confirmed",
            isDeleted:
              false,
          },
        },
        {
          $group: {
            _id: null,
            credits: {
              $sum: {
                $cond: [
                  {
                    $in: [
                      "$type",
                      [
                        "earn",
                        "bonus",
                        "refund",
                        "transfer_in",
                      ],
                    ],
                  },
                  "$points",
                  0,
                ],
              },
            },
            debits: {
              $sum: {
                $cond: [
                  {
                    $in: [
                      "$type",
                      [
                        "redeem",
                        "expire",
                        "reversal",
                        "transfer_out",
                        "penalty",
                      ],
                    ],
                  },
                  "$points",
                  0,
                ],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            credits: 1,
            debits: 1,
            balance: {
              $subtract: [
                "$credits",
                "$debits",
              ],
            },
          },
        },
      ]);

    return (
      result[0] || {
        credits: 0,
        debits: 0,
        balance: 0,
      }
    );
  };

pointLedgerSchema.statics.getSourceSummary =
  async function (
    instituteId,
    userId
  ) {
    return this.aggregate([
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
          status:
            "confirmed",
          isDeleted:
            false,
        },
      },
      {
        $group: {
          _id: {
            source:
              "$source",
            type:
              "$type",
          },
          points: {
            $sum: "$points",
          },
          transactions: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          points: -1,
        },
      },
    ]);
  };

/* ============================================================================
 * MODEL
 * ========================================================================== */

export const PointLedger =
  mongoose.models.PointLedger ||
  mongoose.model(
    "PointLedger",
    pointLedgerSchema
  );

export {
  POINT_TRANSACTION_TYPES,
  POINT_SOURCES,
  POINT_STATUSES,
  REFERENCE_TYPES,
};