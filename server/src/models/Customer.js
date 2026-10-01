// server/src/models/Customer.js

import mongoose from "mongoose";

import crypto from "node:crypto";
const CUSTOMER_STATUSES = [
  "lead",
  "prospect",
  "active",
  "inactive",
  "blocked",
  "suspended",
  "churned",
  "archived",
];

const CUSTOMER_TYPES = [
  "individual",
  "business",
  "parent",
  "guardian",
  "student",
  "employee",
  "alumni",
  "partner",
  "other",
];

const CUSTOMER_SOURCES = [
  "website",
  "mobile",
  "referral",
  "campaign",
  "social",
  "walk_in",
  "phone",
  "email",
  "crm",
  "import",
  "api",
  "admin",
  "other",
];

const CUSTOMER_LIFECYCLE_STAGES = [
  "new",
  "qualified",
  "onboarding",
  "active",
  "retention",
  "at_risk",
  "churned",
];

const CONTACT_PREFERENCES = [
  "phone",
  "email",
  "sms",
  "whatsapp",
  "push",
  "none",
];

const GENDERS = [
  "male",
  "female",
  "non_binary",
  "other",
  "prefer_not_to_say",
];

const ADDRESS_TYPES = [
  "home",
  "work",
  "billing",
  "shipping",
  "other",
];

const communicationSchema = new mongoose.Schema(
  {
    primaryEmail: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 320,
      default: null,
    },

    secondaryEmail: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 320,
      default: null,
    },

    primaryPhone: {
      type: String,
      trim: true,
      maxlength: 50,
      default: null,
    },

    secondaryPhone: {
      type: String,
      trim: true,
      maxlength: 50,
      default: null,
    },

    whatsapp: {
      type: String,
      trim: true,
      maxlength: 50,
      default: null,
    },

    website: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },

    preferredMethod: {
      type: String,
      enum: CONTACT_PREFERENCES,
      default: "email",
    },

    preferredTimeStart: {
      type: String,
      trim: true,
      maxlength: 10,
      default: null,
    },

    preferredTimeEnd: {
      type: String,
      trim: true,
      maxlength: 10,
      default: null,
    },

    timezone: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "Asia/Kolkata",
    },

    locale: {
      type: String,
      trim: true,
      maxlength: 20,
      default: "en-IN",
    },

    verifiedEmail: {
      type: Boolean,
      default: false,
    },

    emailVerifiedAt: {
      type: Date,
      default: null,
    },

    verifiedPhone: {
      type: Boolean,
      default: false,
    },

    phoneVerifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    _id: false,
  }
);

const addressSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ADDRESS_TYPES,
      default: "home",
    },

    label: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    name: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
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

    isVerified: {
      type: Boolean,
      default: false,
    },

    verifiedAt: {
      type: Date,
      default: null,
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

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },

    legalName: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },

    registrationNumber: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 200,
      default: null,
    },

    taxNumber: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 200,
      default: null,
    },

    industry: {
      type: String,
      trim: true,
      maxlength: 300,
      default: null,
    },

    website: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },

    designation: {
      type: String,
      trim: true,
      maxlength: 300,
      default: null,
    },

    department: {
      type: String,
      trim: true,
      maxlength: 300,
      default: null,
    },
  },
  {
    _id: false,
  }
);

const guardianSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },

    relationship: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    phone: {
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

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    isPrimary: {
      type: Boolean,
      default: false,
    },

    isEmergencyContact: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: true,
  }
);

const consentSchema = new mongoose.Schema(
  {
    marketing: {
      granted: {
        type: Boolean,
        default: false,
      },

      grantedAt: {
        type: Date,
        default: null,
      },

      revokedAt: {
        type: Date,
        default: null,
      },

      source: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },
    },

    email: {
      granted: {
        type: Boolean,
        default: true,
      },

      grantedAt: {
        type: Date,
        default: null,
      },

      revokedAt: {
        type: Date,
        default: null,
      },
    },

    sms: {
      granted: {
        type: Boolean,
        default: true,
      },

      grantedAt: {
        type: Date,
        default: null,
      },

      revokedAt: {
        type: Date,
        default: null,
      },
    },

    whatsapp: {
      granted: {
        type: Boolean,
        default: true,
      },

      grantedAt: {
        type: Date,
        default: null,
      },

      revokedAt: {
        type: Date,
        default: null,
      },
    },

    privacyPolicyAccepted: {
      type: Boolean,
      default: false,
    },

    privacyPolicyAcceptedAt: {
      type: Date,
      default: null,
    },

    termsAccepted: {
      type: Boolean,
      default: false,
    },

    termsAcceptedAt: {
      type: Date,
      default: null,
    },
  },
  {
    _id: false,
  }
);

