// server/src/validators/gamificationValidator.js
//
// Body schemas for the achievement catalog, awards and points (H3).

import {
  Joi,
  str,
  optStr,
  text,
  ref,
  optNum,
  optObj,
  oneOf,
  optOneOf,
} from "./common.js";

import {
  ACHIEVEMENT_TYPES,
  ACHIEVEMENT_STATUSES,
  ACHIEVEMENT_RARITIES,
} from "../models/Achievement.js";

const achievementFields = {
  name: str(300, 2),
  shortDescription: optStr(500),
  description: text(5000),
  type: optOneOf(ACHIEVEMENT_TYPES),
  rarity: optOneOf(ACHIEVEMENT_RARITIES),
  points: optNum(0),
  icon: optStr(2000),
  badge: Joi.alternatives().try(optStr(200), optObj()),
};

export const createAchievementSchema = Joi.object({
  ...achievementFields,
  name: achievementFields.name.required(),
});

export const updateAchievementSchema = Joi.object({
  ...achievementFields,
  status: oneOf(ACHIEVEMENT_STATUSES),
});

export const awardAchievementSchema = Joi.object({
  userId: ref().required(),
  achievementId: ref().required(),
  reason: optStr(1000),
});

export const awardPointsSchema = Joi.object({
  userId: ref().required(),
  points: Joi.number().invalid(0).required(),
  reason: optStr(1000),
});

/* ---------- rewards ---------- */

const rewardFields = {
  description: optStr(1000),
  cost: Joi.number().integer().min(1).max(1000000),
  // null = unlimited
  stock: Joi.number().integer().min(0).allow(null),
  status: optOneOf(["active", "inactive"]),
};

export const createRewardSchema = Joi.object({
  ...rewardFields,
  name: str(150).required(),
  cost: rewardFields.cost.required(),
});

export const updateRewardSchema = Joi.object({
  ...rewardFields,
  name: str(150),
});

export const handleRedemptionSchema = Joi.object({
  action: oneOf(["fulfil", "cancel"]).required(),
  note: optStr(500),
});
