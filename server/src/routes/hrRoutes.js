// server/src/routes/hrRoutes.js

import express from "express";

import {
  createHR,
  getHRs,
} from "../controllers/hrController.js";

import authenticate from "../middleware/authenticate.js";
import { requireRole } from "../middleware/authorize.js";

const router = express.Router();

router.use(authenticate);

// Create HR
router.post(
  "/",
  requireRole(
    "admin",
    "super_admin"
  ),
  createHR
);

// Get HRs
router.get(
  "/",
  requireRole(
    "admin",
    "super_admin"
  ),
  getHRs
);

export default router;