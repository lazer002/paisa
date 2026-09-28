// src/routes/attendanceRoutes.js

import express from "express";

import {
  markAttendance,
  getAttendance,
  getMyAttendance,
} from "../controllers/attendanceController.js";

import authenticate from "../middleware/authenticate.js";
import { requireRole } from "../middleware/authorize.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/me",
  getMyAttendance
);

router.get(
  "/",
  requireRole("super_admin", "admin", "teacher", "hr"),
  getAttendance
);

router.post(
  "/",
  requireRole("super_admin", "admin", "teacher"),
  markAttendance
);

export default router;