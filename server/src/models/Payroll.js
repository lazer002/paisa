// server/src/models/Payroll.js

import mongoose from "mongoose";

import crypto from "node:crypto";
const ALLOWANCE_FIELDS = [
  "hra",
  "transport",
  "medical",
  "special",
  "performance",
  "overtime",
  "bonus",
  "other",
];

const DEDUCTION_FIELDS = [
  "pf",
  "esi",
  "tax",
  "professionalTax",
  "loanRecovery",
  "lopDays",
  "lopAmount",
  "other",
];

const PAYMENT_METHODS = [
  "bank_transfer",
  "cheque",
  "cash",
  "upi",
];

const PAYROLL_STATUSES = [
  "draft",
  "processed",
  "approved",
  "paid",
  "cancelled",
];

const payrollSchema = new mongoose.Schema(
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
    `payr_${crypto.randomBytes(16).toString("base64url")}`,
},
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /* ---------------------------------------------------------------------- */
    /* PAY PERIOD                                                               */
    /* ---------------------------------------------------------------------- */

    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },

    year: {
      type: Number,
      required: true,
      min: 2000,
      max: 2200,
    },

    periodStart: {
      type: Date,
      default: null,
    },

    periodEnd: {
      type: Date,
      default: null,
    },

    /* ---------------------------------------------------------------------- */
    /* EARNINGS                                                                 */
    /* ---------------------------------------------------------------------- */

    basicSalary: {
      type: Number,
      required: true,
      min: 0,
    },

    allowances: {
      hra: {
        type: Number,
        min: 0,
        default: 0,
      },

      transport: {
        type: Number,
        min: 0,
        default: 0,
      },

      medical: {
        type: Number,
        min: 0,
        default: 0,
      },

      special: {
        type: Number,
        min: 0,
        default: 0,
      },

      performance: {
        type: Number,
        min: 0,
        default: 0,
      },

      overtime: {
        type: Number,
        min: 0,
        default: 0,
      },

      bonus: {
        type: Number,
        min: 0,
        default: 0,
      },

      other: {
        type: Number,
        min: 0,
        default: 0,
      },
    },

    /* ---------------------------------------------------------------------- */
    /* DEDUCTIONS                                                               */
    /* ---------------------------------------------------------------------- */

    deductions: {
      pf: {
        type: Number,
        min: 0,
        default: 0,
      },

      esi: {
        type: Number,
        min: 0,
        default: 0,
      },

      tax: {
        type: Number,
        min: 0,
        default: 0,
      },

      professionalTax: {
        type: Number,
        min: 0,
        default: 0,
      },

      loanRecovery: {
        type: Number,
        min: 0,
        default: 0,
      },

      lopDays: {
        type: Number,
        min: 0,
        default: 0,
      },

      lopAmount: {
        type: Number,
        min: 0,
        default: 0,
      },

      other: {
        type: Number,
        min: 0,
        default: 0,
      },
    },

    /* ---------------------------------------------------------------------- */
    /* ATTENDANCE SNAPSHOT                                                     */
    /* ---------------------------------------------------------------------- */

    attendanceSummary: {
      workingDays: {
        type: Number,
        min: 0,
        default: 0,
      },

      presentDays: {
        type: Number,
        min: 0,
        default: 0,
      },

      paidLeaveDays: {
        type: Number,
        min: 0,
        default: 0,
      },

      unpaidLeaveDays: {
        type: Number,
        min: 0,
        default: 0,
      },
    },

    /* ---------------------------------------------------------------------- */
    /* SERVER-COMPUTED TOTALS                                                  */
    /* ---------------------------------------------------------------------- */

    grossSalary: {
      type: Number,
      min: 0,
      default: 0,
    },

    totalDeductions: {
      type: Number,
      min: 0,
      default: 0,
    },

    netSalary: {
      type: Number,
      default: 0,
    },

    /* ---------------------------------------------------------------------- */
    /* PAYMENT WORKFLOW                                                         */
    /* ---------------------------------------------------------------------- */

    status: {
      type: String,
      enum: {
        values: PAYROLL_STATUSES,
        message: "Invalid payroll status",
      },
      default: "draft",
      index: true,
    },

    payment: {
      method: {
        type: String,
        enum: [
          ...PAYMENT_METHODS,
          null,
        ],
        default: null,
      },

      referenceNo: {
        type: String,
        trim: true,
        maxlength: 150,
        default: null,
      },

      paidAt: {
        type: Date,
        default: null,
      },

      // Only store a masked/last-four representation.
      paidToAccount: {
        type: String,
        trim: true,
        maxlength: 20,
        default: null,
      },

      utr: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },
    },

    /* ---------------------------------------------------------------------- */
    /* WORKFLOW / AUDIT                                                        */
    /* ---------------------------------------------------------------------- */

    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    remarks: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },

    payslipUrl: {
      type: String,
      trim: true,
      maxlength: 2048,
      default: null,
    },

    revision: {
      type: Number,
      min: 1,
      default: 1,
    },

    isFinalized: {
      type: Boolean,
      default: false,
      index: true,
    },

    finalizedAt: {
      type: Date,
      default: null,
    },

    finalizedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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

