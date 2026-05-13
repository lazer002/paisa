import mongoose from "mongoose";

const payrollSchema = new mongoose.Schema({
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  month: { type: Number, required: true, min: 1, max: 12 },
  year: { type: Number, required: true },
  basicSalary: { type: Number, required: true },
  allowances: {
    hra: { type: Number, default: 0 },
    transport: { type: Number, default: 0 },
    medical: { type: Number, default: 0 },
    other: { type: Number, default: 0 },
  },
  deductions: {
    pf: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    other: { type: Number, default: 0 },
  },
  netSalary: { type: Number },
  status: { type: String, enum: ["draft", "processed", "paid"], default: "draft" },
  paidAt: Date,
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  remarks: String,
}, { timestamps: true });

payrollSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });
payrollSchema.index({ instituteId: 1, month: 1, year: 1 });

export const Payroll = mongoose.models.Payroll || mongoose.model("Payroll", payrollSchema);
