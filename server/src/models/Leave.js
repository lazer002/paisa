// server/src/models/Leave.js

import mongoose from "mongoose";

import crypto from "node:crypto";
const LEAVE_TYPES = [
  "sick",
  "casual",
  "earned",
  "maternity",
  "paternity",
  "comp_off",
  "unpaid",
  "half_day",
  "other",
];

const LEAVE_STATUS = [
  "pending",
  "approved",
  "rejected",
  "cancelled",
];

const LEAVE_DURATIONS = [
  "full_day",
  "half_day_morning",
  "half_day_evening",
  "multi_day",
];

const APPROVAL_ACTIONS = [
  "pending",
  "approved",
  "rejected",
  "skipped",
];

const leaveSchema = new mongoose.Schema(
  {
    /* ---------------------------------------------------------------------- */
    /* TENANCY / EMPLOYEE                                                      */
    /* ---------------------------------------------------------------------- */

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
    `leav_${crypto.randomBytes(16).toString("base64url")}`,
},
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /* ---------------------------------------------------------------------- */
    /* LEAVE TYPE                                                               */
    /* ---------------------------------------------------------------------- */

    type: {
      type: String,
      enum: {
        values: LEAVE_TYPES,
        message: "Invalid leave type",
      },
      required: true,
      index: true,
    },

    duration: {
      type: String,
      enum: LEAVE_DURATIONS,
      default: "full_day",
    },

    /* ---------------------------------------------------------------------- */
    /* DATES                                                                    */
    /* ---------------------------------------------------------------------- */

    startDate: {
      type: Date,
      required: true,
      index: true,
    },

    endDate: {
      type: Date,
      required: true,
      index: true,
    },

    days: {
      type: Number,
      required: true,
      min: 0.5,
      max: 366,
    },

    /* ---------------------------------------------------------------------- */
    /* REQUEST                                                                  */
    /* ---------------------------------------------------------------------- */

    reason: {
      type: String,
      required: [
        true,
        "Reason is required",
      ],
      trim: true,
      minlength: 2,
      maxlength: 500,
    },

    attachmentUrl: {
      type: String,
      trim: true,
      maxlength: 2048,
      default: null,
    },

    /* ---------------------------------------------------------------------- */
    /* STATUS                                                                   */
    /* ---------------------------------------------------------------------- */

    status: {
      type: String,
      enum: {
        values: LEAVE_STATUS,
        message: "Invalid leave status",
      },
      default: "pending",
      index: true,
    },

    /* ---------------------------------------------------------------------- */
    /* APPROVAL WORKFLOW                                                        */
    /* ---------------------------------------------------------------------- */

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 300,
      default: null,
    },

    approverComment: {
      type: String,
      trim: true,
      maxlength: 300,
      default: null,
    },

    approvalChain: [
      {
        _id: false,

        approver: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },

        action: {
          type: String,
          enum: APPROVAL_ACTIONS,
          default: "pending",
        },

        at: {
          type: Date,
          default: null,
        },

        comment: {
          type: String,
          trim: true,
          maxlength: 300,
          default: null,
        },
      },
    ],

    /* ---------------------------------------------------------------------- */
    /* LEAVE BALANCE SNAPSHOT                                                   */
    /* ---------------------------------------------------------------------- */

    balanceSnapshot: {
      typeBefore: {
        type: Number,
        min: 0,
        default: null,
      },

      typeAfter: {
        type: Number,
        min: 0,
        default: null,
      },

      capturedAt: {
        type: Date,
        default: null,
      },
    },

    /* ---------------------------------------------------------------------- */
    /* HANDOVER                                                                 */
    /* ---------------------------------------------------------------------- */

    handoverTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    handoverNote: {
      type: String,
      trim: true,
      maxlength: 300,
      default: null,
    },

    notifyTeam: {
      type: Boolean,
      default: false,
    },

    /* ---------------------------------------------------------------------- */
    /* CANCELLATION                                                             */
    /* ---------------------------------------------------------------------- */

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
      maxlength: 300,
      default: null,
    },

    /* ---------------------------------------------------------------------- */
    /* ATTENDANCE INTEGRATION                                                   */
    /* ---------------------------------------------------------------------- */

    /*
     * This keeps Leave independent from Attendance.
     *
     * Later, when PAISA has a mobile attendance application, the attendance
     * service can consume approved leave records without changing this model.
     */

    attendance: {
      synced: {
        type: Boolean,
        default: false,
      },

      syncedAt: {
        type: Date,
        default: null,
      },

      syncSource: {
        type: String,
        enum: [
          "manual",
          "web",
          "mobile",
          "system",
          null,
        ],
        default: null,
      },

      attendanceRecordIds: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Attendance",
        },
      ],
    },

    /* ---------------------------------------------------------------------- */
    /* AUDIT                                                                    */
    /* ---------------------------------------------------------------------- */

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

    /* ---------------------------------------------------------------------- */
    /* SOFT DELETE                                                              */
    /* ---------------------------------------------------------------------- */

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

