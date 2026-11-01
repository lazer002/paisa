// src/routes/attendanceRoutes.js

import express from "express";

import {
  markAttendance,
  getAttendance,
  getMyAttendance,
  selfCheck,
  scanQr,
} from "../controllers/attendanceController.js";

import authenticate from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { createRateLimiter } from "../middleware/rateLimiter.js";
import {
  validateMarkAttendance,
  validateSelfCheck,
  validateQrScan,
} from "../validators/attendanceValidator.js";

const router = express.Router();

// Codes are short, so cap guesses per student (not per shared school IP).
const qrScanLimiter = createRateLimiter({
  windowSeconds: 10 * 60,
  maxRequests: 15,
  keyPrefix: "qr-scan",
  keyGenerator: (req) => String(req.user?._id ?? req.ip),
  message: "Too many attempts. Please wait a few minutes.",
});

router.use(authenticate);

// Gates run before body validation so forbidden roles get 403, not 400.
// super_admin passes every permission check.

router.get(
  "/me",
  getMyAttendance
);

// Everyone's attendance: attendance:update = admin, principal, hr, teacher
router.get(
  "/",
  authorize({ anyPermissions: ["attendance:update"] }),
  getAttendance
);

// Self check-in / check-out, geofence-checked
router.post(
  "/check-in",
  authorize({ anyPermissions: ["attendance:create"] }),
  validateSelfCheck,
  selfCheck
);

// Students redeem a class attendance code (attendance:scan = student); the
// controller verifies the code and the student's enrollment.
router.post(
  "/qr-scan",
  authorize({ anyPermissions: ["attendance:scan"] }),
  qrScanLimiter,
  validateQrScan,
  scanQr
);

// Mark a class register: attendance:mark = admin, teacher
router.post(
  "/",
  authorize({ anyPermissions: ["attendance:mark"] }),
  validateMarkAttendance,
  markAttendance
);

export default router;
