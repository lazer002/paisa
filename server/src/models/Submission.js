import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema({
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment", required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: String,
  attachments: [String],
  score: Number,
  feedback: String,
  status: { type: String, enum: ["pending", "submitted", "graded", "late"], default: "pending" },
  submittedAt: Date,
  gradedAt: Date,
  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

submissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

export const Submission = mongoose.models.Submission || mongoose.model("Submission", submissionSchema);
