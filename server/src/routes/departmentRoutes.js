// server/src/routes/departmentRoutes.js

import express from "express";

import {
  createDepartment,
  getDepartments,
  updateDepartment,
  deleteDepartment,
} from "../controllers/departmentController.js";

import authenticate from "../middleware/authenticate.js";
import { requireRole } from "../middleware/authorize.js";

const router = express.Router();

router.use(authenticate);

// Get departments
router.get(
  "/",
  getDepartments
);

// Create department
router.post(
  "/",
  requireRole(
    "super_admin",
    "admin",
    "hr"
  ),
  createDepartment
);

// Update department
router.put(
  "/:publicId",
  requireRole(
    "super_admin",
    "admin",
    "hr"
  ),
  updateDepartment
);

// Delete department
router.delete(
  "/:publicId",
  requireRole(
    "super_admin",
    "admin"
  ),
  deleteDepartment
);

export default router;