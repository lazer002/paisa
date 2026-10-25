// server/src/routes/studentRoutes.js

import express from "express";

import {
  createStudent,
  getStudents,
  getStudent,
  updateStudent,
  deleteStudent,
} from "../controllers/studentController.js";

import authenticate from "../middleware/authenticate.js";
import { requireRole } from "../middleware/authorize.js";

const router = express.Router();

router.use(authenticate);

// Roles allowed to read student profiles (student:read in the matrix)
const READ_ROLES = [
  "super_admin",
  "admin",
  "principal",
  "teacher",
  "counselor",
];

// Roles allowed to edit student profiles (student:update in the matrix)
const UPDATE_ROLES = [
  "super_admin",
  "admin",
  "principal",
  "teacher",
  "counselor",
];

// Create student profile
router.post(
  "/",
  requireRole(
    "super_admin",
    "admin",
    "principal",
    "teacher",
    "counselor"
  ),
  createStudent
);

// Get students
router.get(
  "/",
  requireRole(...READ_ROLES),
  getStudents
);

// Get one student
router.get(
  "/:publicId",
  requireRole(...READ_ROLES),
  getStudent
);

// Update student profile
router.put(
  "/:publicId",
  requireRole(...UPDATE_ROLES),
  updateStudent
);

// Delete student profile
router.delete(
  "/:publicId",
  requireRole("super_admin", "admin"),
  deleteStudent
);

export default router;