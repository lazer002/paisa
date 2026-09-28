// server/src/models/Lead.js

import mongoose from "mongoose";

import crypto from "node:crypto";
const LEAD_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "unqualified",
  "nurturing",
  "converted",
  "lost",
  "junk",
];

const LEAD_SOURCES = [
  "website",
  "landing_page",
  "referral",
  "social_media",
  "google",
  "facebook",
  "instagram",
  "linkedin",
  "whatsapp",
  "email",
  "phone",
  "walk_in",
  "event",
  "campaign",
  "advertisement",
  "partner",
  "import",
  "api",
  "other",
];

const LEAD_PRIORITIES = [
  "low",
  "normal",
  "high",
  "urgent",
];

const LEAD_TYPES = [
  "student",
  "parent",
  "individual",
  "business",
  "institution",
  "employee",
  "other",
];

const LEAD_TEMPERATURES = [
  "cold",
  "warm",
  "hot",
];

const LEAD_QUALIFICATION_STATUSES = [
  "not_reviewed",
  "pending",
  "qualified",
  "disqualified",
];

const LEAD_DISQUALIFICATION_REASONS = [
  "invalid_contact",
  "duplicate",
  "not_interested",
  "wrong_requirement",
  "wrong_location",
  "wrong_budget",
  "not_eligible",
  "already_customer",
  "competitor",
  "spam",
  "unresponsive",
  "other",
];

const ACTIVITY_OUTCOMES = [
  "connected",
  "not_connected",
  "interested",
  "not_interested",
  "callback_requested",
  "meeting_scheduled",
  "meeting_completed",
  "proposal_sent",
  "converted",
  "lost",
  "no_response",
  "other",
];

const contactMethodSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "phone",
        "email",
        "whatsapp",
        "sms",
        "website",
        "other",
      ],
      required: true,
    },

    value: {
      type: String,
      trim: true,
      maxlength: 500,
      required: true,
    },

    normalizedValue: {
      type: String,
      trim: true,
      maxlength: 500,
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
  },
  {
    _id: false,
  }
);

const qualificationSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: LEAD_QUALIFICATION_STATUSES,
      default: "not_reviewed",
      index: true,
    },

    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    budget: {
      min: {
        type: Number,
        min: 0,
        default: null,
      },

      max: {
        type: Number,
        min: 0,
        default: null,
      },

      currency: {
        type: String,
        trim: true,
        uppercase: true,
        maxlength: 10,
        default: "INR",
      },
    },

    requirement: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: null,
    },

    need: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },

    timeline: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
    },

    decisionMaker: {
      type: Boolean,
      default: false,
    },

    decisionMakerName: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
    },

    authorityLevel: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
    },

    qualificationNotes: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: null,
    },

    qualifiedAt: {
      type: Date,
      default: null,
    },

    qualifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    disqualifiedAt: {
      type: Date,
      default: null,
    },

    disqualifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    disqualificationReason: {
      type: String,
      enum: LEAD_DISQUALIFICATION_REASONS,
      default: null,
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
      index: true,
    },

    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
      index: true,
    },

    assignedAt: {
      type: Date,
      default: null,
    },

    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    assignmentReason: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },

    autoAssigned: {
      type: Boolean,
      default: false,
    },

    roundRobinKey: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
    },
  },
  {
    _id: false,
  }
);

const conversionSchema = new mongoose.Schema(
  {
    converted: {
      type: Boolean,
      default: false,
    },

    convertedAt: {
      type: Date,
      default: null,
    },

    convertedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },

    enrollmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enrollment",
      default: null,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    dealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Deal",
      default: null,
    },

    conversionValue: {
      type: Number,
      min: 0,
      default: null,
    },

    currency: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 10,
      default: "INR",
    },

    conversionNotes: {
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

const campaignSchema = new mongoose.Schema(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },

    campaignCode: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
    },

    campaignName: {
      type: String,
      trim: true,
      maxlength: 300,
      default: null,
    },

    medium: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    source: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    term: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
    },

    content: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },

    landingPage: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },

    referrer: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },
  },
  {
    _id: false,
  }
);

