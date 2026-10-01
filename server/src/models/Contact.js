// server/src/models/Contact.js

import mongoose from "mongoose";

import crypto from "node:crypto";
const CONTACT_TYPES = [
  "individual",
  "parent",
  "student",
  "guardian",
  "business",
  "institution",
  "vendor",
  "partner",
  "employee",
  "other",
];

const CONTACT_STATUSES = [
  "active",
  "inactive",
  "blocked",
  "archived",
];

const CONTACT_SOURCES = [
  "lead",
  "customer",
  "student",
  "employee",
  "referral",
  "website",
  "import",
  "manual",
  "api",
  "other",
];

const CONTACT_METHODS = [
  "phone",
  "email",
  "whatsapp",
  "sms",
  "website",
  "other",
];

const CONTACT_ROLES = [
  "owner",
  "decision_maker",
  "parent",
  "guardian",
  "student",
  "employee",
  "manager",
  "teacher",
  "hr",
  "finance",
  "admin",
  "contact",
  "other",
];

const addressSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "home",
        "work",
        "billing",
        "shipping",
        "other",
      ],
      default: "home",
    },

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

    landmark: {
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

    isPrimary: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: true,
  }
);

const communicationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: CONTACT_METHODS,
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

    label: {
      type: String,
      trim: true,
      maxlength: 100,
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

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    optedIn: {
      type: Boolean,
      default: true,
    },

    optedInAt: {
      type: Date,
      default: null,
    },

    optedOutAt: {
      type: Date,
      default: null,
    },

    doNotContact: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: true,
  }
);

