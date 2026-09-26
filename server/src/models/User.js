// server/src/models/User.js

import mongoose from "mongoose";
import { getNextSequence } from "../utils/sequence.js";

/* -------------------------------------------------------------------------- */
/* Roles                                                                      */
/* -------------------------------------------------------------------------- */

const Roles = Object.freeze({
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  TEACHER: "teacher",
  STUDENT: "student",
  HR: "hr",
  EMPLOYEE: "employee",
});

/* -------------------------------------------------------------------------- */
/* Permissions                                                                */
/* -------------------------------------------------------------------------- */

const RolePermissions = Object.freeze({
  [Roles.SUPER_ADMIN]: [
    "manage_users",
    "manage_institutes",
    "manage_organizations",
    "manage_teachers",
    "manage_students",
    "manage_employees",
    "manage_hr",
    "manage_classes",
    "manage_assignments",
    "manage_announcements",
    "manage_materials",
    "manage_attendance",
    "manage_leaves",
    "manage_payroll",
    "manage_departments",
    "manage_staff",
    "view_reports",
    "manage_billing",
    "manage_all",
  ],

  [Roles.ADMIN]: [
    "manage_users",
    "manage_teachers",
    "manage_students",
    "manage_employees",
    "manage_hr",
    "manage_classes",
    "manage_assignments",
    "manage_announcements",
    "manage_materials",
    "manage_attendance",
    "manage_leaves",
    "manage_payroll",
    "manage_departments",
    "manage_staff",
    "view_reports",
  ],

  [Roles.TEACHER]: [
    "manage_classes",
    "take_attendance",
    "manage_assignments",
    "manage_materials",
    "view_students",
    "view_announcements",
  ],

  [Roles.STUDENT]: [
    "view_classes",
    "submit_assignments",
    "view_materials",
    "view_attendance",
    "view_announcements",
  ],

  [Roles.HR]: [
    "manage_staff",
    "manage_payroll",
    "manage_leaves",
    "manage_departments",
    "view_reports",
    "view_announcements",
  ],

  [Roles.EMPLOYEE]: [
    "view_payslips",
    "apply_leave",
    "view_announcements",
    "view_profile",
  ],
});

/* -------------------------------------------------------------------------- */
/* Role hierarchy                                                             */
/* -------------------------------------------------------------------------- */

const RoleHierarchy = Object.freeze([
  Roles.EMPLOYEE,
  Roles.STUDENT,
  Roles.HR,
  Roles.TEACHER,
  Roles.ADMIN,
  Roles.SUPER_ADMIN,
]);

const canManageRole = (actorRole, targetRole) => {
  if (!actorRole || !targetRole) return false;

  if (actorRole === Roles.SUPER_ADMIN) {
    return actorRole !== targetRole;
  }

  const actorIndex = RoleHierarchy.indexOf(actorRole);
  const targetIndex = RoleHierarchy.indexOf(targetRole);

  if (actorIndex === -1 || targetIndex === -1) {
    return false;
  }

  return actorIndex > targetIndex;
};

/* -------------------------------------------------------------------------- */
/* Validators                                                                 */
/* -------------------------------------------------------------------------- */

const PHONE_MATCH = [
  /^\+?[0-9]{10,15}$/,
  "Invalid phone number",
];

const EMAIL_MATCH = [
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  "Invalid email format",
];

const PINCODE_MATCH = [
  /^[0-9]{4,10}$/,
  "Invalid pincode",
];

const SOCIAL_URL = {
  type: String,
  trim: true,
  maxlength: 2048,
  default: null,
};

/* -------------------------------------------------------------------------- */
/* Schema                                                                     */
/* -------------------------------------------------------------------------- */

