// server/src/controllers/rewardController.js
//
// Rewards members buy with gamification points.
//   catalog read: achievement:read · manage + handle requests: achievement:create|manage
//   redeem: achievement:read (own points only)
// Always the caller's organization.

import { Reward, RewardRedemption } from "../models/Reward.js";
import { movePoints, pointsOf } from "../services/gamificationService.js";
import { notifyOnce } from "../services/notify.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/errorHandler.js";
import { hasAnyPermission } from "../utils/permissions.js";
import { sendSuccess, sendCreated } from "../utils/response.js";

const MANAGE = ["achievement:create", "achievement:manage"];

const orgOf = (req) => {
  if (!req.user.instituteId) throw ApiError.badRequest("Rewards belong to an organization", "ORGANIZATION_REQUIRED");
  return req.user.instituteId;
};

const pick = (body) =>
  Object.fromEntries(["name", "description", "cost", "stock", "status"].filter((k) => body[k] !== undefined).map((k) => [k, body[k]]));

export const getRewards = asyncHandler(async (req, res) => {
  const manager = hasAnyPermission(req.user, MANAGE);
  const rewards = await Reward.find({ instituteId: orgOf(req), ...(manager ? {} : { status: "active" }) }).sort({ cost: 1 });

  return sendSuccess(res, {
    message: "Rewards",
    data: rewards,
    meta: { myPoints: await pointsOf(req.user._id) },
  });
});

export const createReward = asyncHandler(async (req, res) => {
  const reward = await Reward.create({ ...pick(req.body), instituteId: orgOf(req), createdBy: req.user._id });
  return sendCreated(res, { message: "Reward created", data: reward });
});

export const updateReward = asyncHandler(async (req, res) => {
  const reward = await Reward.findOneAndUpdate(
    { publicId: req.params.publicId, instituteId: orgOf(req) },
    pick(req.body),
    { new: true, runValidators: true }
  );
  if (!reward) throw ApiError.notFound("Reward not found", "REWARD_NOT_FOUND");
  return sendSuccess(res, { message: "Reward updated", data: reward });
});

export const deleteReward = asyncHandler(async (req, res) => {
  const result = await Reward.deleteOne({ publicId: req.params.publicId, instituteId: orgOf(req) });
  if (!result.deletedCount) throw ApiError.notFound("Reward not found", "REWARD_NOT_FOUND");
  return sendSuccess(res, { message: "Reward deleted", data: null });
});

/** Spend points on a reward: takes one from stock and records a request. */
export const redeemReward = asyncHandler(async (req, res) => {
  const instituteId = orgOf(req);

  // Take stock atomically (null stock = unlimited).
  const reward = await Reward.findOneAndUpdate(
    { publicId: req.params.publicId, instituteId, status: "active", $or: [{ stock: null }, { stock: { $gt: 0 } }] },
    [{ $set: { stock: { $cond: [{ $eq: ["$stock", null] }, null, { $subtract: ["$stock", 1] }] } } }],
    { new: true }
  );

  if (!reward) {
    throw ApiError.badRequest("This reward is not available (inactive or out of stock)", "REWARD_UNAVAILABLE");
  }

  const spent = await movePoints({
    instituteId,
    userId: req.user._id,
    delta: -reward.cost,
    type: "redeem",
    description: `Redeemed: ${reward.name}`,
  });

  if (!spent.ok) {
    if (reward.stock !== null) await Reward.updateOne({ _id: reward._id }, { $inc: { stock: 1 } });
    throw ApiError.badRequest(`Not enough points: this costs ${reward.cost}, you have ${spent.balance}`, "INSUFFICIENT_POINTS");
  }

  const redemption = await RewardRedemption.create({
    instituteId,
    rewardId: reward._id,
    rewardName: reward.name,
    userId: req.user._id,
    cost: reward.cost,
  });

  return sendCreated(res, {
    message: `Requested "${reward.name}". You have ${spent.balance} points left`,
    data: redemption,
  });
});

/** Own requests; managers see everyone's (optionally ?status=requested). */
export const getRedemptions = asyncHandler(async (req, res) => {
  const query = { instituteId: orgOf(req) };
  if (!hasAnyPermission(req.user, MANAGE) || req.query.mine === "true") query.userId = req.user._id;
  if (req.query.status) query.status = String(req.query.status);

  const rows = await RewardRedemption.find(query).populate("userId", "publicId name userCode role").sort({ createdAt: -1 }).limit(200);
  return sendSuccess(res, { message: "Reward requests", data: rows });
});

/** Managers: hand it over (fulfil) or cancel and refund the points. */
export const handleRedemption = asyncHandler(async (req, res) => {
  const redemption = await RewardRedemption.findOne({ publicId: req.params.publicId, instituteId: orgOf(req) });
  if (!redemption) throw ApiError.notFound("Request not found", "REDEMPTION_NOT_FOUND");
  if (redemption.status !== "requested") throw ApiError.badRequest(`This request is already ${redemption.status}`, "REDEMPTION_CLOSED");

  const action = req.body.action;

  if (action === "cancel") {
    await movePoints({
      instituteId: redemption.instituteId,
      userId: redemption.userId,
      delta: redemption.cost,
      type: "refund",
      description: `Refund: ${redemption.rewardName}`,
      createdBy: req.user._id,
    });
    await Reward.updateOne({ _id: redemption.rewardId, stock: { $ne: null } }, { $inc: { stock: 1 } });
  }

  redemption.status = action === "cancel" ? "cancelled" : "fulfilled";
  redemption.handledBy = req.user._id;
  redemption.handledAt = new Date();
  redemption.note = req.body.note || null;
  await redemption.save();

  await notifyOnce({
    instituteId: redemption.instituteId,
    userIds: [redemption.userId],
    type: "achievement",
    title: action === "cancel" ? `Reward request cancelled: ${redemption.rewardName}` : `Your reward is ready: ${redemption.rewardName}`,
    body: action === "cancel" ? `${redemption.cost} points were returned.${redemption.note ? ` ${redemption.note}` : ""}` : redemption.note,
    link: "/dashboard/gamification",
    reference: { kind: `reward_${redemption.status}`, id: redemption._id, publicId: redemption.publicId },
  });

  return sendSuccess(res, { message: `Request ${redemption.status}`, data: redemption });
});