const relationshipSchema = new mongoose.Schema(
  {
    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contact",
      required: true,
    },

    relationship: {
      type: String,
      trim: true,
      maxlength: 100,
      required: true,
    },

    role: {
      type: String,
      enum: CONTACT_ROLES,
      default: "contact",
    },

    isPrimary: {
      type: Boolean,
      default: false,
    },

    isEmergencyContact: {
      type: Boolean,
      default: false,
    },

    notes: {
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

const consentSchema = new mongoose.Schema(
  {
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

    email: {
      type: Boolean,
      default: true,
    },

    sms: {
      type: Boolean,
      default: false,
    },

    whatsapp: {
      type: Boolean,
      default: false,
    },

    consentSource: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
    },

    consentAt: {
      type: Date,
      default: null,
    },

    revokedAt: {
      type: Date,
      default: null,
    },

    privacyVersion: {
      type: String,
      trim: true,
      maxlength: 50,
      default: null,
    },
  },
  {
    _id: false,
  }
);

const engagementSchema = new mongoose.Schema(
  {
    totalActivities: {
      type: Number,
      min: 0,
      default: 0,
    },

    calls: {
      type: Number,
      min: 0,
      default: 0,
    },

    emails: {
      type: Number,
      min: 0,
      default: 0,
    },

    whatsappMessages: {
      type: Number,
      min: 0,
      default: 0,
    },

    meetings: {
      type: Number,
      min: 0,
      default: 0,
    },

    notes: {
      type: Number,
      min: 0,
      default: 0,
    },

    tasks: {
      type: Number,
      min: 0,
      default: 0,
    },

    lastContactedAt: {
      type: Date,
      default: null,
    },

    lastRespondedAt: {
      type: Date,
      default: null,
    },

    lastActivityAt: {
      type: Date,
      default: null,
      index: true,
    },

    engagementScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  {
    _id: false,
  }
);

const contactSchema = new mongoose.Schema(
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
    `con_${crypto.randomBytes(16).toString("base64url")}`,
},
    /* ====================================================================== */
    /* IDENTITY                                                               */
    /* ====================================================================== */

    contactCode: {
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
    /* TYPE / STATUS                                                          */
    /* ====================================================================== */

    type: {
      type: String,
      enum: CONTACT_TYPES,
      default: "individual",
      index: true,
    },

    status: {
      type: String,
      enum: CONTACT_STATUSES,
      default: "active",
      index: true,
    },

    source: {
      type: String,
      enum: CONTACT_SOURCES,
      default: "manual",
      index: true,
    },

    /* ====================================================================== */
    /* BASIC INFORMATION                                                      */
    /* ====================================================================== */

    firstName: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    middleName: {
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
      maxlength: 300,
      required: true,
    },

    displayName: {
      type: String,
      trim: true,
      maxlength: 300,
      default: null,
    },

    salutation: {
      type: String,
      trim: true,
      maxlength: 50,
      default: null,
    },

    dateOfBirth: {
      type: Date,
      default: null,
    },

    gender: {
      type: String,
      enum: [
        "male",
        "female",
        "other",
        "prefer_not_to_say",
      ],
      default: null,
    },

    /* ====================================================================== */
    /* ORGANIZATION / BUSINESS                                                */
    /* ====================================================================== */

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

    departmentName: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
    },

    industry: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
    },

    website: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },

    /* ====================================================================== */
    /* SYSTEM REFERENCES                                                      */
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

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
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
    /* CONTACT INFORMATION                                                    */
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

    communications: {
      type: [communicationSchema],
      default: [],
    },

    preferredContactMethod: {
      type: String,
      enum: CONTACT_METHODS,
      default: "phone",
    },

    preferredContactTime: {
      start: {
        type: String,
        trim: true,
        match: /^(?:[01]\d|2[0-3]):[0-5]\d$/,
        default: null,
      },

      end: {
        type: String,
        trim: true,
        match: /^(?:[01]\d|2[0-3]):[0-5]\d$/,
        default: null,
      },

      timezone: {
        type: String,
        trim: true,
        maxlength: 100,
        default: "Asia/Kolkata",
      },
    },

    /* ====================================================================== */
    /* ADDRESS                                                                */
    /* ====================================================================== */

    addresses: {
      type: [addressSchema],
      default: [],
    },

    /* ====================================================================== */
    /* RELATIONSHIPS                                                          */
    /* ====================================================================== */

    relationships: {
      type: [relationshipSchema],
      default: [],
    },

    /* ====================================================================== */
    /* CONSENT / PRIVACY                                                      */
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
      maxlength: 1000,
      default: null,
    },

    doNotContactAt: {
      type: Date,
      default: null,
    },

    /* ====================================================================== */
    /* ENGAGEMENT                                                             */
    /* ====================================================================== */

    engagement: {
      type: engagementSchema,
      default: () => ({}),
    },

    /* ====================================================================== */
    /* TAGGING                                                                */
    /* ====================================================================== */

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
          maxlength: 150,
        },
      ],
      default: [],
    },

    /* ====================================================================== */
    /* NOTES                                                                   */
    /* ====================================================================== */

    description: {
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
    /* SOCIAL / DIGITAL                                                       */
    /* ====================================================================== */

    social: {
      linkedin: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: null,
      },

      instagram: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: null,
      },

      facebook: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: null,
      },

      twitter: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: null,
      },

      whatsapp: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: null,
      },
    },

    /* ====================================================================== */
    /* CUSTOM DATA                                                            */
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
    /* AUDIT                                                                  */
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

    lastModifiedAt: {
      type: Date,
      default: null,
    },

    /* ====================================================================== */
    /* LIFECYCLE                                                              */
    /* ====================================================================== */

    archivedAt: {
      type: Date,
      default: null,
    },

    archivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    archiveReason: {
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

contactSchema.index(
  {
    instituteId: 1,
    contactCode: 1,
  },
  {
    unique: true,
    sparse: true,
    name: "tenant_contact_code",
  }
);

contactSchema.index(
  {
    instituteId: 1,
    email: 1,
    isDeleted: 1,
  },
  {
    sparse: true,
    name: "tenant_contact_email",
  }
);

contactSchema.index(
  {
    instituteId: 1,
    phone: 1,
    isDeleted: 1,
  },
  {
    sparse: true,
    name: "tenant_contact_phone",
  }
);

contactSchema.index(
  {
    instituteId: 1,
    status: 1,
    type: 1,
    createdAt: -1,
  },
  {
    name: "contact_listing",
  }
);

contactSchema.index(
  {
    instituteId: 1,
    userId: 1,
  },
  {
    sparse: true,
    name: "contact_user",
  }
);

contactSchema.index(
  {
    instituteId: 1,
    leadId: 1,
  },
  {
    sparse: true,
    name: "contact_lead",
  }
);

contactSchema.index(
  {
    instituteId: 1,
    customerId: 1,
  },
  {
    sparse: true,
    name: "contact_customer",
  }
);

contactSchema.index(
  {
    instituteId: 1,
    studentId: 1,
  },
  {
    sparse: true,
    name: "contact_student",
  }
);

contactSchema.index(
  {
    instituteId: 1,
    employeeId: 1,
  },
  {
    sparse: true,
    name: "contact_employee",
  }
);

contactSchema.index(
  {
    instituteId: 1,
    "engagement.lastActivityAt": -1,
  },
  {
    name: "contact_recent_activity",
  }
);

contactSchema.index(
  {
    instituteId: 1,
    doNotContact: 1,
    status: 1,
  },
  {
    name: "contact_communication_status",
  }
);

contactSchema.index(
  {
    instituteId: 1,
    tags: 1,
  },
  {
    name: "contact_tags",
  }
);

contactSchema.index(
  {
    instituteId: 1,
    segments: 1,
  },
  {
    name: "contact_segments",
  }
);

contactSchema.index(
  {
    instituteId: 1,
    fullName: "text",
    email: "text",
    phone: "text",
    companyName: "text",
    designation: "text",
  },
  {
    name: "contact_search",
    weights: {
      fullName: 10,
      email: 8,
      phone: 8,
      companyName: 5,
      designation: 3,
    },
  }
);

/* ============================================================================
 * VALIDATION
 * ========================================================================== */

contactSchema.pre(
  "validate",
  function (next) {
    if (
      this.addresses.length >
      20
    ) {
      return next(
        new Error(
          "Contact cannot contain more than 20 addresses"
        )
      );
    }

    if (
      this.communications.length >
      30
    ) {
      return next(
        new Error(
          "Contact cannot contain more than 30 communication methods"
        )
      );
    }

    if (
      this.relationships.length >
      50
    ) {
      return next(
        new Error(
          "Contact cannot contain more than 50 relationships"
        )
      );
    }

    if (
      this.tags.length >
      100
    ) {
      return next(
        new Error(
          "Contact cannot contain more than 100 tags"
        )
      );
    }

    if (
      this.segments.length >
      100
    ) {
      return next(
        new Error(
          "Contact cannot contain more than 100 segments"
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
      this.email
    ) {
      this.email =
        this.email
          .trim()
          .toLowerCase();
    }

    if (
      this.fullName &&
      !this.displayName
    ) {
      this.displayName =
        this.fullName;
    }

    next();
  }
);

/* ============================================================================
 * VIRTUALS
 * ========================================================================== */

contactSchema.virtual(
  "isActive"
).get(function () {
  return (
    this.status === "active" &&
    !this.isDeleted
  );
});

contactSchema.virtual(
  "isLinked"
).get(function () {
  return Boolean(
    this.userId ||
      this.leadId ||
      this.customerId ||
      this.studentId ||
      this.employeeId
  );
});

contactSchema.virtual(
  "primaryEmail"
).get(function () {
  const primary =
    this.communications.find(
      (item) =>
        item.type === "email" &&
        item.isPrimary
    );

  return (
    primary?.value ||
    this.email ||
    null
  );
});

contactSchema.virtual(
  "primaryPhone"
).get(function () {
  const primary =
    this.communications.find(
      (item) =>
        item.type === "phone" &&
        item.isPrimary
    );

  return (
    primary?.value ||
    this.phone ||
    null
  );
});

contactSchema.virtual(
  "hasCommunicationConsent"
).get(function () {
  return (
    !this.doNotContact &&
    this.consent.communication
  );
});

/* ============================================================================
 * QUERY HELPERS
 * ========================================================================== */

contactSchema.query.byInstitute =
  function (instituteId) {
    return this.where({
      instituteId,
      isDeleted: false,
    });
  };

contactSchema.query.active =
  function () {
    return this.where({
      isDeleted: false,
      status: "active",
    });
  };

contactSchema.query.byType =
  function (type) {
    return this.where({
      isDeleted: false,
      type,
    });
  };

contactSchema.query.byUser =
  function (userId) {
    return this.where({
      isDeleted: false,
      userId,
    });
  };

contactSchema.query.byCustomer =
  function (customerId) {
    return this.where({
      isDeleted: false,
      customerId,
    });
  };

contactSchema.query.byStudent =
  function (studentId) {
    return this.where({
      isDeleted: false,
      studentId,
    });
  };

contactSchema.query.byEmployee =
  function (employeeId) {
    return this.where({
      isDeleted: false,
      employeeId,
    });
  };

contactSchema.query.contactable =
  function () {
    return this.where({
      isDeleted: false,
      status: "active",
      doNotContact: false,
      "consent.communication": true,
    });
  };

/* ============================================================================
 * INSTANCE METHODS
 * ========================================================================== */

contactSchema.methods.verifyCommunication =
  async function ({
    communicationId,
    verifiedBy = null,
  } = {}) {
    const communication =
      this.communications.id(
        communicationId
      );

    if (
      !communication
    ) {
      throw new Error(
        "Communication method not found"
      );
    }

    communication.isVerified =
      true;

    communication.verifiedAt =
      new Date();

    communication.verifiedBy =
      verifiedBy;

    return this.save();
  };

contactSchema.methods.addCommunication =
  async function ({
    type,
    value,
    normalizedValue = null,
    label = null,
    isPrimary = false,
    optedIn = true,
  } = {}) {
    if (
      !CONTACT_METHODS.includes(
        type
      )
    ) {
      throw new Error(
        "Invalid communication method"
      );
    }

    if (
      isPrimary
    ) {
      this.communications.forEach(
        (item) => {
          if (
            item.type === type
          ) {
            item.isPrimary =
              false;
          }
        }
      );
    }

    this.communications.push({
      type,
      value,
      normalizedValue,
      label,
      isPrimary,
      optedIn,
      optedInAt:
        optedIn
          ? new Date()
          : null,
    });

    return this.save();
  };

contactSchema.methods.removeCommunication =
  async function (
    communicationId
  ) {
    const communication =
      this.communications.id(
        communicationId
      );

    if (
      !communication
    ) {
      throw new Error(
        "Communication method not found"
      );
    }

    communication.deleteOne();

    return this.save();
  };

contactSchema.methods.addAddress =
  async function ({
    type = "home",
    line1 = null,
    line2 = null,
    landmark = null,
    city = null,
    state = null,
    country = "India",
    postalCode = null,
    isPrimary = false,
  } = {}) {
    if (
      isPrimary
    ) {
      this.addresses.forEach(
        (address) => {
          if (
            address.type ===
            type
          ) {
            address.isPrimary =
              false;
          }
        }
      );
    }

    this.addresses.push({
      type,
      line1,
      line2,
      landmark,
      city,
      state,
      country,
      postalCode,
      isPrimary,
    });

    return this.save();
  };

contactSchema.methods.addRelationship =
  async function ({
    contactId,
    relationship,
    role = "contact",
    isPrimary = false,
    isEmergencyContact = false,
    notes = null,
  } = {}) {
    if (
      String(contactId) ===
      String(this._id)
    ) {
      throw new Error(
        "A contact cannot have a relationship with itself"
      );
    }

    if (
      isPrimary
    ) {
      this.relationships.forEach(
        (item) => {
          if (
            item.relationship ===
            relationship
          ) {
            item.isPrimary =
              false;
          }
        }
      );
    }

    this.relationships.push({
      contactId,
      relationship,
      role,
      isPrimary,
      isEmergencyContact,
      notes,
    });

    return this.save();
  };

contactSchema.methods.removeRelationship =
  async function (
    relationshipId
  ) {
    const relationship =
      this.relationships.id(
        relationshipId
      );

    if (
      !relationship
    ) {
      throw new Error(
        "Relationship not found"
      );
    }

    relationship.deleteOne();

    return this.save();
  };

contactSchema.methods.markContacted =
  async function ({
    method = "phone",
    responded = false,
    activityDate = new Date(),
  } = {}) {
    this.engagement.totalActivities +=
      1;

    if (
      method === "phone"
    ) {
      this.engagement.calls +=
        1;
    } else if (
      method === "email"
    ) {
      this.engagement.emails +=
        1;
    } else if (
      method === "whatsapp"
    ) {
      this.engagement.whatsappMessages +=
        1;
    } else if (
      method === "meeting"
    ) {
      this.engagement.meetings +=
        1;
    }

    this.engagement.lastContactedAt =
      activityDate;

    this.engagement.lastActivityAt =
      activityDate;

    if (
      responded
    ) {
      this.engagement.lastRespondedAt =
        activityDate;
    }

    this.lastModifiedAt =
      activityDate;

    return this.save();
  };

contactSchema.methods.updateEngagementScore =
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
        "Engagement score must be between 0 and 100"
      );
    }

    this.engagement.engagementScore =
      score;

    return this.save();
  };