const engagementSchema = new mongoose.Schema(
  {
    firstContactAt: {
      type: Date,
      default: null,
    },

    lastContactAt: {
      type: Date,
      default: null,
    },

    lastInteractionAt: {
      type: Date,
      default: null,
    },

    lastPurchaseAt: {
      type: Date,
      default: null,
    },

    firstPurchaseAt: {
      type: Date,
      default: null,
    },

    totalInteractions: {
      type: Number,
      min: 0,
      default: 0,
    },

    totalCalls: {
      type: Number,
      min: 0,
      default: 0,
    },

    totalEmails: {
      type: Number,
      min: 0,
      default: 0,
    },

    totalMessages: {
      type: Number,
      min: 0,
      default: 0,
    },

    totalOrders: {
      type: Number,
      min: 0,
      default: 0,
    },

    totalInvoices: {
      type: Number,
      min: 0,
      default: 0,
    },

    totalPayments: {
      type: Number,
      min: 0,
      default: 0,
    },

    totalSpend: {
      type: Number,
      min: 0,
      default: 0,
    },

    averageOrderValue: {
      type: Number,
      min: 0,
      default: 0,
    },

    lifetimeValue: {
      type: Number,
      min: 0,
      default: 0,
    },

    outstandingBalance: {
      type: Number,
      min: 0,
      default: 0,
    },

    lastOrderValue: {
      type: Number,
      min: 0,
      default: 0,
    },

    daysSinceLastInteraction: {
      type: Number,
      min: 0,
      default: 0,
    },

    daysSinceLastPurchase: {
      type: Number,
      min: 0,
      default: 0,
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
    },

    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    assignedAt: {
      type: Date,
      default: null,
    },

    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },

    territory: {
      type: String,
      trim: true,
      maxlength: 300,
      default: null,
    },

    sourceOwner: {
      type: String,
      trim: true,
      maxlength: 300,
      default: null,
    },
  },
  {
    _id: false,
  }
);