const followUpSchema = new mongoose.Schema(
  {
    required: {
      type: Boolean,
      default: false,
    },

    dueAt: {
      type: Date,
      default: null,
      index: true,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    type: {
      type: String,
      enum: [
        "call",
        "email",
        "whatsapp",
        "meeting",
        "demo",
        "visit",
        "task",
        "other",
      ],
      default: "call",
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: null,
    },
  },
  {
    _id: false,
  }
);

const leadSchema = new mongoose.Schema(
  {
    /* ====================================================================== */
    /* TENANCY                                                               */
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
    `lead_${crypto.randomBytes(16).toString("base64url")}`,
},
    /* ====================================================================== */
    /* IDENTITY                                                               */
    /* ====================================================================== */

    leadCode: {
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

    /* ====================================================================== */
    /* BASIC INFORMATION                                                      */
    /* ====================================================================== */

    type: {
      type: String,
      enum: LEAD_TYPES,
      default: "individual",
      index: true,
    },

    firstName: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    lastName: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    fullName: {
      type: String,
      trim: true,
      maxlength: 250,
      required: true,
    },

    displayName: {
      type: String,
      trim: true,
      maxlength: 250,
      default: null,
    },

    companyName: {
      type: String,
      trim: true,
      maxlength: 300,
      default: null,
    },

    designation: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
    },

    /* ====================================================================== */
    /* CONTACT                                                                 */
    /* ====================================================================== */

    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 320,
      default: null,
      index: true,
    },

    phone: {
      type: String,
      trim: true,
      maxlength: 50,
      default: null,
      index: true,
    },

    alternatePhone: {
      type: String,
      trim: true,
      maxlength: 50,
      default: null,
    },

    whatsappNumber: {
      type: String,
      trim: true,
      maxlength: 50,
      default: null,
    },

    contactMethods: {
      type: [contactMethodSchema],
      default: [],
    },

    preferredContactMethod: {
      type: String,
      enum: [
        "phone",
        "email",
        "whatsapp",
        "sms",
        "website",
      ],
      default: "phone",
    },

    /* ====================================================================== */
    /* ADDRESS                                                                 */
    /* ====================================================================== */

    address: {
      line1: {
        type: String,
        trim: true,
        maxlength: 300,
        default: null,
      },

      line2: {
        type: String,
        trim: true,
        maxlength: 300,
        default: null,
      },

      city: {
        type: String,
        trim: true,
        maxlength: 150,
        default: null,
      },

      state: {
        type: String,
        trim: true,
        maxlength: 150,
        default: null,
      },

      country: {
        type: String,
        trim: true,
        maxlength: 150,
        default: "India",
      },

      postalCode: {
        type: String,
        trim: true,
        maxlength: 30,
        default: null,
      },
    },

    /* ====================================================================== */
    /* LEAD STATE                                                              */
    /* ====================================================================== */

    status: {
      type: String,
      enum: LEAD_STATUSES,
      default: "new",
      index: true,
    },

    priority: {
      type: String,
      enum: LEAD_PRIORITIES,
      default: "normal",
      index: true,
    },

    temperature: {
      type: String,
      enum: LEAD_TEMPERATURES,
      default: "cold",
      index: true,
    },

    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
      index: true,
    },

    /* ====================================================================== */
    /* SOURCE                                                                  */
    /* ====================================================================== */

    source: {
      type: String,
      enum: LEAD_SOURCES,
      default: "other",
      index: true,
    },

    sourceDetails: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },

    referralCode: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 100,
      default: null,
    },

    referredByLeadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      default: null,
    },

    referredByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /* ====================================================================== */
    /* CAMPAIGN                                                                */
    /* ====================================================================== */

    campaign: {
      type: campaignSchema,
      default: () => ({}),
    },

    /* ====================================================================== */
    /* ASSIGNMENT                                                              */
    /* ====================================================================== */

    assignment: {
      type: assignmentSchema,
      default: () => ({}),
    },

    /* ====================================================================== */
    /* QUALIFICATION                                                           */
    /* ====================================================================== */

    qualification: {
      type: qualificationSchema,
      default: () => ({}),
    },

    /* ====================================================================== */
    /* INTEREST / REQUIREMENT                                                  */
    /* ====================================================================== */

    interestedIn: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Course",
        },
      ],
      default: [],
    },

    interestedPrograms: {
      type: [String],
      default: [],
    },

    interestedClasses: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Class",
        },
      ],
      default: [],
    },

    requirement: {
      type: String,
      trim: true,
      maxlength: 10000,
      default: null,
    },

    preferredStartDate: {
      type: Date,
      default: null,
    },

    preferredLocation: {
      type: String,
      trim: true,
      maxlength: 300,
      default: null,
    },

    /* ====================================================================== */
    /* FOLLOW-UP                                                               */
    /* ====================================================================== */

    followUp: {
      type: followUpSchema,
      default: () => ({}),
    },

    lastContactedAt: {
      type: Date,
      default: null,
      index: true,
    },

    nextContactAt: {
      type: Date,
      default: null,
      index: true,
    },

    lastActivityAt: {
      type: Date,
      default: null,
      index: true,
    },

    /* ====================================================================== */
    /* CONVERSION                                                              */
    /* ====================================================================== */

    conversion: {
      type: conversionSchema,
      default: () => ({}),
    },

    /* ====================================================================== */
    /* DUPLICATE MANAGEMENT                                                    */
    /* ====================================================================== */

    duplicateOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      default: null,
      index: true,
    },

    duplicateCheckedAt: {
      type: Date,
      default: null,
    },

    duplicateScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    /* ====================================================================== */
    /* COMMUNICATION / ENGAGEMENT                                              */
    /* ====================================================================== */

    communication: {
      emailCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      callCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      whatsappCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      meetingCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      responseCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      unansweredCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      lastResponseAt: {
        type: Date,
        default: null,
      },
    },

    /* ====================================================================== */
    /* NOTES / TAGS                                                            */
    /* ====================================================================== */

    notes: {
      type: String,
      trim: true,
      maxlength: 10000,
      default: null,
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

    /* ====================================================================== */
    /* CONSENT / PRIVACY                                                       */
    /* ====================================================================== */

    consent: {
      marketing: {
        type: Boolean,
        default: false,
      },

      communication: {
        type: Boolean,
        default: true,
      },

      dataProcessing: {
        type: Boolean,
        default: true,
      },

      consentAt: {
        type: Date,
        default: null,
      },

      consentSource: {
        type: String,
        trim: true,
        maxlength: 200,
        default: null,
      },

      revokedAt: {
        type: Date,
        default: null,
      },
    },

    /* ====================================================================== */
    /* ANALYTICS                                                               */
    /* ====================================================================== */

    analytics: {
      pageViews: {
        type: Number,
        min: 0,
        default: 0,
      },

      websiteVisits: {
        type: Number,
        min: 0,
        default: 0,
      },

      emailOpens: {
        type: Number,
        min: 0,
        default: 0,
      },

      emailClicks: {
        type: Number,
        min: 0,
        default: 0,
      },

      formSubmissions: {
        type: Number,
        min: 0,
        default: 0,
      },

      adInteractions: {
        type: Number,
        min: 0,
        default: 0,
      },

      engagementScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
    },

    /* ====================================================================== */
    /* ACTIVITY SNAPSHOT                                                       */
    /* ====================================================================== */

    lastActivity: {
      type: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      outcome: {
        type: String,
        enum: ACTIVITY_OUTCOMES,
        default: null,
      },

      occurredAt: {
        type: Date,
        default: null,
      },

      performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      summary: {
        type: String,
        trim: true,
        maxlength: 2000,
        default: null,
      },
    },

    /* ====================================================================== */
    /* CUSTOM FIELDS                                                           */
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

    /* ====================================================================== */
    /* LIFECYCLE                                                               */
    /* ====================================================================== */

    convertedAt: {
      type: Date,
      default: null,
    },

    lostAt: {
      type: Date,
      default: null,
    },

    lostReason: {
      type: String,
      trim: true,
      maxlength: 2000,
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

leadSchema.index(
  {
    instituteId: 1,
    leadCode: 1,
  },
  {
    unique: true,
    sparse: true,
    name: "tenant_lead_code",
  }
);

leadSchema.index(
  {
    instituteId: 1,
    email: 1,
    isDeleted: 1,
  },
  {
    sparse: true,
    name: "tenant_lead_email",
  }
);

leadSchema.index(
  {
    instituteId: 1,
    phone: 1,
    isDeleted: 1,
  },
  {
    sparse: true,
    name: "tenant_lead_phone",
  }
);

leadSchema.index(
  {
    instituteId: 1,
    status: 1,
    priority: 1,
    score: -1,
  },
  {
    name: "lead_pipeline_listing",
  }
);

leadSchema.index(
  {
    instituteId: 1,
    "assignment.ownerId": 1,
    status: 1,
    lastActivityAt: -1,
  },
  {
    name: "owner_lead_pipeline",
  }
);

leadSchema.index(
  {
    instituteId: 1,
    "assignment.teamId": 1,
    status: 1,
    createdAt: -1,
  },
  {
    name: "team_lead_pipeline",
  }
);

leadSchema.index(
  {
    instituteId: 1,
    source: 1,
    createdAt: -1,
  },
  {
    name: "lead_source_analytics",
  }
);

leadSchema.index(
  {
    instituteId: 1,
    "campaign.campaignId": 1,
    createdAt: -1,
  },
  {
    name: "campaign_leads",
  }
);

leadSchema.index(
  {
    instituteId: 1,
    nextContactAt: 1,
    status: 1,
  },
  {
    name: "lead_followup_queue",
  }
);

leadSchema.index(
  {
    instituteId: 1,
    "followUp.dueAt": 1,
    status: 1,
  },
  {
    name: "lead_followup_due",
  }
);

leadSchema.index(
  {
    instituteId: 1,
    temperature: 1,
    score: -1,
  },
  {
    name: "lead_temperature_score",
  }
);

leadSchema.index(
  {
    instituteId: 1,
    "qualification.status": 1,
    createdAt: -1,
  },
  {
    name: "lead_qualification",
  }
);

leadSchema.index(
  {
    instituteId: 1,
    "conversion.converted": 1,
    "conversion.convertedAt": -1,
  },
  {
    name: "lead_conversion",
  }
);

leadSchema.index(
  {
    instituteId: 1,
    duplicateOf: 1,
  },
  {
    sparse: true,
    name: "lead_duplicates",
  }
);

leadSchema.index(
  {
    instituteId: 1,
    tags: 1,
  },
  {
    name: "lead_tags",
  }
);

leadSchema.index(
  {
    instituteId: 1,
    lastActivityAt: -1,
  },
  {
    name: "lead_recent_activity",
  }
);

leadSchema.index(
  {
    instituteId: 1,
    createdAt: -1,
  },
  {
    name: "lead_recent",
  }
);

leadSchema.index(
  {
    instituteId: 1,
    fullName: "text",
    email: "text",
    phone: "text",
    companyName: "text",
    requirement: "text",
  },
  {
    name: "lead_search",
    weights: {
      fullName: 10,
      email: 8,
      phone: 8,
      companyName: 5,
      requirement: 3,
    },
  }
);

/* ============================================================================
 * VALIDATION
 * ========================================================================== */

leadSchema.pre(
  "validate",
  function (next) {
    if (
      this.qualification.budget.min !== null &&
      this.qualification.budget.max !== null &&
      this.qualification.budget.max <
        this.qualification.budget.min
    ) {
      return next(
        new Error(
          "Maximum budget cannot be lower than minimum budget"
        )
      );
    }

    if (
      this.status === "converted" &&
      !this.conversion.converted
    ) {
      this.conversion.converted = true;

      if (
        !this.conversion.convertedAt
      ) {
        this.conversion.convertedAt =
          new Date();
      }
    }

    if (
      this.status === "lost" &&
      !this.lostAt
    ) {
      this.lostAt =
        new Date();
    }

    if (
      this.qualification.status ===
        "qualified" &&
      !this.qualification.qualifiedAt
    ) {
      this.qualification.qualifiedAt =
        new Date();
    }

    if (
      this.qualification.status ===
        "disqualified" &&
      !this.qualification.disqualifiedAt
    ) {
      this.qualification.disqualifiedAt =
        new Date();
    }

    if (
      this.tags.length > 100
    ) {
      return next(
        new Error(
          "Lead cannot contain more than 100 tags"
        )
      );
    }

    if (
      this.contactMethods.length > 20
    ) {
      return next(
        new Error(
          "Lead cannot contain more than 20 contact methods"
        )
      );
    }

    next();
  }
);

/* ============================================================================
 * VIRTUALS
 * ========================================================================== */

leadSchema.virtual(
  "isConverted"
).get(function () {
  return (
    this.status === "converted" ||
    this.conversion.converted
  );
});

leadSchema.virtual(
  "isOpen"
).get(function () {
  return [
    "new",
    "contacted",
    "qualified",
    "nurturing",
  ].includes(this.status);
});

leadSchema.virtual(
  "isClosed"
).get(function () {
  return [
    "converted",
    "lost",
    "junk",
    "unqualified",
  ].includes(this.status);
});

leadSchema.virtual(
  "needsFollowUp"
).get(function () {
  if (
    !this.followUp?.required ||
    !this.followUp?.dueAt
  ) {
    return false;
  }

  return (
    !this.followUp.completedAt &&
    this.followUp.dueAt <=
      new Date()
  );
});

leadSchema.virtual(
  "ageInDays"
).get(function () {
  if (!this.createdAt) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor(
      (Date.now() -
        this.createdAt.getTime()) /
        86400000
    )
  );
});

/* ============================================================================
 * QUERY HELPERS
 * ========================================================================== */

leadSchema.query.byInstitute =
  function (instituteId) {
    return this.where({
      instituteId,
      isDeleted: false,
    });
  };

leadSchema.query.open =
  function () {
    return this.where({
      isDeleted: false,
      status: {
        $in: [
          "new",
          "contacted",
          "qualified",
          "nurturing",
        ],
      },
    });
  };

leadSchema.query.byOwner =
  function (ownerId) {
    return this.where({
      isDeleted: false,
      "assignment.ownerId": ownerId,
    });
  };

leadSchema.query.bySource =
  function (source) {
    return this.where({
      isDeleted: false,
      source,
    });
  };

leadSchema.query.qualified =
  function () {
    return this.where({
      isDeleted: false,
      "qualification.status": "qualified",
    });
  };

leadSchema.query.converted =
  function () {
    return this.where({
      isDeleted: false,
      status: "converted",
    });
  };

leadSchema.query.followUpsDue =
  function () {
    return this.where({
      isDeleted: false,
      "followUp.required": true,
      "followUp.completedAt": null,
      "followUp.dueAt": {
        $lte: new Date(),
      },
    });
  };

leadSchema.query.hot =
  function () {
    return this.where({
      isDeleted: false,
      temperature: "hot",
      status: {
        $in: [
          "new",
          "contacted",
          "qualified",
          "nurturing",
        ],
      },
    });
  };

/* ============================================================================
 * INSTANCE METHODS
 * ========================================================================== */

leadSchema.methods.assign =
  async function ({
    ownerId = null,
    teamId = null,
    assignedBy = null,
    autoAssigned = false,
    reason = null,
  } = {}) {
    this.assignment.ownerId =
      ownerId;

    this.assignment.teamId =
      teamId;

    this.assignment.assignedAt =
      new Date();

    this.assignment.assignedBy =
      assignedBy;

    this.assignment.assignmentReason =
      reason;

    this.assignment.autoAssigned =
      autoAssigned;

    this.lastActivityAt =
      new Date();

    return this.save();
  };

leadSchema.methods.contact =
  async function ({
    method = "phone",
    outcome = "connected",
    contactedAt = new Date(),
    notes = null,
    performedBy = null,
  } = {}) {
    this.lastContactedAt =
      contactedAt;

    this.lastActivityAt =
      contactedAt;

    this.lastActivity = {
      type: method,
      outcome,
      occurredAt:
        contactedAt,
      performedBy,
      summary: notes,
    };

    if (method === "phone") {
      this.communication.callCount +=
        1;
    } else if (method === "email") {
      this.communication.emailCount +=
        1;
    } else if (method === "whatsapp") {
      this.communication.whatsappCount +=
        1;
    }

    if (
      [
        "connected",
        "interested",
        "meeting_scheduled",
        "meeting_completed",
        "proposal_sent",
        "converted",
      ].includes(outcome)
    ) {
      this.communication.responseCount +=
        1;

      this.communication.lastResponseAt =
        contactedAt;
    } else if (
      [
        "not_connected",
        "no_response",
      ].includes(outcome)
    ) {
      this.communication.unansweredCount +=
        1;
    }

    if (
      this.status === "new"
    ) {
      this.status =
        "contacted";
    }

    return this.save();
  };

leadSchema.methods.qualify =
  async function ({
    score = null,
    temperature = null,
    qualifiedBy = null,
    notes = null,
  } = {}) {
    this.qualification.status =
      "qualified";

    this.qualification.qualifiedAt =
      new Date();

    this.qualification.qualifiedBy =
      qualifiedBy;

    if (
      score !== null
    ) {
      this.score =
        Math.max(
          0,
          Math.min(
            100,
            score
          )
        );
    }

    if (
      temperature
    ) {
      this.temperature =
        temperature;
    }

    if (
      notes
    ) {
      this.qualification.qualificationNotes =
        notes;
    }

    this.status =
      "qualified";

    this.lastActivityAt =
      new Date();

    return this.save();
  };

leadSchema.methods.disqualify =
  async function ({
    reason,
    disqualifiedBy = null,
  } = {}) {
    if (
      !LEAD_DISQUALIFICATION_REASONS.includes(
        reason
      )
    ) {
      throw new Error(
        "Invalid lead disqualification reason"
      );
    }

    this.qualification.status =
      "disqualified";

    this.qualification.disqualifiedAt =
      new Date();

    this.qualification.disqualifiedBy =
      disqualifiedBy;

    this.qualification.disqualificationReason =
      reason;

    this.status =
      "unqualified";

    this.lastActivityAt =
      new Date();

    return this.save();
  };

leadSchema.methods.nurture =
  async function () {
    this.status =
      "nurturing";

    this.lastActivityAt =
      new Date();

    return this.save();
  };

leadSchema.methods.scheduleFollowUp =
  async function ({
    dueAt,
    assignedTo = null,
    type = "call",
    notes = null,
  } = {}) {
    if (
      !dueAt
    ) {
      throw new Error(
        "Follow-up due date is required"
      );
    }

    this.followUp.required =
      true;

    this.followUp.dueAt =
      dueAt;

    this.followUp.completedAt =
      null;

    this.followUp.assignedTo =
      assignedTo;

    this.followUp.type =
      type;

    this.followUp.notes =
      notes;

    this.nextContactAt =
      dueAt;

    return this.save();
  };

leadSchema.methods.completeFollowUp =
  async function ({
    notes = null,
  } = {}) {
    this.followUp.completedAt =
      new Date();

    if (
      notes
    ) {
      this.followUp.notes =
        notes;
    }

    this.lastActivityAt =
      new Date();

    this.nextContactAt =
      null;

    return this.save();
  };

leadSchema.methods.convert =
  async function ({
    convertedBy = null,
    customerId = null,
    enrollmentId = null,
    userId = null,
    dealId = null,
    conversionValue = null,
    conversionNotes = null,
  } = {}) {
    const now =
      new Date();

    this.status =
      "converted";

    this.conversion.converted =
      true;

    this.conversion.convertedAt =
      now;

    this.conversion.convertedBy =
      convertedBy;

    this.conversion.customerId =
      customerId;

    this.conversion.enrollmentId =
      enrollmentId;

    this.conversion.userId =
      userId;

    this.conversion.dealId =
      dealId;

    this.conversion.conversionValue =
      conversionValue;

    this.conversion.conversionNotes =
      conversionNotes;

    this.convertedAt =
      now;

    this.lastActivityAt =
      now;

    this.lastActivity = {
      type: "conversion",
      outcome: "converted",
      occurredAt: now,
      performedBy:
        convertedBy,
      summary:
        "Lead converted",
    };

    return this.save();
  };

leadSchema.methods.markLost =
  async function ({
    reason = null,
  } = {}) {
    this.status =
      "lost";

    this.lostAt =
      new Date();

    this.lostReason =
      reason;

    this.lastActivityAt =
      new Date();

    this.lastActivity = {
      type: "status_change",
      outcome: "lost",
      occurredAt:
        new Date(),
      summary:
        reason ||
        "Lead marked as lost",
    };

    return this.save();
  };

leadSchema.methods.markJunk =
  async function ({
    reason = null,
  } = {}) {
    this.status =
      "junk";

    this.lostReason =
      reason;

    this.lastActivityAt =
      new Date();

    return this.save();
  };

leadSchema.methods.updateScore =
  async function (
    score
  ) {
    if (
      typeof score !==
        "number" ||
      score < 0 ||
      score > 100
    ) {
      throw new Error(
        "Lead score must be between 0 and 100"
      );
    }

    this.score =
      score;

    if (
      score >= 80
    ) {
      this.temperature =
        "hot";
    } else if (
      score >= 50
    ) {
      this.temperature =
        "warm";
    } else {
      this.temperature =
        "cold";
    }

    return this.save();
  };

leadSchema.methods.updateEngagement =
  async function ({
    pageViews = 0,
    websiteVisits = 0,
    emailOpens = 0,
    emailClicks = 0,
    formSubmissions = 0,
    adInteractions = 0,
  } = {}) {
    this.analytics.pageViews +=
      Math.max(
        0,
        pageViews
      );

    this.analytics.websiteVisits +=
      Math.max(
        0,
        websiteVisits
      );

    this.analytics.emailOpens +=
      Math.max(
        0,
        emailOpens
      );

    this.analytics.emailClicks +=
      Math.max(
        0,
        emailClicks
      );

    this.analytics.formSubmissions +=
      Math.max(
        0,
        formSubmissions
      );

    this.analytics.adInteractions +=
      Math.max(
        0,
        adInteractions
      );

    const engagement =
      this.analytics.emailOpens +
      this.analytics.emailClicks * 2 +
      this.analytics.pageViews +
      this.analytics.websiteVisits * 2 +
      this.analytics.formSubmissions * 5 +
      this.analytics.adInteractions * 3;

    this.analytics.engagementScore =
      Math.min(
        100,
        engagement
      );

    return this.save();
  };

leadSchema.methods.addTag =
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
      return this;
    }

    if (
      !this.tags.includes(
        normalized
      )
    ) {
      this.tags.push(
        normalized
      );
    }

    return this.save();
  };

