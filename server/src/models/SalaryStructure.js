// server/src/models/SalaryStructure.js

import mongoose from "mongoose";

import crypto from "node:crypto";
const SALARY_STATUSES = [
  "draft",
  "active",
  "inactive",
  "expired",
  "archived",
  "cancelled",
];

const SALARY_TYPES = [
  "monthly",
  "annual",
  "hourly",
  "daily",
  "contract",
];

const COMPONENT_TYPES = [
  "earning",
  "deduction",
  "employer_contribution",
  "reimbursement",
  "benefit",
];

const CALCULATION_TYPES = [
  "fixed",
  "percentage",
  "formula",
  "per_day",
  "per_hour",
  "per_unit",
];

const PERCENTAGE_BASES = [
  "basic",
  "gross",
  "net",
  "ctc",
  "component",
  "custom",
];

const COMPONENT_CATEGORIES = [
  "basic",
  "hra",
  "da",
  "special_allowance",
  "transport",
  "medical",
  "bonus",
  "commission",
  "overtime",
  "incentive",
  "pf",
  "esi",
  "professional_tax",
  "income_tax",
  "loan",
  "advance",
  "insurance",
  "leave_deduction",
  "other",
];

const PAY_FREQUENCIES = [
  "monthly",
  "weekly",
  "biweekly",
  "daily",
  "hourly",
  "custom",
];

const approvalSchema = new mongoose.Schema(
  {
    required: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "rejected",
      ],
      default: "pending",
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

    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    rejectedAt: {
      type: Date,
      default: null,
    },

    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },

    comments: {
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

const componentSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 100,
      required: true,
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
      maxlength: 2000,
      default: null,
    },

    type: {
      type: String,
      enum: COMPONENT_TYPES,
      required: true,
    },

    category: {
      type: String,
      enum: COMPONENT_CATEGORIES,
      default: "other",
    },

    calculationType: {
      type: String,
      enum: CALCULATION_TYPES,
      default: "fixed",
    },

    amount: {
      type: Number,
      min: 0,
      default: 0,
    },

    percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    percentageBase: {
      type: String,
      enum: PERCENTAGE_BASES,
      default: null,
    },

    baseComponentCode: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 100,
      default: null,
    },

    formula: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: null,
    },

    perDayAmount: {
      type: Number,
      min: 0,
      default: null,
    },

    perHourAmount: {
      type: Number,
      min: 0,
      default: null,
    },

    perUnitAmount: {
      type: Number,
      min: 0,
      default: null,
    },

    unit: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    taxable: {
      type: Boolean,
      default: false,
    },

    includedInGross: {
      type: Boolean,
      default: true,
    },

    includedInCTC: {
      type: Boolean,
      default: true,
    },

    includedInNet: {
      type: Boolean,
      default: false,
    },

    recurring: {
      type: Boolean,
      default: true,
    },

    proratable: {
      type: Boolean,
      default: true,
    },

    overtimeEligible: {
      type: Boolean,
      default: false,
    },

    active: {
      type: Boolean,
      default: true,
    },

    displayOrder: {
      type: Number,
      min: 0,
      default: 0,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    _id: true,
  }
);

const revisionSchema = new mongoose.Schema(
  {
    version: {
      type: Number,
      min: 1,
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

    changeType: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "update",
    },

    reason: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },

    snapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    _id: false,
  }
);

