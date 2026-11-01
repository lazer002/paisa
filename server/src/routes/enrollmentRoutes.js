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

import { body } from "../validators/common.js";

import {
  createEnrollmentSchema,
  updateEnrollmentStatusSchema,
} from "../validators/academicValidator.js";

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
  body(createEnrollmentSchema),
  createEnrollment
);

router.put(
  "/:publicId/status",
  authorize({
    anyPermissions: ["enrollment:update"],
  }),
  body(updateEnrollmentStatusSchema),
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
