import mongoose from "mongoose";
import { getNextSequence } from "../utils/sequence.js";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  USER — industry-grade identity model for a multi-tenant HRMS/ERP/LMS
 * ═══════════════════════════════════════════════════════════════════════════
 *  Sections:
 *    1. Identity & tenancy        6. Emergency contacts
 *    2. Credentials & security    7. Academic (LMS)
 *    3. Profile & contact         8. Preferences
 *    4. Employment (HRMS)         9. Lifecycle / audit
 *    5. Compensation & bank
 * ═══════════════════════════════════════════════════════════════════════════
 */

const Roles = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  TEACHER: "teacher",
  STUDENT: "student",
  HR: "hr",
  EMPLOYEE: "employee",
};

export const RolePermissions = Object.freeze({
  [Roles.SUPER_ADMIN]: [
    "manage_users", "manage_institutes", "manage_organizations",
    "view_reports", "manage_billing", "manage_all",
  ],
  [Roles.ADMIN]: [
    "manage_teachers", "manage_students", "manage_employees", "manage_hr",
    "manage_classes", "manage_announcements", "manage_materials",
    "view_reports", "manage_attendance", "manage_leaves", "manage_payroll",
  ],
  [Roles.TEACHER]: [
    "manage_classes", "take_attendance", "manage_assignments",
    "manage_materials", "view_students",
  ],
  [Roles.STUDENT]: [
    "view_classes", "submit_assignments", "view_materials", "view_attendance",
  ],
  [Roles.HR]: [
    "manage_staff", "manage_payroll", "manage_leaves",
    "manage_departments", "view_reports",
  ],
  [Roles.EMPLOYEE]: [
    "view_payslips", "apply_leave", "view_announcements", "view_profile",
  ],
});

export const RoleHierarchy = [
  Roles.EMPLOYEE, Roles.STUDENT, Roles.HR, Roles.TEACHER, Roles.ADMIN, Roles.SUPER_ADMIN,
];

export const canManageRole = (actorRole, targetRole) => {
  const actorIdx = RoleHierarchy.indexOf(actorRole);
  const targetIdx = RoleHierarchy.indexOf(targetRole);
  return actorIdx > targetIdx;
};

const PHONE_MATCH = [/^[0-9]{10,15}$/, "Invalid phone number"];
const EMAIL_MATCH = [/^\S+@\S+\.\S+$/, "Invalid email format"];

