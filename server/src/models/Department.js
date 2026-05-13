import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema({
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
  name: { type: String, required: true },
  code: { type: String },
  head: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  description: String,
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  employeeCount: { type: Number, default: 0 },
}, { timestamps: true });

departmentSchema.index({ instituteId: 1, name: 1 }, { unique: true });

export const Department = mongoose.models.Department || mongoose.model("Department", departmentSchema);
