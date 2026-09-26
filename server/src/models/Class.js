import mongoose from "mongoose";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  CLASS — course/batch with schedule, capacity and enrollment stats
 * ═══════════════════════════════════════════════════════════════════════════
 */

const classSchema = new mongoose.Schema(
  {
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: [true, "Class name is required"],
      trim: true,
      maxlength: 100,
    },

    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
      index: true,
    },

    description: { type: String, maxlength: 1000 },

    // ── PEOPLE ───────────────────────────────────────────────────────────────
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    coTeachers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    studentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // ── SCHEDULE ─────────────────────────────────────────────────────────────
    schedule: {
      days: [
        {
          type: String,
          enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        },
      ],
      startTime: { type: String, default: null }, // "09:00"
      endTime: { type: String, default: null },   // "10:30"
      room: { type: String, trim: true, default: null },
      mode: {
        type: String,
        enum: ["in_person", "online", "hybrid"],
        default: "in_person",
      },
      meetingLink: { type: String, default: null }, // for online classes
    },

    // ── CAPACITY & ENROLLMENT ────────────────────────────────────────────────
    maxStudents: { type: Number, default: 50, min: 1 },

    enrollment: {
      open: { type: Boolean, default: true },
      requiresApproval: { type: Boolean, default: false },
      enrollmentCode: { type: String, trim: true, default: null }, // join code
      closesAt: { type: Date, default: null },
    },

    // ── ACADEMIC CONTEXT ─────────────────────────────────────────────────────
    grade: { type: String, trim: true, default: null },
    academicYear: { type: String, trim: true, default: null }, // "2026-27"
    syllabusUrl: { type: String, default: null },

    status: {
      type: String,
      enum: { values: ["active", "inactive", "completed", "archived"], message: "Invalid status" },
      default: "active",
      index: true,
    },

    // ── STATS CACHE ──────────────────────────────────────────────────────────
    stats: {
      attendancePercent: { type: Number, default: null },
      assignmentsCount: { type: Number, default: 0 },
      materialsCount: { type: Number, default: 0 },
      lastComputedAt: { type: Date, default: null },
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true, versionKey: false }
);

classSchema.index({ instituteId: 1, status: 1 });
classSchema.index({ instituteId: 1, subject: 1 });
classSchema.index({ teacherId: 1, status: 1 });

// ── Virtuals ─────────────────────────────────────────────────────────────────
classSchema.virtual("enrolledCount").get(function () {
  return this.studentIds?.length ?? 0;
});

classSchema.virtual("seatsAvailable").get(function () {
  return Math.max(0, (this.maxStudents ?? 50) - (this.studentIds?.length ?? 0));
});

classSchema.virtual("isFull").get(function () {
  return (this.studentIds?.length ?? 0) >= (this.maxStudents ?? 50);
});

classSchema.set("toJSON", { virtuals: true });
classSchema.set("toObject", { virtuals: true });

// Hide soft-deleted classes
classSchema.pre(/^find/, function (next) {
  this.where({ isDeleted: false });
  next();
});

export const Class = mongoose.models.Class || mongoose.model("Class", classSchema);