leadSchema.methods.removeTag =
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
          item !== normalized
      );

    return this.save();
  };

leadSchema.methods.markDuplicate =
  async function ({
    duplicateOf,
    score = null,
  } = {}) {
    if (
      !duplicateOf
    ) {
      throw new Error(
        "Duplicate lead reference is required"
      );
    }

    this.duplicateOf =
      duplicateOf;

    this.duplicateScore =
      score;

    this.duplicateCheckedAt =
      new Date();

    this.status =
      "junk";

    return this.save();
  };

leadSchema.methods.verifyContact =
  async function ({
    type,
    value,
  } = {}) {
    const contact =
      this.contactMethods.find(
        (item) =>
          item.type === type &&
          (
            item.value ===
              value ||
            item.normalizedValue ===
              value
          )
      );

    if (
      !contact
    ) {
      throw new Error(
        "Contact method not found"
      );
    }

    contact.isVerified =
      true;

    contact.verifiedAt =
      new Date();

    return this.save();
  };

leadSchema.methods.softDelete =
  async function () {
    this.isDeleted =
      true;

    this.deletedAt =
      new Date();

    return this.save();
  };

leadSchema.methods.restore =
  async function () {
    this.isDeleted =
      false;

    this.deletedAt =
      null;

    return this.save();
  };

