import mongoose from "mongoose";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  DEPARTMENT — org unit with head, budget and workforce stats
 * ═══════════════════════════════════════════════════════════════════════════
 */

const departmentSchema = new mongoose.Schema(
  {
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: [true, "Department name is required"],
      trim: true,
      maxlength: 100,
    },

    code: { type: String, trim: true, uppercase: true, maxlength: 10 },

    description: { type: String, trim: true, maxlength: 500 },

    // ── LEADERSHIP ───────────────────────────────────────────────────────────
    head: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    deputyHead: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // ── STRUCTURE ────────────────────────────────────────────────────────────
    parentDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null, // for sub-departments / nested org structures
      index: true,
    },

    costCenter: { type: String, trim: true, default: null }, // finance mapping

    budget: {
      annual: { type: Number, default: null },
      spent: { type: Number, default: 0 },
      currency: { type: String, default: "INR" },
    },

    // ── WORKFORCE CACHE ──────────────────────────────────────────────────────
    stats: {
      employeeCount: { type: Number, default: 0 },
      openPositions: { type: Number, default: 0 },
      avgTenureMonths: { type: Number, default: null },
      lastComputedAt: { type: Date, default: null },
    },

    status: {
      type: String,
      enum: { values: ["active", "inactive", "archived"], message: "Invalid status" },
      default: "active",
      index: true,
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true, versionKey: false }
);

// Unique name per institute
departmentSchema.index({ instituteId: 1, name: 1 }, { unique: true });

// ── Virtuals ─────────────────────────────────────────────────────────────────
departmentSchema.virtual("budgetUtilization").get(function () {
  if (!this.budget?.annual) return null;
  return Math.round(((this.budget.spent ?? 0) / this.budget.annual) * 100);
});

departmentSchema.set("toJSON", { virtuals: true });
departmentSchema.set("toObject", { virtuals: true });

// Hide soft-deleted departments
departmentSchema.pre(/^find/, function (next) {
  this.where({ isDeleted: false });
  next();
});

export const Department =
  mongoose.models.Department || mongoose.model("Department", departmentSchema);
