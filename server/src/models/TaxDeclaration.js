// server/src/models/TaxDeclaration.js
//
// An employee's income-tax choices for one financial year: regime and the
// deductions they declare (used by the old regime). HR verifies it; a
// verified declaration is locked for the employee.

import mongoose from "mongoose";
import crypto from "node:crypto";

import { REGIMES } from "../config/incomeTax.js";

const amount = { type: Number, min: 0, max: 100000000, default: 0 };

const taxDeclarationSchema = new mongoose.Schema(
  {
    instituteId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },

    publicId: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      default: () => `taxd_${crypto.randomBytes(16).toString("base64url")}`,
    },

    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // "2026-27"
    financialYear: { type: String, required: true, match: /^\d{4}-\d{2}$/ },

    regime: { type: String, enum: REGIMES, default: "new" },

    deductions: {
      section80C: amount,
      section80D: amount,
      hraExemption: amount,
      homeLoanInterest: amount,
      nps80CCD1B: amount,
      other: amount,
    },

    pan: { type: String, trim: true, uppercase: true, match: /^[A-Z]{5}[0-9]{4}[A-Z]$/, default: null },

    status: { type: String, enum: ["draft", "submitted", "verified"], default: "submitted" },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    verifiedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

taxDeclarationSchema.index({ instituteId: 1, userId: 1, financialYear: 1 }, { unique: true });

export const TaxDeclaration =
  mongoose.models.TaxDeclaration || mongoose.model("TaxDeclaration", taxDeclarationSchema);

export default TaxDeclaration;
