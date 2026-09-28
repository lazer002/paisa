// server/src/models/organization.js

import mongoose from "mongoose";

import crypto from "node:crypto";import slugify from "slugify";
import { getNextSequence } from "../utils/sequence.js";

const ORG_TYPES = [
  "school",
  "college",
  "coaching",
  "company",
  "institute",
  "startup",
  "ngo",
  "others",
];

const ORG_STATUS = [
  "active",
  "inactive",
  "suspended",
];

const PLANS = [
  "free",
  "pro",
  "enterprise",
];

const BILLING_CYCLES = [
  "monthly",
  "yearly",
];

const WEEK_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const organizationSchema = new mongoose.Schema(
  {
    /* ---------------------------------------------------------------------- */
    /* IDENTITY                                                                */
    /* ---------------------------------------------------------------------- */
publicId: {
  type: String,
  required: true,
  unique: true,
  immutable: true,
  index: true,
  default: () =>
    `org_${crypto.randomBytes(16).toString("base64url")}`,
},
    name: {
      type: String,
      required: [true, "Organization name is required"],
      trim: true,
      minlength: [2, "Organization name is too short"],
      maxlength: [100, "Organization name is too long"],
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
      maxlength: 120,
    },

    type: {
      type: String,
      enum: {
        values: ORG_TYPES,
        message: "Invalid organization type",
      },
      required: true,
      index: true,
    },

    orgCode: {
      type: String,
      unique: true,
      index: true,
      trim: true,
      uppercase: true,
      immutable: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },

    /* ---------------------------------------------------------------------- */
    /* CONTACT                                                                 */
    /* ---------------------------------------------------------------------- */

    contact: {
      email: {
        type: String,
        lowercase: true,
        trim: true,
        maxlength: 254,
        index: true,
        match: [
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          "Invalid email format",
        ],
        default: null,
      },

      phone: {
        type: String,
        trim: true,
        match: [
          /^\+?[0-9]{10,15}$/,
          "Invalid phone number",
        ],
        default: null,
      },

      address: {
        type: String,
        trim: true,
        maxlength: 300,
        default: null,
      },

      city: {
        type: String,
        trim: true,
        maxlength: 100,
        index: true,
        default: null,
      },

      state: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      country: {
        type: String,
        trim: true,
        maxlength: 100,
        default: "India",
      },

      pincode: {
        type: String,
        trim: true,
        maxlength: 20,
        default: null,
      },
    },

    /* ---------------------------------------------------------------------- */
    /* OWNERSHIP                                                               */
    /* ---------------------------------------------------------------------- */

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    membersCount: {
      type: Number,
      min: 0,
      default: 1,
    },

    /* ---------------------------------------------------------------------- */
    /* SUBSCRIPTION                                                             */
    /* ---------------------------------------------------------------------- */

    plan: {
      type: String,
      enum: {
        values: PLANS,
        message: "Invalid subscription plan",
      },
      default: "free",
      index: true,
    },

    planExpiresAt: {
      type: Date,
      default: null,
    },

    billing: {
      cycle: {
        type: String,
        enum: [
          ...BILLING_CYCLES,
          null,
        ],
        default: null,
      },

      currency: {
        type: String,
        trim: true,
        uppercase: true,
        minlength: 3,
        maxlength: 3,
        default: "INR",
      },

      pricePaid: {
        type: Number,
        min: 0,
        default: 0,
      },

      lastInvoiceAt: {
        type: Date,
        default: null,
      },

      paymentMethod: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      billingEmail: {
        type: String,
        lowercase: true,
        trim: true,
        maxlength: 254,
        match: [
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          "Invalid billing email format",
        ],
        default: null,
      },
    },

    /* ---------------------------------------------------------------------- */
    /* META                                                                    */
    /* ---------------------------------------------------------------------- */

    meta: {
      industry: {
        type: String,
        trim: true,
        maxlength: 150,
        default: null,
      },

      registrationNo: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      gstNumber: {
        type: String,
        trim: true,
        uppercase: true,
        maxlength: 20,
        match: [
          /^([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{3})$/,
          "Invalid GST number",
        ],
        default: null,
      },

      board: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      affiliationNo: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      establishedYear: {
        type: Number,
        min: 1800,
        max: new Date().getFullYear(),
        default: null,
      },

      employeeRange: {
        type: String,
        enum: [
          "1-10",
          "11-50",
          "51-200",
          "201-500",
          "501-1000",
          "1000+",
          null,
        ],
        default: null,
      },

      annualRevenue: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },
    },

    /* ---------------------------------------------------------------------- */
    /* BRANDING                                                                */
    /* ---------------------------------------------------------------------- */

    branding: {
      logo: {
        type: String,
        trim: true,
        maxlength: 2048,
        default: null,
      },

      banner: {
        type: String,
        trim: true,
        maxlength: 2048,
        default: null,
      },

      primaryColor: {
        type: String,
        trim: true,
        uppercase: true,
        match: [
          /^#[0-9A-F]{6}$/i,
          "Invalid primary color",
        ],
        default: "#111111",
      },

      website: {
        type: String,
        trim: true,
        maxlength: 2048,
        default: null,
      },

      socialLinks: {
        linkedin: {
          type: String,
          trim: true,
          maxlength: 2048,
          default: null,
        },

        twitter: {
          type: String,
          trim: true,
          maxlength: 2048,
          default: null,
        },

        instagram: {
          type: String,
          trim: true,
          maxlength: 2048,
          default: null,
        },

        facebook: {
          type: String,
          trim: true,
          maxlength: 2048,
          default: null,
        },
      },
    },

    /* ---------------------------------------------------------------------- */
    /* DOCUMENTS                                                               */
    /* ---------------------------------------------------------------------- */

    documents: [
      {
        _id: false,

        type: {
          type: String,
          enum: [
            "registration",
            "gst_certificate",
            "affiliation",
            "moa",
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

        verified: {
          type: Boolean,
          default: false,
        },

        uploadedAt: {
          type: Date,
          default: Date.now,
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
      },
    ],

    /* ---------------------------------------------------------------------- */
    /* VERIFICATION                                                            */
    /* ---------------------------------------------------------------------- */

    verification: {
      isVerified: {
        type: Boolean,
        default: false,
        index: true,
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

      notes: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: null,
      },
    },

    /* ---------------------------------------------------------------------- */
    /* SETTINGS & LIMITS                                                       */
    /* ---------------------------------------------------------------------- */

    settings: {
      allowPublicJoin: {
        type: Boolean,
        default: false,
      },

      requireApproval: {
        type: Boolean,
        default: true,
      },

      maxMembers: {
        type: Number,
        min: 1,
        default: 50,
      },

      maxStorageMb: {
        type: Number,
        min: 0,
        default: 1024,
      },

      features: {
        payroll: {
          type: Boolean,
          default: true,
        },

        attendance: {
          type: Boolean,
          default: true,
        },

        lms: {
          type: Boolean,
          default: true,
        },

        announcements: {
          type: Boolean,
          default: true,
        },
      },

      academicYearStarts: {
        type: String,
        trim: true,
        maxlength: 30,
        default: null,
      },

      weeklyOffs: [
        {
          type: String,
          enum: WEEK_DAYS,
        },
      ],
    },

    /* ---------------------------------------------------------------------- */
    /* STATUS                                                                  */
    /* ---------------------------------------------------------------------- */

    status: {
      type: String,
      enum: {
        values: ORG_STATUS,
        message: "Invalid organization status",
      },
      default: "active",
      index: true,
    },

    /* ---------------------------------------------------------------------- */
    /* DASHBOARD STATS CACHE                                                   */
    /* ---------------------------------------------------------------------- */

    stats: {
      totalUsers: {
        type: Number,
        min: 0,
        default: 0,
      },

      totalStudents: {
        type: Number,
        min: 0,
        default: 0,
      },

      totalStaff: {
        type: Number,
        min: 0,
        default: 0,
      },

      totalClasses: {
        type: Number,
        min: 0,
        default: 0,
      },

      activeDepartments: {
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

    deletionReason: {
      type: String,
      trim: true,
      maxlength: 300,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,

    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },

    toObject: {
      virtuals: true,
    },
  }
);

/* -------------------------------------------------------------------------- */
/* INDEXES                                                                    */
/* -------------------------------------------------------------------------- */

organizationSchema.index(
  {
    name: 1,
    owner: 1,
  },
  {
    unique: true,
    name: "organization_name_owner_unique",
  }
);

organizationSchema.index(
  {
    owner: 1,
    type: 1,
  },
  {
    name: "organization_owner_type",
  }
);

organizationSchema.index(
  {
    name: "text",
    description: "text",
  },
  {
    name: "organization_search",
  }
);

organizationSchema.index(
  {
    "contact.city": 1,
    type: 1,
  },
  {
    name: "organization_city_type",
  }
);

organizationSchema.index(
  {
    status: 1,
    isDeleted: 1,
  },
  {
    name: "organization_status_deleted",
  }
);

organizationSchema.index(
  {
    plan: 1,
    status: 1,
  },
  {
    name: "organization_plan_status",
  }
);

/* -------------------------------------------------------------------------- */
/* VIRTUALS                                                                   */
/* -------------------------------------------------------------------------- */

organizationSchema.virtual(
  "isActive"
).get(function () {
  return (
    this.status === "active" &&
    !this.isDeleted
  );
});

organizationSchema.virtual(
  "isSubscriptionActive"
).get(function () {
  if (
    this.plan === "free"
  ) {
    return true;
  }

  if (!this.planExpiresAt) {
    return true;
  }

  return (
    this.planExpiresAt >
    new Date()
  );
});

organizationSchema.virtual(
  "storageLimitBytes"
).get(function () {
  return (
    (this.settings?.maxStorageMb || 0) *
    1024 *
    1024
  );
});

/* -------------------------------------------------------------------------- */
/* HOOKS                                                                      */
/* -------------------------------------------------------------------------- */

organizationSchema.pre(
  "validate",
  function (next) {
    if (
      this.membersCount <
      0
    ) {
      return next(
        new Error(
          "Members count cannot be negative"
        )
      );
    }

    if (
      this.settings?.maxMembers != null &&
      this.membersCount >
        this.settings.maxMembers
    ) {
      return next(
        new Error(
          "Members count cannot exceed organization member limit"
        )
      );
    }

    if (
      this.verification?.isVerified &&
      !this.verification.verifiedAt
    ) {
      this.verification.verifiedAt =
        new Date();
    }

    if (
      this.verification?.isVerified &&
      !this.verification.verifiedBy
    ) {
      return next(
        new Error(
          "Verified organization requires verifiedBy"
        )
      );
    }

    next();
  }
);

organizationSchema.pre(
  "save",
  function (next) {
    if (
      this.isModified("name") ||
      !this.slug
    ) {
      this.slug = slugify(
        this.name,
        {
          lower: true,
          strict: true,
          trim: true,
        }
      );
    }

    next();
  }
);

organizationSchema.pre(
  "save",
  async function (next) {
    try {
      if (
        this.isNew &&
        !this.orgCode
      ) {
        const sequence =
          await getNextSequence(
            "Organization"
          );

        this.orgCode =
          `ORG-${String(
            sequence
          ).padStart(5, "0")}`;
      }

      next();
    } catch (error) {
      next(error);
    }
  }
);

/*
 * Soft-deleted organizations are excluded from normal find queries.
 *
 * Explicit recovery/admin queries can use:
 *   Organization.findDeleted(...)
 *   Organization.findWithDeleted(...)
 */
organizationSchema.pre(
  /^find/,
  function (next) {
    const query =
      this.getQuery();

    if (
      query.includeDeleted === true ||
      query.withDeleted === true
    ) {
      delete query.includeDeleted;
      delete query.withDeleted;
      return next();
    }

    this.where({
      isDeleted: false,
    });

    next();
  }
);

/* -------------------------------------------------------------------------- */
/* QUERY HELPERS                                                              */
/* -------------------------------------------------------------------------- */

organizationSchema.query.active =
  function () {
    return this.where({
      status: "active",
      isDeleted: false,
    });
  };

organizationSchema.query.notDeleted =
  function () {
    return this.where({
      isDeleted: false,
    });
  };

/* -------------------------------------------------------------------------- */
/* INSTANCE METHODS                                                           */
/* -------------------------------------------------------------------------- */

organizationSchema.methods.softDelete =
  async function (
    reason = null,
    byUserId = null
  ) {
    if (this.isDeleted) {
      return this;
    }

    this.isDeleted = true;
    this.deletedAt =
      new Date();
    this.deletionReason =
      reason;

    if (byUserId) {
      this.updatedBy =
        byUserId;
    }

    await this.save();

    return this;
  };

organizationSchema.methods.restore =
  async function (
    byUserId = null
  ) {
    this.isDeleted = false;
    this.deletedAt = null;
    this.deletionReason = null;

    if (byUserId) {
      this.updatedBy =
        byUserId;
    }

    await this.save();

    return this;
  };

organizationSchema.methods.activate =
  async function (
    byUserId = null
  ) {
    if (this.isDeleted) {
      throw new Error(
        "Deleted organization must be restored before activation"
      );
    }

    this.status = "active";

    if (byUserId) {
      this.updatedBy =
        byUserId;
    }

    return this.save();
  };

organizationSchema.methods.suspend =
  async function (
    byUserId = null
  ) {
    this.status = "suspended";

    if (byUserId) {
      this.updatedBy =
        byUserId;
    }

    return this.save();
  };

organizationSchema.methods.deactivate =
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

organizationSchema.methods.addAdmin =
  async function (
    userId
  ) {
    const normalizedId =
      new mongoose.Types.ObjectId(
        userId
      );

    const exists =
      this.admins.some(
        (id) =>
          id.toString() ===
          normalizedId.toString()
      );

    if (!exists) {
      this.admins.push(
        normalizedId
      );
      await this.save();
    }

    return this;
  };

organizationSchema.methods.removeAdmin =
  async function (
    userId
  ) {
    const normalizedId =
      userId.toString();

    this.admins =
      this.admins.filter(
        (id) =>
          id.toString() !==
          normalizedId
      );

    await this.save();

    return this;
  };

/* -------------------------------------------------------------------------- */
/* STATIC METHODS                                                             */
/* -------------------------------------------------------------------------- */

organizationSchema.statics.findBySlug =
  function (slug) {
    return this.findOne({
      slug: String(slug)
        .trim()
        .toLowerCase(),
    });
  };

organizationSchema.statics.findActiveById =
  function (organizationId) {
    return this.findOne({
      _id: organizationId,
      status: "active",
      isDeleted: false,
    });
  };

organizationSchema.statics.findDeleted =
  function (conditions = {}) {
    return this.find({
      ...conditions,
      isDeleted: true,
    });
  };

organizationSchema.statics.findWithDeleted =
  function (conditions = {}) {
    return this.find({
      ...conditions,
      includeDeleted: true,
    });
  };

/* -------------------------------------------------------------------------- */
/* MODEL                                                                      */
/* -------------------------------------------------------------------------- */

const Organization =
  mongoose.models.Organization ||
  mongoose.model(
    "Organization",
    organizationSchema
  );

export {
  Organization,
  ORG_TYPES,
  ORG_STATUS,
  PLANS,
};

export default Organization;
