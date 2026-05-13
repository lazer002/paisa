import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  description: String,
  instructions: String,
  dueDate: Date,
  maxScore: { type: Number, default: 100 },
  attachments: [String],
  status: { type: String, enum: ["draft", "published", "closed"], default: "published" },
}, { timestamps: true });

assignmentSchema.index({ instituteId: 1 });
assignmentSchema.index({ classId: 1 });
assignmentSchema.index({ createdBy: 1 });

export const Assignment = mongoose.models.Assignment || mongoose.model("Assignment", assignmentSchema);
