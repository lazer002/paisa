import mongoose from "mongoose";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LEAVE — application with workflow, handover and balance context
 * ═══════════════════════════════════════════════════════════════════════════
 */

const LEAVE_TYPES = [
  "sick", "casual", "earned", "maternity", "paternity",
  "comp_off", "unpaid", "half_day", "other",
];

const leaveSchema = new mongoose.Schema(
  {
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: { values: LEAVE_TYPES, message: "Invalid leave type" },
      required: true,
    },

    // Half-day support
    duration: {
      type: String,
      enum: ["full_day", "half_day_morning", "half_day_evening", "multi_day"],
      default: "full_day",
    },

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    days: { type: Number, required: true, min: 0.5 },

    reason: {
      type: String,
      required: [true, "Reason is required"],
      trim: true,
      maxlength: 500,
    },

    // Supporting document (medical certificate etc.)
    attachmentUrl: { type: String, default: null },

    status: {
      type: String,
      enum: { values: ["pending", "approved", "rejected", "cancelled"], message: "Invalid status" },
      default: "pending",
      index: true,
    },

    // ── APPROVAL WORKFLOW ────────────────────────────────────────────────────
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    approvedAt: { type: Date, default: null },
    rejectionReason: { type: String, maxlength: 300, default: null },
    approverComment: { type: String, maxlength: 300, default: null },

    // Approval chain for multi-level orgs (HR → Admin)
    approvalChain: [
      {
        _id: false,
        approver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        action: { type: String, enum: ["pending", "approved", "rejected", "skipped"] },
        at: { type: Date },
        comment: { type: String, maxlength: 300 },
      },
    ],

    // ── CONTEXT ──────────────────────────────────────────────────────────────
    balanceSnapshot: {
      typeBefore: { type: Number, default: null }, // remaining days of this type
      typeAfter: { type: Number, default: null },
    },

    handoverTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    handoverNote: { type: String, maxlength: 300, default: null },

    // Notify the team?
    notifyTeam: { type: Boolean, default: false },

    // Cancel audit
    cancelledAt: { type: Date, default: null },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true, versionKey: false }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
leaveSchema.index({ instituteId: 1, status: 1 });
leaveSchema.index({ userId: 1, startDate: -1 });
leaveSchema.index({ instituteId: 1, startDate: 1, endDate: 1 });

// Prevent overlapping pending/approved leaves for the same user
leaveSchema.index(
  { userId: 1, startDate: 1, endDate: 1 },
  {
    unique: false, // overlap check done in controller; index aids the query
  }
);

// ── Virtuals ─────────────────────────────────────────────────────────────────
leaveSchema.virtual("isUpcoming").get(function () {
  return this.status === "approved" && this.startDate > new Date();
});

leaveSchema.virtual("isActiveNow").get(function () {
  const now = new Date();
  return (
    this.status === "approved" &&
    this.startDate <= now &&
    this.endDate >= now
  );
});

leaveSchema.set("toJSON", { virtuals: true });
leaveSchema.set("toObject", { virtuals: true });

export const Leave = mongoose.models.Leave || mongoose.model("Leave", leaveSchema);