/* ============================================================================
 * STATIC METHODS
 * ========================================================================== */

leadSchema.statics.findOpenForOwner =
  function (
    instituteId,
    ownerId
  ) {
    return this.find({
      instituteId,
      "assignment.ownerId":
        ownerId,
      status: {
        $in: [
          "new",
          "contacted",
          "qualified",
          "nurturing",
        ],
      },
      isDeleted: false,
    }).sort({
      priority: -1,
      score: -1,
      lastActivityAt: -1,
    });
  };

leadSchema.statics.findHotLeads =
  function (
    instituteId,
    limit = 100
  ) {
    return this.find({
      instituteId,
      isDeleted: false,
      temperature: "hot",
      status: {
        $in: [
          "new",
          "contacted",
          "qualified",
          "nurturing",
        ],
      },
    })
      .sort({
        score: -1,
        lastActivityAt: -1,
      })
      .limit(limit);
  };

leadSchema.statics.findDueFollowUps =
  function (
    instituteId,
    limit = 100
  ) {
    return this.find({
      instituteId,
      isDeleted: false,
      "followUp.required": true,
      "followUp.completedAt": null,
      "followUp.dueAt": {
        $lte: new Date(),
      },
    })
      .sort({
        "followUp.dueAt": 1,
        priority: -1,
      })
      .limit(limit);
  };