const customerSchema = new mongoose.Schema(
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
publicId: {
  type: String,
  required: true,
  unique: true,
  immutable: true,
  index: true,
  default: () =>
    `cus_${crypto.randomBytes(16).toString("base64url")}`,
},
    /* ====================================================================== */
    /* IDENTITY                                                               */
    /* ====================================================================== */

    customerCode: {
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

    type: {
      type: String,
      enum: CUSTOMER_TYPES,
      default: "individual",
      index: true,
    },

    status: {
      type: String,
      enum: CUSTOMER_STATUSES,
      default: "active",
      index: true,
    },

    lifecycleStage: {
      type: String,
      enum: CUSTOMER_LIFECYCLE_STAGES,
      default: "new",
      index: true,
    },

    /* ====================================================================== */
    /* PERSONAL INFORMATION                                                    */
    /* ====================================================================== */

    firstName: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
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

    preferredLanguage: {
      type: String,
      trim: true,
      maxlength: 50,
      default: "en",
    },

    /* ====================================================================== */
    /* COMPANY                                                                */
    /* ====================================================================== */

    company: {
      type: companySchema,
      default: () => ({}),
    },

    /* ====================================================================== */
    /* COMMUNICATION                                                          */
    /* ====================================================================== */

    communication: {
      type: communicationSchema,
      default: () => ({}),
    },

    /* ====================================================================== */
    /* ADDRESSES                                                              */
    /* ====================================================================== */

    addresses: {
      type: [addressSchema],
      default: [],
    },

    /* ====================================================================== */
    /* GUARDIANS / RELATIONSHIPS                                              */
    /* ====================================================================== */

    guardians: {
      type: [guardianSchema],
      default: [],
    },

    parentCustomerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
      index: true,
    },

    relatedCustomerIds: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Customer",
        },
      ],
      default: [],
    },

    /* ====================================================================== */
    /* USER / CRM REFERENCES                                                  */
    /* ====================================================================== */

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
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

    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
      index: true,
    },

    /* ====================================================================== */
    /* CRM                                                                    */
    /* ====================================================================== */

    source: {
      type: String,
      enum: CUSTOMER_SOURCES,
      default: "other",
      index: true,
    },

    sourceDetail: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },

    campaignId: {
      type: String,
      trim: true,
      maxlength: 300,
      default: null,
    },

    campaignName: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },

    referralCode: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 200,
      default: null,
    },

    referredByCustomerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },

    /* ====================================================================== */
    /* ASSIGNMENT                                                             */
    /* ====================================================================== */

    assignment: {
      type: assignmentSchema,
      default: () => ({}),
    },

    /* ====================================================================== */
    /* BUSINESS / SEGMENTATION                                                */
    /* ====================================================================== */

    industry: {
      type: String,
      trim: true,
      maxlength: 300,
      default: null,
    },

    customerSegment: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
      index: true,
    },

    customerTier: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
      index: true,
    },

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

    segments: {
      type: [
        {
          type: String,
          trim: true,
          lowercase: true,
          maxlength: 200,
        },
      ],
      default: [],
    },

    /* ====================================================================== */
    /* FINANCIAL                                                               */
    /* ====================================================================== */

    currency: {
      type: String,
      trim: true,
      uppercase: true,
      minlength: 3,
      maxlength: 3,
      default: "INR",
    },

    creditLimit: {
      type: Number,
      min: 0,
      default: 0,
    },

    paymentTerms: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },

    paymentTermsDays: {
      type: Number,
      min: 0,
      max: 3650,
      default: 0,
    },

    creditHold: {
      type: Boolean,
      default: false,
    },

    /* ====================================================================== */
    /* ENGAGEMENT                                                              */
    /* ====================================================================== */

    engagement: {
      type: engagementSchema,
      default: () => ({}),
    },

    leadScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
      index: true,
    },

    healthScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
      index: true,
    },

    /* ====================================================================== */
    /* CONSENT / PRIVACY                                                       */
    /* ====================================================================== */

    consent: {
      type: consentSchema,
      default: () => ({}),
    },

    doNotContact: {
      type: Boolean,
      default: false,
      index: true,
    },

    doNotContactReason: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },

    doNotContactAt: {
      type: Date,
      default: null,
    },

    doNotContactBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /* ====================================================================== */
    /* NOTES                                                                   */
    /* ====================================================================== */

    notes: {
      type: String,
      trim: true,
      maxlength: 10000,
      default: null,
    },

    internalNotes: {
      type: String,
      trim: true,
      maxlength: 10000,
      default: null,
    },

    /* ====================================================================== */
    /* CUSTOM DATA                                                             */
    /* ====================================================================== */

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
    /* AUDIT                                                                   */
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

    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /* ====================================================================== */
    /* LIFECYCLE                                                               */
    /* ====================================================================== */

    lastStatusChangeAt: {
      type: Date,
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

customerSchema.index(
  {
    instituteId: 1,
    customerCode: 1,
  },
  {
    unique: true,
    sparse: true,
    name: "tenant_customer_code",
  }
);

customerSchema.index(
  {
    instituteId: 1,
    externalId: 1,
  },
  {
    unique: true,
    sparse: true,
    name: "tenant_customer_external_id",
  }
);

customerSchema.index(
  {
    instituteId: 1,
    userId: 1,
  },
  {
    unique: true,
    sparse: true,
    name: "tenant_customer_user",
  }
);

customerSchema.index(
  {
    instituteId: 1,
    contactId: 1,
  },
  {
    sparse: true,
    name: "tenant_customer_contact",
  }
);

customerSchema.index(
  {
    instituteId: 1,
    leadId: 1,
  },
  {
    sparse: true,
    name: "tenant_customer_lead",
  }
);

customerSchema.index(
  {
    instituteId: 1,
    primaryEmail: 1,
  },
  {
    sparse: true,
    name: "tenant_customer_email",
  }
);

customerSchema.index(
  {
    instituteId: 1,
    "communication.primaryEmail": 1,
  },
  {
    sparse: true,
    name: "tenant_customer_primary_email",
  }
);

customerSchema.index(
  {
    instituteId: 1,
    "communication.primaryPhone": 1,
  },
  {
    sparse: true,
    name: "tenant_customer_primary_phone",
  }
);

customerSchema.index(
  {
    instituteId: 1,
    status: 1,
    lifecycleStage: 1,
    createdAt: -1,
  },
  {
    name: "customer_lifecycle",
  }
);

customerSchema.index(
  {
    instituteId: 1,
    assignment: 1,
    status: 1,
  },
  {
    name: "customer_assignment",
  }
);

customerSchema.index(
  {
    instituteId: 1,
    customerSegment: 1,
    customerTier: 1,
  },
  {
    name: "customer_segmentation",
  }
);

customerSchema.index(
  {
    instituteId: 1,
    healthScore: 1,
    status: 1,
  },
  {
    name: "customer_health",
  }
);

customerSchema.index(
  {
    instituteId: 1,
    leadScore: -1,
    status: 1,
  },
  {
    name: "customer_lead_score",
  }
);

customerSchema.index(
  {
    instituteId: 1,
    "engagement.lastInteractionAt": -1,
  },
  {
    name: "customer_last_interaction",
  }
);

customerSchema.index(
  {
    instituteId: 1,
    "engagement.lastPurchaseAt": -1,
  },
  {
    name: "customer_last_purchase",
  }
);

customerSchema.index(
  {
    instituteId: 1,
    "engagement.outstandingBalance": -1,
  },
  {
    name: "customer_outstanding_balance",
  }
);

customerSchema.index(
  {
    instituteId: 1,
    isDeleted: 1,
    createdAt: -1,
  },
  {
    name: "active_customers",
  }
);

customerSchema.index(
  {
    instituteId: 1,
    displayName: "text",
    "communication.primaryEmail": "text",
    "communication.primaryPhone": "text",
    "company.name": "text",
    customerCode: "text",
  },
  {
    name: "customer_search",
    weights: {
      displayName: 10,
      customerCode: 10,
      "communication.primaryEmail": 8,
      "communication.primaryPhone": 8,
      "company.name": 5,
    },
  }
);

/* ============================================================================
 * VALIDATION
 * ========================================================================== */

customerSchema.pre(
  "validate",
  function (next) {
    if (
      !this.displayName &&
      (
        this.firstName ||
        this.lastName
      )
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
      50
    ) {
      return next(
        new Error(
          "Customer cannot contain more than 50 addresses"
        )
      );
    }

    if (
      this.guardians.length >
      20
    ) {
      return next(
        new Error(
          "Customer cannot contain more than 20 guardians"
        )
      );
    }

    if (
      this.relatedCustomerIds.length >
      100
    ) {
      return next(
        new Error(
          "Customer cannot contain more than 100 related customers"
        )
      );
    }

    if (
      this.tags.length >
      100
    ) {
      return next(
        new Error(
          "Customer cannot contain more than 100 tags"
        )
      );
    }

    if (
      this.segments.length >
      100
    ) {
      return next(
        new Error(
          "Customer cannot contain more than 100 segments"
        )
      );
    }

    if (
      this.creditLimit <
      0
    ) {
      return next(
        new Error(
          "Credit limit cannot be negative"
        )
      );
    }

    if (
      this.engagement.totalSpend <
      0
    ) {
      return next(
        new Error(
          "Customer total spend cannot be negative"
        )
      );
    }

    if (
      this.doNotContact &&
      !this.doNotContactAt
    ) {
      this.doNotContactAt =
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

customerSchema.virtual(
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

customerSchema.virtual(
  "primaryEmail"
).get(function () {
  return (
    this.communication?.primaryEmail ||
    null
  );
});

customerSchema.virtual(
  "primaryPhone"
).get(function () {
  return (
    this.communication?.primaryPhone ||
    null
  );
});

customerSchema.virtual(
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

customerSchema.virtual(
  "isActive"
).get(function () {
  return (
    this.status ===
      "active" &&
    !this.isDeleted
  );
});

customerSchema.virtual(
  "hasOutstandingBalance"
).get(function () {
  return (
    this.engagement
      .outstandingBalance >
    0
  );
});

customerSchema.virtual(
  "isHighValue"
).get(function () {
  return (
    this.engagement
      .lifetimeValue >=
    100000
  );
});

/* ============================================================================
 * QUERY HELPERS
 * ========================================================================== */

customerSchema.query.byInstitute =
  function (
    instituteId
  ) {
    return this.where({
      instituteId,
      isDeleted: false,
    });
  };

customerSchema.query.active =
  function () {
    return this.where({
      status: "active",
      isDeleted: false,
    });
  };

customerSchema.query.notDeleted =
  function () {
    return this.where({
      isDeleted: false,
    });
  };

customerSchema.query.withOutstandingBalance =
  function () {
    return this.where({
      "engagement.outstandingBalance": {
        $gt: 0,
      },
      isDeleted: false,
    });
  };

customerSchema.query.highValue =
  function (
    minimum = 100000
  ) {
    return this.where({
      "engagement.lifetimeValue": {
        $gte: minimum,
      },
      isDeleted: false,
    });
  };

/* ============================================================================
 * INSTANCE METHODS
 * ========================================================================== */

customerSchema.methods.changeStatus =
  async function (
    status,
    changedBy = null
  ) {
    if (
      !CUSTOMER_STATUSES.includes(
        status
      )
    ) {
      throw new Error(
        "Invalid customer status"
      );
    }

    this.status =
      status;

    this.lastStatusChangeAt =
      new Date();

    this.lastModifiedBy =
      changedBy;

    return this.save();
  };

customerSchema.methods.setLifecycleStage =
  async function (
    lifecycleStage
  ) {
    if (
      !CUSTOMER_LIFECYCLE_STAGES.includes(
        lifecycleStage
      )
    ) {
      throw new Error(
        "Invalid customer lifecycle stage"
      );
    }

    this.lifecycleStage =
      lifecycleStage;

    return this.save();
  };

customerSchema.methods.assignOwner =
  async function ({
    ownerId,
    assignedBy = null,
    teamId = null,
    departmentId = null,
    territory = null,
  } = {}) {
    if (
      !ownerId
    ) {
      throw new Error(
        "Owner ID is required"
      );
    }

    this.assignment.ownerId =
      ownerId;

    this.assignment.assignedBy =
      assignedBy;

    this.assignment.assignedAt =
      new Date();

    this.assignment.teamId =
      teamId;

    this.assignment.departmentId =
      departmentId;

    this.assignment.territory =
      territory;

    return this.save();
  };

customerSchema.methods.addAddress =
  async function (
    address
  ) {
    if (
      !address ||
      typeof address !==
        "object"
    ) {
      throw new Error(
        "Address data is required"
      );
    }

    if (
      this.addresses.length >=
      50
    ) {
      throw new Error(
        "Maximum address limit reached"
      );
    }

    if (
      address.isPrimary
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

customerSchema.methods.setPrimaryAddress =
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

customerSchema.methods.removeAddress =
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

    address.deleteOne();

    return this.save();
  };

customerSchema.methods.addGuardian =
  async function (
    guardian
  ) {
    if (
      this.guardians.length >=
      20
    ) {
      throw new Error(
        "Maximum guardian limit reached"
      );
    }

    if (
      guardian?.isPrimary
    ) {
      this.guardians.forEach(
        (item) => {
          item.isPrimary =
            false;
        }
      );
    }

    this.guardians.push(
      guardian
    );

    return this.save();
  };

customerSchema.methods.addTag =
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

customerSchema.methods.removeTag =
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

customerSchema.methods.addSegment =
  async function (
    segment
  ) {
    const normalized =
      String(segment)
        .trim()
        .toLowerCase();

    if (
      !normalized
    ) {
      throw new Error(
        "Segment is required"
      );
    }

    if (
      this.segments.includes(
        normalized
      )
    ) {
      return this;
    }

    if (
      this.segments.length >=
      100
    ) {
      throw new Error(
        "Maximum segment limit reached"
      );
    }

    this.segments.push(
      normalized
    );

    return this.save();
  };

customerSchema.methods.removeSegment =
  async function (
    segment
  ) {
    const normalized =
      String(segment)
        .trim()
        .toLowerCase();

    this.segments =
      this.segments.filter(
        (item) =>
          item !==
          normalized
      );

    return this.save();
  };

customerSchema.methods.recordInteraction =
  async function ({
    type = "interaction",
    value = 0,
    occurredAt = new Date(),
  } = {}) {
    this.engagement
      .totalInteractions +=
      1;

    this.engagement
      .lastInteractionAt =
      occurredAt;

    this.engagement
      .lastContactAt =
      occurredAt;

    if (
      type ===
      "call"
    ) {
      this.engagement
        .totalCalls +=
        1;
    }

    if (
      type ===
      "email"
    ) {
      this.engagement
        .totalEmails +=
        1;
    }

    if (
      type ===
        "message" ||
      type ===
        "whatsapp"
    ) {
      this.engagement
        .totalMessages +=
        1;
    }

    if (
      value > 0
    ) {
      this.engagement
        .lastOrderValue =
        value;
    }

    return this.save();
  };

customerSchema.methods.recordPurchase =
  async function ({
    amount = 0,
    occurredAt = new Date(),
  } = {}) {
    const purchaseAmount =
      Number(amount);

    if (
      !Number.isFinite(
        purchaseAmount
      ) ||
      purchaseAmount <
        0
    ) {
      throw new Error(
        "Purchase amount must be a valid non-negative number"
      );
    }

    this.engagement
      .totalOrders +=
      1;

    this.engagement
      .totalSpend =
      Number(
        (
          this.engagement
            .totalSpend +
          purchaseAmount
        ).toFixed(2)
      );

    this.engagement
      .lastOrderValue =
      purchaseAmount;

    this.engagement
      .lastPurchaseAt =
      occurredAt;

    this.engagement
      .firstPurchaseAt =
      this.engagement
        .firstPurchaseAt ||
      occurredAt;

    this.engagement
      .averageOrderValue =
      this.engagement
        .totalOrders >
      0
        ? Number(
            (
              this.engagement
                .totalSpend /
              this.engagement
                .totalOrders
            ).toFixed(2)
          )
        : 0;

    this.engagement
      .lifetimeValue =
      this.engagement
        .totalSpend;

    this.engagement
      .lastInteractionAt =
      occurredAt;

    return this.save();
  };

customerSchema.methods.recordPayment =
  async function ({
    amount = 0,
    occurredAt = new Date(),
  } = {}) {
    const paymentAmount =
      Number(amount);

    if (
      !Number.isFinite(
        paymentAmount
      ) ||
      paymentAmount <
        0
    ) {
      throw new Error(
        "Payment amount must be a valid non-negative number"
      );
    }

    this.engagement
      .totalPayments +=
      1;

    this.engagement
      .outstandingBalance =
      Math.max(
        0,
        Number(
          (
            this.engagement
              .outstandingBalance -
            paymentAmount
          ).toFixed(2)
        )
      );

    this.engagement
      .lastInteractionAt =
      occurredAt;

    return this.save();
  };

customerSchema.methods.updateOutstandingBalance =
  async function (
    amount
  ) {
    const value =
      Number(amount);

    if (
      !Number.isFinite(
        value
      ) ||
      value <
        0
    ) {
      throw new Error(
        "Outstanding balance must be a valid non-negative number"
      );
    }

    this.engagement
      .outstandingBalance =
      Number(
        value.toFixed(2)
      );

    return this.save();
  };

customerSchema.methods.setDoNotContact =
  async function ({
    enabled = true,
    reason = null,
    changedBy = null,
  } = {}) {
    this.doNotContact =
      enabled;

    this.doNotContactReason =
      reason;

    this.doNotContactAt =
      enabled
        ? new Date()
        : null;

    this.doNotContactBy =
      changedBy;

    return this.save();
  };

customerSchema.methods.updateScores =
  async function ({
    leadScore = this.leadScore,
    healthScore = this.healthScore,
  } = {}) {
    this.leadScore =
      Math.max(
        0,
        Math.min(
          100,
          Number(
            leadScore
          )
        )
      );

    this.healthScore =
      Math.max(
        0,
        Math.min(
          100,
          Number(
            healthScore
          )
        )
      );

    return this.save();
  };

customerSchema.methods.setLegalHold =
  async function (
    enabled = true
  ) {
    this.legalHold =
      enabled;

    return this.save();
  };

customerSchema.methods.archive =
  async function ({
    archivedBy = null,
  } = {}) {
    this.status =
      "archived";

    this.archivedAt =
      new Date();

    this.archivedBy =
      archivedBy;

    return this.save();
  };

customerSchema.methods.softDelete =
  async function ({
    deletedBy = null,
    reason = null,
  } = {}) {
    if (
      this.legalHold
    ) {
      throw new Error(
        "Customer is under legal hold"
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

customerSchema.methods.restore =
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

customerSchema.statics.findByCode =
  function (
    instituteId,
    customerCode
  ) {
    return this.findOne({
      instituteId,
      customerCode:
        String(
          customerCode
        )
          .trim()
          .toUpperCase(),
      isDeleted: false,
    });
  };

customerSchema.statics.findByEmail =
  function (
    instituteId,
    email
  ) {
    return this.findOne({
      instituteId,
      "communication.primaryEmail":
        String(
          email
        )
          .trim()
          .toLowerCase(),
      isDeleted: false,
    });
  };

customerSchema.statics.findByPhone =
  function (
    instituteId,
    phone
  ) {
    return this.findOne({
      instituteId,
      "communication.primaryPhone":
        String(
          phone
        ).trim(),
      isDeleted: false,
    });
  };

customerSchema.statics.findByUser =
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

customerSchema.statics.findByStudent =
  function (
    instituteId,
    studentId
  ) {
    return this.findOne({
      instituteId,
      studentId,
      isDeleted: false,
    });
  };

customerSchema.statics.findByLead =
  function (
    instituteId,
    leadId
  ) {
    return this.findOne({
      instituteId,
      leadId,
      isDeleted: false,
    });
  };

customerSchema.statics.findByOwner =
  function (
    instituteId,
    ownerId,
    {
      status = null,
      limit = 100,
    } = {}
  ) {
    const query = {
      instituteId,
      "assignment.ownerId":
        ownerId,
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

customerSchema.statics.findAtRisk =
  function (
    instituteId,
    {
      maxHealthScore = 40,
      limit = 100,
    } = {}
  ) {
    return this.find({
      instituteId,
      healthScore: {
        $lte:
          maxHealthScore,
      },
      status: {
        $in: [
          "active",
          "inactive",
        ],
      },
      isDeleted: false,
    })
      .sort({
        healthScore: 1,
        "engagement.lastInteractionAt": 1,
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

customerSchema.statics.findHighValue =
  function (
    instituteId,
    minimumLifetimeValue = 100000,
    limit = 100
  ) {
    return this.find({
      instituteId,
      "engagement.lifetimeValue": {
        $gte:
          minimumLifetimeValue,
      },
      isDeleted: false,
    })
      .sort({
        "engagement.lifetimeValue": -1,
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

customerSchema.statics.findWithOutstandingBalance =
  function (
    instituteId,
    limit = 100
  ) {
    return this.find({
      instituteId,
      "engagement.outstandingBalance": {
        $gt: 0,
      },
      isDeleted: false,
    })
      .sort({
        "engagement.outstandingBalance": -1,
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

customerSchema.statics.search =
  function (
    instituteId,
    search,
    limit = 50
  ) {
    if (
      !search ||
      !String(
        search
      ).trim()
    ) {
      return this.find({
        instituteId,
        isDeleted: false,
      })
        .sort({
          createdAt: -1,
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
            String(
              search
            ).trim(),
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

customerSchema.statics.getSummary =
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

            inactive: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "inactive",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            blocked: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "blocked",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            totalSpend: {
              $sum:
                "$engagement.totalSpend",
            },

            lifetimeValue: {
              $sum:
                "$engagement.lifetimeValue",
            },

            outstandingBalance: {
              $sum:
                "$engagement.outstandingBalance",
            },

            totalOrders: {
              $sum:
                "$engagement.totalOrders",
            },

            averageHealthScore: {
              $avg:
                "$healthScore",
            },

            averageLeadScore: {
              $avg:
                "$leadScore",
            },
          },
        },
        {
          $project: {
            _id: 0,
            total: 1,
            active: 1,
            inactive: 1,
            blocked: 1,
            totalSpend: 1,
            lifetimeValue: 1,
            outstandingBalance: 1,
            totalOrders: 1,
            averageHealthScore: 1,
            averageLeadScore: 1,
          },
        },
      ]);

    return (
      result[0] || {
        total: 0,
        active: 0,
        inactive: 0,
        blocked: 0,
        totalSpend: 0,
        lifetimeValue: 0,
        outstandingBalance: 0,
        totalOrders: 0,
        averageHealthScore: 0,
        averageLeadScore: 0,
      }
    );
  };

/* ============================================================================
 * MODEL
 * ========================================================================== */

export const Customer =
  mongoose.models.Customer ||
  mongoose.model(
    "Customer",
    customerSchema
  );

export {
  CUSTOMER_STATUSES,
  CUSTOMER_TYPES,
  CUSTOMER_SOURCES,
  CUSTOMER_LIFECYCLE_STAGES,
  CONTACT_PREFERENCES,
  GENDERS,
  ADDRESS_TYPES,
};
