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
import { authorize } from "../middleware/authorize.js";
import { validateBody } from "../middleware/validate.js";

import {
  createHRSchema,
  updateHRSchema,
} from "../validators/hrValidator.js";

const router = express.Router();

router.use(authenticate);

// Create HR (hr:create — admin, hr)
router.post(
  "/",
  authorize({
    anyPermissions: ["hr:create"],
  }),
  validateBody(createHRSchema),
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

// Update HR (hr:update — admin, hr)
router.put(
  "/:publicId",
  authorize({
    anyPermissions: ["hr:update"],
  }),
  validateBody(updateHRSchema),
  updateHR
);

// Delete HR (hr:delete — admin)
router.delete(
  "/:publicId",
  authorize({
    anyPermissions: ["hr:delete"],
  }),
  deleteHR
);

export default router;
