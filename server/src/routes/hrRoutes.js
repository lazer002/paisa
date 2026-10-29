// server/src/routes/hrRoutes.js

import express from "express";

import {
  createHR,
  getHRs,
  getHR,
  updateHR,
  deleteHR,
} from "../controllers/hrController.js";

import authenticate from "../middleware/authenticate.js";
import {
  requireRole,
  authorize,
} from "../middleware/authorize.js";

const router = express.Router();

router.use(authenticate);

// Create HR
router.post(
  "/",
  requireRole(
    "admin",
    "super_admin",
    "hr"
  ),
  createHR
);

// Get HRs (hr:read — admin, principal, hr)
router.get(
  "/",
  authorize({
    anyPermissions: ["hr:read"],
  }),
  getHRs
);

// Get one HR
router.get(
  "/:publicId",
  authorize({
    anyPermissions: ["hr:read"],
  }),
  getHR
);

// Update HR (hr:update — admin)
router.put(
  "/:publicId",
  requireRole("admin", "super_admin", "hr"),
  updateHR
);

// Delete HR (hr:delete — admin)
router.delete(
  "/:publicId",
  requireRole("admin", "super_admin"),
  deleteHR
);

export default router;