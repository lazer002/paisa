// src/routes/assignmentRoutes.js

import express from "express";

import {
  createAssignment,
  getAssignments,
  getAssignment,
  updateAssignment,
  deleteAssignment,
} from "../controllers/assignmentController.js";

import authenticate from "../middleware/authenticate.js";
import { requireRole } from "../middleware/authorize.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  requireRole("super_admin", "admin", "teacher", "student"),
  getAssignments
);

router.get(
  "/:publicId",
  requireRole("super_admin", "admin", "teacher", "student"),
  getAssignment
);

router.post(
  "/",
  requireRole("super_admin", "admin", "teacher"),
  createAssignment
);

router.put(
  "/:publicId",
  requireRole("super_admin", "admin", "teacher"),
  updateAssignment
);

router.delete(
  "/:publicId",
  requireRole("super_admin", "admin", "teacher"),
  deleteAssignment
);

export default router;