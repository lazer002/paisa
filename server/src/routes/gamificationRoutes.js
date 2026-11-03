// server/src/routes/gamificationRoutes.js

import express from "express";

import {
  createAchievement,
  getAchievements,
  updateAchievement,
  deleteAchievement,
  awardAchievement,
  getUserAchievements,
  awardPoints,
  getPointsLedger,
  getLeaderboard,
  getMyGamification,
} from "../controllers/gamificationController.js";
import {
  getRewards,
  createReward,
  updateReward,
  deleteReward,
  redeemReward,
  getRedemptions,
  handleRedemption,
} from "../controllers/rewardController.js";

import authenticate from "../middleware/authenticate.js";

import { authorize } from "../middleware/authorize.js";

import { body } from "../validators/common.js";

import {
  createAchievementSchema,
  updateAchievementSchema,
  awardAchievementSchema,
  awardPointsSchema,
  createRewardSchema,
  updateRewardSchema,
  handleRedemptionSchema,
} from "../validators/gamificationValidator.js";

const router = express.Router();

router.use(authenticate);

// ─────────────────────────────────────────────
// ACHIEVEMENT CATALOG
// ─────────────────────────────────────────────

router.get(
  "/achievements",
  authorize({
    anyPermissions: ["achievement:read"],
  }),
  getAchievements
);

router.post(
  "/achievements",
  authorize({
    anyPermissions: ["achievement:create"],
  }),
  body(createAchievementSchema),
  createAchievement
);

// Creators may edit/delete their own achievements; managers any (controller).
router.put(
  "/achievements/:publicId",
  authorize({
    anyPermissions: ["achievement:update", "achievement:create"],
  }),
  body(updateAchievementSchema),
  updateAchievement
);

router.delete(
  "/achievements/:publicId",
  authorize({
    anyPermissions: ["achievement:delete", "achievement:create"],
  }),
  deleteAchievement
);

// ─────────────────────────────────────────────
// AWARDS
// ─────────────────────────────────────────────

router.post(
  "/award",
  authorize({
    anyPermissions: ["achievement:create", "achievement:manage"],
  }),
  body(awardAchievementSchema),
  awardAchievement
);

router.get(
  "/user-achievements",
  authorize({
    anyPermissions: ["achievement:read"],
  }),
  getUserAchievements
);

// ─────────────────────────────────────────────
// POINTS
// ─────────────────────────────────────────────

router.post(
  "/points",
  authorize({
    anyPermissions: ["point_ledger:create"],
  }),
  body(awardPointsSchema),
  awardPoints
);

router.get(
  "/points",
  authorize({
    anyPermissions: ["point_ledger:read"],
  }),
  getPointsLedger
);

// ─────────────────────────────────────────────
// LEADERBOARD (readable by any authenticated
// member of the tenant — visibility mirrors
// the existing stats endpoints)
// ─────────────────────────────────────────────

router.get(
  "/leaderboard",
  getLeaderboard
);

// The caller's own balance, rank and streak.
router.get(
  "/me",
  getMyGamification
);

// ─────────────────────────────────────────────
// REWARDS (spend points)
// ─────────────────────────────────────────────

const rewardManagers = authorize({
  anyPermissions: ["achievement:create", "achievement:manage"],
});
const members = authorize({ anyPermissions: ["achievement:read"] });

router.get("/rewards", members, getRewards);
router.post("/rewards", rewardManagers, body(createRewardSchema), createReward);
router.put("/rewards/:publicId", rewardManagers, body(updateRewardSchema), updateReward);
router.delete("/rewards/:publicId", rewardManagers, deleteReward);
router.post("/rewards/:publicId/redeem", members, redeemReward);

router.get("/redemptions", members, getRedemptions);
router.post(
  "/redemptions/:publicId/handle",
  rewardManagers,
  body(handleRedemptionSchema),
  handleRedemption
);

export default router;
