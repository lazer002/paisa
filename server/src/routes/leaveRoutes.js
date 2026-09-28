// server/src/routes/leaveRoutes.js

import express from "express";

import {
  applyLeave,
  getLeaves,
  updateLeaveStatus,
  cancelLeave,
} from "../controllers/leaveController.js";

import authenticate from "../middleware/authenticate.js";
import { requireRole } from "../middleware/authorize.js";

const router = express.Router();

router.use(authenticate);

// Get leaves
router.get(
  "/",
  getLeaves
);

// Apply for leave
router.post(
  "/",
  applyLeave
);

// Update leave status
router.put(
  "/:publicId/status",
  requireRole(
    "super_admin",
    "admin",
    "hr"
  ),
  updateLeaveStatus
);

// Cancel leave
router.put(
  "/:publicId/cancel",
  cancelLeave
);

export default router;