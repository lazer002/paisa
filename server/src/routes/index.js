// server/src/routes/index.js

import express from "express";

import authRoutes from "./authRoutes.js";
import organizationRoutes from "./organizationRoutes.js";
import userRoutes from "./userRoutes.js";
import hrRoutes from "./hrRoutes.js";
import employeeRoutes from "./employeeRoutes.js";
import studentRoutes from "./studentRoutes.js";
import teacherRoutes from "./teacherRoutes.js";

import classRoutes from "./classRoutes.js";
import assignmentRoutes from "./assignmentRoutes.js";
import submissionRoutes from "./submissionRoutes.js";
import attendanceRoutes from "./attendanceRoutes.js";
import studyMaterialRoutes from "./studyMaterialRoutes.js";

import announcementRoutes from "./announcementRoutes.js";
import payrollRoutes from "./payrollRoutes.js";
import leaveRoutes from "./leaveRoutes.js";
import departmentRoutes from "./departmentRoutes.js";
import statsRoutes from "./statsRoutes.js";

const router = express.Router();

// ─────────────────────────────────────────────
// AUTHENTICATION
// ─────────────────────────────────────────────

router.use(
  "/auth",
  authRoutes
);

// ─────────────────────────────────────────────
// ORGANIZATION & USERS
// ─────────────────────────────────────────────

router.use(
  "/organizations",
  organizationRoutes
);

router.use(
  "/users",
  userRoutes
);

// ─────────────────────────────────────────────
// HR & PEOPLE
// ─────────────────────────────────────────────

router.use(
  "/hr",
  hrRoutes
);

router.use(
  "/employees",
  employeeRoutes
);

router.use(
  "/students",
  studentRoutes
);

router.use(
  "/teachers",
  teacherRoutes
);

// ─────────────────────────────────────────────
// ACADEMIC
// ─────────────────────────────────────────────

router.use(
  "/classes",
  classRoutes
);

router.use(
  "/assignments",
  assignmentRoutes
);

router.use(
  "/submissions",
  submissionRoutes
);

router.use(
  "/attendance",
  attendanceRoutes
);

router.use(
  "/study-materials",
  studyMaterialRoutes
);

// ─────────────────────────────────────────────
// BUSINESS / OPERATIONS
// ─────────────────────────────────────────────

router.use(
  "/announcements",
  announcementRoutes
);

router.use(
  "/payroll",
  payrollRoutes
);

router.use(
  "/leaves",
  leaveRoutes
);

router.use(
  "/departments",
  departmentRoutes
);

router.use(
  "/stats",
  statsRoutes
);

// ─────────────────────────────────────────────
// API ROOT
// ─────────────────────────────────────────────

router.get(
  "/",
  (req, res) => {
    res.status(200).json({
      success: true,
      message:
        "PAISA API is running",
      version:
        process.env.APP_VERSION ||
        "3.0.0",
      timestamp:
        new Date().toISOString(),
      requestId:
        req.requestId || null,
    });
  }
);

export default router;