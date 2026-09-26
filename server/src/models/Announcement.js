import mongoose from "mongoose";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ANNOUNCEMENT — targeted notices with scheduling and delivery analytics
 * ═══════════════════════════════════════════════════════════════════════════
 */

const announcementSchema = new mongoose.Schema(
  {
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null, // null = platform-wide announcement
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

    content: {
      type: String,
      required: [true, "Content is required"],
      maxlength: 5000,
    },

    summary: { type: String, maxlength: 300 }, // short preview for cards

    // ── TARGETING ────────────────────────────────────────────────────────────
    targetRoles: [
      {
        type: String,
        enum: ["all", "admin", "teacher", "student", "hr", "employee"],
      },
    ],

    targetClasses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Class" }],
    targetDepartments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Department" }],

    // Specific users (direct notice)
    targetUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    priority: {
      type: String,
      enum: { values: ["low", "medium", "high", "critical"], message: "Invalid priority" },
      default: "medium",
    },

    category: {
      type: String,
      enum: ["general", "event", "holiday", "exam", "policy", "emergency", "other"],
      default: "general",
      index: true,
    },

    // ── SCHEDULING ───────────────────────────────────────────────────────────
    publishAt: { type: Date, default: null }, // scheduled publishing
    expiresAt: { type: Date, default: null },

    isActive: { type: Boolean, default: true, index: true },

    // Pinned to top of feed
    isPinned: { type: Boolean, default: false },

    // ── MEDIA ────────────────────────────────────────────────────────────────
    attachments: [
      {
        _id: false,
        name: String,
        url: String,
        mimeType: String,
        sizeBytes: Number,
      },
    ],

    // ── DELIVERY ANALYTICS ───────────────────────────────────────────────────
    delivery: {
      targetedCount: { type: Number, default: 0 },
      readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      readCount: { type: Number, default: 0 },
      acknowledgedCount: { type: Number, default: 0 }, // for mandatory notices
      requiresAcknowledgment: { type: Boolean, default: false },
    },

    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, versionKey: false }
);

announcementSchema.index({ instituteId: 1, isActive: 1, createdAt: -1 });
announcementSchema.index({ priority: 1, createdAt: -1 });
announcementSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL auto-cleanup

announcementSchema.virtual("isExpired").get(function () {
  return !!(this.expiresAt && this.expiresAt < new Date());
});

announcementSchema.set("toJSON", { virtuals: true });
announcementSchema.set("toObject", { virtuals: true });

export const Announcement =
  mongoose.models.Announcement || mongoose.model("Announcement", announcementSchema);
