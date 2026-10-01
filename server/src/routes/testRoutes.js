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
} from "../controllers/testController.js";

import authenticate from "../middleware/authenticate.js";

import { authorize } from "../middleware/authorize.js";

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
  createTest
);

router.put(
  "/:publicId",
  authorize({
    anyPermissions: ["test:update"],
  }),
  updateTest
);

router.delete(
  "/:publicId",
  authorize({
    anyPermissions: ["test:delete"],
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
  createQuestion
);

questionRouter.put(
  "/:publicId",
  authorize({
    anyPermissions: ["question:update"],
  }),
  updateQuestion
);

questionRouter.delete(
  "/:publicId",
  authorize({
    anyPermissions: ["question:delete"],
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
  submitAttempt
);

attemptRouter.put(
  "/:publicId/grade",
  authorize({
    anyPermissions: ["test_attempt:update", "test_attempt:manage"],
  }),
  gradeAttempt
);

export { questionRouter, attemptRouter };

export default router;
