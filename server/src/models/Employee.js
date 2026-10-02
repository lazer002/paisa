// server/src/models/Employee.js

import mongoose from "mongoose";

import crypto from "node:crypto";
const EMPLOYEE_STATUSES = [
  "active",
  "inactive",
  "on_leave",
  "suspended",
  "terminated",
  "resigned",
  "retired",
  "probation",
  "notice_period",
];

const EMPLOYEE_TYPES = [
  "full_time",
  "part_time",
  "contract",
  "temporary",
  "intern",
  "consultant",
  "freelancer",
  "apprentice",
];

const EMPLOYMENT_CATEGORIES = [
  "teaching",
  "non_teaching",
  "administration",
  "management",
  "hr",
  "finance",
  "sales",
  "operations",
  "support",
  "technical",
  "security",
  "maintenance",
  "other",
];

const GENDERS = [
  "male",
  "female",
  "non_binary",
  "other",
  "prefer_not_to_say",
];

const WORK_MODES = [
  "office",
  "remote",
  "hybrid",
  "field",
];

const PAY_FREQUENCIES = [
  "monthly",
  "biweekly",
  "weekly",
  "daily",
  "hourly",
];

const DOCUMENT_TYPES = [
  "identity",
  "address",
  "education",
  "experience",
  "joining",
  "contract",
  "tax",
  "bank",
  "medical",
  "background_check",
  "other",
];

const employeeAddressSchema =
  new mongoose.Schema(
    {
      type: {
        type: String,
        enum: [
          "current",
          "permanent",
          "emergency",
          "other",
        ],
        default: "current",
      },

      line1: {
        type: String,
        trim: true,
        maxlength: 500,
        default: null,
      },

      line2: {
        type: String,
        trim: true,
        maxlength: 500,
        default: null,
      },

      landmark: {
        type: String,
        trim: true,
        maxlength: 500,
        default: null,
      },

      city: {
        type: String,
        trim: true,
        maxlength: 200,
        default: null,
      },

      state: {
        type: String,
        trim: true,
        maxlength: 200,
        default: null,
      },

      country: {
        type: String,
        trim: true,
        maxlength: 100,
        default: "India",
      },

      postalCode: {
        type: String,
        trim: true,
        maxlength: 30,
        default: null,
      },

      isPrimary: {
        type: Boolean,
        default: false,
      },
    },
    {
      _id: true,
    }
  );

const emergencyContactSchema =
  new mongoose.Schema(
    {
      name: {
        type: String,
        trim: true,
        maxlength: 500,
        required: true,
      },

      relationship: {
        type: String,
        trim: true,
        maxlength: 200,
        default: null,
      },

      phone: {
        type: String,
        trim: true,
        maxlength: 50,
        required: true,
      },

      alternatePhone: {
        type: String,
        trim: true,
        maxlength: 50,
        default: null,
      },

      email: {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: 320,
        default: null,
      },

      address: {
        type: String,
        trim: true,
        maxlength: 2000,
        default: null,
      },

      isPrimary: {
        type: Boolean,
        default: false,
      },
    },
    {
      _id: true,
    }
  );

const educationSchema =
  new mongoose.Schema(
    {
      qualification: {
        type: String,
        trim: true,
        maxlength: 500,
        required: true,
      },

      specialization: {
        type: String,
        trim: true,
        maxlength: 500,
        default: null,
      },

      institution: {
        type: String,
        trim: true,
        maxlength: 500,
        default: null,
      },

      university: {
        type: String,
        trim: true,
        maxlength: 500,
        default: null,
      },

      yearOfCompletion: {
        type: Number,
        min: 1900,
        max: 3000,
        default: null,
      },

      percentage: {
        type: Number,
        min: 0,
        max: 100,
        default: null,
      },

      grade: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      certificateUrl: {
        type: String,
        trim: true,
        maxlength: 3000,
        default: null,
      },
    },
    {
      _id: true,
    }
  );

const experienceSchema =
  new mongoose.Schema(
    {
      organization: {
        type: String,
        trim: true,
        maxlength: 500,
        required: true,
      },

      designation: {
        type: String,
        trim: true,
        maxlength: 300,
        default: null,
      },

      startDate: {
        type: Date,
        default: null,
      },

      endDate: {
        type: Date,
        default: null,
      },

      isCurrent: {
        type: Boolean,
        default: false,
      },

      responsibilities: {
        type: String,
        trim: true,
        maxlength: 5000,
        default: null,
      },

      reasonForLeaving: {
        type: String,
        trim: true,
        maxlength: 2000,
        default: null,
      },

      verificationStatus: {
        type: String,
        enum: [
          "pending",
          "verified",
          "rejected",
          "not_required",
        ],
        default: "pending",
      },

      verificationNotes: {
        type: String,
        trim: true,
        maxlength: 2000,
        default: null,
      },
    },
    {
      _id: true,
    }
  );