payrollSchema.index(
  {
    instituteId: 1,
    employeeId: 1,
    month: 1,
    year: 1,
  },
  {
    unique: true,
    name: "payroll_employee_period_unique",
  }
);

payrollSchema.index(
  {
    instituteId: 1,
    month: 1,
    year: 1,
  },
  {
    name: "payroll_institute_period",
  }
);

payrollSchema.index(
  {
    instituteId: 1,
    status: 1,
  },
  {
    name: "payroll_institute_status",
  }
);

payrollSchema.index(
  {
    instituteId: 1,
    employeeId: 1,
    createdAt: -1,
  },
  {
    name: "payroll_employee_history",
  }
);

payrollSchema.index(
  {
    instituteId: 1,
    isFinalized: 1,
  },
  {
    name: "payroll_institute_finalized",
  }
);

/* -------------------------------------------------------------------------- */
/* VIRTUALS                                                                   */
/* -------------------------------------------------------------------------- */

payrollSchema.virtual("periodLabel").get(
  function () {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    return `${months[this.month - 1]} ${this.year}`;
  }
);

payrollSchema.virtual("isPaid").get(
  function () {
    return this.status === "paid";
  }
);

payrollSchema.virtual("isEditable").get(
  function () {
    return (
      !this.isFinalized &&
      this.status !== "paid" &&
      this.status !== "cancelled"
    );
  }
);

payrollSchema.virtual("attendanceDaysAccounted").get(
  function () {
    const summary =
      this.attendanceSummary || {};

    return (
      (summary.presentDays || 0) +
      (summary.paidLeaveDays || 0) +
      (summary.unpaidLeaveDays || 0)
    );
  }
);

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

function sumComponents(
  object,
  fields
) {
  return fields.reduce(
    (total, field) => {
      const value = Number(
        object?.[field]
      );

      return (
        total +
        (Number.isFinite(value)
          ? value
          : 0)
      );
    },
    0
  );
}

/* -------------------------------------------------------------------------- */
/* TOTAL CALCULATION                                                           */
/* -------------------------------------------------------------------------- */

payrollSchema.statics.computeTotals =
  function (doc) {
    const basicSalary =
      Number(doc.basicSalary) || 0;

    const allowances =
      sumComponents(
        doc.allowances,
        ALLOWANCE_FIELDS
      );

    const deductions =
      sumComponents(
        doc.deductions,
        DEDUCTION_FIELDS
      );

    doc.grossSalary =
      Math.max(
        0,
        basicSalary + allowances
      );

    doc.totalDeductions =
      Math.min(
        doc.grossSalary,
        Math.max(0, deductions)
      );

    doc.netSalary =
      Math.max(
        0,
        doc.grossSalary -
          doc.totalDeductions
      );

    return doc;
  };

/* -------------------------------------------------------------------------- */
/* VALIDATION                                                                  */
/* -------------------------------------------------------------------------- */

payrollSchema.pre(
  "validate",
  function (next) {
    if (
      this.periodStart &&
      this.periodEnd &&
      this.periodEnd < this.periodStart
    ) {
      return next(
        new Error(
          "Payroll period end cannot be before period start"
        )
      );
    }

    const attendance =
      this.attendanceSummary || {};

    const accountedDays =
      (attendance.presentDays || 0) +
      (attendance.paidLeaveDays || 0) +
      (attendance.unpaidLeaveDays || 0);

    if (
      attendance.workingDays > 0 &&
      accountedDays >
        attendance.workingDays
    ) {
      return next(
        new Error(
          "Attendance days cannot exceed working days"
        )
      );
    }

    if (
      this.deductions?.lopDays >
        attendance.workingDays
    ) {
      return next(
        new Error(
          "Loss-of-pay days cannot exceed working days"
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
          "Approved payroll must contain approval audit information"
        )
      );
    }

    if (
      this.status === "paid" &&
      (!this.payment?.paidAt ||
        !this.payment?.method)
    ) {
      return next(
        new Error(
          "Paid payroll must contain payment information"
        )
      );
    }

    if (
      this.isFinalized &&
      this.status !== "paid"
    ) {
      return next(
        new Error(
          "Only paid payroll can be finalized"
        )
      );
    }

    if (
      this.isFinalized &&
      !this.finalizedAt
    ) {
      this.finalizedAt =
        new Date();
    }

    next();
  }
);

