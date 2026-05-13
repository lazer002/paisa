import mongoose from "mongoose";

const studyMaterialSchema = new mongoose.Schema({
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  description: String,
  subject: String,
  type: { type: String, enum: ["pdf", "video", "document", "link", "image", "other"], default: "other" },
  url: String,
  fileSize: Number,
  isPublic: { type: Boolean, default: true },
}, { timestamps: true });

studyMaterialSchema.index({ instituteId: 1 });
studyMaterialSchema.index({ classId: 1 });

export const StudyMaterial = mongoose.models.StudyMaterial || mongoose.model("StudyMaterial", studyMaterialSchema);
