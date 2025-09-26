import express from "express";
import { register, login, logout, getProfile, updateProfile } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/auth.js";
import { validate } from "../utils/validation.js";
import { registerSchema, loginSchema, updateUserSchema } from "../utils/validation.js";

const router = express.Router();

// Public routes
router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);

// Protected routes
router.post("/logout", logout);
router.get("/me", authMiddleware, getProfile);
router.put("/profile", authMiddleware, validate(updateUserSchema), updateProfile);

export default router;
