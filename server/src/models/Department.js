// server/src/models/Department.js

import mongoose from "mongoose";

const DEPARTMENT_STATUS = [
  "active",
  "inactive",
  "archived",
];

const departmentSchema = new mongoose.Schema(
  {
    /* ---------------------------------------------------------------------- */
    /* TENANCY                                                                 */
    /* ---------------------------------------------------------------------- */

    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    /* ---------------------------------------------------------------------- */
    /* IDENTITY                                                                */
    /* ---------------------------------------------------------------------- */

    name: {
      type: String,
      required: [
        true,
        "Department name is required",
      ],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    code: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 20,
      default: null,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },

    /* ---------------------------------------------------------------------- */
    /* LEADERSHIP                                                              */
    /* ---------------------------------------------------------------------- */

    head: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    deputyHead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /* ---------------------------------------------------------------------- */
    /* ORGANIZATION STRUCTURE                                                  */
    /* ---------------------------------------------------------------------- */

    parentDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
      index: true,
    },

    costCenter: {
      type: String,
      trim: true,
      maxlength: 50,
      default: null,
    },

    /* ---------------------------------------------------------------------- */
    /* BUDGET                                                                  */
    /* ---------------------------------------------------------------------- */

    budget: {
      annual: {
        type: Number,
        min: 0,
        default: null,
      },

      spent: {
        type: Number,
        min: 0,
        default: 0,
      },

      currency: {
        type: String,
        trim: true,
        uppercase: true,
        minlength: 3,
        maxlength: 3,
        default: "INR",
      },
    },

    /* ---------------------------------------------------------------------- */
    /* WORKFORCE CACHE                                                         */
    /* ---------------------------------------------------------------------- */

    stats: {
      employeeCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      openPositions: {
        type: Number,
        min: 0,
        default: 0,
      },

      avgTenureMonths: {
        type: Number,
        min: 0,
        default: null,
      },

      lastComputedAt: {
        type: Date,
        default: null,
      },
    },

    /* ---------------------------------------------------------------------- */
    /* STATUS                                                                   */
    /* ---------------------------------------------------------------------- */

    status: {
      type: String,
      enum: {
        values: DEPARTMENT_STATUS,
        message: "Invalid department status",
      },
      default: "active",
      index: true,
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

departmentSchema.index(
  {
    instituteId: 1,
    name: 1,
  },
  {
    unique: true,
    name: "department_institute_name_unique",
  }
);

departmentSchema.index(
  {
    instituteId: 1,
    code: 1,
  },
  {
    unique: true,
    sparse: true,
    name: "department_institute_code_unique",
  }
);

departmentSchema.index(
  {
    instituteId: 1,
    status: 1,
  },
  {
    name: "department_institute_status",
  }
);

departmentSchema.index(
  {
    instituteId: 1,
    parentDepartment: 1,
  },
  {
    name: "department_parent",
  }
);

departmentSchema.index(
  {
    instituteId: 1,
    head: 1,
  },
  {
    name: "department_head",
  }
);

departmentSchema.index(
  {
    instituteId: 1,
    isDeleted: 1,
  },
  {
    name: "department_deleted",
  }
);

/* -------------------------------------------------------------------------- */
/* VALIDATION                                                                 */
/* -------------------------------------------------------------------------- */

departmentSchema.pre(
  "validate",
  async function (next) {
    if (
      this.parentDepartment &&
      this._id &&
      this.parentDepartment.toString() ===
        this._id.toString()
    ) {
      return next(
        new Error(
          "A department cannot be its own parent"
        )
      );
    }

    if (
      this.budget?.annual != null &&
      this.budget.spent >
        this.budget.annual
    ) {
      return next(
        new Error(
          "Department budget spent cannot exceed annual budget"
        )
      );
    }

    next();
  }
);

/* -------------------------------------------------------------------------- */
/* VIRTUALS                                                                   */
/* -------------------------------------------------------------------------- */

departmentSchema.virtual(
  "budgetUtilization"
).get(function () {
  if (
    this.budget?.annual == null ||
    this.budget.annual <= 0
  ) {
    return null;
  }

  return Math.round(
    ((this.budget.spent || 0) /
      this.budget.annual) *
      100
  );
});

departmentSchema.virtual(
  "remainingBudget"
).get(function () {
  if (
    this.budget?.annual == null
  ) {
    return null;
  }

  return Math.max(
    0,
    this.budget.annual -
      (this.budget.spent || 0)
  );
});

departmentSchema.virtual(
  "isActive"
).get(function () {
  return (
    this.status === "active" &&
    !this.isDeleted
  );
});

departmentSchema.virtual(
  "isRootDepartment"
).get(function () {
  return !this.parentDepartment;
});

/* -------------------------------------------------------------------------- */
/* QUERY HELPERS                                                              */
/* -------------------------------------------------------------------------- */

departmentSchema.query.byInstitute =
  function (instituteId) {
    return this.where({
      instituteId,
      isDeleted: false,
    });
  };

departmentSchema.query.active =
  function () {
    return this.where({
      status: "active",
      isDeleted: false,
    });
  };

departmentSchema.query.notDeleted =
  function () {
    return this.where({
      isDeleted: false,
    });
  };

/* -------------------------------------------------------------------------- */
/* SOFT DELETE                                                                */
/* -------------------------------------------------------------------------- */

departmentSchema.methods.softDelete =
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

departmentSchema.methods.restore =
  async function (
    byUserId = null
  ) {
    this.isDeleted = false;
    this.deletedAt = null;

    if (byUserId) {
      this.updatedBy =
        byUserId;
    }

    return this.save();
  };

/* -------------------------------------------------------------------------- */
/* STATUS MANAGEMENT                                                          */
/* -------------------------------------------------------------------------- */

departmentSchema.methods.activate =
  async function (
    byUserId = null
  ) {
    this.status = "active";

    if (byUserId) {
      this.updatedBy =
        byUserId;
    }

    return this.save();
  };

departmentSchema.methods.deactivate =
  async function (
    byUserId = null
  ) {
    this.status = "inactive";

    if (byUserId) {
      this.updatedBy =
        byUserId;
    }

    return this.save();
  };

departmentSchema.methods.archive =
  async function (
    byUserId = null
  ) {
    this.status = "archived";

    if (byUserId) {
      this.updatedBy =
        byUserId;
    }

    return this.save();
  };

/* -------------------------------------------------------------------------- */
/* BUDGET METHODS                                                             */
/* -------------------------------------------------------------------------- */

departmentSchema.methods.addExpense =
  async function (
    amount,
    byUserId = null
  ) {
    const value = Number(amount);

    if (
      !Number.isFinite(value) ||
      value <= 0
    ) {
      throw new Error(
        "Expense amount must be greater than zero"
      );
    }

    if (
      this.budget?.annual != null &&
      (this.budget.spent || 0) +
        value >
        this.budget.annual
    ) {
      throw new Error(
        "Expense exceeds department annual budget"
      );
    }

    this.budget.spent =
      (this.budget.spent || 0) +
      value;

    if (byUserId) {
      this.updatedBy =
        byUserId;
    }

    return this.save();
  };

/* -------------------------------------------------------------------------- */
/* MODEL                                                                      */
/* -------------------------------------------------------------------------- */

export const Department =
  mongoose.models.Department ||
  mongoose.model(
    "Department",
    departmentSchema
  );

export {
  DEPARTMENT_STATUS,
};