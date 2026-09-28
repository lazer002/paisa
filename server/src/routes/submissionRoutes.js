// server/src/routes/submissionRoutes.js

import express from "express";

import {
  submitAssignment,
  getSubmissions,
  getSubmission,
  gradeSubmission,
} from "../controllers/submissionController.js";

import authenticate from "../middleware/authenticate.js";
import { requireRole } from "../middleware/authorize.js";

const router = express.Router();

router.use(authenticate);

// Get submissions
router.get(
  "/",
  getSubmissions
);

// Submit assignment
router.post(
  "/",
  requireRole("student"),
  submitAssignment
);

// Get single submission
router.get(
  "/:publicId",
  getSubmission
);

// Grade submission
router.put(
  "/:publicId/grade",
  requireRole(
    "super_admin",
    "admin",
    "teacher"
  ),
  gradeSubmission
);

export default router;