leaveSchema.index(
  {
    instituteId: 1,
    status: 1,
  },
  {
    name: "leave_institute_status",
  }
);

leaveSchema.index(
  {
    instituteId: 1,
    userId: 1,
    startDate: -1,
  },
  {
    name: "leave_user_history",
  }
);

leaveSchema.index(
  {
    instituteId: 1,
    startDate: 1,
    endDate: 1,
  },
  {
    name: "leave_date_range",
  }
);

leaveSchema.index(
  {
    userId: 1,
    status: 1,
    startDate: 1,
    endDate: 1,
  },
  {
    name: "leave_overlap_lookup",
  }
);

leaveSchema.index(
  {
    instituteId: 1,
    type: 1,
    status: 1,
  },
  {
    name: "leave_type_status",
  }
);

leaveSchema.index(
  {
    instituteId: 1,
    isDeleted: 1,
  },
  {
    name: "leave_institute_deleted",
  }
);

/* -------------------------------------------------------------------------- */
/* VALIDATION                                                                  */
/* -------------------------------------------------------------------------- */

leaveSchema.pre(
  "validate",
  function (next) {
    if (
      this.endDate < this.startDate
    ) {
      return next(
        new Error(
          "Leave end date cannot be before start date"
        )
      );
    }

    if (
      this.duration ===
        "half_day_morning" ||
      this.duration ===
        "half_day_evening"
    ) {
      if (
        this.startDate.toDateString() !==
        this.endDate.toDateString()
      ) {
        return next(
          new Error(
            "Half-day leave must be for a single day"
          )
        );
      }

      if (this.days !== 0.5) {
        this.days = 0.5;
      }
    }

    if (
      this.duration === "full_day" &&
      this.startDate.toDateString() ===
        this.endDate.toDateString() &&
      this.days !== 1
    ) {
      this.days = 1;
    }

    if (
      this.duration === "multi_day" &&
      this.endDate <= this.startDate
    ) {
      return next(
        new Error(
          "Multi-day leave requires more than one day"
        )
      );
    }

    if (
      this.status === "approved" &&
      (!this.approvedBy ||
        !this.approvedAt)
    ) {
      return next(
        new Error(
          "Approved leave requires approval audit information"
        )
      );
    }

    if (
      this.status === "rejected" &&
      !this.rejectionReason
    ) {
      return next(
        new Error(
          "Rejected leave requires a rejection reason"
        )
      );
    }

    if (
      this.status === "cancelled" &&
      (!this.cancelledAt ||
        !this.cancelledBy)
    ) {
      return next(
        new Error(
          "Cancelled leave requires cancellation audit information"
        )
      );
    }

    next();
  }
);

/* -------------------------------------------------------------------------- */
/* VIRTUALS                                                                    */
/* -------------------------------------------------------------------------- */

leaveSchema.virtual("isUpcoming").get(
  function () {
    return (
      this.status === "approved" &&
      this.startDate > new Date()
    );
  }
);

leaveSchema.virtual("isActiveNow").get(
  function () {
    const now = new Date();

    return (
      this.status === "approved" &&
      this.startDate <= now &&
      this.endDate >= now
    );
  }
);

leaveSchema.virtual("isPending").get(
  function () {
    return this.status === "pending";
  }
);

leaveSchema.virtual("isCompleted").get(
  function () {
    return (
      this.status === "approved" &&
      this.endDate < new Date()
    );
  }
);

leaveSchema.virtual("isHalfDay").get(
  function () {
    return (
      this.duration ===
        "half_day_morning" ||
      this.duration ===
        "half_day_evening" ||
      this.type === "half_day"
    );
  }
);

/* -------------------------------------------------------------------------- */
/* QUERY HELPERS                                                              */
/* -------------------------------------------------------------------------- */

leaveSchema.query.byInstitute =
  function (instituteId) {
    return this.where({
      instituteId,
      isDeleted: false,
    });
  };

