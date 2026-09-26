import mongoose from "mongoose";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  STUDENT PROFILE — extends the User identity for LMS features
 * ═══════════════════════════════════════════════════════════════════════════
 */

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    enrollmentNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    // ── ACADEMICS ────────────────────────────────────────────────────────────
    course: { type: String, required: true, trim: true },
    branch: { type: String, trim: true, default: null }, // e.g. "Computer Science"
    year: { type: Number, min: 1, max: 10 },
    semester: { type: Number, min: 1, max: 12 },
    section: { type: String, trim: true, default: null },
    rollNumber: { type: String, trim: true, default: null },

    // Current academic status
    academicStatus: {
      type: String,
      enum: ["active", "alumni", "suspended", "dropped_out", "graduating"],
      default: "active",
      index: true,
    },

    // ── PERFORMANCE CACHE (denormalized for quick lists) ─────────────────────
    performance: {
      cgpa: { type: Number, min: 0, max: 10, default: null },
      attendancePercent: { type: Number, min: 0, max: 100, default: null },
      assignmentsSubmitted: { type: Number, default: 0 },
      assignmentsPending: { type: Number, default: 0 },
      lastComputedAt: { type: Date, default: null },
    },

    // ── GUARDIAN ─────────────────────────────────────────────────────────────
    guardian: {
      name: { type: String, trim: true, default: null },
      relationship: {
        type: String,
        enum: ["father", "mother", "sibling", "other", null],
        default: null,
      },
      phone: {
        type: String,
        match: [/^[0-9]{10,15}$/, "Invalid phone number"],
        default: null,
      },
      email: {
        type: String,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
        default: null,
      },
      occupation: { type: String, trim: true, default: null },
    },

    // ── FEES (LMS/ERP bridge) ────────────────────────────────────────────────
    fees: {
      totalAnnual: { type: Number, default: null },
      paid: { type: Number, default: 0 },
      pending: { type: Number, default: null },
      dueDate: { type: Date, default: null },
      scholarshipPercent: { type: Number, min: 0, max: 100, default: 0 },
    },

    // ── EXTRAS ───────────────────────────────────────────────────────────────
    activities: [
      {
        _id: false,
        type: { type: String, enum: ["sports", "cultural", "technical", "social", "other"] },
        name: String,
        date: Date,
        achievement: String,
      },
    ],

    documents: [
      {
        _id: false,
        type: { type: String, enum: ["id_card", "marksheet", "transfer_certificate", "other"] },
        name: String,
        url: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true, versionKey: false }
);

studentSchema.index({ instituteId: 1, enrollmentNumber: 1 }, { unique: true });
studentSchema.index({ instituteId: 1, course: 1, year: 1 });

studentSchema.virtual("feePending").get(function () {
  if (this.fees?.totalAnnual == null) return null;
  return this.fees.totalAnnual - (this.fees.paid ?? 0);
});

studentSchema.set("toJSON", { virtuals: true });
studentSchema.set("toObject", { virtuals: true });

export default mongoose.models.Student || mongoose.model("Student", studentSchema);
