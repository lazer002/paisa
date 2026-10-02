// server/src/models/hr.js

import mongoose from "mongoose";
import crypto from "node:crypto";

const hrSchema = new mongoose.Schema(
  {
    /* ---------------------------------------------------------------------- */
    /* REFERENCES                                                             */
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
        `hr_${crypto.randomBytes(16).toString("base64url")}`,
    },

    /* ---------------------------------------------------------------------- */
    /* BASIC HR INFORMATION                                                   */
    /* ---------------------------------------------------------------------- */

    employeeCode: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 50,
      default: null,
    },

    designation: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "HR Manager",
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
      index: true,
    },

    reportingManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    workLocation: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
    },

    workEmail: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 200,
      default: null,
    },

    /* ---------------------------------------------------------------------- */
    /* CONTACT                                                                */
    /* ---------------------------------------------------------------------- */

    phone: {
      type: String,
      trim: true,
      maxlength: 30,
      default: null,
    },

    alternatePhone: {
      type: String,
      trim: true,
      maxlength: 30,
      default: null,
    },

    /* ---------------------------------------------------------------------- */
    /* HR RESPONSIBILITIES                                                    */
    /* ---------------------------------------------------------------------- */

    responsibilities: [
      {
        type: String,
        trim: true,
        maxlength: 200,
      },
    ],

    managedDepartments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
      },
    ],

    managedEmployees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    /* ---------------------------------------------------------------------- */
    /* RECRUITMENT                                                            */
    /* ---------------------------------------------------------------------- */

    recruitmentAccess: {
      type: Boolean,
      default: true,
    },

    canCreateEmployees: {
      type: Boolean,
      default: true,
    },

    canManageEmployeeProfiles: {
      type: Boolean,
      default: true,
    },

    canManageLeaves: {
      type: Boolean,
      default: true,
    },

    canManageAttendance: {
      type: Boolean,
      default: true,
    },

    canManagePayroll: {
      type: Boolean,
      default: false,
    },

    canManageDepartments: {
      type: Boolean,
      default: false,
    },

    /* ---------------------------------------------------------------------- */
    /* EMPLOYEE MANAGEMENT                                                    */
    /* ---------------------------------------------------------------------- */

    totalEmployeesManaged: {
      type: Number,
      min: 0,
      default: 0,
    },

    activeEmployeesManaged: {
      type: Number,
      min: 0,
      default: 0,
    },

    /* ---------------------------------------------------------------------- */
    /* EXPERIENCE / QUALIFICATIONS                                            */
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

        company: {
          type: String,
          required: true,
          trim: true,
          maxlength: 200,
        },

        role: {
          type: String,
          trim: true,
          maxlength: 150,
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
    /* EMPLOYMENT                                                              */
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
      employeesHandled: {
        type: Number,
        min: 0,
        default: 0,
      },

      leavesProcessed: {
        type: Number,
        min: 0,
        default: 0,
      },

      recruitmentCount: {
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
/* INDEXES                                                                    */
/* -------------------------------------------------------------------------- */

hrSchema.index({
  instituteId: 1,
  employmentStatus: 1,
});

hrSchema.index({
  instituteId: 1,
  isDeleted: 1,
});

hrSchema.index({
  instituteId: 1,
  userId: 1,
});

/* -------------------------------------------------------------------------- */
/* VALIDATION                                                                 */
/* -------------------------------------------------------------------------- */

hrSchema.pre("validate", function (next) {
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
/* QUERY HELPERS                                                             */
/* -------------------------------------------------------------------------- */

hrSchema.query.active = function () {
  return this.where({
    employmentStatus: "active",
    isDeleted: false,
  });
};

hrSchema.query.byInstitute = function (
  instituteId
) {
  return this.where({
    instituteId,
    isDeleted: false,
  });
};

hrSchema.query.notDeleted = function () {
  return this.where({
    isDeleted: false,
  });
};

/* -------------------------------------------------------------------------- */
/* VIRTUALS                                                                   */
/* -------------------------------------------------------------------------- */

hrSchema.virtual("isActive").get(function () {
  return (
    this.employmentStatus === "active" &&
    !this.isDeleted
  );
});

hrSchema.virtual("tenureDays").get(function () {
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
/* INSTANCE METHODS                                                           */
/* -------------------------------------------------------------------------- */

hrSchema.methods.softDelete =
  async function (byUserId = null) {
    this.isDeleted = true;
    this.deletedAt = new Date();

    if (byUserId) {
      this.updatedBy = byUserId;
    }

    return this.save();
  };

hrSchema.methods.restore =
  async function (byUserId = null) {
    this.isDeleted = false;
    this.deletedAt = null;

    if (byUserId) {
      this.updatedBy = byUserId;
    }

    return this.save();
  };

/* -------------------------------------------------------------------------- */
/* MODEL                                                                      */
/* -------------------------------------------------------------------------- */

const HR =
  mongoose.models.HR ||
  mongoose.model("HR", hrSchema);

export default HR;