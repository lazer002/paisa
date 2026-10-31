// server/src/models/LeavePolicy.js
//
// One row per (organization, leave type): how many days each member of the
// listed roles gets per calendar year, and how many unused days may carry
// over into the next year. "unpaid" never has a policy: it is loss of pay
// and is never limited by a balance.

import mongoose from "mongoose";
import crypto from "node:crypto";

import { LEAVE_TYPES } from "./Leave.js";

export const POLICY_LEAVE_TYPES = LEAVE_TYPES.filter(
  (type) => type !== "unpaid"
);

export const DEFAULT_POLICY_ROLES = [
  "admin",
  "principal",
  "hr",
  "accountant",
  "counselor",
  "teacher",
  "support",
  "employee",
];

const leavePolicySchema = new mongoose.Schema(
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
        `lpol_${crypto.randomBytes(16).toString("base64url")}`,
    },

    leaveType: {
      type: String,
      enum: {
        values: POLICY_LEAVE_TYPES,
        message: "Invalid leave type for a policy",
      },
      required: true,
    },

    name: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    yearlyAllocation: {
      type: Number,
      required: true,
      min: 0,
      max: 366,
    },

    // Max unused days carried into the next year. 0 = no carry forward.
    carryForwardCap: {
      type: Number,
      min: 0,
      max: 366,
      default: 0,
    },

    appliesToRoles: {
      type: [String],
      default: () => [...DEFAULT_POLICY_ROLES],
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

leavePolicySchema.index(
  { instituteId: 1, leaveType: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
    name: "leave_policy_type_unique",
  }
);

export const LeavePolicy =
  mongoose.models.LeavePolicy ||
  mongoose.model("LeavePolicy", leavePolicySchema);

export default LeavePolicy;