const bankAccountSchema =
  new mongoose.Schema(
    {
      accountHolderName: {
        type: String,
        trim: true,
        maxlength: 500,
        default: null,
      },

      bankName: {
        type: String,
        trim: true,
        maxlength: 300,
        default: null,
      },

      accountNumberMasked: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      accountNumberHash: {
        type: String,
        trim: true,
        maxlength: 500,
        default: null,
        select: false,
      },

      ifscCode: {
        type: String,
        trim: true,
        uppercase: true,
        maxlength: 20,
        default: null,
      },

      branchName: {
        type: String,
        trim: true,
        maxlength: 300,
        default: null,
      },

      accountType: {
        type: String,
        enum: [
          "savings",
          "current",
          "other",
        ],
        default: "savings",
      },

      isPrimary: {
        type: Boolean,
        default: false,
      },

      verified: {
        type: Boolean,
        default: false,
      },

      verifiedAt: {
        type: Date,
        default: null,
      },
    },
    {
      _id: true,
    }
  );

const statutorySchema =
  new mongoose.Schema(
    {
      panNumber: {
        type: String,
        trim: true,
        uppercase: true,
        maxlength: 20,
        default: null,
      },

      aadhaarMasked: {
        type: String,
        trim: true,
        maxlength: 30,
        default: null,
      },

      aadhaarHash: {
        type: String,
        trim: true,
        maxlength: 500,
        default: null,
        select: false,
      },

      uanNumber: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      pfNumber: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      esiNumber: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      professionalTaxNumber: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      taxRegime: {
        type: String,
        enum: [
          "old",
          "new",
          "not_applicable",
        ],
        default: "new",
      },
    },
    {
      _id: false,
    }
  );

const reportingSchema =
  new mongoose.Schema(
    {
      managerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        default: null,
      },

      managerUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      departmentHeadId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        default: null,
      },

      hrManagerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        default: null,
      },

      dottedLineManagerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        default: null,
      },
    },
    {
      _id: false,
    }
  );

const attendanceConfigSchema =
  new mongoose.Schema(
    {
      attendanceRequired: {
        type: Boolean,
        default: true,
      },

      biometricEnabled: {
        type: Boolean,
        default: false,
      },

      qrEnabled: {
        type: Boolean,
        default: true,
      },

      geofenceRequired: {
        type: Boolean,
        default: false,
      },

      remoteAttendanceAllowed: {
        type: Boolean,
        default: false,
      },

      lateGraceMinutes: {
        type: Number,
        min: 0,
        max: 1440,
        default: 0,
      },

      expectedHoursPerDay: {
        type: Number,
        min: 0,
        max: 24,
        default: 8,
      },

      expectedDaysPerWeek: {
        type: Number,
        min: 0,
        max: 7,
        default: 5,
      },
    },
    {
      _id: false,
    }
  );

