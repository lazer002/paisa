// server/src/routes/testRoutes.js

import express from "express";

import {
  createTest,
  getTests,
  getTest,
  updateTest,
  deleteTest,
  createQuestion,
  getQuestions,
  updateQuestion,
  deleteQuestion,
  startAttempt,
  getAttempts,
  submitAttempt,
  gradeAttempt,
  recordAttemptEvent,
} from "../controllers/testController.js";

import authenticate from "../middleware/authenticate.js";

import { authorize } from "../middleware/authorize.js";

import { body } from "../validators/common.js";

import {
  createTestSchema,
  updateTestSchema,
  createQuestionSchema,
  updateQuestionSchema,
  submitAttemptSchema,
  gradeAttemptSchema,
  attemptEventSchema,
} from "../validators/testValidator.js";

const router = express.Router();

router.use(authenticate);

// ─────────────────────────────────────────────
// TESTS
// ─────────────────────────────────────────────

router.get(
  "/",
  authorize({
    anyPermissions: ["test:read"],
  }),
  getTests
);

router.get(
  "/:publicId",
  authorize({
    anyPermissions: ["test:read"],
  }),
  getTest
);

router.post(
  "/",
  authorize({
    anyPermissions: ["test:create"],
  }),
  body(createTestSchema),
  createTest
);

router.put(
  "/:publicId",
  authorize({
    anyPermissions: ["test:update"],
  }),
  body(updateTestSchema),
  updateTest
);

// Creators may delete their own tests; managers any (controller).
router.delete(
  "/:publicId",
  authorize({
    anyPermissions: ["test:delete", "test:create"],
  }),
  deleteTest
);

// ─────────────────────────────────────────────
// QUESTIONS (question bank)
// ─────────────────────────────────────────────

const questionRouter = express.Router();

questionRouter.use(authenticate);

questionRouter.get(
  "/",
  authorize({
    anyPermissions: ["question:read"],
  }),
  getQuestions
);

questionRouter.post(
  "/",
  authorize({
    anyPermissions: ["question:create"],
  }),
  body(createQuestionSchema),
  createQuestion
);

questionRouter.put(
  "/:publicId",
  authorize({
    anyPermissions: ["question:update"],
  }),
  body(updateQuestionSchema),
  updateQuestion
);

// Creators may delete their own questions; managers any (controller).
questionRouter.delete(
  "/:publicId",
  authorize({
    anyPermissions: ["question:delete", "question:create"],
  }),
  deleteQuestion
);

// ─────────────────────────────────────────────
// ATTEMPTS
// Must be declared before /:publicId routes
// are hit — express matches in order, so
// attempts live under /attempts.
// ─────────────────────────────────────────────

const attemptRouter = express.Router();

attemptRouter.use(authenticate);

attemptRouter.get(
  "/",
  authorize({
    anyPermissions: ["test_attempt:read"],
  }),
  getAttempts
);

attemptRouter.post(
  "/:publicId/start",
  authorize({
    anyPermissions: ["test_attempt:create"],
  }),
  startAttempt
);

attemptRouter.put(
  "/:publicId/submit",
  authenticate,
  authorize({
    anyPermissions: ["test_attempt:update"],
  }),
  body(submitAttemptSchema),
  submitAttempt
);

// The test-taker's browser reports tab switches, copy/paste… (owner only).
attemptRouter.post(
  "/:publicId/events",
  authorize({
    anyPermissions: ["test_attempt:update"],
  }),
  body(attemptEventSchema),
  recordAttemptEvent
);

attemptRouter.put(
  "/:publicId/grade",
  authorize({
    // Grading is staff work: test_attempt:update is the student's
    // submit permission. The controller limits teachers to their own tests.
    anyPermissions: ["test_attempt:manage", "test:manage", "test:update"],
  }),
  body(gradeAttemptSchema),
  gradeAttempt
);

export { questionRouter, attemptRouter };

export default router;
