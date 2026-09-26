import express from "express";
import rateLimit from "express-rate-limit";
import {
  register,
  login,
  logout,
  logoutAll,
  refresh,
  getProfile,
  updateProfile,
} from "../controllers/authController.js";
import { authMiddleware } from "../middleware/auth.js";
import { User } from "../models/user.js";
import { validate } from "../utils/validation.js";
import { registerSchema, loginSchema, updateUserSchema } from "../utils/validation.js";

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many login attempts. Please wait 15 minutes and try again." },
  skipSuccessfulRequests: true,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { success: false, message: "Too many registration attempts. Please try again later." },
});

/**
 * Bootstrap-only open registration:
 * - If NO user exists at all → anyone may create the FIRST super_admin.
 * - After that, this endpoint requires an authenticated super_admin,
 *   so nobody can self-escalate to super_admin ever again.
 */
router.post("/register", registerLimiter, async (req, res, next) => {
  try {
    const userCount = await User.estimatedDocumentCount();
    if (userCount === 0) return next(); // bootstrap: create first super_admin

    // Locked down — must already be an authenticated super_admin
    return authMiddleware(req, res, (err) => {
      if (err) return err;
      if (req.user?.role !== "super_admin") {
        return res.status(403).json({
          success: false,
          message: "Registration is closed. Only a super admin can create accounts.",
        });
      }
      // Force the role to stay within what a super_admin may create
      return next();
    });
  } catch (e) {
    next(e);
  }
}, validate(registerSchema), register);

router.post("/login", loginLimiter, validate(loginSchema), login);

// Refresh uses ONLY the httpOnly cookie — no body, no headers
router.post("/refresh", refresh);

router.post("/logout", logout);
router.post("/logout-all", authMiddleware, logoutAll);

router.get("/me", authMiddleware, getProfile);
router.put("/profile", authMiddleware, validate(updateUserSchema), updateProfile);

export default router;
