// server/src/routes/employeeRoutes.js

import express from "express";

import {
  createEmployee,
  getEmployees,
  getEmployee,
  updateEmployee,
  deleteEmployee,
} from "../controllers/employeeController.js";

import authenticate from "../middleware/authenticate.js";
import { requireRole } from "../middleware/authorize.js";

const router = express.Router();

// All employee routes require authentication
router.use(authenticate);

// Create employee
router.post(
  "/",
  requireRole("super_admin", "admin", "hr"),
  createEmployee
);

// Get employees (employee:read — admin, principal, hr)
router.get(
  "/",
  requireRole("super_admin", "admin", "principal", "hr"),
  getEmployees
);

// Get one employee
router.get(
  "/:publicId",
  requireRole("super_admin", "admin", "principal", "hr"),
  getEmployee
);

// Update employee (employee:update — admin, hr)
router.put(
  "/:publicId",
  requireRole("super_admin", "admin", "hr"),
  updateEmployee
);

// Delete employee (employee:delete — admin)
router.delete(
  "/:publicId",
  requireRole("super_admin", "admin"),
  deleteEmployee
);

export default router;