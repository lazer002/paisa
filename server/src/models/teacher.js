import mongoose from "mongoose";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  TEACHER PROFILE — extends the User identity for LMS features
 * ═══════════════════════════════════════════════════════════════════════════
 */

const teacherSchema = new mongoose.Schema(
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

    employeeCode: { type: String, trim: true, default: null },

    // ── TEACHING ─────────────────────────────────────────────────────────────
    subjects: [{ type: String, trim: true }],
    gradesTaught: [{ type: String, trim: true }], // e.g. "Grade 9", "Grade 10"

    // ── QUALIFICATIONS ───────────────────────────────────────────────────────
    qualifications: [
      {
        _id: false,
        degree: { type: String, required: true }, // B.Tech, M.Sc, B.Ed…
        institution: { type: String, trim: true },
        year: { type: Number },
      },
    ],

    certifications: [
      {
        _id: false,
        name: { type: String, required: true },
        issuer: { type: String, trim: true },
        year: { type: Number },
        url: { type: String, default: null },
      },
    ],

    experienceYears: { type: Number, min: 0, max: 60, default: 0 },

    previousEmployment: [
      {
        _id: false,
        school: { type: String, required: true },
        role: { type: String },
        from: { type: Date },
        to: { type: Date },
      },
    ],

    // ── WORKLOAD ─────────────────────────────────────────────────────────────
    maxWeeklyHours: { type: Number, default: 24 },
    isClassTeacherOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      default: null,
    },

    // ── STATUS ───────────────────────────────────────────────────────────────
    employmentStatus: {
      type: String,
      enum: ["active", "on_leave", "resigned", "terminated", "retired"],
      default: "active",
      index: true,
    },

    joiningDate: { type: Date, default: null },

    performance: {
      studentRating: { type: Number, min: 0, max: 5, default: null },
      classesThisTerm: { type: Number, default: 0 },
      lastComputedAt: { type: Date, default: null },
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true, versionKey: false }
);

teacherSchema.index({ instituteId: 1, employmentStatus: 1 });

teacherSchema.set("toJSON", { virtuals: true });
teacherSchema.set("toObject", { virtuals: true });

export default mongoose.models.Teacher || mongoose.model("Teacher", teacherSchema);