/* -------------------------------------------------------------------------- */
/* AUTO-COMPUTE TOTALS                                                         */
/* -------------------------------------------------------------------------- */

payrollSchema.pre(
  "save",
  function (next) {
    const wasFinanciallyModified =
      this.isNew ||
      this.isModified(
        "basicSalary"
      ) ||
      this.isModified(
        "allowances"
      ) ||
      this.isModified(
        "deductions"
      );

    if (
      wasFinanciallyModified
    ) {
      const basicSalary =
        Number(
          this.basicSalary
        ) || 0;

      const allowances =
        sumComponents(
          this.allowances,
          ALLOWANCE_FIELDS
        );

      const deductions =
        sumComponents(
          this.deductions,
          DEDUCTION_FIELDS
        );

      this.grossSalary =
        Math.max(
          0,
          basicSalary +
            allowances
        );

      this.totalDeductions =
        Math.min(
          this.grossSalary,
          Math.max(
            0,
            deductions
          )
        );

      this.netSalary =
        Math.max(
          0,
          this.grossSalary -
            this.totalDeductions
        );
    }

    next();
  }
);

/* -------------------------------------------------------------------------- */
/* QUERY HELPERS                                                               */
/* -------------------------------------------------------------------------- */

payrollSchema.query.byInstitute =
  function (instituteId) {
    return this.where({
      instituteId,
    });
  };

payrollSchema.query.byPeriod =
  function (month, year) {
    return this.where({
      month,
      year,
    });
  };

payrollSchema.query.byEmployee =
  function (employeeId) {
    return this.where({
      employeeId,
    });
  };

payrollSchema.query.active =
  function () {
    return this.where({
      status: {
        $nin: [
          "cancelled",
        ],
      },
    });
  };

payrollSchema.query.finalized =
  function () {
    return this.where({
      isFinalized: true,
    });
  };

/* -------------------------------------------------------------------------- */
/* INSTANCE METHODS                                                            */
/* -------------------------------------------------------------------------- */

payrollSchema.methods.recalculate =
  function () {
    const basicSalary =
      Number(
        this.basicSalary
      ) || 0;

    const allowances =
      sumComponents(
        this.allowances,
        ALLOWANCE_FIELDS
      );

    const deductions =
      sumComponents(
        this.deductions,
        DEDUCTION_FIELDS
      );

    this.grossSalary =
      Math.max(
        0,
        basicSalary +
          allowances
      );

    this.totalDeductions =
      Math.min(
        this.grossSalary,
        Math.max(
          0,
          deductions
        )
      );

    this.netSalary =
      Math.max(
        0,
        this.grossSalary -
          this.totalDeductions
      );

    return this;
  };

payrollSchema.methods.canEdit =
  function () {
    return (
      !this.isFinalized &&
      this.status !== "paid" &&
      this.status !== "cancelled"
    );
  };

payrollSchema.methods.approve =
  async function (userId) {
    if (!this.canEdit()) {
      throw new Error(
        "Finalized payroll cannot be approved"
      );
    }

    this.status = "approved";
    this.approvedBy = userId;
    this.approvedAt = new Date();
    this.revision += 1;

    return this.save();
  };

payrollSchema.methods.process =
  async function (userId) {
    if (!this.canEdit()) {
      throw new Error(
        "This payroll cannot be processed"
      );
    }

    this.status = "processed";
    this.processedBy = userId;
    this.revision += 1;

    return this.save();
  };

payrollSchema.methods.markPaid =
  async function ({
    method,
    referenceNo = null,
    utr = null,
    paidToAccount = null,
  } = {}) {
    if (
      this.status !== "approved"
    ) {
      throw new Error(
        "Only approved payroll can be marked as paid"
      );
    }

    if (
      !PAYMENT_METHODS.includes(
        method
      )
    ) {
      throw new Error(
        "Invalid payment method"
      );
    }

    this.status = "paid";

    this.payment.method =
      method;

    this.payment.referenceNo =
      referenceNo;

    this.payment.utr =
      utr;

    this.payment.paidToAccount =
      paidToAccount;

    this.payment.paidAt =
      new Date();

    this.isFinalized = true;
    this.finalizedAt =
      new Date();

    this.revision += 1;

    return this.save();
  };

payrollSchema.methods.cancel =
  async function () {
    if (this.isFinalized) {
      throw new Error(
        "Finalized payroll cannot be cancelled"
      );
    }

    if (this.status === "paid") {
      throw new Error(
        "Paid payroll cannot be cancelled"
      );
    }

    this.status = "cancelled";
    this.revision += 1;

    return this.save();
  };

/* -------------------------------------------------------------------------- */
/* MODEL                                                                       */
/* -------------------------------------------------------------------------- */

export const Payroll =
  mongoose.models.Payroll ||
  mongoose.model(
    "Payroll",
    payrollSchema
  );

export default Payroll;
