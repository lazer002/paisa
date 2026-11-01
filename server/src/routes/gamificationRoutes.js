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
} from "../controllers/gamificationController.js";

import authenticate from "../middleware/authenticate.js";

import { authorize } from "../middleware/authorize.js";

import { body } from "../validators/common.js";

import {
  createAchievementSchema,
  updateAchievementSchema,
  awardAchievementSchema,
  awardPointsSchema,
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

router.put(
  "/achievements/:publicId",
  authorize({
    anyPermissions: ["achievement:update"],
  }),
  body(updateAchievementSchema),
  updateAchievement
);

router.delete(
  "/achievements/:publicId",
  authorize({
    anyPermissions: ["achievement:delete"],
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

export default router;
