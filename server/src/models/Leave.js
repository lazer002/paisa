import mongoose from "mongoose";

const leaveSchema = new mongoose.Schema({
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["sick", "casual", "earned", "maternity", "paternity", "other"], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  days: { type: Number },
  reason: { type: String, required: true },
  status: { type: String, enum: ["pending", "approved", "rejected", "cancelled"], default: "pending" },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  approvedAt: Date,
  rejectionReason: String,
}, { timestamps: true });

leaveSchema.index({ instituteId: 1, status: 1 });
leaveSchema.index({ userId: 1 });

export const Leave = mongoose.models.Leave || mongoose.model("Leave", leaveSchema);