const userSchema = new mongoose.Schema(
  {
    // ── 1. IDENTITY & TENANCY ────────────────────────────────────────────────
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      index: true,
      default: null,
    },

    userCode: { type: String, unique: true, index: true },

    name: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: [2, "Name too short"],
      maxlength: [100, "Name too long"],
    },

    displayName: { type: String, trim: true, default: null },

    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      unique: true,
      match: EMAIL_MATCH,
    },

    alternateEmail: { type: String, lowercase: true, trim: true, match: EMAIL_MATCH, default: null },

    role: {
      type: String,
      enum: { values: Object.values(Roles), message: "Invalid role" },
      default: Roles.STUDENT,
      index: true,
    },

    // A user can hold extra roles (e.g. an admin who also teaches)
    additionalRoles: [{ type: String, enum: Object.values(Roles) }],

    employmentType: {
      type: String,
      enum: ["full_time", "part_time", "contract", "intern", "probation", null],
      default: null,
    },

    // ── 2. CREDENTIALS & SECURITY ────────────────────────────────────────────
    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
      select: false,
    },

    mustChangePassword: { type: Boolean, default: false },
    passwordChangedAt: { type: Date, default: null },

    // Previous hashes to prevent password reuse (keep last 3)
    passwordHistory: { type: [String], select: false, default: [] },

    emailVerified: { type: Boolean, default: false },
    emailVerifiedAt: { type: Date, default: null },

    status: {
      type: String,
      enum: { values: ["active", "inactive", "suspended"], message: "Invalid status" },
      default: "active",
      index: true,
    },

    lastLogin: { type: Date, default: null },
    lastLoginIp: { type: String, default: null },
    lastActiveAt: { type: Date, default: null },

    failedAttempts: { type: Number, default: 0, select: false },
    lockedUntil: { type: Date, default: null, select: false },

    // 2FA-ready
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, select: false, default: null },

    // ── 3. PROFILE & CONTACT ─────────────────────────────────────────────────
    profile: {
      phone: { type: String, match: PHONE_MATCH, default: null },
      alternatePhone: { type: String, match: PHONE_MATCH, default: null },
      address: { type: String, trim: true, maxlength: 300, default: null },
      city: { type: String, trim: true, default: null },
      state: { type: String, trim: true, default: null },
      country: { type: String, trim: true, default: "India" },
      pincode: { type: String, trim: true, default: null },
      avatarUrl: { type: String, default: null },
      dateOfBirth: { type: Date, default: null },
      gender: {
        type: String,
        enum: ["male", "female", "other", "prefer_not_to_say", null],
        default: null,
      },
      bloodGroup: {
        type: String,
        enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", null],
        default: null,
      },
      bio: { type: String, maxlength: 500, default: null },
      socialLinks: {
        linkedin: { type: String, default: null },
        github: { type: String, default: null },
        twitter: { type: String, default: null },
        website: { type: String, default: null },
      },
    },

    // ── 4. EMPLOYMENT (HRMS) — staff roles ───────────────────────────────────
    employment: {
      employeeId: { type: String, trim: true, default: null },
      department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", default: null },
      designation: { type: String, trim: true, maxlength: 100, default: null },
      reportingManager: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      workLocation: { type: String, trim: true, default: null },
      workEmail: { type: String, lowercase: true, trim: true, match: EMAIL_MATCH, default: null },
      dateOfJoining: { type: Date, default: null },
      dateOfExit: { type: Date, default: null },
      probationEndDate: { type: Date, default: null },
      employmentHistory: [
        {
          _id: false,
          title: { type: String, required: true },
          department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
          from: { type: Date, required: true },
          to: { type: Date, default: null }, // null = current
          reason: { type: String, default: null }, // promotion / transfer
        },
      ],
      skills: [{ type: String, trim: true }],
      documents: [
        {
          _id: false,
          type: { type: String, enum: ["id_proof", "contract", "certificate", "other"] },
          name: String,
          url: String,
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
    },

    // ── 5. COMPENSATION & BANK (payroll-ready, private) ──────────────────────
    compensation: {
      ctc: { type: Number, default: null, select: false }, // annual
      basicMonthly: { type: Number, default: null, select: false },
      bank: {
        accountName: { type: String, trim: true, default: null, select: false },
        accountNumber: { type: String, trim: true, default: null, select: false },
        bankName: { type: String, trim: true, default: null, select: false },
        ifsc: { type: String, trim: true, uppercase: true, default: null, select: false },
        branch: { type: String, trim: true, default: null, select: false },
      },
      statutory: {
        pan: { type: String, trim: true, uppercase: true, default: null, select: false },
        aadhaarLast4: {
          type: String,
          match: [/^[0-9]{4}$/, "Must be last 4 digits"],
          default: null,
          select: false,
        },
        uan: { type: String, trim: true, default: null, select: false }, // PF
        esic: { type: String, trim: true, default: null, select: false },
      },
    },

    // ── 6. EMERGENCY CONTACTS ────────────────────────────────────────────────
    emergencyContacts: [
      {
        _id: false,
        name: { type: String, required: true, trim: true },
        relationship: { type: String, required: true, trim: true },
        phone: { type: String, required: true, match: PHONE_MATCH },
        isPrimary: { type: Boolean, default: false },
      },
    ],

    // ── 7. ACADEMIC (LMS) — students ─────────────────────────────────────────
    academic: {
      rollNumber: { type: String, trim: true, default: null },
      grade: { type: String, trim: true, default: null },
      section: { type: String, trim: true, default: null },
      guardianName: { type: String, trim: true, default: null },
      guardianPhone: { type: String, match: PHONE_MATCH, default: null },
      admissionDate: { type: Date, default: null },
    },

    // ── 8. PREFERENCES ───────────────────────────────────────────────────────
    preferences: {
      language: { type: String, default: "en" },
      timezone: { type: String, default: "Asia/Kolkata" },
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        announcements: { type: Boolean, default: true },
        payroll: { type: Boolean, default: true },
      },
      theme: { type: String, enum: ["light", "dark", "system"], default: "system" },
    },

    // ── 9. LIFECYCLE / AUDIT ─────────────────────────────────────────────────
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    deactivatedAt: { type: Date, default: null },
    deactivationReason: { type: String, maxlength: 300, default: null },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },

    // Free-form metadata for future needs without migrations
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
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
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// ── Indexes for real query patterns ──────────────────────────────────────────
userSchema.index({ instituteId: 1, role: 1 });
userSchema.index({ instituteId: 1, status: 1 });
userSchema.index({ "employment.department": 1 });
userSchema.index({ "employment.reportingManager": 1 });
userSchema.index({ name: "text", email: "text", userCode: "text" });