const employeeSchema =
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
    `emp_${crypto.randomBytes(16).toString("base64url")}`,
},
      /* ==================================================================== */
      /* IDENTITY                                                             */
      /* ==================================================================== */

      employeeCode: {
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

      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
        index: true,
      },

      /* ==================================================================== */
      /* PERSONAL INFORMATION                                                 */
      /* ==================================================================== */

      firstName: {
        type: String,
        trim: true,
        maxlength: 200,
        required: true,
      },

      middleName: {
        type: String,
        trim: true,
        maxlength: 200,
        default: null,
      },

      lastName: {
        type: String,
        trim: true,
        maxlength: 200,
        default: null,
      },

      displayName: {
        type: String,
        trim: true,
        maxlength: 500,
        required: true,
      },

      dateOfBirth: {
        type: Date,
        default: null,
      },

      gender: {
        type: String,
        enum: GENDERS,
        default: null,
      },

      profileImage: {
        type: String,
        trim: true,
        maxlength: 3000,
        default: null,
      },

      nationality: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      maritalStatus: {
        type: String,
        enum: [
          "single",
          "married",
          "divorced",
          "widowed",
          "other",
          "prefer_not_to_say",
        ],
        default: null,
      },

      bloodGroup: {
        type: String,
        trim: true,
        uppercase: true,
        maxlength: 10,
        default: null,
      },

      /* ==================================================================== */
      /* CONTACT                                                              */
      /* ==================================================================== */

      email: {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: 320,
        default: null,
      },

      personalEmail: {
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

      alternatePhone: {
        type: String,
        trim: true,
        maxlength: 50,
        default: null,
      },

      emailVerified: {
        type: Boolean,
        default: false,
      },

      phoneVerified: {
        type: Boolean,
        default: false,
      },

      /* ==================================================================== */
      /* EMPLOYMENT                                                           */
      /* ==================================================================== */

      status: {
        type: String,
        enum: EMPLOYEE_STATUSES,
        default: "active",
        index: true,
      },

      employmentType: {
        type: String,
        enum: EMPLOYEE_TYPES,
        default: "full_time",
        index: true,
      },

      employmentCategory: {
        type: String,
        enum: EMPLOYMENT_CATEGORIES,
        default: "other",
        index: true,
      },

      workMode: {
        type: String,
        enum: WORK_MODES,
        default: "office",
      },

      joiningDate: {
        type: Date,
        default: null,
        index: true,
      },

      probationStartDate: {
        type: Date,
        default: null,
      },

      probationEndDate: {
        type: Date,
        default: null,
      },

      confirmationDate: {
        type: Date,
        default: null,
      },

      noticePeriodDays: {
        type: Number,
        min: 0,
        max: 3650,
        default: 30,
      },

      resignationDate: {
        type: Date,
        default: null,
      },

      lastWorkingDate: {
        type: Date,
        default: null,
      },

      terminationDate: {
        type: Date,
        default: null,
      },

      retirementDate: {
        type: Date,
        default: null,
      },

      terminationReason: {
        type: String,
        trim: true,
        maxlength: 3000,
        default: null,
      },

      /* ==================================================================== */
      /* ORGANIZATION                                                         */
      /* ==================================================================== */

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
        index: true,
      },

      jobTitle: {
        type: String,
        trim: true,
        maxlength: 300,
        default: null,
      },

      jobGrade: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
        index: true,
      },

      employmentLevel: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      reporting: {
        type: reportingSchema,
        default: () => ({}),
      },

      location: {
        type: String,
        trim: true,
        maxlength: 300,
        default: null,
      },

      branch: {
        type: String,
        trim: true,
        maxlength: 300,
        default: null,
      },

      costCenter: {
        type: String,
        trim: true,
        maxlength: 200,
        default: null,
      },

      /* ==================================================================== */
      /* CONTACT DETAILS                                                       */
      /* ==================================================================== */

      addresses: {
        type: [employeeAddressSchema],
        default: [],
      },

      emergencyContacts: {
        type: [emergencyContactSchema],
        default: [],
      },

      /* ==================================================================== */
      /* EDUCATION / EXPERIENCE                                               */
      /* ==================================================================== */

      education: {
        type: [educationSchema],
        default: [],
      },

      experience: {
        type: [experienceSchema],
        default: [],
      },

      totalExperienceYears: {
        type: Number,
        min: 0,
        default: 0,
      },

      /* ==================================================================== */
      /* ATTENDANCE                                                            */
      /* ==================================================================== */

      attendance: {
        type: attendanceConfigSchema,
        default: () => ({}),
      },

      shiftId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },

      weeklyOffDays: {
        type: [
          {
            type: Number,
            min: 0,
            max: 6,
          },
        ],
        default: [0],
      },

      workStartTime: {
        type: String,
        trim: true,
        maxlength: 10,
        default: "09:00",
      },

      workEndTime: {
        type: String,
        trim: true,
        maxlength: 10,
        default: "18:00",
      },

      /* ==================================================================== */
      /* COMPENSATION                                                         */
      /* ==================================================================== */

      salaryStructureId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SalaryStructure",
        default: null,
        index: true,
      },

      salaryType: {
        type: String,
        enum: [
          "monthly",
          "annual",
          "hourly",
          "daily",
        ],
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

      currentSalary: {
        type: Number,
        min: 0,
        default: 0,
      },

      annualSalary: {
        type: Number,
        min: 0,
        default: 0,
      },

      salaryEffectiveFrom: {
        type: Date,
        default: null,
      },

      /* ==================================================================== */
      /* BANK / STATUTORY                                                     */
      /* ==================================================================== */

      bankAccounts: {
        type: [bankAccountSchema],
        default: [],
      },

      statutory: {
        type: statutorySchema,
        default: () => ({}),
      },

      /* ==================================================================== */
      /* DOCUMENT REFERENCES                                                  */
      /* ==================================================================== */

      documents: {
        type: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "EmployeeDocument",
          },
        ],
        default: [],
      },

      /* ==================================================================== */
      /* LEAVE / PERFORMANCE                                                  */
      /* ==================================================================== */

      leaveBalance: {
        annual: {
          type: Number,
          min: 0,
          default: 0,
        },

        sick: {
          type: Number,
          min: 0,
          default: 0,
        },

        casual: {
          type: Number,
          min: 0,
          default: 0,
        },

        unpaid: {
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

      lastPerformanceReviewId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PerformanceReview",
        default: null,
      },

      performanceScore: {
        type: Number,
        min: 0,
        max: 100,
        default: null,
      },

      /* ==================================================================== */
      /* SKILLS / QUALIFICATIONS                                              */
      /* ==================================================================== */

      skills: {
        type: [
          {
            type: String,
            trim: true,
            maxlength: 200,
          },
        ],
        default: [],
      },

      certifications: {
        type: [
          {
            name: {
              type: String,
              trim: true,
              maxlength: 500,
            },

            issuingOrganization: {
              type: String,
              trim: true,
              maxlength: 500,
              default: null,
            },

            issueDate: {
              type: Date,
              default: null,
            },

            expiryDate: {
              type: Date,
              default: null,
            },

            credentialId: {
              type: String,
              trim: true,
              maxlength: 300,
              default: null,
            },

            credentialUrl: {
              type: String,
              trim: true,
              maxlength: 3000,
              default: null,
            },
          },
        ],
        default: [],
      },

      /* ==================================================================== */
      /* ACCESS / SECURITY                                                    */
      /* ==================================================================== */

      access: {
        portalEnabled: {
          type: Boolean,
          default: true,
        },

        attendanceAccess: {
          type: Boolean,
          default: true,
        },

        payrollAccess: {
          type: Boolean,
          default: false,
        },

        hrAccess: {
          type: Boolean,
          default: false,
        },

        managerAccess: {
          type: Boolean,
          default: false,
        },

        lastLoginAt: {
          type: Date,
          default: null,
        },
      },

      /* ==================================================================== */
      /* CUSTOM DATA                                                          */
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

      customFields: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: {},
      },

      metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },

      /* ==================================================================== */
      /* AUDIT                                                                 */
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

      lastModifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      /* ==================================================================== */
      /* LIFECYCLE                                                             */
      /* ==================================================================== */

      lastStatusChangeAt: {
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

employeeSchema.index(
  {
    instituteId: 1,
    employeeCode: 1,
  },
  {
    unique: true,
    sparse: true,
    name: "tenant_employee_code",
  }
);

employeeSchema.index(
  {
    instituteId: 1,
    externalId: 1,
  },
  {
    unique: true,
    sparse: true,
    name: "tenant_employee_external_id",
  }
);

employeeSchema.index(
  {
    instituteId: 1,
    userId: 1,
  },
  {
    unique: true,
    sparse: true,
    name: "tenant_employee_user",
  }
);

employeeSchema.index(
  {
    instituteId: 1,
    email: 1,
  },
  {
    sparse: true,
    name: "tenant_employee_email",
  }
);

employeeSchema.index(
  {
    instituteId: 1,
    phone: 1,
  },
  {
    sparse: true,
    name: "tenant_employee_phone",
  }
);

employeeSchema.index(
  {
    instituteId: 1,
    departmentId: 1,
    status: 1,
  },
  {
    name: "employee_department_status",
  }
);

employeeSchema.index(
  {
    instituteId: 1,
    reporting: 1,
    status: 1,
  },
  {
    name: "employee_reporting",
  }
);

employeeSchema.index(
  {
    instituteId: 1,
    designation: 1,
    status: 1,
  },
  {
    name: "employee_designation",
  }
);

employeeSchema.index(
  {
    instituteId: 1,
    jobGrade: 1,
    status: 1,
  },
  {
    name: "employee_grade",
  }
);

employeeSchema.index(
  {
    instituteId: 1,
    employmentType: 1,
    status: 1,
  },
  {
    name: "employee_type_status",
  }
);

employeeSchema.index(
  {
    instituteId: 1,
    joiningDate: -1,
  },
  {
    name: "employee_joining_date",
  }
);

employeeSchema.index(
  {
    instituteId: 1,
    lastWorkingDate: 1,
    status: 1,
  },
  {
    sparse: true,
    name: "employee_exit_tracking",
  }
);

employeeSchema.index(
  {
    instituteId: 1,
    salaryStructureId: 1,
  },
  {
    sparse: true,
    name: "employee_salary_structure",
  }
);

employeeSchema.index(
  {
    instituteId: 1,
    isDeleted: 1,
    createdAt: -1,
  },
  {
    name: "active_employees",
  }
);

employeeSchema.index(
  {
    instituteId: 1,
    displayName: "text",
    employeeCode: "text",
    email: "text",
    designation: "text",
    jobTitle: "text",
  },
  {
    name: "employee_search",
    weights: {
      employeeCode: 10,
      displayName: 10,
      email: 8,
      designation: 6,
      jobTitle: 6,
    },
  }
);

/* ============================================================================
 * VALIDATION
 * ========================================================================== */

employeeSchema.pre(
  "validate",
  function (next) {
    if (
      !this.displayName
    ) {
      this.displayName = [
        this.firstName,
        this.middleName,
        this.lastName,
      ]
        .filter(Boolean)
        .join(" ")
        .trim();
    }

    if (
      this.addresses.length >
      20
    ) {
      return next(
        new Error(
          "Employee cannot contain more than 20 addresses"
        )
      );
    }

    if (
      this.emergencyContacts.length >
      10
    ) {
      return next(
        new Error(
          "Employee cannot contain more than 10 emergency contacts"
        )
      );
    }

    if (
      this.education.length >
      30
    ) {
      return next(
        new Error(
          "Employee cannot contain more than 30 education records"
        )
      );
    }

    if (
      this.experience.length >
      50
    ) {
      return next(
        new Error(
          "Employee cannot contain more than 50 experience records"
        )
      );
    }

    if (
      this.bankAccounts.length >
      10
    ) {
      return next(
        new Error(
          "Employee cannot contain more than 10 bank accounts"
        )
      );
    }

    if (
      this.documents.length >
      500
    ) {
      return next(
        new Error(
          "Employee cannot contain more than 500 document references"
        )
      );
    }

    if (
      this.skills.length >
      200
    ) {
      return next(
        new Error(
          "Employee cannot contain more than 200 skills"
        )
      );
    }

    if (
      this.certifications.length >
      100
    ) {
      return next(
        new Error(
          "Employee cannot contain more than 100 certifications"
        )
      );
    }

    if (
      this.tags.length >
      100
    ) {
      return next(
        new Error(
          "Employee cannot contain more than 100 tags"
        )
      );
    }

    if (
      this.probationStartDate &&
      this.probationEndDate &&
      this.probationEndDate <
        this.probationStartDate
    ) {
      return next(
        new Error(
          "Probation end date cannot be before probation start date"
        )
      );
    }

    if (
      this.joiningDate &&
      this.lastWorkingDate &&
      this.lastWorkingDate <
        this.joiningDate
    ) {
      return next(
        new Error(
          "Last working date cannot be before joining date"
        )
      );
    }

    if (
      this.currentSalary <
      0
    ) {
      return next(
        new Error(
          "Current salary cannot be negative"
        )
      );
    }

    if (
      this.annualSalary <
      0
    ) {
      return next(
        new Error(
          "Annual salary cannot be negative"
        )
      );
    }

    if (
      this.status ===
        "terminated" ||
      this.status ===
        "resigned" ||
      this.status ===
        "retired"
    ) {
      if (
        !this.lastStatusChangeAt
      ) {
        this.lastStatusChangeAt =
          new Date();
      }
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

employeeSchema.virtual(
  "fullName"
).get(function () {
  return [
    this.firstName,
    this.middleName,
    this.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
});

employeeSchema.virtual(
  "isActive"
).get(function () {
  return (
    this.status ===
      "active" &&
    !this.isDeleted
  );
});

employeeSchema.virtual(
  "isOnLeave"
).get(function () {
  return (
    this.status ===
    "on_leave"
  );
});

employeeSchema.virtual(
  "isExEmployee"
).get(function () {
  return [
    "terminated",
    "resigned",
    "retired",
  ].includes(
    this.status
  );
});

employeeSchema.virtual(
  "tenureInDays"
).get(function () {
  if (
    !this.joiningDate
  ) {
    return 0;
  }

  const end =
    this.lastWorkingDate ||
    new Date();

  return Math.max(
    0,
    Math.floor(
      (
        end.getTime() -
        this.joiningDate.getTime()
      ) /
        (1000 *
          60 *
          60 *
          24)
    )
  );
});

employeeSchema.virtual(
  "tenureInYears"
).get(function () {
  return Number(
    (
      this.tenureInDays /
      365.25
    ).toFixed(2)
  );
});

employeeSchema.virtual(
  "primaryAddress"
).get(function () {
  return (
    this.addresses.find(
      (address) =>
        address.isPrimary
    ) ||
    this.addresses[0] ||
    null
  );
});

employeeSchema.virtual(
  "primaryEmergencyContact"
).get(function () {
  return (
    this.emergencyContacts.find(
      (contact) =>
        contact.isPrimary
    ) ||
    this.emergencyContacts[0] ||
    null
  );
});

employeeSchema.virtual(
  "primaryBankAccount"
).get(function () {
  return (
    this.bankAccounts.find(
      (account) =>
        account.isPrimary
    ) ||
    this.bankAccounts[0] ||
    null
  );
});

/* ============================================================================
 * QUERY HELPERS
 * ========================================================================== */

employeeSchema.query.byInstitute =
  function (
    instituteId
  ) {
    return this.where({
      instituteId,
      isDeleted: false,
    });
  };

employeeSchema.query.active =
  function () {
    return this.where({
      status: "active",
      isDeleted: false,
    });
  };

employeeSchema.query.currentEmployees =
  function () {
    return this.where({
      status: {
        $in: [
          "active",
          "on_leave",
          "probation",
          "notice_period",
        ],
      },
      isDeleted: false,
    });
  };

employeeSchema.query.exEmployees =
  function () {
    return this.where({
      status: {
        $in: [
          "terminated",
          "resigned",
          "retired",
        ],
      },
      isDeleted: false,
    });
  };

/* ============================================================================
 * INSTANCE METHODS
 * ========================================================================== */

employeeSchema.methods.changeStatus =
  async function (
    status,
    changedBy = null
  ) {
    if (
      !EMPLOYEE_STATUSES.includes(
        status
      )
    ) {
      throw new Error(
        "Invalid employee status"
      );
    }

    this.status =
      status;

    this.lastStatusChangeAt =
      new Date();

    this.lastModifiedBy =
      changedBy;

    if (
      status ===
      "resigned"
    ) {
      this.resignationDate =
        this.resignationDate ||
        new Date();
    }

    if (
      status ===
      "terminated"
    ) {
      this.terminationDate =
        this.terminationDate ||
        new Date();
    }

    if (
      [
        "resigned",
        "terminated",
        "retired",
      ].includes(
        status
      )
    ) {
      this.lastWorkingDate =
        this.lastWorkingDate ||
        new Date();
    }

    return this.save();
  };

employeeSchema.methods.confirmEmployment =
  async function ({
    confirmedBy = null,
    confirmationDate = new Date(),
  } = {}) {
    this.confirmationDate =
      confirmationDate;

    if (
      this.status ===
      "probation"
    ) {
      this.status =
        "active";

      this.lastStatusChangeAt =
        new Date();
    }

    this.lastModifiedBy =
      confirmedBy;

    return this.save();
  };

employeeSchema.methods.startProbation =
  async function ({
    startDate = new Date(),
    endDate = null,
  } = {}) {
    this.probationStartDate =
      startDate;

    this.probationEndDate =
      endDate;

    this.status =
      "probation";

    this.lastStatusChangeAt =
      new Date();

    return this.save();
  };

employeeSchema.methods.submitResignation =
  async function ({
    resignationDate = new Date(),
    lastWorkingDate = null,
    reason = null,
    submittedBy = null,
  } = {}) {
    this.status =
      "notice_period";

    this.resignationDate =
      resignationDate;

    this.lastWorkingDate =
      lastWorkingDate;

    this.terminationReason =
      reason;

    this.lastStatusChangeAt =
      new Date();

    this.lastModifiedBy =
      submittedBy;

    return this.save();
  };

employeeSchema.methods.assignManager =
  async function ({
    managerId = null,
    managerUserId = null,
    departmentHeadId = null,
    hrManagerId = null,
  } = {}) {
    this.reporting.managerId =
      managerId;

    this.reporting.managerUserId =
      managerUserId;

    this.reporting.departmentHeadId =
      departmentHeadId;

    this.reporting.hrManagerId =
      hrManagerId;

    return this.save();
  };

employeeSchema.methods.setDepartment =
  async function (
    departmentId
  ) {
    this.departmentId =
      departmentId;

    return this.save();
  };

employeeSchema.methods.addAddress =
  async function (
    address
  ) {
    if (
      this.addresses.length >=
      20
    ) {
      throw new Error(
        "Maximum address limit reached"
      );
    }

    if (
      address?.isPrimary
    ) {
      this.addresses.forEach(
        (item) => {
          item.isPrimary =
            false;
        }
      );
    }

    this.addresses.push(
      address
    );

    return this.save();
  };

employeeSchema.methods.setPrimaryAddress =
  async function (
    addressId
  ) {
    const address =
      this.addresses.id(
        addressId
      );

    if (
      !address
    ) {
      throw new Error(
        "Address not found"
      );
    }

    this.addresses.forEach(
      (item) => {
        item.isPrimary =
          String(
            item._id
          ) ===
          String(
            addressId
          );
      }
    );

    return this.save();
  };

employeeSchema.methods.addEmergencyContact =
  async function (
    contact
  ) {
    if (
      this.emergencyContacts.length >=
      10
    ) {
      throw new Error(
        "Maximum emergency contact limit reached"
      );
    }

    if (
      contact?.isPrimary
    ) {
      this.emergencyContacts.forEach(
        (item) => {
          item.isPrimary =
            false;
        }
      );
    }

    this.emergencyContacts.push(
      contact
    );

    return this.save();
  };

employeeSchema.methods.addEducation =
  async function (
    education
  ) {
    if (
      this.education.length >=
      30
    ) {
      throw new Error(
        "Maximum education record limit reached"
      );
    }

    this.education.push(
      education
    );

    return this.save();
  };

employeeSchema.methods.addExperience =
  async function (
    experience
  ) {
    if (
      this.experience.length >=
      50
    ) {
      throw new Error(
        "Maximum experience record limit reached"
      );
    }

    this.experience.push(
      experience
    );

    return this.save();
  };

employeeSchema.methods.addBankAccount =
  async function (
    account
  ) {
    if (
      this.bankAccounts.length >=
      10
    ) {
      throw new Error(
        "Maximum bank account limit reached"
      );
    }

    if (
      account?.isPrimary
    ) {
      this.bankAccounts.forEach(
        (item) => {
          item.isPrimary =
            false;
        }
      );
    }

    this.bankAccounts.push(
      account
    );

    return this.save();
  };

employeeSchema.methods.setPrimaryBankAccount =
  async function (
    accountId
  ) {
    const account =
      this.bankAccounts.id(
        accountId
      );

    if (
      !account
    ) {
      throw new Error(
        "Bank account not found"
      );
    }

    this.bankAccounts.forEach(
      (item) => {
        item.isPrimary =
          String(
            item._id
          ) ===
          String(
            accountId
          );
      }
    );

    return this.save();
  };

employeeSchema.methods.updateSalary =
  async function ({
    currentSalary,
    annualSalary,
    effectiveFrom = new Date(),
    updatedBy = null,
  } = {}) {
    if (
      currentSalary !==
      undefined
    ) {
      if (
        !Number.isFinite(
          Number(
            currentSalary
          )
        ) ||
        Number(
          currentSalary
        ) < 0
      ) {
        throw new Error(
          "Invalid current salary"
        );
      }

      this.currentSalary =
        Number(
          currentSalary
        );
    }

    if (
      annualSalary !==
      undefined
    ) {
      if (
        !Number.isFinite(
          Number(
            annualSalary
          )
        ) ||
        Number(
          annualSalary
        ) < 0
      ) {
        throw new Error(
          "Invalid annual salary"
        );
      }

      this.annualSalary =
        Number(
          annualSalary
        );
    }

    this.salaryEffectiveFrom =
      effectiveFrom;

    this.updatedBy =
      updatedBy;

    return this.save();
  };

employeeSchema.methods.updatePerformanceScore =
  async function (
    score
  ) {
    const numericScore =
      Number(score);

    if (
      !Number.isFinite(
        numericScore
      ) ||
      numericScore <
        0 ||
      numericScore >
        100
    ) {
      throw new Error(
        "Performance score must be between 0 and 100"
      );
    }

    this.performanceScore =
      numericScore;

    return this.save();
  };

employeeSchema.methods.addSkill =
  async function (
    skill
  ) {
    const normalized =
      String(skill)
        .trim();

    if (
      !normalized
    ) {
      throw new Error(
        "Skill is required"
      );
    }

    if (
      this.skills.includes(
        normalized
      )
    ) {
      return this;
    }

    if (
      this.skills.length >=
      200
    ) {
      throw new Error(
        "Maximum skill limit reached"
      );
    }

    this.skills.push(
      normalized
    );

    return this.save();
  };

employeeSchema.methods.removeSkill =
  async function (
    skill
  ) {
    const normalized =
      String(skill)
        .trim();

    this.skills =
      this.skills.filter(
        (item) =>
          item !==
          normalized
      );

    return this.save();
  };

employeeSchema.methods.addTag =
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

employeeSchema.methods.removeTag =
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

employeeSchema.methods.setLegalHold =
  async function (
    enabled = true
  ) {
    this.legalHold =
      enabled;

    return this.save();
  };

employeeSchema.methods.softDelete =
  async function ({
    deletedBy = null,
    reason = null,
  } = {}) {
    if (
      this.legalHold
    ) {
      throw new Error(
        "Employee is under legal hold"
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

employeeSchema.methods.restore =
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

employeeSchema.statics.findByCode =
  function (
    instituteId,
    employeeCode
  ) {
    return this.findOne({
      instituteId,
      employeeCode:
        String(
          employeeCode
        )
          .trim()
          .toUpperCase(),
      isDeleted: false,
    });
  };

employeeSchema.statics.findByUser =
  function (
    instituteId,
    userId
  ) {
    return this.findOne({
      instituteId,
      userId,
      isDeleted: false,
    });
  };

employeeSchema.statics.findByEmail =
  function (
    instituteId,
    email
  ) {
    return this.findOne({
      instituteId,
      email:
        String(
          email
        )
          .trim()
          .toLowerCase(),
      isDeleted: false,
    });
  };

employeeSchema.statics.findByDepartment =
  function (
    instituteId,
    departmentId,
    {
      status = "active",
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
        displayName: 1,
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

employeeSchema.statics.findByManager =
  function (
    instituteId,
    managerId,
    {
      status = "active",
      limit = 100,
    } = {}
  ) {
    const query = {
      instituteId,
      "reporting.managerId":
        managerId,
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
        displayName: 1,
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

employeeSchema.statics.findOnLeave =
  function (
    instituteId,
    limit = 100
  ) {
    return this.find({
      instituteId,
      status: "on_leave",
      isDeleted: false,
    })
      .sort({
        displayName: 1,
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

employeeSchema.statics.findProbationEmployees =
  function (
    instituteId,
    limit = 100
  ) {
    return this.find({
      instituteId,
      status: "probation",
      isDeleted: false,
    })
      .sort({
        probationEndDate: 1,
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

employeeSchema.statics.findNoticePeriodEmployees =
  function (
    instituteId,
    limit = 100
  ) {
    return this.find({
      instituteId,
      status: "notice_period",
      isDeleted: false,
    })
      .sort({
        lastWorkingDate: 1,
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

employeeSchema.statics.search =
  function (
    instituteId,
    search,
    limit = 50
  ) {
    const normalized =
      String(
        search || ""
      ).trim();

    if (
      !normalized
    ) {
      return this.find({
        instituteId,
        isDeleted: false,
      })
        .sort({
          displayName: 1,
        })
        .limit(
          Math.min(
            200,
            Math.max(
              1,
              limit
            )
          )
        );
    }

    return this.find(
      {
        instituteId,
        $text: {
          $search:
            normalized,
        },
        isDeleted: false,
      },
      {
        score: {
          $meta:
            "textScore",
        },
      }
    )
      .sort({
        score: {
          $meta:
            "textScore",
        },
      })
      .limit(
        Math.min(
          200,
          Math.max(
            1,
            limit
          )
        )
      );
  };

employeeSchema.statics.getSummary =
  async function (
    instituteId
  ) {
    const result =
      await this.aggregate([
        {
          $match: {
            instituteId:
              new mongoose.Types.ObjectId(
                instituteId
              ),
            isDeleted: false,
          },
        },
        {
          $group: {
            _id: null,

            total: {
              $sum: 1,
            },

            active: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "active",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            probation: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "probation",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            onLeave: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "on_leave",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            noticePeriod: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "notice_period",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            terminated: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "terminated",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            resigned: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "resigned",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            totalCurrentSalary: {
              $sum:
                "$currentSalary",
            },

            totalAnnualSalary: {
              $sum:
                "$annualSalary",
            },

            averagePerformanceScore: {
              $avg:
                "$performanceScore",
            },
          },
        },
        {
          $project: {
            _id: 0,
            total: 1,
            active: 1,
            probation: 1,
            onLeave: 1,
            noticePeriod: 1,
            terminated: 1,
            resigned: 1,
            totalCurrentSalary: 1,
            totalAnnualSalary: 1,
            averagePerformanceScore: 1,
          },
        },
      ]);

    return (
      result[0] || {
        total: 0,
        active: 0,
        probation: 0,
        onLeave: 0,
        noticePeriod: 0,
        terminated: 0,
        resigned: 0,
        totalCurrentSalary: 0,
        totalAnnualSalary: 0,
        averagePerformanceScore: 0,
      }
    );
  };

/* ============================================================================
 * MODEL
 * ========================================================================== */

 const Employee =
  mongoose.models.Employee ||
  mongoose.model(
    "Employee",
    employeeSchema
  );

export default Employee;

export {
  EMPLOYEE_STATUSES,
  EMPLOYEE_TYPES,
  EMPLOYMENT_CATEGORIES,
  GENDERS,
  WORK_MODES,
  PAY_FREQUENCIES,
  DOCUMENT_TYPES,
};
