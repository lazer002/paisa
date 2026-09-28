// server/src/routes/studentRoutes.js

import express from "express";

import {
  createStudent,
  getStudents,
} from "../controllers/studentController.js";

import authenticate from "../middleware/authenticate.js";
import { requireRole } from "../middleware/authorize.js";

const router = express.Router();

router.use(authenticate);

// Create student
router.post(
  "/",
  requireRole(
    "super_admin",
    "admin",
    "teacher"
  ),
  createStudent
);

// Get students
router.get(
  "/",
  requireRole(
    "super_admin",
    "admin",
    "teacher"
  ),
  getStudents
);

export default router;