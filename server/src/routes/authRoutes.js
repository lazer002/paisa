// server/src/routes/authRoutes.js

import express from "express";

import {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  me,
  updateProfile,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";

import authenticate from "../middleware/authenticate.js";

import { validateBody } from "../middleware/validate.js";

import {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validators/authValidator.js";

import {
  authRateLimiter,
  loginRateLimiter,
  passwordResetRateLimiter,
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
// FORGOT / RESET PASSWORD (public)
// ─────────────────────────────────────────────

router.post(
  "/forgot-password",
  passwordResetRateLimiter,
  validateBody(forgotPasswordSchema),
  forgotPassword
);

router.post(
  "/reset-password",
  authRateLimiter,
  validateBody(resetPasswordSchema),
  resetPassword
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

// ─────────────────────────────────────────────
// UPDATE OWN PROFILE / CHANGE PASSWORD
// ─────────────────────────────────────────────

router.put(
  "/profile",
  authenticate,
  authRateLimiter,
  updateProfile
);

export default router;