const userSchema = new mongoose.Schema(
  {
    /* ---------------------------------------------------------------------- */
    /* 1. IDENTITY & TENANCY                                                  */
    /* ---------------------------------------------------------------------- */

    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      index: true,
      default: null,
    },

    userCode: {
      type: String,
      trim: true,
      uppercase: true,
      unique: true,
      index: true,
      immutable: true,
    },

    name: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: [2, "Name too short"],
      maxlength: [100, "Name too long"],
    },

    displayName: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      maxlength: 254,
      unique: true,
      index: true,
      match: EMAIL_MATCH,
    },

    alternateEmail: {
      type: String,
      lowercase: true,
      trim: true,
      maxlength: 254,
      match: EMAIL_MATCH,
      default: null,
    },

    role: {
      type: String,
      enum: {
        values: Object.values(Roles),
        message: "Invalid role",
      },
      default: Roles.STUDENT,
      index: true,
    },

    additionalRoles: [
      {
        type: String,
        enum: Object.values(Roles),
      },
    ],

    employmentType: {
      type: String,
      enum: [
        "full_time",
        "part_time",
        "contract",
        "intern",
        "probation",
        null,
      ],
      default: null,
    },

    /* ---------------------------------------------------------------------- */
    /* 2. CREDENTIALS & SECURITY                                              */
    /* ---------------------------------------------------------------------- */

    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
      select: false,
      minlength: 20,
    },

    mustChangePassword: {
      type: Boolean,
      default: false,
    },

    passwordChangedAt: {
      type: Date,
      default: null,
    },

    passwordHistory: {
      type: [String],
      select: false,
      default: [],
      validate: {
        validator: (value) =>
          Array.isArray(value) && value.length <= 5,
        message: "Password history cannot exceed 5 entries",
      },
    },

    emailVerified: {
      type: Boolean,
      default: false,
      index: true,
    },

    emailVerifiedAt: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: {
        values: [
          "active",
          "inactive",
          "suspended",
        ],
        message: "Invalid status",
      },
      default: "active",
      index: true,
    },

    lastLogin: {
      type: Date,
      default: null,
    },

    lastLoginIp: {
      type: String,
      default: null,
      maxlength: 100,
    },

    lastActiveAt: {
      type: Date,
      default: null,
    },

    failedAttempts: {
      type: Number,
      default: 0,
      min: 0,
      max: 20,
      select: false,
    },

    lockedUntil: {
      type: Date,
      default: null,
      select: false,
    },

    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },

    twoFactorSecret: {
      type: String,
      select: false,
      default: null,
    },

    /* ---------------------------------------------------------------------- */
    /* 3. PROFILE & CONTACT                                                   */
    /* ---------------------------------------------------------------------- */

    profile: {
      phone: {
        type: String,
        trim: true,
        match: PHONE_MATCH,
        default: null,
      },

      alternatePhone: {
        type: String,
        trim: true,
        match: PHONE_MATCH,
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
        match: PINCODE_MATCH,
        default: null,
      },

      avatarUrl: {
        type: String,
        trim: true,
        maxlength: 2048,
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
          null,
        ],
        default: null,
      },

      bloodGroup: {
        type: String,
        enum: [
          "A+",
          "A-",
          "B+",
          "B-",
          "AB+",
          "AB-",
          "O+",
          "O-",
          null,
        ],
        default: null,
      },

      bio: {
        type: String,
        trim: true,
        maxlength: 500,
        default: null,
      },

      socialLinks: {
        linkedin: SOCIAL_URL,
        github: SOCIAL_URL,
        twitter: SOCIAL_URL,
        website: SOCIAL_URL,
      },
    },

    /* ---------------------------------------------------------------------- */
    /* 4. EMPLOYMENT                                                          */
    /* ---------------------------------------------------------------------- */

    employment: {
      employeeId: {
        type: String,
        trim: true,
        uppercase: true,
        maxlength: 50,
        default: null,
      },

      department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
        default: null,
        index: true,
      },

      designation: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      reportingManager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
        index: true,
      },

      workLocation: {
        type: String,
        trim: true,
        maxlength: 200,
        default: null,
      },

      workEmail: {
        type: String,
        lowercase: true,
        trim: true,
        maxlength: 254,
        match: EMAIL_MATCH,
        default: null,
      },

      dateOfJoining: {
        type: Date,
        default: null,
      },

      dateOfExit: {
        type: Date,
        default: null,
      },

      probationEndDate: {
        type: Date,
        default: null,
      },

      employmentHistory: [
        {
          _id: false,

          title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
          },

          department: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Department",
            default: null,
          },

          from: {
            type: Date,
            required: true,
          },

          to: {
            type: Date,
            default: null,
          },

          reason: {
            type: String,
            trim: true,
            maxlength: 500,
            default: null,
          },
        },
      ],

      skills: [
        {
          type: String,
          trim: true,
          maxlength: 100,
        },
      ],

      documents: [
        {
          _id: false,

          type: {
            type: String,
            enum: [
              "id_proof",
              "contract",
              "certificate",
              "other",
            ],
            required: true,
          },

          name: {
            type: String,
            trim: true,
            maxlength: 200,
          },

          url: {
            type: String,
            trim: true,
            maxlength: 2048,
          },

          uploadedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
    },

    /* ---------------------------------------------------------------------- */
    /* 5. COMPENSATION & BANK                                                 */
    /* ---------------------------------------------------------------------- */

    compensation: {
      ctc: {
        type: Number,
        min: 0,
        default: null,
        select: false,
      },

      basicMonthly: {
        type: Number,
        min: 0,
        default: null,
        select: false,
      },

      bank: {
        accountName: {
          type: String,
          trim: true,
          maxlength: 150,
          default: null,
          select: false,
        },

        accountNumber: {
          type: String,
          trim: true,
          maxlength: 50,
          default: null,
          select: false,
        },

        bankName: {
          type: String,
          trim: true,
          maxlength: 150,
          default: null,
          select: false,
        },

        ifsc: {
          type: String,
          trim: true,
          uppercase: true,
          maxlength: 20,
          default: null,
          select: false,
        },

        branch: {
          type: String,
          trim: true,
          maxlength: 150,
          default: null,
          select: false,
        },
      },

      statutory: {
        pan: {
          type: String,
          trim: true,
          uppercase: true,
          maxlength: 20,
          default: null,
          select: false,
        },

        aadhaarLast4: {
          type: String,
          match: [
            /^[0-9]{4}$/,
            "Must be last 4 digits",
          ],
          default: null,
          select: false,
        },

        uan: {
          type: String,
          trim: true,
          maxlength: 50,
          default: null,
          select: false,
        },

        esic: {
          type: String,
          trim: true,
          maxlength: 50,
          default: null,
          select: false,
        },
      },
    },

    /* ---------------------------------------------------------------------- */
    /* 6. EMERGENCY CONTACTS                                                  */
    /* ---------------------------------------------------------------------- */

    emergencyContacts: [
      {
        _id: false,

        name: {
          type: String,
          required: true,
          trim: true,
          maxlength: 100,
        },

        relationship: {
          type: String,
          required: true,
          trim: true,
          maxlength: 50,
        },

        phone: {
          type: String,
          required: true,
          trim: true,
          match: PHONE_MATCH,
        },

        isPrimary: {
          type: Boolean,
          default: false,
        },
      },
    ],

    /* ---------------------------------------------------------------------- */
    /* 7. ACADEMIC                                                            */
    /* ---------------------------------------------------------------------- */

    academic: {
      rollNumber: {
        type: String,
        trim: true,
        maxlength: 50,
        default: null,
      },

      grade: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      section: {
        type: String,
        trim: true,
        maxlength: 50,
        default: null,
      },

      guardianName: {
        type: String,
        trim: true,
        maxlength: 150,
        default: null,
      },

      guardianPhone: {
        type: String,
        trim: true,
        match: PHONE_MATCH,
        default: null,
      },

      admissionDate: {
        type: Date,
        default: null,
      },
    },

    /* ---------------------------------------------------------------------- */
    /* 8. PREFERENCES                                                         */
    /* ---------------------------------------------------------------------- */

    preferences: {
      language: {
        type: String,
        trim: true,
        maxlength: 10,
        default: "en",
      },

      timezone: {
        type: String,
        trim: true,
        maxlength: 100,
        default: "Asia/Kolkata",
      },

      notifications: {
        email: {
          type: Boolean,
          default: true,
        },

        push: {
          type: Boolean,
          default: true,
        },

        announcements: {
          type: Boolean,
          default: true,
        },

        payroll: {
          type: Boolean,
          default: true,
        },
      },

      theme: {
        type: String,
        enum: [
          "light",
          "dark",
          "system",
        ],
        default: "system",
      },
    },

    /* ---------------------------------------------------------------------- */
    /* 9. LIFECYCLE / AUDIT                                                   */
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

    deactivatedAt: {
      type: Date,
      default: null,
    },

    deactivationReason: {
      type: String,
      trim: true,
      maxlength: 300,
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

    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    versionKey: false,

    toJSON: {
      virtuals: true,

      transform(doc, ret) {
        delete ret.passwordHash;
        delete ret.passwordHistory;
        delete ret.twoFactorSecret;
        delete ret.failedAttempts;
        delete ret.lockedUntil;
        delete ret.compensation;

        return ret;
      },
    },

    toObject: {
      virtuals: true,
    },
  }
);

