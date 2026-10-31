// server/src/routes/employeeRoutes.js

import express from "express";

import {
  createEmployee,
  getEmployees,
  getEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeLifecycle,
  changeEmployeeStage,
  updateEmployeeChecklist,
} from "../controllers/employeeController.js";

import authenticate from "../middleware/authenticate.js";
import {
  requireRole,
  requirePermission,
} from "../middleware/authorize.js";

const router = express.Router();

// All employee routes require authentication
router.use(authenticate);

// Lifecycle writes need employee:update AND employee:manage. The employee
// role holds employee:update for its own profile, so update alone would let
// staff move each other through stages; manage is admin/hr only.
const canManageLifecycle = requirePermission(
  "employee:update",
  "employee:manage"
);

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

// Lifecycle stage, history and onboarding/exit checklist
router.get(
  "/:publicId/lifecycle",
  requireRole("super_admin", "admin", "principal", "hr"),
  requirePermission("employee:read"),
  getEmployeeLifecycle
);

router.post(
  "/:publicId/stage",
  canManageLifecycle,
  changeEmployeeStage
);

router.put(
  "/:publicId/checklist",
  canManageLifecycle,
  updateEmployeeChecklist
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