contactSchema.methods.setDoNotContact =
  async function ({
    value = true,
    reason = null,
  } = {}) {
    this.doNotContact =
      value;

    this.doNotContactReason =
      reason;

    this.doNotContactAt =
      value
        ? new Date()
        : null;

    return this.save();
  };

contactSchema.methods.setConsent =
  async function ({
    communication,
    marketing,
    email,
    sms,
    whatsapp,
    source = null,
    privacyVersion = null,
  } = {}) {
    if (
      communication !==
      undefined
    ) {
      this.consent.communication =
        Boolean(
          communication
        );
    }

    if (
      marketing !==
      undefined
    ) {
      this.consent.marketing =
        Boolean(
          marketing
        );
    }

    if (
      email !==
      undefined
    ) {
      this.consent.email =
        Boolean(email);
    }

    if (
      sms !==
      undefined
    ) {
      this.consent.sms =
        Boolean(sms);
    }

    if (
      whatsapp !==
      undefined
    ) {
      this.consent.whatsapp =
        Boolean(
          whatsapp
        );
    }

    this.consent.consentSource =
      source;

    this.consent.privacyVersion =
      privacyVersion;

    this.consent.consentAt =
      new Date();

    this.consent.revokedAt =
      null;

    return this.save();
  };

contactSchema.methods.revokeConsent =
  async function () {
    this.consent.communication =
      false;

    this.consent.marketing =
      false;

    this.consent.email =
      false;

    this.consent.sms =
      false;

    this.consent.whatsapp =
      false;

    this.consent.revokedAt =
      new Date();

    return this.save();
  };

