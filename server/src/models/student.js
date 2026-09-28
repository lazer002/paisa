// server/src/models/student.js

import mongoose from "mongoose";

import crypto from "node:crypto";
const PHONE_MATCH = [
  /^\+?[0-9]{10,15}$/,
  "Invalid phone number",
];

const EMAIL_MATCH = [
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  "Invalid email format",
];

const studentSchema = new mongoose.Schema(
  {
    /* ---------------------------------------------------------------------- */
    /* IDENTITY & TENANCY                                                      */
    /* ---------------------------------------------------------------------- */

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

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
    `stu_${crypto.randomBytes(16).toString("base64url")}`,
},
    enrollmentNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 50,
      index: true,
    },

    /* ---------------------------------------------------------------------- */
    /* ACADEMICS                                                               */
    /* ---------------------------------------------------------------------- */

    course: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    branch: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
    },

    year: {
      type: Number,
      min: 1,
      max: 10,
      default: null,
    },

    semester: {
      type: Number,
      min: 1,
      max: 12,
      default: null,
    },

    section: {
      type: String,
      trim: true,
      maxlength: 50,
      default: null,
    },

    rollNumber: {
      type: String,
      trim: true,
      maxlength: 50,
      default: null,
    },

    academicStatus: {
      type: String,
      enum: [
        "active",
        "alumni",
        "suspended",
        "dropped_out",
        "graduating",
      ],
      default: "active",
      index: true,
    },

    /* ---------------------------------------------------------------------- */
    /* PERFORMANCE                                                             */
    /* ---------------------------------------------------------------------- */

    performance: {
      cgpa: {
        type: Number,
        min: 0,
        max: 10,
        default: null,
      },

      attendancePercent: {
        type: Number,
        min: 0,
        max: 100,
        default: null,
      },

      assignmentsSubmitted: {
        type: Number,
        min: 0,
        default: 0,
      },

      assignmentsPending: {
        type: Number,
        min: 0,
        default: 0,
      },

      lastComputedAt: {
        type: Date,
        default: null,
      },
    },

    /* ---------------------------------------------------------------------- */
    /* GUARDIAN                                                                */
    /* ---------------------------------------------------------------------- */

    guardian: {
      name: {
        type: String,
        trim: true,
        maxlength: 150,
        default: null,
      },

      relationship: {
        type: String,
        enum: [
          "father",
          "mother",
          "sibling",
          "other",
          null,
        ],
        default: null,
      },

      phone: {
        type: String,
        trim: true,
        match: PHONE_MATCH,
        default: null,
      },

      email: {
        type: String,
        lowercase: true,
        trim: true,
        maxlength: 254,
        match: EMAIL_MATCH,
        default: null,
      },

      occupation: {
        type: String,
        trim: true,
        maxlength: 150,
        default: null,
      },
    },

    /* ---------------------------------------------------------------------- */
    /* FEES                                                                    */
    /* ---------------------------------------------------------------------- */

    fees: {
      totalAnnual: {
        type: Number,
        min: 0,
        default: null,
      },

      paid: {
        type: Number,
        min: 0,
        default: 0,
      },

      pending: {
        type: Number,
        min: 0,
        default: null,
      },

      dueDate: {
        type: Date,
        default: null,
      },

      scholarshipPercent: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
    },

    /* ---------------------------------------------------------------------- */
    /* ACTIVITIES                                                              */
    /* ---------------------------------------------------------------------- */

    activities: [
      {
        _id: false,

        type: {
          type: String,
          enum: [
            "sports",
            "cultural",
            "technical",
            "social",
            "other",
          ],
          required: true,
        },

        name: {
          type: String,
          trim: true,
          maxlength: 200,
          required: true,
        },

        date: {
          type: Date,
          default: null,
        },

        achievement: {
          type: String,
          trim: true,
          maxlength: 1000,
          default: null,
        },
      },
    ],

    /* ---------------------------------------------------------------------- */
    /* DOCUMENTS                                                               */
    /* ---------------------------------------------------------------------- */

    documents: [
      {
        _id: false,

        type: {
          type: String,
          enum: [
            "id_card",
            "marksheet",
            "transfer_certificate",
            "other",
          ],
          required: true,
        },

        name: {
          type: String,
          trim: true,
          maxlength: 200,
          required: true,
        },

        url: {
          type: String,
          trim: true,
          maxlength: 2048,
          required: true,
        },

        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    /* ---------------------------------------------------------------------- */
    /* AUDIT / LIFECYCLE                                                       */
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
/* Indexes                                                                    */
/* -------------------------------------------------------------------------- */

studentSchema.index(
  {
    instituteId: 1,
    enrollmentNumber: 1,
  },
  {
    unique: true,
    name: "student_institute_enrollment_unique",
  }
);

studentSchema.index({
  instituteId: 1,
  course: 1,
  year: 1,
});

studentSchema.index({
  instituteId: 1,
  academicStatus: 1,
});

studentSchema.index({
  instituteId: 1,
  isDeleted: 1,
});

studentSchema.index({
  instituteId: 1,
  section: 1,
});

studentSchema.index({
  instituteId: 1,
  rollNumber: 1,
});

/* -------------------------------------------------------------------------- */
/* Validation                                                                 */
/* -------------------------------------------------------------------------- */

studentSchema.pre("validate", function (next) {
  if (
    this.fees?.totalAnnual != null &&
    this.fees.paid > this.fees.totalAnnual
  ) {
    return next(
      new Error(
        "Paid fees cannot exceed total annual fees"
      )
    );
  }

  if (
    this.academicStatus === "active" &&
    this.isDeleted
  ) {
    this.isDeleted = false;
    this.deletedAt = null;
  }

  next();
});

/* -------------------------------------------------------------------------- */
/* Virtuals                                                                   */
/* -------------------------------------------------------------------------- */

studentSchema.virtual("feePending").get(
  function () {
    if (this.fees?.totalAnnual == null) {
      return null;
    }

    return Math.max(
      0,
      this.fees.totalAnnual -
        (this.fees.paid ?? 0)
    );
  }
);

studentSchema.virtual("netAnnualFee").get(
  function () {
    if (this.fees?.totalAnnual == null) {
      return null;
    }

    const scholarship =
      this.fees.totalAnnual *
      ((this.fees.scholarshipPercent ?? 0) /
        100);

    return Math.max(
      0,
      this.fees.totalAnnual - scholarship
    );
  }
);

studentSchema.virtual("isActive").get(
  function () {
    return (
      this.academicStatus === "active" &&
      !this.isDeleted
    );
  }
);

/* -------------------------------------------------------------------------- */
/* Query helpers                                                              */
/* -------------------------------------------------------------------------- */

studentSchema.query.byInstitute =
  function (instituteId) {
    return this.where({
      instituteId,
      isDeleted: false,
    });
  };

studentSchema.query.active =
  function () {
    return this.where({
      academicStatus: "active",
      isDeleted: false,
    });
  };

studentSchema.query.notDeleted =
  function () {
    return this.where({
      isDeleted: false,
    });
  };

/* -------------------------------------------------------------------------- */
/* Instance methods                                                           */
/* -------------------------------------------------------------------------- */

studentSchema.methods.softDelete =
  async function (byUserId = null) {
    this.isDeleted = true;
    this.deletedAt = new Date();

    if (byUserId) {
      this.updatedBy = byUserId;
    }

    return this.save();
  };

studentSchema.methods.restore =
  async function (byUserId = null) {
    this.isDeleted = false;
    this.deletedAt = null;

    if (byUserId) {
      this.updatedBy = byUserId;
    }

    return this.save();
  };

studentSchema.methods.updateFeePayment =
  async function (
    amount,
    byUserId = null
  ) {
    const payment = Number(amount);

    if (
      !Number.isFinite(payment) ||
      payment <= 0
    ) {
      throw new Error(
        "Payment amount must be greater than zero"
      );
    }

    if (this.fees.totalAnnual == null) {
      throw new Error(
        "Total annual fee is not configured"
      );
    }

    const currentPaid =
      this.fees.paid || 0;

    const newPaid =
      currentPaid + payment;

    if (
      newPaid > this.fees.totalAnnual
    ) {
      throw new Error(
        "Payment exceeds outstanding fee"
      );
    }

    this.fees.paid = newPaid;
    this.fees.pending =
      Math.max(
        0,
        this.fees.totalAnnual - newPaid
      );

    if (byUserId) {
      this.updatedBy = byUserId;
    }

    return this.save();
  };

/* -------------------------------------------------------------------------- */
/* Model                                                                      */
/* -------------------------------------------------------------------------- */

const Student =
  mongoose.models.Student ||
  mongoose.model("Student", studentSchema);

export default Student;
