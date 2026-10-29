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
import { requireRole, authorize } from "../middleware/authorize.js";
import { createRateLimiter } from "../middleware/rateLimiter.js";

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

router.get(
  "/me",
  getMyAttendance
);

router.get(
  "/",
  requireRole("super_admin", "admin", "teacher", "hr", "principal"),
  getAttendance
);

// Self check-in / check-out, geofence-checked
router.post(
  "/check-in",
  authorize({ anyPermissions: ["attendance:create"] }),
  selfCheck
);

// Students redeem a class attendance code; the controller verifies the
// code and the student's enrollment.
router.post("/qr-scan", requireRole("student"), qrScanLimiter, scanQr);

router.post(
  "/",
  requireRole("super_admin", "admin", "teacher"),
  markAttendance
);

export default router;