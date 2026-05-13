import mongoose from "mongoose";
import { getNextSequence } from "../utils/sequence.js";

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

// Hierarchy: higher index = more power
export const RoleHierarchy = [
  Roles.EMPLOYEE, Roles.STUDENT, Roles.HR,
  Roles.TEACHER, Roles.ADMIN, Roles.SUPER_ADMIN,
];

export const canManageRole = (actorRole, targetRole) => {
  const actorIdx = RoleHierarchy.indexOf(actorRole);
  const targetIdx = RoleHierarchy.indexOf(targetRole);
  return actorIdx > targetIdx;
};

const userSchema = new mongoose.Schema(
  {
    instituteId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization" },
    userCode: { type: String, unique: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, unique: true, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: Object.values(Roles), default: Roles.STUDENT },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    lastLogin: { type: Date },
    failedAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
    profile: {
      phone: { type: String },
      address: { type: String },
      avatarUrl: { type: String },
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  try {
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

    if (!this.instituteId || this.role === Roles.SUPER_ADMIN) {
      return next();
    }

    // Fixed: was mongoose.models.Institute (wrong model name)
    const Organization = mongoose.models.Organization;
    if (!Organization) return next();

    const org = await Organization.findById(this.instituteId).lean();
    if (!org) return next(new Error("Invalid organization ID"));

    const allowedRoles = {
      school: [Roles.ADMIN, Roles.TEACHER, Roles.STUDENT],
      college: [Roles.ADMIN, Roles.TEACHER, Roles.STUDENT],
      coaching: [Roles.ADMIN, Roles.TEACHER, Roles.STUDENT],
      company: [Roles.ADMIN, Roles.HR, Roles.EMPLOYEE],
    };

    if (!allowedRoles[org.type]?.includes(this.role)) {
      return next(new Error(`Role '${this.role}' is not allowed for a '${org.type}' organization`));
    }

    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.isLocked = function () {
  return this.lockedUntil && this.lockedUntil > new Date();
};

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ instituteId: 1 });
userSchema.index({ role: 1 });

export const User = mongoose.models.User || mongoose.model("User", userSchema);
export { Roles };
