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
import { getReportTrends } from "../controllers/reportController.js";

import authenticate from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";

const router = express.Router();

router.use(authenticate);

// One permission per dashboard (stats:<name>); super_admin passes every
// permission check. Holders are listed in utils/permissions.js.
const dashboard = (name) =>
  authorize({ anyPermissions: [`stats:${name}`] });

// Super Admin statistics
router.get("/superadmin", dashboard("superadmin"), getSuperAdminStats);

// Admin statistics (admin & principal share org-wide stats)
router.get("/admin", dashboard("admin"), getAdminStats);

// Teacher statistics
router.get("/teacher", dashboard("teacher"), getTeacherStats);

// Student statistics
router.get("/student", dashboard("student"), getStudentStats);

// HR statistics (admin, hr)
router.get("/hr", dashboard("hr"), getHRStats);

// Employee statistics
router.get("/employee", dashboard("employee"), getEmployeeStats);

// Accountant statistics
router.get("/accountant", dashboard("accountant"), getAccountantStats);

// Counselor statistics
router.get("/counselor", dashboard("counselor"), getCounselorStats);

// Support statistics
router.get("/support", dashboard("support"), getSupportStats);

// Reports page trends; the controller picks the report for the caller's role.
router.get(
  "/trends",
  authorize({ anyPermissions: ["report:read"] }),
  getReportTrends
);

export default router;
