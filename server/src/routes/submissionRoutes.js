// server/src/routes/submissionRoutes.js

import express from "express";

import {
  submitAssignment,
  getSubmissions,
  getSubmission,
  gradeSubmission,
} from "../controllers/submissionController.js";

import authenticate from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { body } from "../validators/common.js";
import {
  submitAssignmentSchema,
  gradeSubmissionSchema,
} from "../validators/submissionValidator.js";

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
  // submission:create is also held by staff; submitAssignment itself
  // rejects anyone who is not a student (403).
  authorize({ anyPermissions: ["submission:create"] }),
  body(submitAssignmentSchema),
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
  authorize({ anyPermissions: ["submission:update"] }),
  body(gradeSubmissionSchema),
  gradeSubmission
);

export default router;