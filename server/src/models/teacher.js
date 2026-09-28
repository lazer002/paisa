// server/src/models/teacher.js

import mongoose from "mongoose";

import crypto from "node:crypto";
const teacherSchema = new mongoose.Schema(
  {
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
    `teac_${crypto.randomBytes(16).toString("base64url")}`,
},
    employeeCode: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 50,
      default: null,
    },

    /* ---------------------------------------------------------------------- */
    /* TEACHING                                                                */
    /* ---------------------------------------------------------------------- */

    subjects: [
      {
        type: String,
        trim: true,
        maxlength: 100,
      },
    ],

    gradesTaught: [
      {
        type: String,
        trim: true,
        maxlength: 100,
      },
    ],

    /* ---------------------------------------------------------------------- */
    /* QUALIFICATIONS                                                          */
    /* ---------------------------------------------------------------------- */

    qualifications: [
      {
        _id: false,

        degree: {
          type: String,
          required: true,
          trim: true,
          maxlength: 150,
        },

        institution: {
          type: String,
          trim: true,
          maxlength: 200,
          default: null,
        },

        year: {
          type: Number,
          min: 1900,
          max: 2100,
          default: null,
        },
      },
    ],

    certifications: [
      {
        _id: false,

        name: {
          type: String,
          required: true,
          trim: true,
          maxlength: 200,
        },

        issuer: {
          type: String,
          trim: true,
          maxlength: 200,
          default: null,
        },

        year: {
          type: Number,
          min: 1900,
          max: 2100,
          default: null,
        },

        url: {
          type: String,
          trim: true,
          maxlength: 2048,
          default: null,
        },
      },
    ],

    experienceYears: {
      type: Number,
      min: 0,
      max: 60,
      default: 0,
    },

    previousEmployment: [
      {
        _id: false,

        school: {
          type: String,
          required: true,
          trim: true,
          maxlength: 200,
        },

        role: {
          type: String,
          trim: true,
          maxlength: 100,
          default: null,
        },

        from: {
          type: Date,
          default: null,
        },

        to: {
          type: Date,
          default: null,
        },
      },
    ],

    /* ---------------------------------------------------------------------- */
    /* WORKLOAD                                                                */
    /* ---------------------------------------------------------------------- */

    maxWeeklyHours: {
      type: Number,
      min: 0,
      max: 168,
      default: 24,
    },

    isClassTeacherOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      default: null,
      index: true,
    },

    /* ---------------------------------------------------------------------- */
    /* STATUS                                                                  */
    /* ---------------------------------------------------------------------- */

    employmentStatus: {
      type: String,
      enum: [
        "active",
        "on_leave",
        "resigned",
        "terminated",
        "retired",
      ],
      default: "active",
      index: true,
    },

    joiningDate: {
      type: Date,
      default: null,
    },

    leavingDate: {
      type: Date,
      default: null,
    },

    leavingReason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },

    /* ---------------------------------------------------------------------- */
    /* PERFORMANCE                                                             */
    /* ---------------------------------------------------------------------- */

    performance: {
      studentRating: {
        type: Number,
        min: 0,
        max: 5,
        default: null,
      },

      classesThisTerm: {
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
    /* AUDIT                                                                   */
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

teacherSchema.index({
  instituteId: 1,
  employmentStatus: 1,
});

teacherSchema.index({
  instituteId: 1,
  isDeleted: 1,
});

teacherSchema.index({
  instituteId: 1,
  userId: 1,
});

teacherSchema.index({
  instituteId: 1,
  isClassTeacherOf: 1,
});

/* -------------------------------------------------------------------------- */
/* Validation                                                                 */
/* -------------------------------------------------------------------------- */

teacherSchema.pre("validate", function (next) {
  if (
    this.joiningDate &&
    this.leavingDate &&
    this.leavingDate < this.joiningDate
  ) {
    return next(
      new Error(
        "Leaving date cannot be earlier than joining date"
      )
    );
  }

  if (
    this.employmentStatus === "active" &&
    this.leavingDate
  ) {
    this.leavingDate = null;
    this.leavingReason = null;
  }

  if (
    this.employmentStatus !== "active" &&
    !this.leavingDate &&
    this.isModified("employmentStatus")
  ) {
    this.leavingDate = new Date();
  }

  next();
});

/* -------------------------------------------------------------------------- */
/* Query helpers                                                              */
/* -------------------------------------------------------------------------- */

teacherSchema.query.active = function () {
  return this.where({
    employmentStatus: "active",
    isDeleted: false,
  });
};

teacherSchema.query.byInstitute = function (
  instituteId
) {
  return this.where({
    instituteId,
    isDeleted: false,
  });
};

teacherSchema.query.notDeleted = function () {
  return this.where({
    isDeleted: false,
  });
};

/* -------------------------------------------------------------------------- */
/* Virtuals                                                                   */
/* -------------------------------------------------------------------------- */

teacherSchema.virtual("isActive").get(function () {
  return (
    this.employmentStatus === "active" &&
    !this.isDeleted
  );
});

teacherSchema.virtual("tenureDays").get(function () {
  if (!this.joiningDate) {
    return null;
  }

  const endDate =
    this.leavingDate || new Date();

  return Math.max(
    0,
    Math.floor(
      (endDate - this.joiningDate) /
        (1000 * 60 * 60 * 24)
    )
  );
});

/* -------------------------------------------------------------------------- */
/* Instance methods                                                           */
/* -------------------------------------------------------------------------- */

teacherSchema.methods.softDelete =
  async function (byUserId = null) {
    this.isDeleted = true;
    this.deletedAt = new Date();

    if (byUserId) {
      this.updatedBy = byUserId;
    }

    return this.save();
  };

teacherSchema.methods.restore =
  async function (byUserId = null) {
    this.isDeleted = false;
    this.deletedAt = null;

    if (byUserId) {
      this.updatedBy = byUserId;
    }

    return this.save();
  };

/* -------------------------------------------------------------------------- */
/* Model                                                                      */
/* -------------------------------------------------------------------------- */

const Teacher =
  mongoose.models.Teacher ||
  mongoose.model("Teacher", teacherSchema);

export default Teacher;
