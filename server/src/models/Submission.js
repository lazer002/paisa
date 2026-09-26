import mongoose from "mongoose";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SUBMISSION — student work with rubric scoring and grading audit
 * ═══════════════════════════════════════════════════════════════════════════
 */

const submissionSchema = new mongoose.Schema(
  {
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
      index: true,
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    // Group work support
    groupId: { type: String, default: null },
    groupMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // ── WORK ─────────────────────────────────────────────────────────────────
    content: { type: String, maxlength: 20000 },
    attachments: [
      {
        _id: false,
        name: String,
        url: String,
        sizeBytes: Number,
        mimeType: String,
      },
    ],

    // ── TIMELINE ─────────────────────────────────────────────────────────────
    submittedAt: { type: Date, default: null },
    isLate: { type: Boolean, default: false },
    latePenaltyApplied: { type: Number, default: 0 }, // percent deducted
    attempt: { type: Number, default: 1 }, // resubmission counter

    status: {
      type: String,
      enum: { values: ["pending", "submitted", "graded", "returned", "missing"], message: "Invalid status" },
      default: "pending",
      index: true,
    },

    // ── GRADING ──────────────────────────────────────────────────────────────
    score: { type: Number, default: null },
    maxScore: { type: Number, default: null }, // snapshot from assignment
    percentage: { type: Number, default: null },

    rubricScores: [
      {
        _id: false,
        criterion: String,
        points: Number,
        maxPoints: Number,
        comment: String,
      },
    ],

    feedback: { type: String, maxlength: 2000 },
    privateNotes: { type: String, maxlength: 1000 }, // teacher-only notes

    gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    gradedAt: { type: Date, default: null },

    // Plagiarism-ready hook
    originalityScore: { type: Number, min: 0, max: 100, default: null },
  },
  { timestamps: true, versionKey: false }
);

submissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });
submissionSchema.index({ instituteId: 1, status: 1 });

// ── Auto-compute percentage on grade ─────────────────────────────────────────
submissionSchema.pre("save", function (next) {
  if (this.isModified("score") && this.score != null && this.maxScore) {
    this.percentage = Math.round((this.score / this.maxScore) * 10000) / 100;
  }
  next();
});

submissionSchema.set("toJSON", { virtuals: true });
submissionSchema.set("toObject", { virtuals: true });

export const Submission =
  mongoose.models.Submission || mongoose.model("Submission", submissionSchema);
