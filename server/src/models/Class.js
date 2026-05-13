import mongoose from "mongoose";

const classSchema = new mongoose.Schema({
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
  name: { type: String, required: true },
  subject: { type: String, required: true },
  description: String,
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  studentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  schedule: {
    days: [{ type: String, enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] }],
    startTime: String,
    endTime: String,
  },
  room: String,
  maxStudents: { type: Number, default: 50 },
  status: { type: String, enum: ["active", "inactive"], default: "active" },
}, { timestamps: true });

classSchema.index({ instituteId: 1 });
classSchema.index({ teacherId: 1 });

export const Class = mongoose.models.Class || mongoose.model("Class", classSchema);
