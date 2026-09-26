import mongoose from "mongoose";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ASSIGNMENT — classwork with rubric, workflow and submission stats
 * ═══════════════════════════════════════════════════════════════════════════
 */

const assignmentSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },

    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: 200,
    },

    description: { type: String, maxlength: 2000 },
    instructions: { type: String, maxlength: 5000 },

    // ── SCHEDULING ───────────────────────────────────────────────────────────
    availableFrom: { type: Date, default: null }, // visible to students from
    dueDate: { type: Date, default: null },
    lateSubmissionUntil: { type: Date, default: null }, // grace period
    allowLateSubmission: { type: Boolean, default: true },
    latePenaltyPercent: { type: Number, min: 0, max: 100, default: 0 },

    // ── GRADING ──────────────────────────────────────────────────────────────
    maxScore: { type: Number, default: 100, min: 1 },
    passingScore: { type: Number, default: null },
    weight: { type: Number, default: 1 }, // for final grade calculation
    gradingType: {
      type: String,
      enum: ["points", "percentage", "letter", "pass_fail"],
      default: "points",
    },

    // Rubric-driven grading
    rubric: [
      {
        _id: false,
        criterion: { type: String, required: true },
        maxPoints: { type: Number, required: true },
        description: { type: String },
      },
    ],

    attachments: [
      {
        _id: false,
        name: String,
        url: String,
        sizeBytes: Number,
        mimeType: String,
      },
    ],

    status: {
      type: String,
      enum: { values: ["draft", "published", "closed", "archived"], message: "Invalid status" },
      default: "published",
      index: true,
    },

    // ── STATS CACHE (denormalized for lists) ─────────────────────────────────
    stats: {
      totalStudents: { type: Number, default: 0 },
      submitted: { type: Number, default: 0 },
      graded: { type: Number, default: 0 },
      pending: { type: Number, default: 0 },
      averageScore: { type: Number, default: null },
      lastComputedAt: { type: Date, default: null },
    },

    // Individual settings
    resubmissionAllowed: { type: Boolean, default: true },
    maxResubmissions: { type: Number, default: 2 },
    isGroupAssignment: { type: Boolean, default: false },
    groupSize: { type: Number, default: null },

    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, versionKey: false }
);

assignmentSchema.index({ instituteId: 1, status: 1 });
assignmentSchema.index({ classId: 1, dueDate: 1 });

assignmentSchema.virtual("isOverdue").get(function () {
  return !!(this.dueDate && this.dueDate < new Date() && this.status === "published");
});

assignmentSchema.virtual("isOpen").get(function () {
  if (this.status !== "published") return false;
  if (this.availableFrom && this.availableFrom > new Date()) return false;
  return true;
});

assignmentSchema.set("toJSON", { virtuals: true });
assignmentSchema.set("toObject", { virtuals: true });

export const Assignment =
  mongoose.models.Assignment || mongoose.model("Assignment", assignmentSchema);