contactSchema.methods.addTag =
  async function (
    tag
  ) {
    const normalized =
      String(tag)
        .trim()
        .toLowerCase();

    if (
      normalized &&
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

contactSchema.methods.removeTag =
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

contactSchema.methods.addSegment =
  async function (
    segment
  ) {
    const normalized =
      String(segment)
        .trim()
        .toLowerCase();

    if (
      normalized &&
      !this.segments.includes(
        normalized
      )
    ) {
      this.segments.push(
        normalized
      );
    }

    return this.save();
  };

contactSchema.methods.removeSegment =
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
          item !== normalized
      );

    return this.save();
  };

contactSchema.methods.archive =
  async function ({
    archivedBy = null,
    reason = null,
  } = {}) {
    this.status =
      "archived";

    this.archivedAt =
      new Date();

    this.archivedBy =
      archivedBy;

    this.archiveReason =
      reason;

    return this.save();
  };

contactSchema.methods.restore =
  async function () {
    this.status =
      "active";

    this.archivedAt =
      null;

    this.archivedBy =
      null;

    this.archiveReason =
      null;

    return this.save();
  };

contactSchema.methods.block =
  async function (
    reason = null
  ) {
    this.status =
      "blocked";

    if (
      reason
    ) {
      this.internalNotes =
        this.internalNotes
          ? `${this.internalNotes}\n${reason}`
          : reason;
    }

    return this.save();
  };