/* -------------------------------------------------------------------------- */
/* Indexes                                                                    */
/* -------------------------------------------------------------------------- */

userSchema.index({
  instituteId: 1,
  role: 1,
});

userSchema.index({
  instituteId: 1,
  status: 1,
});

userSchema.index({
  instituteId: 1,
  isDeleted: 1,
});

userSchema.index({
  instituteId: 1,
  email: 1,
});

userSchema.index({
  instituteId: 1,
  "employment.department": 1,
});

userSchema.index({
  instituteId: 1,
  "employment.reportingManager": 1,
});

userSchema.index({
  instituteId: 1,
  "academic.rollNumber": 1,
});

userSchema.index({
  name: "text",
  email: "text",
  userCode: "text",
});

/* -------------------------------------------------------------------------- */
/* Pre-save                                                                   */
/* -------------------------------------------------------------------------- */

userSchema.pre("save", async function (next) {
  try {
    /* ---------------------------------------------------------------------- */
    /* User code generation                                                   */
    /* ---------------------------------------------------------------------- */

    if (this.isNew && !this.userCode) {
      const prefixMap = {
        [Roles.STUDENT]: "STU",
        [Roles.TEACHER]: "TEA",
        [Roles.EMPLOYEE]: "EMP",
        [Roles.HR]: "HR",
        [Roles.ADMIN]: "ADM",
        [Roles.SUPER_ADMIN]: "SA",
      };

      const prefix =
        prefixMap[this.role] || "USR";

      const sequenceKey =
        `user:${this.role}`;

      const sequence =
        await getNextSequence(sequenceKey);

      this.userCode =
        `${prefix}-${String(sequence).padStart(4, "0")}`;
    }

    /* ---------------------------------------------------------------------- */
    /* Super admin cannot belong to an organization                           */
    /* ---------------------------------------------------------------------- */

    if (this.role === Roles.SUPER_ADMIN) {
      this.instituteId = null;
    }

    /* ---------------------------------------------------------------------- */
    /* Tenant role validation                                                  */
    /* ---------------------------------------------------------------------- */

    if (!this.instituteId) {
      if (this.role !== Roles.SUPER_ADMIN) {
        return next(
          new Error(
            "Organization is required for this user role"
          )
        );
      }

      return next();
    }

    const Organization =
      mongoose.models.Organization;

    if (!Organization) {
      return next();
    }

    const organization =
      await Organization.findById(
        this.instituteId
      )
        .select("type status")
        .lean();

    if (!organization) {
      return next(
        new Error("Invalid organization ID")
      );
    }

    if (
      organization.status &&
      organization.status !== "active"
    ) {
      return next(
        new Error(
          "Cannot assign users to an inactive organization"
        )
      );
    }

    const allowedRoles = {
      school: [
        Roles.ADMIN,
        Roles.TEACHER,
        Roles.STUDENT,
      ],

      college: [
        Roles.ADMIN,
        Roles.TEACHER,
        Roles.STUDENT,
      ],

      coaching: [
        Roles.ADMIN,
        Roles.TEACHER,
        Roles.STUDENT,
      ],

      company: [
        Roles.ADMIN,
        Roles.HR,
        Roles.EMPLOYEE,
      ],

      institute: [
        Roles.ADMIN,
        Roles.TEACHER,
        Roles.STUDENT,
        Roles.HR,
        Roles.EMPLOYEE,
      ],

      startup: [
        Roles.ADMIN,
        Roles.HR,
        Roles.EMPLOYEE,
      ],

      ngo: [
        Roles.ADMIN,
        Roles.HR,
        Roles.EMPLOYEE,
      ],

      others: [
        Roles.ADMIN,
        Roles.TEACHER,
        Roles.STUDENT,
        Roles.HR,
        Roles.EMPLOYEE,
      ],
    };

    const organizationRoles =
      allowedRoles[organization.type];

    if (
      organizationRoles &&
      !organizationRoles.includes(this.role)
    ) {
      return next(
        new Error(
          `Role '${this.role}' is not allowed for a '${organization.type}' organization`
        )
      );
    }

    next();
  } catch (error) {
    next(error);
  }
});