const salaryStructureSchema =
  new mongoose.Schema(
    {
      /* ==================================================================== */
      /* TENANCY                                                              */
      /* ==================================================================== */

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
    `sal_${crypto.randomBytes(16).toString("base64url")}`,
},
      /* ==================================================================== */
      /* IDENTITY                                                             */
      /* ==================================================================== */

      structureCode: {
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

      name: {
        type: String,
        trim: true,
        minlength: 2,
        maxlength: 300,
        required: true,
      },

      slug: {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: 300,
        index: true,
      },

      description: {
        type: String,
        trim: true,
        maxlength: 5000,
        default: null,
      },

      /* ==================================================================== */
      /* STATUS                                                               */
      /* ==================================================================== */

      status: {
        type: String,
        enum: SALARY_STATUSES,
        default: "draft",
        index: true,
      },

      type: {
        type: String,
        enum: SALARY_TYPES,
        default: "monthly",
      },

      payFrequency: {
        type: String,
        enum: PAY_FREQUENCIES,
        default: "monthly",
      },

      currency: {
        type: String,
        trim: true,
        uppercase: true,
        minlength: 3,
        maxlength: 3,
        default: "INR",
      },

      /* ==================================================================== */
      /* EMPLOYEE                                                             */
      /* ==================================================================== */

      employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        default: null,
        index: true,
      },

      employeeIds: {
        type: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee",
          },
        ],
        default: [],
      },

      departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
        default: null,
        index: true,
      },

      designation: {
        type: String,
        trim: true,
        maxlength: 300,
        default: null,
      },

      grade: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      /* ==================================================================== */
      /* BASE SALARY                                                          */
      /* ==================================================================== */

      baseSalary: {
        type: Number,
        min: 0,
        required: true,
        default: 0,
      },

      annualBaseSalary: {
        type: Number,
        min: 0,
        default: 0,
      },

      monthlyBaseSalary: {
        type: Number,
        min: 0,
        default: 0,
      },

      /* ==================================================================== */
      /* COMPONENTS                                                           */
      /* ==================================================================== */

      components: {
        type: [componentSchema],
        default: [],
      },

      /* ==================================================================== */
      /* TOTALS                                                               */
      /* ==================================================================== */

      totals: {
        monthlyEarnings: {
          type: Number,
          min: 0,
          default: 0,
        },

        monthlyDeductions: {
          type: Number,
          min: 0,
          default: 0,
        },

        monthlyEmployerContributions: {
          type: Number,
          min: 0,
          default: 0,
        },

        monthlyReimbursements: {
          type: Number,
          min: 0,
          default: 0,
        },

        monthlyGross: {
          type: Number,
          min: 0,
          default: 0,
        },

        monthlyNet: {
          type: Number,
          min: 0,
          default: 0,
        },

        monthlyCTC: {
          type: Number,
          min: 0,
          default: 0,
        },

        annualGross: {
          type: Number,
          min: 0,
          default: 0,
        },

        annualNet: {
          type: Number,
          min: 0,
          default: 0,
        },

        annualCTC: {
          type: Number,
          min: 0,
          default: 0,
        },
      },

      /* ==================================================================== */
      /* BENEFITS                                                             */
      /* ==================================================================== */

      benefits: {
        providentFund: {
          enabled: {
            type: Boolean,
            default: false,
          },

          employeePercentage: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
          },

          employerPercentage: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
          },

          ceiling: {
            type: Number,
            min: 0,
            default: null,
          },
        },

        esi: {
          enabled: {
            type: Boolean,
            default: false,
          },

          employeePercentage: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
          },

          employerPercentage: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
          },

          wageCeiling: {
            type: Number,
            min: 0,
            default: null,
          },
        },

        gratuity: {
          enabled: {
            type: Boolean,
            default: false,
          },

          percentage: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
          },
        },

        insurance: {
          enabled: {
            type: Boolean,
            default: false,
          },

          monthlyAmount: {
            type: Number,
            min: 0,
            default: 0,
          },

          annualAmount: {
            type: Number,
            min: 0,
            default: 0,
          },
        },

        other: {
          type: [
            {
              name: {
                type: String,
                trim: true,
                maxlength: 300,
              },

              amount: {
                type: Number,
                min: 0,
                default: 0,
              },

              recurring: {
                type: Boolean,
                default: true,
              },

              metadata: {
                type: mongoose.Schema.Types.Mixed,
                default: null,
              },
            },
          ],
          default: [],
        },
      },

      /* ==================================================================== */
      /* TAX                                                                  */
      /* ==================================================================== */

      tax: {
        regime: {
          type: String,
          trim: true,
          maxlength: 100,
          default: null,
        },

        taxable: {
          type: Boolean,
          default: true,
        },

        taxDeductionEnabled: {
          type: Boolean,
          default: false,
        },

        professionalTaxEnabled: {
          type: Boolean,
          default: false,
        },

        taxConfig: {
          type: mongoose.Schema.Types.Mixed,
          default: null,
        },
      },

      /* ==================================================================== */
      /* OVERTIME                                                             */
      /* ==================================================================== */

      overtime: {
        enabled: {
          type: Boolean,
          default: false,
        },

        multiplier: {
          type: Number,
          min: 0,
          default: 1.5,
        },

        hourlyRate: {
          type: Number,
          min: 0,
          default: null,
        },

        maximumHoursPerMonth: {
          type: Number,
          min: 0,
          default: null,
        },
      },

      /* ==================================================================== */
      /* LEAVE / LOP                                                          */
      /* ==================================================================== */

      leave: {
        lossOfPayEnabled: {
          type: Boolean,
          default: true,
        },

        workingDaysPerMonth: {
          type: Number,
          min: 1,
          max: 31,
          default: 26,
        },

        workingHoursPerDay: {
          type: Number,
          min: 1,
          max: 24,
          default: 8,
        },

        lopCalculation: {
          type: String,
          enum: [
            "calendar_day",
            "working_day",
            "hourly",
          ],
          default: "working_day",
        },
      },

      /* ==================================================================== */
      /* EFFECTIVE PERIOD                                                     */
      /* ==================================================================== */

      effectiveFrom: {
        type: Date,
        required: true,
        index: true,
      },

      effectiveTo: {
        type: Date,
        default: null,
        index: true,
      },

      /* ==================================================================== */
      /* APPROVAL                                                             */
      /* ==================================================================== */

      approval: {
        type: approvalSchema,
        default: () => ({}),
      },

      /* ==================================================================== */
      /* REVISION                                                              */
      /* ==================================================================== */

      version: {
        type: Number,
        min: 1,
        default: 1,
      },

      revisions: {
        type: [revisionSchema],
        default: [],
      },

      /* ==================================================================== */
      /* SOURCE / IMPORT                                                      */
      /* ==================================================================== */

      source: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      importedAt: {
        type: Date,
        default: null,
      },

      importedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      /* ==================================================================== */
      /* TAGS / METADATA                                                      */
      /* ==================================================================== */

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

      /* ==================================================================== */
      /* AUDIT                                                                */
      /* ==================================================================== */

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

      activatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      activatedAt: {
        type: Date,
        default: null,
      },

      /* ==================================================================== */
      /* LIFECYCLE                                                            */
      /* ==================================================================== */

      archivedAt: {
        type: Date,
        default: null,
      },

      cancelledAt: {
        type: Date,
        default: null,
      },

      legalHold: {
        type: Boolean,
        default: false,
        index: true,
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

salaryStructureSchema.index(
  {
    instituteId: 1,
    structureCode: 1,
  },
  {
    unique: true,
    sparse: true,
    name: "tenant_salary_structure_code",
  }
);

salaryStructureSchema.index(
  {
    instituteId: 1,
    slug: 1,
  },
  {
    unique: true,
    sparse: true,
    name: "tenant_salary_structure_slug",
  }
);

salaryStructureSchema.index(
  {
    instituteId: 1,
    employeeId: 1,
    status: 1,
    effectiveFrom: -1,
  },
  {
    sparse: true,
    name: "employee_salary_structures",
  }
);

salaryStructureSchema.index(
  {
    instituteId: 1,
    departmentId: 1,
    status: 1,
    effectiveFrom: -1,
  },
  {
    sparse: true,
    name: "department_salary_structures",
  }
);

salaryStructureSchema.index(
  {
    instituteId: 1,
    grade: 1,
    status: 1,
    effectiveFrom: -1,
  },
  {
    sparse: true,
    name: "grade_salary_structures",
  }
);

salaryStructureSchema.index(
  {
    instituteId: 1,
    status: 1,
    effectiveFrom: 1,
    effectiveTo: 1,
  },
  {
    name: "salary_structure_effective_period",
  }
);

salaryStructureSchema.index(
  {
    instituteId: 1,
    "approval.status": 1,
    status: 1,
  },
  {
    name: "salary_approval_queue",
  }
);

salaryStructureSchema.index(
  {
    instituteId: 1,
    isDeleted: 1,
    createdAt: -1,
  },
  {
    name: "active_salary_structures",
  }
);

/* ============================================================================
 * VALIDATION
 * ========================================================================== */

salaryStructureSchema.pre(
  "validate",
  function (next) {
    if (
      this.effectiveFrom &&
      this.effectiveTo &&
      this.effectiveTo <
        this.effectiveFrom
    ) {
      return next(
        new Error(
          "Effective end date cannot be before effective start date"
        )
      );
    }

    if (
      this.components.length >
      200
    ) {
      return next(
        new Error(
          "Salary structure cannot contain more than 200 components"
        )
      );
    }

    if (
      this.employeeIds.length >
      10000
    ) {
      return next(
        new Error(
          "Salary structure cannot contain more than 10000 employees"
        )
      );
    }

    if (
      this.revisions.length >
      100
    ) {
      return next(
        new Error(
          "Salary structure cannot contain more than 100 revisions"
        )
      );
    }

    if (
      this.tags.length >
      100
    ) {
      return next(
        new Error(
          "Salary structure cannot contain more than 100 tags"
        )
      );
    }

    const componentCodes =
      new Set();

    for (
      const component of this
        .components
    ) {
      const code =
        component.code;

      if (
        componentCodes.has(
          code
        )
      ) {
        return next(
          new Error(
            `Duplicate salary component code: ${code}`
          )
        );
      }

      componentCodes.add(
        code
      );

      if (
        component.calculationType ===
          "percentage" &&
        (
          component.percentage ===
            null ||
          component.percentage ===
            undefined
        )
      ) {
        return next(
          new Error(
            `Percentage is required for component ${code}`
          )
        );
      }

      if (
        component.calculationType ===
          "formula" &&
        !component.formula
      ) {
        return next(
          new Error(
            `Formula is required for component ${code}`
          )
        );
      }

      if (
        component.calculationType ===
          "per_day" &&
        (
          component.perDayAmount ===
            null ||
          component.perDayAmount ===
            undefined
        )
      ) {
        return next(
          new Error(
            `Per-day amount is required for component ${code}`
          )
        );
      }

      if (
        component.calculationType ===
          "per_hour" &&
        (
          component.perHourAmount ===
            null ||
          component.perHourAmount ===
            undefined
        )
      ) {
        return next(
          new Error(
            `Per-hour amount is required for component ${code}`
          )
        );
      }

      if (
        component.calculationType ===
          "per_unit" &&
        (
          component.perUnitAmount ===
            null ||
          component.perUnitAmount ===
            undefined
        )
      ) {
        return next(
          new Error(
            `Per-unit amount is required for component ${code}`
          )
        );
      }
    }

    if (
      this.status ===
        "active" &&
      this.approval.required &&
      this.approval.status !==
        "approved"
    ) {
      return next(
        new Error(
          "Salary structure requiring approval must be approved before activation"
        )
      );
    }

    if (
      this.status ===
        "active" &&
      !this.activatedAt
    ) {
      this.activatedAt =
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

    if (
      this.status ===
        "cancelled" &&
      !this.cancelledAt
    ) {
      this.cancelledAt =
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

salaryStructureSchema.virtual(
  "isActive"
).get(function () {
  return (
    this.status ===
    "active"
  );
});

salaryStructureSchema.virtual(
  "isEffective"
).get(function () {
  const now =
    new Date();

  return (
    this.status ===
      "active" &&
    this.effectiveFrom <=
      now &&
    (
      !this.effectiveTo ||
      this.effectiveTo >=
        now
    )
  );
});

salaryStructureSchema.virtual(
  "monthlyCTC"
).get(function () {
  return (
    this.totals
      ?.monthlyCTC || 0
  );
});

salaryStructureSchema.virtual(
  "annualCTC"
).get(function () {
  return (
    this.totals
      ?.annualCTC || 0
  );
});

salaryStructureSchema.virtual(
  "monthlyGross"
).get(function () {
  return (
    this.totals
      ?.monthlyGross || 0
  );
});

salaryStructureSchema.virtual(
  "monthlyNet"
).get(function () {
  return (
    this.totals
      ?.monthlyNet || 0
  );
});

/* ============================================================================
 * QUERY HELPERS
 * ========================================================================== */

salaryStructureSchema.query.byInstitute =
  function (
    instituteId
  ) {
    return this.where({
      instituteId,
      isDeleted: false,
    });
  };

salaryStructureSchema.query.active =
  function () {
    return this.where({
      status: "active",
      isDeleted: false,
    });
  };

salaryStructureSchema.query.effective =
  function (
    date = new Date()
  ) {
    return this.where({
      status: "active",
      isDeleted: false,
      effectiveFrom: {
        $lte: date,
      },
      $or: [
        {
          effectiveTo: null,
        },
        {
          effectiveTo: {
            $gte: date,
          },
        },
      ],
    });
  };

salaryStructureSchema.query.pendingApproval =
  function () {
    return this.where({
      "approval.status":
        "pending",
      isDeleted: false,
    });
  };

/* ============================================================================
 * INSTANCE METHODS
 * ========================================================================== */

salaryStructureSchema.methods.calculateTotals =
  function () {
    let monthlyEarnings =
      0;

    let monthlyDeductions =
      0;

    let monthlyEmployerContributions =
      0;

    let monthlyReimbursements =
      0;

    const activeComponents =
      this.components.filter(
        (component) =>
          component.active
      );

    const componentValues =
      new Map();

    for (
      const component of
        activeComponents
    ) {
      let amount = 0;

      switch (
        component.calculationType
      ) {
        case "fixed":
          amount =
            component.amount;
          break;

        case "percentage": {
          let base = 0;

          if (
            component.percentageBase ===
            "basic"
          ) {
            base =
              this.monthlyBaseSalary;
          } else if (
            component.percentageBase ===
            "component"
          ) {
            base =
              componentValues.get(
                component.baseComponentCode
              ) || 0;
          } else if (
            component.percentageBase ===
            "gross"
          ) {
            base =
              monthlyEarnings;
          } else if (
            component.percentageBase ===
            "ctc"
          ) {
            base =
              monthlyEarnings +
              monthlyEmployerContributions;
          } else {
            base =
              this.monthlyBaseSalary;
          }

          amount =
            (base *
              (
                component.percentage ||
                0
              )) /
            100;

          break;
        }

        case "per_day":
          amount =
            component.perDayAmount ||
            0;
          break;

        case "per_hour":
          amount =
            component.perHourAmount ||
            0;
          break;

        case "per_unit":
          amount =
            component.perUnitAmount ||
            0;
          break;

        case "formula":
          amount = 0;
          break;

        default:
          amount = 0;
      }

      componentValues.set(
        component.code,
        amount
      );

      if (
        component.type ===
        "earning"
      ) {
        monthlyEarnings +=
          amount;
      } else if (
        component.type ===
        "deduction"
      ) {
        monthlyDeductions +=
          amount;
      } else if (
        component.type ===
        "employer_contribution"
      ) {
        monthlyEmployerContributions +=
          amount;
      } else if (
        component.type ===
        "reimbursement"
      ) {
        monthlyReimbursements +=
          amount;
      }
    }

    const monthlyGross =
      this.monthlyBaseSalary +
      monthlyEarnings +
      monthlyReimbursements;

    const monthlyNet =
      Math.max(
        0,
        monthlyGross -
          monthlyDeductions
      );

    const monthlyCTC =
      monthlyGross +
      monthlyEmployerContributions;

    this.totals.monthlyEarnings =
      monthlyEarnings;

    this.totals.monthlyDeductions =
      monthlyDeductions;

    this.totals.monthlyEmployerContributions =
      monthlyEmployerContributions;

    this.totals.monthlyReimbursements =
      monthlyReimbursements;

    this.totals.monthlyGross =
      monthlyGross;

    this.totals.monthlyNet =
      monthlyNet;

    this.totals.monthlyCTC =
      monthlyCTC;

    this.totals.annualGross =
      monthlyGross * 12;

    this.totals.annualNet =
      monthlyNet * 12;

    this.totals.annualCTC =
      monthlyCTC * 12;

    this.annualBaseSalary =
      this.monthlyBaseSalary *
      12;

    return this;
  };

salaryStructureSchema.methods.activate =
  async function (
    activatedBy = null
  ) {
    if (
      this.approval.required &&
      this.approval.status !==
        "approved"
    ) {
      throw new Error(
        "Salary structure must be approved before activation"
      );
    }

    if (
      this.status ===
      "archived"
    ) {
      throw new Error(
        "Archived salary structure cannot be activated"
      );
    }

    this.calculateTotals();

    this.status =
      "active";

    this.activatedBy =
      activatedBy;

    this.activatedAt =
      new Date();

    return this.save();
  };

salaryStructureSchema.methods.deactivate =
  async function () {
    if (
      this.status !==
      "active"
    ) {
      throw new Error(
        "Only active salary structures can be deactivated"
      );
    }

    this.status =
      "inactive";

    return this.save();
  };

salaryStructureSchema.methods.submitForApproval =
  async function () {
    this.approval.required =
      true;

    this.approval.status =
      "pending";

    this.approval.approvedBy =
      null;

    this.approval.approvedAt =
      null;

    this.approval.rejectedBy =
      null;

    this.approval.rejectedAt =
      null;

    return this.save();
  };

salaryStructureSchema.methods.approve =
  async function ({
    approvedBy,
    comments = null,
  } = {}) {
    if (
      !approvedBy
    ) {
      throw new Error(
        "Approver is required"
      );
    }

    this.approval.status =
      "approved";

    this.approval.approvedBy =
      approvedBy;

    this.approval.approvedAt =
      new Date();

    this.approval.comments =
      comments;

    this.approval.rejectedBy =
      null;

    this.approval.rejectedAt =
      null;

    this.approval.rejectionReason =
      null;

    return this.save();
  };

salaryStructureSchema.methods.reject =
  async function ({
    rejectedBy,
    reason = null,
  } = {}) {
    if (
      !rejectedBy
    ) {
      throw new Error(
        "Rejecting user is required"
      );
    }

    this.approval.status =
      "rejected";

    this.approval.rejectedBy =
      rejectedBy;

    this.approval.rejectedAt =
      new Date();

    this.approval.rejectionReason =
      reason;

    return this.save();
  };

salaryStructureSchema.methods.addComponent =
  async function (
    component
  ) {
    if (
      this.components.length >=
      200
    ) {
      throw new Error(
        "Maximum salary component limit reached"
      );
    }

    const exists =
      this.components.some(
        (item) =>
          item.code ===
          component.code
      );

    if (
      exists
    ) {
      throw new Error(
        "Salary component code already exists"
      );
    }

    this.components.push(
      component
    );

    this.version +=
      1;

    this.calculateTotals();

    return this.save();
  };

salaryStructureSchema.methods.updateComponent =
  async function (
    code,
    updates = {}
  ) {
    const component =
      this.components.find(
        (item) =>
          item.code ===
          String(
            code
          ).toUpperCase()
      );

    if (
      !component
    ) {
      throw new Error(
        "Salary component not found"
      );
    }

    const allowedFields = [
      "name",
      "description",
      "type",
      "category",
      "calculationType",
      "amount",
      "percentage",
      "percentageBase",
      "baseComponentCode",
      "formula",
      "perDayAmount",
      "perHourAmount",
      "perUnitAmount",
      "unit",
      "taxable",
      "includedInGross",
      "includedInCTC",
      "includedInNet",
      "recurring",
      "proratable",
      "overtimeEligible",
      "active",
      "displayOrder",
      "metadata",
    ];

    for (
      const field of
        allowedFields
    ) {
      if (
        Object.prototype.hasOwnProperty.call(
          updates,
          field
        )
      ) {
        component[field] =
          updates[field];
      }
    }

    this.version +=
      1;

    this.calculateTotals();

    return this.save();
  };

salaryStructureSchema.methods.removeComponent =
  async function (
    code
  ) {
    const normalized =
      String(
        code
      ).toUpperCase();

    const before =
      this.components.length;

    this.components =
      this.components.filter(
        (component) =>
          component.code !==
          normalized
      );

    if (
      this.components.length ===
      before
    ) {
      throw new Error(
        "Salary component not found"
      );
    }

    this.version +=
      1;

    this.calculateTotals();

    return this.save();
  };

salaryStructureSchema.methods.addRevision =
  async function ({
    changedBy = null,
    changeType = "update",
    reason = null,
  } = {}) {
    this.revisions.push({
      version:
        this.version,
      changedAt:
        new Date(),
      changedBy,
      changeType,
      reason,
      snapshot:
        this.toObject(),
    });

    if (
      this.revisions.length >
      100
    ) {
      this.revisions =
        this.revisions.slice(
          -100
        );
    }

    return this.save();
  };

salaryStructureSchema.methods.archive =
  async function () {
    this.status =
      "archived";

    this.archivedAt =
      new Date();

    return this.save();
  };

salaryStructureSchema.methods.cancel =
  async function () {
    if (
      this.status ===
      "active"
    ) {
      throw new Error(
        "Active salary structure must be deactivated before cancellation"
      );
    }

    this.status =
      "cancelled";

    this.cancelledAt =
      new Date();

    return this.save();
  };

salaryStructureSchema.methods.addTag =
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

salaryStructureSchema.methods.removeTag =
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

salaryStructureSchema.methods.setLegalHold =
  async function (
    enabled = true
  ) {
    this.legalHold =
      enabled;

    return this.save();
  };

salaryStructureSchema.methods.softDelete =
  async function ({
    deletedBy = null,
    reason = null,
  } = {}) {
    if (
      this.legalHold
    ) {
      throw new Error(
        "Salary structure is under legal hold"
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

salaryStructureSchema.methods.restore =
  async function () {
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

/* ============================================================================
 * STATIC METHODS
 * ========================================================================== */

salaryStructureSchema.statics.findByCode =
  function (
    instituteId,
    structureCode
  ) {
    return this.findOne({
      instituteId,
      structureCode:
        String(
          structureCode
        )
          .trim()
          .toUpperCase(),
      isDeleted: false,
    });
  };

salaryStructureSchema.statics.findBySlug =
  function (
    instituteId,
    slug
  ) {
    return this.findOne({
      instituteId,
      slug:
        String(
          slug
        )
          .trim()
          .toLowerCase(),
      isDeleted: false,
    });
  };

salaryStructureSchema.statics.findCurrentForEmployee =
  function (
    instituteId,
    employeeId,
    date = new Date()
  ) {
    return this.findOne({
      instituteId,
      employeeId,
      status: "active",
      isDeleted: false,
      effectiveFrom: {
        $lte: date,
      },
      $or: [
        {
          effectiveTo: null,
        },
        {
          effectiveTo: {
            $gte: date,
          },
        },
      ],
    }).sort({
      effectiveFrom: -1,
    });
  };

salaryStructureSchema.statics.findEffective =
  function (
    instituteId,
    date = new Date(),
    {
      departmentId = null,
      grade = null,
      employeeId = null,
    } = {}
  ) {
    const query = {
      instituteId,
      status: "active",
      isDeleted: false,
      effectiveFrom: {
        $lte: date,
      },
      $or: [
        {
          effectiveTo: null,
        },
        {
          effectiveTo: {
            $gte: date,
          },
        },
      ],
    };

    if (
      departmentId
    ) {
      query.departmentId =
        departmentId;
    }

    if (
      grade
    ) {
      query.grade =
        grade;
    }

    if (
      employeeId
    ) {
      query.employeeId =
        employeeId;
    }

    return this.find(
      query
    ).sort({
      effectiveFrom: -1,
    });
  };

salaryStructureSchema.statics.findPendingApproval =
  function (
    instituteId,
    limit = 100
  ) {
    return this.find({
      instituteId,
      "approval.status":
        "pending",
      isDeleted: false,
    })
      .sort({
        createdAt: 1,
      })
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

salaryStructureSchema.statics.findByDepartment =
  function (
    instituteId,
    departmentId,
    {
      status = null,
      limit = 100,
    } = {}
  ) {
    const query = {
      instituteId,
      departmentId,
      isDeleted: false,
    };

    if (
      status
    ) {
      query.status =
        status;
    }

    return this.find(
      query
    )
      .sort({
        effectiveFrom: -1,
        createdAt: -1,
      })
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

salaryStructureSchema.statics.findByGrade =
  function (
    instituteId,
    grade,
    {
      status = "active",
      limit = 100,
    } = {}
  ) {
    const query = {
      instituteId,
      grade,
      isDeleted: false,
    };

    if (
      status
    ) {
      query.status =
        status;
    }

    return this.find(
      query
    )
      .sort({
        effectiveFrom: -1,
      })
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

/* ============================================================================
 * MODEL
 * ========================================================================== */

export const SalaryStructure =
  mongoose.models.SalaryStructure ||
  mongoose.model(
    "SalaryStructure",
    salaryStructureSchema
  );

export {
  SALARY_STATUSES,
  SALARY_TYPES,
  COMPONENT_TYPES,
  CALCULATION_TYPES,
  PERCENTAGE_BASES,
  COMPONENT_CATEGORIES,
  PAY_FREQUENCIES,
};
