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
  validateKioskCheck,
  validateCreateKiosk,
} from "../validators/attendanceValidator.js";
import {
  listKiosks,
  createKiosk,
  revokeKiosk,
  kioskCheck,
} from "../controllers/kioskController.js";

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

// Staff scan a kiosk's rotating QR: check in, or out when already in.
router.post(
  "/kiosk-check",
  authorize({ anyPermissions: ["attendance:create"] }),
  qrScanLimiter,
  validateKioskCheck,
  kioskCheck
);

// Kiosks (attendance setup = geofence permissions, admin).
router.get("/kiosks", authorize({ anyPermissions: ["geofence:read"] }), listKiosks);
router.post("/kiosks", authorize({ anyPermissions: ["geofence:create"] }), validateCreateKiosk, createKiosk);
router.delete("/kiosks/:publicId", authorize({ anyPermissions: ["geofence:create"] }), revokeKiosk);

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