/* -------------------------------------------------------------------------- */
/* Pre-validation                                                             */
/* -------------------------------------------------------------------------- */

userSchema.pre("validate", function (next) {
  if (
    this.status === "active" &&
    this.deactivatedAt
  ) {
    this.deactivatedAt = null;
    this.deactivationReason = null;
  }

  if (
    this.status !== "active" &&
    !this.deactivatedAt
  ) {
    this.deactivatedAt = new Date();
  }

  if (
    this.role === Roles.STUDENT
  ) {
    this.employmentType = null;
  }

  next();
});

/* -------------------------------------------------------------------------- */
/* Virtuals                                                                   */
/* -------------------------------------------------------------------------- */

userSchema.virtual("isLocked").get(function () {
  return Boolean(
    this.lockedUntil &&
    this.lockedUntil > new Date()
  );
});

userSchema.virtual("tenureDays").get(function () {
  if (!this.employment?.dateOfJoining) {
    return null;
  }

  const end =
    this.employment.dateOfExit ||
    new Date();

  return Math.max(
    0,
    Math.floor(
      (end - this.employment.dateOfJoining) /
        (1000 * 60 * 60 * 24)
    )
  );
});

userSchema.virtual("isStaff").get(function () {
  return [
    Roles.ADMIN,
    Roles.TEACHER,
    Roles.HR,
    Roles.EMPLOYEE,
  ].includes(this.role);
});