contactSchema.methods.softDelete =
  async function () {
    this.isDeleted =
      true;

    this.deletedAt =
      new Date();

    return this.save();
  };

contactSchema.methods.restoreDeleted =
  async function () {
    this.isDeleted =
      false;

    this.deletedAt =
      null;

    if (
      this.status ===
      "archived"
    ) {
      this.status =
        "active";
    }

    return this.save();
  };

/* ============================================================================
 * STATIC METHODS
 * ========================================================================== */

contactSchema.statics.findForUser =
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

contactSchema.statics.findForCustomer =
  function (
    instituteId,
    customerId
  ) {
    return this.find({
      instituteId,
      customerId,
      isDeleted: false,
    }).sort({
      createdAt: -1,
    });
  };

contactSchema.statics.findForStudent =
  function (
    instituteId,
    studentId
  ) {
    return this.find({
      instituteId,
      studentId,
      isDeleted: false,
    }).sort({
      createdAt: -1,
    });
  };

contactSchema.statics.findForEmployee =
  function (
    instituteId,
    employeeId
  ) {
    return this.find({
      instituteId,
      employeeId,
      isDeleted: false,
    }).sort({
      createdAt: -1,
    });
  };

contactSchema.statics.findContactable =
  function (
    instituteId,
    {
      type = null,
      tag = null,
      segment = null,
      limit = 100,
    } = {}
  ) {
    const query = {
      instituteId,
      isDeleted: false,
      status: "active",
      doNotContact: false,
      "consent.communication":
        true,
    };

    if (
      type
    ) {
      query.type =
        type;
    }

    if (
      tag
    ) {
      query.tags =
        String(tag)
          .trim()
          .toLowerCase();
    }

    if (
      segment
    ) {
      query.segments =
        String(segment)
          .trim()
          .toLowerCase();
    }

    return this.find(
      query
    )
      .sort({
        "engagement.lastActivityAt": -1,
      })
      .limit(limit);
  };