// ── Hooks ────────────────────────────────────────────────────────────────────
userSchema.pre("save", async function (next) {
  try {
    // Auto-generate human-friendly user codes per role: ADM-0001, EMP-0042 …
    if (this.isNew && !this.userCode) {
      const prefixMap = {
        [Roles.STUDENT]: "STU",
        [Roles.TEACHER]: "TEA",
        [Roles.EMPLOYEE]: "EMP",
        [Roles.HR]: "HR",
        [Roles.ADMIN]: "ADM",
        [Roles.SUPER_ADMIN]: "SA",
      };
      const prefix = prefixMap[this.role] || "USR";
      const seq = await getNextSequence(this.role);
      this.userCode = `${prefix}-${String(seq).padStart(4, "0")}`;
    }

    // Multi-tenant role rules: which roles may belong to which org type
    if (!this.instituteId || this.role === Roles.SUPER_ADMIN) return next();

    const Organization = mongoose.models.Organization;
    if (!Organization) return next();

    const org = await Organization.findById(this.instituteId).lean();
    if (!org) return next(new Error("Invalid organization ID"));

    const allowedRoles = {
      school: [Roles.ADMIN, Roles.TEACHER, Roles.STUDENT],
      college: [Roles.ADMIN, Roles.TEACHER, Roles.STUDENT],
      coaching: [Roles.ADMIN, Roles.TEACHER, Roles.STUDENT],
      company: [Roles.ADMIN, Roles.HR, Roles.EMPLOYEE],
      // Platform-created orgs may not have a type-specific structure yet
      institute: [Roles.ADMIN, Roles.TEACHER, Roles.STUDENT, Roles.HR, Roles.EMPLOYEE],
      startup: [Roles.ADMIN, Roles.HR, Roles.EMPLOYEE],
      ngo: [Roles.ADMIN, Roles.HR, Roles.EMPLOYEE],
      others: [Roles.ADMIN, Roles.TEACHER, Roles.STUDENT, Roles.HR, Roles.EMPLOYEE],
    };

    if (!allowedRoles[org.type]?.includes(this.role)) {
      return next(new Error(`Role '${this.role}' is not allowed for a '${org.type}' organization`));
    }

    next();
  } catch (err) {
    next(err);
  }
});

// ── Virtuals ─────────────────────────────────────────────────────────────────
userSchema.virtual("isLocked").get(function () {
  return !!(this.lockedUntil && this.lockedUntil > new Date());
});

userSchema.virtual("tenureDays").get(function () {
  if (!this.employment?.dateOfJoining) return null;
  const end = this.employment.dateOfExit ?? new Date();
  return Math.floor((end - this.employment.dateOfJoining) / (1000 * 60 * 60 * 24));
});

// ── Query helpers ────────────────────────────────────────────────────────────
userSchema.query.byOrganization = function (orgId) {
  return this.where({ instituteId: orgId, isDeleted: false });
};
userSchema.query.active = function () {
  return this.where({ status: "active", isDeleted: false });
};

// ── Instance methods ─────────────────────────────────────────────────────────
userSchema.methods.hasPermission = function (permission) {
  if (this.role === Roles.SUPER_ADMIN) return true;
  return (RolePermissions[this.role] ?? []).includes(permission);
};

userSchema.methods.canManage = function (targetRole) {
  return canManageRole(this.role, targetRole);
};

userSchema.methods.softDelete = function (reason, byUserId = null) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.status = "inactive";
  this.deactivatedAt = new Date();
  this.deactivationReason = reason ?? null;
  if (byUserId) this.updatedBy = byUserId;
  return this.save();
};

export const User = mongoose.models.User || mongoose.model("User", userSchema);

export { Roles };
