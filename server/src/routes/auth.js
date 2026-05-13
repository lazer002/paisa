import express from "express";
import rateLimit from "express-rate-limit";
import { register, login, logout, getProfile, updateProfile } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/auth.js";
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

router.post("/register", registerLimiter, validate(registerSchema), register);
router.post("/login", loginLimiter, validate(loginSchema), login);
router.post("/logout", logout);
router.get("/me", authMiddleware, getProfile);
router.put("/profile", authMiddleware, validate(updateUserSchema), updateProfile);

export default router;
