import mongoose from "mongoose";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ATTENDANCE — daily record with check-in/out, location and audit
 * ═══════════════════════════════════════════════════════════════════════════
 */

const attendanceSchema = new mongoose.Schema(
  {
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      default: null, // null = org-wide (office) attendance
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    date: {
      type: Date,
      required: true,
      // stored at midnight UTC for clean day queries
    },

    status: {
      type: String,
      enum: { values: ["present", "absent", "late", "leave", "half_day", "holiday"], message: "Invalid status" },
      default: "present",
      index: true,
    },

    // Check-in / check-out (offices)
    checkIn: { type: Date, default: null },
    checkOut: { type: Date, default: null },
    workedMinutes: { type: Number, default: null },

    // Where they clocked in (remote/hybrid teams)
    location: {
      mode: { type: String, enum: ["office", "remote", "field", null], default: null },
      coordinates: {
        latitude: { type: Number, default: null },
        longitude: { type: Number, default: null },
      },
      address: { type: String, default: null },
    },

    notes: { type: String, maxlength: 300 },

    // Late arrival context
    lateBy: { type: Number, default: null }, // minutes

    // ── AUDIT ────────────────────────────────────────────────────────────────
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    markedVia: {
      type: String,
      enum: ["manual", "self_checkin", "biometric", "import", "api"],
      default: "manual",
    },

    // Edits after initial mark
    editHistory: [
      {
        _id: false,
        editedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        from: String,
        to: String,
        at: { type: Date, default: Date.now },
        reason: { type: String, maxlength: 200 },
      },
    ],
  },
  { timestamps: true, versionKey: false }
);

// One record per user per day per class (null classId = org-wide)
attendanceSchema.index({ userId: 1, date: 1, classId: 1 }, { unique: true });
attendanceSchema.index({ instituteId: 1, date: 1 });
attendanceSchema.index({ instituteId: 1, classId: 1, date: 1 });

// ── Virtuals ─────────────────────────────────────────────────────────────────
attendanceSchema.virtual("hoursWorked").get(function () {
  if (!this.workedMinutes) return null;
  return Math.round((this.workedMinutes / 60) * 10) / 10;
});

attendanceSchema.set("toJSON", { virtuals: true });
attendanceSchema.set("toObject", { virtuals: true });

export const Attendance =
  mongoose.models.Attendance || mongoose.model("Attendance", attendanceSchema);
