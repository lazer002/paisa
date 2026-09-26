import mongoose from "mongoose";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  STUDY MATERIAL — learning resources with access control + analytics
 * ═══════════════════════════════════════════════════════════════════════════
 */

const studyMaterialSchema = new mongoose.Schema(
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
      default: null, // null = institute-wide resource
      index: true,
    },

    uploadedBy: {
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
    subject: { type: String, trim: true, index: true },
    tags: [{ type: String, trim: true, lowercase: true }],

    type: {
      type: String,
      enum: { values: ["pdf", "video", "document", "link", "image", "presentation", "audio", "other"], message: "Invalid type" },
      default: "other",
    },

    // ── SOURCE ───────────────────────────────────────────────────────────────
    url: { type: String, required: true },
    storageProvider: {
      type: String,
      enum: ["external", "s3", "cloudinary", "local"],
      default: "external",
    },

    fileMeta: {
      sizeBytes: { type: Number, default: null },
      mimeType: { type: String, default: null },
      pages: { type: Number, default: null }, // for PDFs
      durationMinutes: { type: Number, default: null }, // for videos
      thumbnailUrl: { type: String, default: null },
    },

    // ── ACCESS CONTROL ───────────────────────────────────────────────────────
    visibility: {
      type: String,
      enum: ["class_only", "institute", "public"],
      default: "class_only",
    },

    allowedRoles: [
      { type: String, enum: ["admin", "teacher", "student", "hr", "employee"] },
    ],

    downloadable: { type: Boolean, default: true },
    availableFrom: { type: Date, default: null },
    availableUntil: { type: Date, default: null },

    // ── ANALYTICS CACHE ──────────────────────────────────────────────────────
    analytics: {
      views: { type: Number, default: 0 },
      downloads: { type: Number, default: 0 },
      uniqueViewers: { type: Number, default: 0 },
      lastViewedAt: { type: Date, default: null },
    },

    isArchived: { type: Boolean, default: false, index: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, versionKey: false }
);

studyMaterialSchema.index({ instituteId: 1, classId: 1 });
studyMaterialSchema.index({ instituteId: 1, subject: 1 });
studyMaterialSchema.index({ title: "text", description: "text", tags: "text" });

// ── Instance methods ─────────────────────────────────────────────────────────
studyMaterialSchema.methods.recordView = function (unique = false) {
  this.analytics.views += 1;
  this.analytics.lastViewedAt = new Date();
  if (unique) this.analytics.uniqueViewers += 1;
  return this.save();
};

studyMaterialSchema.set("toJSON", { virtuals: true });
studyMaterialSchema.set("toObject", { virtuals: true });

export const StudyMaterial =
  mongoose.models.StudyMaterial || mongoose.model("StudyMaterial", studyMaterialSchema);
