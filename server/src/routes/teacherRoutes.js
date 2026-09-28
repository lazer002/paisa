// server/src/routes/teacherRoutes.js

import express from "express";

import {
  createTeacher,
  getTeachers,
} from "../controllers/teacherController.js";

import authenticate from "../middleware/authenticate.js";
import { requireRole } from "../middleware/authorize.js";

const router = express.Router();

router.use(authenticate);

// Create teacher
router.post(
  "/",
  requireRole(
    "super_admin",
    "admin"
  ),
  createTeacher
);

// Get teachers
router.get(
  "/",
  requireRole(
    "super_admin",
    "admin",
    "teacher"
  ),
  getTeachers
);

export default router;