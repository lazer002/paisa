// server/src/models/Reward.js
//
// Things members can spend gamification points on, and the requests to do
// so. Redeeming writes a "redeem" PointLedger entry; cancelling refunds it.

import mongoose from "mongoose";
import crypto from "node:crypto";

const rewardSchema = new mongoose.Schema(
  {
    instituteId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    publicId: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      default: () => `rwd_${crypto.randomBytes(16).toString("base64url")}`,
    },
    name: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, trim: true, maxlength: 1000, default: null },
    cost: { type: Number, required: true, min: 1, max: 1000000 },
    // null = unlimited
    stock: { type: Number, min: 0, default: null },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

const redemptionSchema = new mongoose.Schema(
  {
    instituteId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    publicId: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      default: () => `rdm_${crypto.randomBytes(16).toString("base64url")}`,
    },
    rewardId: { type: mongoose.Schema.Types.ObjectId, ref: "Reward", required: true },
    rewardName: { type: String, trim: true, maxlength: 150 },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    cost: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["requested", "fulfilled", "cancelled"], default: "requested", index: true },
    handledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    handledAt: { type: Date, default: null },
    note: { type: String, trim: true, maxlength: 500, default: null },
  },
  { timestamps: true }
);

export const Reward = mongoose.models.Reward || mongoose.model("Reward", rewardSchema);
export const RewardRedemption =
  mongoose.models.RewardRedemption || mongoose.model("RewardRedemption", redemptionSchema);