leadSchema.statics.findPotentialDuplicates =
  function ({
    instituteId,
    email = null,
    phone = null,
    fullName = null,
    limit = 20,
  } = {}) {
    const conditions = [];

    if (email) {
      conditions.push({
        email: String(
          email
        ).trim().toLowerCase(),
      });
    }

    if (phone) {
      conditions.push({
        phone: String(
          phone
        ).trim(),
      });
    }

    if (fullName) {
      conditions.push({
        fullName: new RegExp(
          `^${String(
            fullName
          ).replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          )}$`,
          "i"
        ),
      });
    }

    if (
      !conditions.length
    ) {
      return this.find({
        _id: null,
      });
    }

    return this.find({
      instituteId,
      isDeleted: false,
      $or: conditions,
    }).limit(limit);
  };

leadSchema.statics.convertLead =
  async function (
    leadId,
    conversionData
  ) {
    const lead =
      await this.findById(
        leadId
      );

    if (!lead) {
      throw new Error(
        "Lead not found"
      );
    }

    return lead.convert(
      conversionData
    );
  };

/* ============================================================================
 * MODEL
 * ========================================================================== */

export const Lead =
  mongoose.models.Lead ||
  mongoose.model(
    "Lead",
    leadSchema
  );

export {
  LEAD_STATUSES,
  LEAD_SOURCES,
  LEAD_PRIORITIES,
  LEAD_TYPES,
  LEAD_TEMPERATURES,
  LEAD_QUALIFICATION_STATUSES,
  LEAD_DISQUALIFICATION_REASONS,
  ACTIVITY_OUTCOMES,
};