/* -------------------------------------------------------------------------- */
/* Query helpers                                                              */
/* -------------------------------------------------------------------------- */

userSchema.query.byOrganization =
  function (organizationId) {
    return this.where({
      instituteId: organizationId,
      isDeleted: false,
    });
  };

userSchema.query.active =
  function () {
    return this.where({
      status: "active",
      isDeleted: false,
    });
  };

userSchema.query.notDeleted =
  function () {
    return this.where({
      isDeleted: false,
    });
  };

/* -------------------------------------------------------------------------- */
/* Instance methods                                                           */
/* -------------------------------------------------------------------------- */

userSchema.methods.hasPermission =
  function (permission) {
    if (
      this.role === Roles.SUPER_ADMIN
    ) {
      return true;
    }

    const permissions =
      RolePermissions[this.role] || [];

    return permissions.includes(permission);
  };

userSchema.methods.hasAnyPermission =
  function (...permissions) {
    if (
      this.role === Roles.SUPER_ADMIN
    ) {
      return true;
    }

    return permissions
      .flat()
      .some((permission) =>
        this.hasPermission(permission)
      );
  };

userSchema.methods.hasAllPermissions =
  function (...permissions) {
    if (
      this.role === Roles.SUPER_ADMIN
    ) {
      return true;
    }

    return permissions
      .flat()
      .every((permission) =>
        this.hasPermission(permission)
      );
  };

userSchema.methods.canManage =
  function (targetRole) {
    return canManageRole(
      this.role,
      targetRole
    );
  };

userSchema.methods.isActive =
  function () {
    return (
      this.status === "active" &&
      !this.isDeleted
    );
  };

userSchema.methods.softDelete =
  async function (
    reason = null,
    byUserId = null
  ) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.status = "inactive";
    this.deactivatedAt = new Date();
    this.deactivationReason =
      reason || null;

    if (byUserId) {
      this.updatedBy = byUserId;
    }

    return this.save();
  };

userSchema.methods.restore =
  async function (
    byUserId = null
  ) {
    this.isDeleted = false;
    this.deletedAt = null;
    this.status = "active";
    this.deactivatedAt = null;
    this.deactivationReason = null;

    if (byUserId) {
      this.updatedBy = byUserId;
    }

    return this.save();
  };

/* -------------------------------------------------------------------------- */
/* Static helpers                                                             */
/* -------------------------------------------------------------------------- */

userSchema.statics.findActiveById =
  function (userId) {
    return this.findOne({
      _id: userId,
      status: "active",
      isDeleted: false,
    });
  };

userSchema.statics.findByOrganization =
  function (
    organizationId,
    options = {}
  ) {
    const {
      role = null,
      status = "active",
    } = options;

    const query = {
      instituteId: organizationId,
      isDeleted: false,
    };

    if (role) {
      query.role = role;
    }

    if (status) {
      query.status = status;
    }

    return this.find(query);
  };

/* -------------------------------------------------------------------------- */
/* Model                                                                      */
/* -------------------------------------------------------------------------- */

export const User =
  mongoose.models.User ||
  mongoose.model("User", userSchema);

export {
  Roles,
  RolePermissions,
  RoleHierarchy,
  canManageRole,
};