contactSchema.statics.findByEmail =
  function (
    instituteId,
    email
  ) {
    return this.findOne({
      instituteId,
      email: String(
        email
      )
        .trim()
        .toLowerCase(),
      isDeleted: false,
    });
  };

contactSchema.statics.findByPhone =
  function (
    instituteId,
    phone
  ) {
    return this.findOne({
      instituteId,
      phone: String(
        phone
      ).trim(),
      isDeleted: false,
    });
  };

contactSchema.statics.findPotentialDuplicates =
  function ({
    instituteId,
    email = null,
    phone = null,
    fullName = null,
    limit = 20,
  } = {}) {
    const conditions = [];

    if (
      email
    ) {
      conditions.push({
        email: String(
          email
        )
          .trim()
          .toLowerCase(),
      });
    }

    if (
      phone
    ) {
      conditions.push({
        phone: String(
          phone
        ).trim(),
      });
    }

    if (
      fullName
    ) {
      const escaped =
        String(
          fullName
        ).replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        );

      conditions.push({
        fullName: new RegExp(
          `^${escaped}$`,
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

/* ============================================================================
 * MODEL
 * ========================================================================== */

export const Contact =
  mongoose.models.Contact ||
  mongoose.model(
    "Contact",
    contactSchema
  );

export {
  CONTACT_TYPES,
  CONTACT_STATUSES,
  CONTACT_SOURCES,
  CONTACT_METHODS,
  CONTACT_ROLES,
};
