// server/src/routes/statsRoutes.js

import express from "express";

import {
  getSuperAdminStats,
  getAdminStats,
  getTeacherStats,
  getStudentStats,
  getHRStats,
  getEmployeeStats,
  getAccountantStats,
  getCounselorStats,
  getSupportStats,
} from "../controllers/statsController.js";

import authenticate from "../middleware/authenticate.js";
import { requireRole } from "../middleware/authorize.js";

const router = express.Router();

router.use(authenticate);

// Super Admin statistics
router.get(
  "/superadmin",
  requireRole("super_admin"),
  getSuperAdminStats
);

// Admin statistics (admin & principal share org-wide stats)
router.get(
  "/admin",
  requireRole(
    "super_admin",
    "admin",
    "principal"
  ),
  getAdminStats
);

// Teacher statistics
router.get(
  "/teacher",
  requireRole("teacher"),
  getTeacherStats
);

// Student statistics
router.get(
  "/student",
  requireRole("student"),
  getStudentStats
);

// HR statistics
router.get(
  "/hr",
  requireRole(
    "super_admin",
    "admin",
    "hr"
  ),
  getHRStats
);

// Employee statistics
router.get(
  "/employee",
  requireRole("employee"),
  getEmployeeStats
);

// Accountant statistics
router.get(
  "/accountant",
  requireRole("accountant"),
  getAccountantStats
);

// Counselor statistics
router.get(
  "/counselor",
  requireRole("counselor"),
  getCounselorStats
);

// Support statistics
router.get(
  "/support",
  requireRole("support"),
  getSupportStats
);

export default router;