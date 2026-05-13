import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ["present", "absent", "late", "leave"], default: "present" },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  notes: String,
}, { timestamps: true });

attendanceSchema.index({ userId: 1, date: 1, classId: 1 }, { unique: true });
attendanceSchema.index({ instituteId: 1, date: 1 });

export const Attendance = mongoose.models.Attendance || mongoose.model("Attendance", attendanceSchema);
