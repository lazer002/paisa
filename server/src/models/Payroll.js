import mongoose from "mongoose";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  PAYROLL — monthly payslip with component-level breakdown + audit trail
 * ═══════════════════════════════════════════════════════════════════════════
 */

const payrollSchema = new mongoose.Schema(
  {
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Period
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },

    // Pay period boundaries for clarity
    periodStart: { type: Date, default: null },
    periodEnd: { type: Date, default: null },

    // ── EARNINGS (component-level) ───────────────────────────────────────────
    basicSalary: { type: Number, required: true, min: 0 },
    allowances: {
      hra: { type: Number, default: 0 },
      transport: { type: Number, default: 0 },
      medical: { type: Number, default: 0 },
      special: { type: Number, default: 0 },
      performance: { type: Number, default: 0 },
      overtime: { type: Number, default: 0 },
      bonus: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },

    // ── DEDUCTIONS ───────────────────────────────────────────────────────────
    deductions: {
      pf: { type: Number, default: 0 },        // provident fund
      esi: { type: Number, default: 0 },       // employee state insurance
      tax: { type: Number, default: 0 },       // TDS
      professionalTax: { type: Number, default: 0 },
      loanRecovery: { type: Number, default: 0 },
      lopDays: { type: Number, default: 0 },   // loss-of-pay days
      lopAmount: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },

    // Attendance context for the month
    attendanceSummary: {
      workingDays: { type: Number, default: 0 },
      presentDays: { type: Number, default: 0 },
      paidLeaveDays: { type: Number, default: 0 },
      unpaidLeaveDays: { type: Number, default: 0 },
    },

    // Computed (server-authoritative)
    grossSalary: { type: Number, default: 0 },
    totalDeductions: { type: Number, default: 0 },
    netSalary: { type: Number, default: 0 },

    // ── PAYMENT TRACKING ─────────────────────────────────────────────────────
    status: {
      type: String,
      enum: { values: ["draft", "processed", "approved", "paid", "cancelled"], message: "Invalid status" },
      default: "draft",
      index: true,
    },

    payment: {
      method: { type: String, enum: ["bank_transfer", "cheque", "cash", "upi", null], default: null },
      referenceNo: { type: String, trim: true, default: null },
      paidAt: { type: Date, default: null },
      paidToAccount: { type: String, default: null }, // last 4 digits snapshot
      utr: { type: String, trim: true, default: null },
    },

    // ── WORKFLOW / AUDIT ─────────────────────────────────────────────────────
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    approvedAt: { type: Date, default: null },

    remarks: { type: String, maxlength: 500 },
    payslipUrl: { type: String, default: null }, // generated PDF link

    revision: { type: Number, default: 1 }, // bumped on every edit
    isFinalized: { type: Boolean, default: false }, // locked after payment
  },
  { timestamps: true, versionKey: false }
);

// One payslip per employee per month
payrollSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });
payrollSchema.index({ instituteId: 1, month: 1, year: 1 });
payrollSchema.index({ instituteId: 1, status: 1 });

// ── Virtuals ─────────────────────────────────────────────────────────────────
payrollSchema.virtual("periodLabel").get(function () {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[this.month - 1]} ${this.year}`;
});

payrollSchema.set("toJSON", { virtuals: true });
payrollSchema.set("toObject", { virtuals: true });

// ── Statics: compute totals from components ─────────────────────────────────
payrollSchema.statics.computeTotals = function (doc) {
  const allow = Object.values(doc.allowances ?? {}).reduce((a, b) => a + (Number(b) || 0), 0);
  const ded = Object.values(doc.deductions ?? {}).reduce((a, b) => a + (Number(b) || 0), 0);
  doc.grossSalary = Number(doc.basicSalary) + allow;
  doc.totalDeductions = ded;
  doc.netSalary = doc.grossSalary - ded;
  return doc;
};

// Auto-compute totals on save
payrollSchema.pre("save", function (next) {
  const allow = Object.values(this.allowances ?? {}).reduce((a, b) => a + (Number(b) || 0), 0);
  const ded = Object.values(this.deductions ?? {}).reduce((a, b) => a + (Number(b) || 0), 0);
  this.grossSalary = Number(this.basicSalary) + allow;
  this.totalDeductions = ded;
  this.netSalary = this.grossSalary - ded;
  next();
});

export const Payroll = mongoose.models.Payroll || mongoose.model("Payroll", payrollSchema);
