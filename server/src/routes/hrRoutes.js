import express from "express";
import { createHR, getHRs } from "../controllers/hrController.js";
import { authMiddleware, isAdmin, isSuperAdmin } from "../middleware/auth.js";

const router = express.Router();

// Only Admins or SuperAdmins can create HR
router.post("/", authMiddleware, isAdmin, createHR);

// Get all HRs
router.get("/", authMiddleware, isAdmin, getHRs);

export default router;
