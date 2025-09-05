import mongoose from "mongoose";
import { getNextSequence } from "../utils/sequence.js"; // 🔑 helper

const Roles = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",      // institute/org owner
  TEACHER: "teacher",
  STUDENT: "student",
  HR: "hr",
  EMPLOYEE: "employee", // for company staff
};

const RolePermissions = {
  [Roles.SUPER_ADMIN]: ["manage_users", "manage_institutes", "view_reports"],
  [Roles.ADMIN]: ["manage_teachers", "manage_students", "view_reports"],
  [Roles.TEACHER]: ["manage_classes", "take_attendance"],
  [Roles.STUDENT]: ["view_classes", "submit_assignments"],
  [Roles.HR]: ["manage_staff", "view_payroll"],
  [Roles.EMPLOYEE]: ["view_tasks", "submit_reports"],
};

const userSchema = new mongoose.Schema(
  {
    instituteId: { type: mongoose.Schema.Types.ObjectId, ref: "Institute" },

    // 🔑 Unique user identifier (auto-generated)
    userCode: { type: String, unique: true },

    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    passwordHash: { type: String, required: true },

    role: {
      type: String,
      enum: Object.values(Roles),
      default: Roles.STUDENT,
    },

    // 🔒 Status & security
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    lastLogin: { type: Date },
    failedAttempts: { type: Number, default: 0 },

    // 👤 Profile
    profile: {
      phone: { type: String },
      address: { type: String },
      avatarUrl: { type: String },
    },
  },
  { timestamps: true }
);

// 🎯 Generate userCode before saving
userSchema.pre("save", async function (next) {
  if (this.isNew && !this.userCode) {
    let prefix = "USR"; // fallback

    switch (this.role) {
      case Roles.STUDENT:
        prefix = "STU";
        break;
      case Roles.TEACHER:
        prefix = "TEA";
        break;
      case Roles.EMPLOYEE:
        prefix = "EMP";
        break;
      case Roles.HR:
        prefix = "HR";
        break;
      case Roles.ADMIN:
        prefix = "ADM";
        break;
      case Roles.SUPER_ADMIN:
        prefix = "SA";
        break;
    }

    const seq = await getNextSequence(this.role); // role-specific sequence
    this.userCode = `${prefix}-${String(seq).padStart(4, "0")}`;
  }
  next();
});

// ✅ Validation: enforce role by institute type
userSchema.pre("save", async function (next) {
  if (!this.instituteId || this.role === Roles.SUPER_ADMIN) {
    return next(); // allow super_admin or unlinked users
  }

  const Institute = mongoose.model("Institute");
  const institute = await Institute.findById(this.instituteId);
  if (!institute) return next(new Error("Invalid institute ID"));

  const allowedRoles = {
    school: [Roles.ADMIN, Roles.TEACHER, Roles.STUDENT],
    college: [Roles.ADMIN, Roles.TEACHER, Roles.STUDENT],
    coaching: [Roles.ADMIN, Roles.TEACHER, Roles.STUDENT],
    company: [Roles.ADMIN, Roles.HR, Roles.EMPLOYEE],
  };

  if (!allowedRoles[institute.type]?.includes(this.role)) {
    return next(
      new Error(
        `Role '${this.role}' not allowed for institute type '${institute.type}'`
      )
    );
  }

  next();
});

export const User = mongoose.model("User", userSchema);
export { Roles, RolePermissions };
