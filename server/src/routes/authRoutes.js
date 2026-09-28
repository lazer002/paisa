// server/src/routes/authRoutes.js

import express from "express";

import {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  me,
} from "../controllers/authController.js";

import authenticate from "../middleware/authenticate.js";

import { validateBody } from "../middleware/validate.js";

import {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
} from "../validators/authValidator.js";

import {
  authRateLimiter,
  loginRateLimiter,
} from "../middleware/rateLimiter.js";

import { auditMiddleware } from "../middleware/audit.js";

const router = express.Router();

// ─────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────

router.post(
  "/register",
  authRateLimiter,
  validateBody(registerSchema),
  auditMiddleware({
    action: "register",
    category: "authentication",
    resource: "User",
    description:
      "User registration attempt",
  }),
  register
);

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────

router.post(
  "/login",
  loginRateLimiter,
  validateBody(loginSchema),
  auditMiddleware({
    action: "login",
    category: "authentication",
    resource: "User",
    description:
      "User login attempt",
  }),
  login
);

// ─────────────────────────────────────────────
// REFRESH TOKEN
// ─────────────────────────────────────────────

router.post(
  "/refresh",
  authRateLimiter,
  validateBody(refreshSchema),
  refresh
);

// ─────────────────────────────────────────────
// LOGOUT CURRENT SESSION
// ─────────────────────────────────────────────

router.post(
  "/logout",
  authenticate,
  validateBody(logoutSchema),
  logout
);

// ─────────────────────────────────────────────
// LOGOUT ALL SESSIONS
// ─────────────────────────────────────────────

router.post(
  "/logout-all",
  authenticate,
  logoutAll
);

// ─────────────────────────────────────────────
// CURRENT AUTHENTICATED USER
// ─────────────────────────────────────────────

router.get(
  "/me",
  authenticate,
  me
);

export default router;