// server/src/routes/qrSessionRoutes.js

import express from "express";

import {
  createQrSession,
  getQrSessions,
  closeQrSession,
} from "../controllers/qrSessionController.js";

import authenticate from "../middleware/authenticate.js";

import { authorize } from "../middleware/authorize.js";

import { body } from "../validators/common.js";

import { createQrSessionSchema } from "../validators/attendanceOpsValidator.js";

const router = express.Router();

router.use(authenticate);

router.get("/", authorize({ anyPermissions: ["qr_session:read"] }), getQrSessions);

router.post(
  "/",
  authorize({ anyPermissions: ["qr_session:create"] }),
  body(createQrSessionSchema),
  createQrSession
);

// PUT /:publicId/close reads no body fields, so it has no body schema.

router.put(
  "/:publicId/close",
  authorize({ anyPermissions: ["qr_session:update"] }),
  closeQrSession
);

export default router;
