// server/src/routes/enrollmentRoutes.js

import express from "express";

import {
  createEnrollment,
  getEnrollments,
  updateEnrollmentStatus,
  deleteEnrollment,
} from "../controllers/enrollmentController.js";

import authenticate from "../middleware/authenticate.js";

import { authorize } from "../middleware/authorize.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  authorize({
    anyPermissions: ["enrollment:read"],
  }),
  getEnrollments
);

router.post(
  "/",
  authorize({
    anyPermissions: ["enrollment:create"],
  }),
  createEnrollment
);

router.put(
  "/:publicId/status",
  authorize({
    anyPermissions: ["enrollment:update"],
  }),
  updateEnrollmentStatus
);

router.delete(
  "/:publicId",
  authorize({
    anyPermissions: ["enrollment:delete"],
  }),
  deleteEnrollment
);

export default router;
