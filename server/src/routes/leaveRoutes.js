// server/src/routes/leaveRoutes.js

import express from "express";

import {
  applyLeave,
  getLeaves,
  updateLeaveStatus,
  cancelLeave,
} from "../controllers/leaveController.js";

import authenticate from "../middleware/authenticate.js";
import {
  requireRole,
  authorize,
} from "../middleware/authorize.js";

const router = express.Router();

router.use(authenticate);

// Get leaves (self-only roles are scoped to their own leaves)
router.get(
  "/",
  authorize({
    anyPermissions: ["leave:read"],
  }),
  getLeaves
);

// Apply for leave
router.post(
  "/",
  authorize({
    anyPermissions: ["leave:create"],
  }),
  applyLeave
);

// Update leave status
router.put(
  "/:publicId/status",
  requireRole(
    "super_admin",
    "admin",
    "principal",
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