import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema({
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  targetRoles: [{ type: String, enum: ["all", "admin", "teacher", "student", "hr", "employee"] }],
  priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  expiresAt: Date,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

announcementSchema.index({ instituteId: 1, isActive: 1 });

export const Announcement = mongoose.models.Announcement || mongoose.model("Announcement", announcementSchema);