leaveSchema.query.byUser =
  function (userId) {
    return this.where({
      userId,
      isDeleted: false,
    });
  };

leaveSchema.query.pending =
  function () {
    return this.where({
      status: "pending",
      isDeleted: false,
    });
  };

leaveSchema.query.approved =
  function () {
    return this.where({
      status: "approved",
      isDeleted: false,
    });
  };

leaveSchema.query.active =
  function () {
    return this.where({
      isDeleted: false,
      status: {
        $nin: [
          "cancelled",
          "rejected",
        ],
      },
    });
  };

/* -------------------------------------------------------------------------- */
/* INSTANCE METHODS                                                            */
/* -------------------------------------------------------------------------- */

leaveSchema.methods.approve =
  async function (
    approverId,
    comment = null
  ) {
    if (
      this.status !== "pending"
    ) {
      throw new Error(
        "Only pending leave can be approved"
      );
    }

    this.status = "approved";
    this.approvedBy = approverId;
    this.approvedAt = new Date();
    this.approverComment =
      comment;

    if (
      this.approvalChain?.length
    ) {
      const step =
        this.approvalChain.find(
          (item) =>
            item.approver.toString() ===
              approverId.toString() &&
            item.action ===
              "pending"
        );

      if (step) {
        step.action =
          "approved";
        step.at =
          new Date();
        step.comment =
          comment;
      }
    }

    return this.save();
  };

leaveSchema.methods.reject =
  async function (
    approverId,
    reason,
    comment = null
  ) {
    if (
      this.status !== "pending"
    ) {
      throw new Error(
        "Only pending leave can be rejected"
      );
    }

    if (!reason?.trim()) {
      throw new Error(
        "Rejection reason is required"
      );
    }

    this.status = "rejected";
    this.rejectionReason =
      reason.trim();
    this.approverComment =
      comment;

    if (
      this.approvalChain?.length
    ) {
      const step =
        this.approvalChain.find(
          (item) =>
            item.approver.toString() ===
              approverId.toString() &&
            item.action ===
              "pending"
        );

      if (step) {
        step.action =
          "rejected";
        step.at =
          new Date();
        step.comment =
          comment;
      }
    }

    return this.save();
  };

leaveSchema.methods.cancel =
  async function (
    userId,
    reason = null
  ) {
    if (
      ["rejected", "cancelled"].includes(
        this.status
      )
    ) {
      throw new Error(
        "This leave cannot be cancelled"
      );
    }

    this.status =
      "cancelled";
    this.cancelledAt =
      new Date();
    this.cancelledBy =
      userId;
    this.cancellationReason =
      reason;

    return this.save();
  };

leaveSchema.methods.softDelete =
  async function (
    userId = null
  ) {
    this.isDeleted = true;
    this.deletedAt =
      new Date();

    if (userId) {
      this.updatedBy =
        userId;
    }

    return this.save();
  };

leaveSchema.methods.restore =
  async function (
    userId = null
  ) {
    this.isDeleted = false;
    this.deletedAt = null;

    if (userId) {
      this.updatedBy =
        userId;
    }

    return this.save();
  };

/* -------------------------------------------------------------------------- */
/* STATIC METHODS                                                             */
/* -------------------------------------------------------------------------- */

leaveSchema.statics.findOverlapping =
  function ({
    userId,
    startDate,
    endDate,
    excludeId = null,
  }) {
    const query = {
      userId,
      isDeleted: false,
      status: {
        $in: [
          "pending",
          "approved",
        ],
      },
      startDate: {
        $lte: endDate,
      },
      endDate: {
        $gte: startDate,
      },
    };

    if (excludeId) {
      query._id = {
        $ne: excludeId,
      };
    }

    return this.find(query);
  };

leaveSchema.statics.findActiveForDate =
  function (
    instituteId,
    date
  ) {
    return this.find({
      instituteId,
      isDeleted: false,
      status: "approved",
      startDate: {
        $lte: date,
      },
      endDate: {
        $gte: date,
      },
    });
  };

/* -------------------------------------------------------------------------- */
/* MODEL                                                                      */
/* -------------------------------------------------------------------------- */

export const Leave =
  mongoose.models.Leave ||
  mongoose.model(
    "Leave",
    leaveSchema
  );

export {
  LEAVE_TYPES,
  LEAVE_STATUS,
  LEAVE_DURATIONS,
};
