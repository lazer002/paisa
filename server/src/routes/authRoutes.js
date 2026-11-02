// server/src/routes/authRoutes.js

import express from "express";

import {
  register,
  login,
  loginTwoFactor,
  twoFactorStatus,
  twoFactorSetup,
  twoFactorEnable,
  twoFactorDisable,
  twoFactorRecoveryCodes,
  listSessions,
  revokeSession,
  revokeOtherSessions,
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
  twoFactorLoginSchema,
  twoFactorPasswordSchema,
  twoFactorEnableSchema,
  twoFactorConfirmSchema,
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

// Login step 2 when two-factor sign-in is on (public; the challenge
// token from step 1 identifies the user). Same limiter as login.
router.post(
  "/login/2fa",
  loginRateLimiter,
  validateBody(twoFactorLoginSchema),
  auditMiddleware({
    action: "login",
    category: "authentication",
    resource: "User",
    description:
      "Two-factor login attempt",
  }),
  loginTwoFactor
);

// ─────────────────────────────────────────────
// TWO-FACTOR SETTINGS (own account)
// ─────────────────────────────────────────────

router.get("/2fa", authenticate, twoFactorStatus);

router.post(
  "/2fa/setup",
  authenticate,
  authRateLimiter,
  validateBody(twoFactorPasswordSchema),
  twoFactorSetup
);

router.post(
  "/2fa/enable",
  authenticate,
  authRateLimiter,
  validateBody(twoFactorEnableSchema),
  auditMiddleware({
    action: "update",
    category: "security",
    resource: "User",
    description: "Two-factor sign-in turned on",
  }),
  twoFactorEnable
);

router.post(
  "/2fa/disable",
  authenticate,
  authRateLimiter,
  validateBody(twoFactorConfirmSchema),
  auditMiddleware({
    action: "update",
    category: "security",
    resource: "User",
    description: "Two-factor sign-in turned off",
  }),
  twoFactorDisable
);

router.post(
  "/2fa/recovery-codes",
  authenticate,
  authRateLimiter,
  validateBody(twoFactorConfirmSchema),
  twoFactorRecoveryCodes
);

// ─────────────────────────────────────────────
// SIGNED-IN DEVICES (own account)
// ─────────────────────────────────────────────

router.get("/sessions", authenticate, listSessions);

// Before /sessions/:sessionId so "others" is not taken as an id.
router.post(
  "/sessions/revoke-others",
  authenticate,
  auditMiddleware({
    action: "logout",
    category: "authentication",
    resource: "RefreshSession",
    description: "Signed out of all other devices",
  }),
  revokeOtherSessions
);

router.delete(
  "/sessions/:sessionId",
  authenticate,
  auditMiddleware({
    action: "logout",
    category: "authentication",
    resource: "RefreshSession",
    description: "Signed out of a device",
  }),
  revokeSession
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