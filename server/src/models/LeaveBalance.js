// server/src/models/LeaveBalance.js
//
// A user's balance for one leave type in one calendar year.
// allocated/carriedForward are set when the row is first created (from the
// policy and last year's row); adjustment is a manual HR correction.
// used/pending are recomputed from the Leave records whenever a leave of that
// user changes, so they can never drift from the real requests.
// remaining = allocated + carriedForward + adjustment - used - pending

import mongoose from "mongoose";
import crypto from "node:crypto";

const leaveBalanceSchema = new mongoose.Schema(
  {
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    publicId: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      index: true,
      default: () =>
        `lbal_${crypto.randomBytes(16).toString("base64url")}`,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    year: {
      type: Number,
      required: true,
      min: 2000,
      max: 2200,
    },

    leaveType: {
      type: String,
      required: true,
      trim: true,
    },

    allocated: { type: Number, min: 0, default: 0 },
    carriedForward: { type: Number, min: 0, default: 0 },
    adjustment: { type: Number, default: 0 },
    used: { type: Number, min: 0, default: 0 },
    pending: { type: Number, min: 0, default: 0 },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

leaveBalanceSchema.virtual("total").get(function () {
  return (this.allocated || 0) + (this.carriedForward || 0) + (this.adjustment || 0);
});

leaveBalanceSchema.virtual("remaining").get(function () {
  return this.total - (this.used || 0) - (this.pending || 0);
});

leaveBalanceSchema.index(
  { instituteId: 1, userId: 1, year: 1, leaveType: 1 },
  { unique: true, name: "leave_balance_user_year_type_unique" }
);

export const LeaveBalance =
  mongoose.models.LeaveBalance ||
  mongoose.model("LeaveBalance", leaveBalanceSchema);

export default LeaveBalance;
