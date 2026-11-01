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
  authorize,
  requirePermission,
} from "../middleware/authorize.js";
import { validateBody } from "../middleware/validate.js";

import {
  createEmployeeSchema,
  updateEmployeeSchema,
  changeEmployeeStageSchema,
  updateEmployeeChecklistSchema,
} from "../validators/employeeValidator.js";

const router = express.Router();

// All employee routes require authentication
router.use(authenticate);

// The employee directory is for people-management roles: employee:read AND
// hr:read (admin, principal, hr). employee:read alone also covers the
// employee/accountant/support roles, whose access is self-service only.
const canReadEmployees = authorize({
  permissions: ["employee:read", "hr:read"],
});

// Writes need employee:update AND employee:manage. The employee role holds
// employee:update for its own profile, so update alone would let staff edit
// each other; manage is admin/hr only.
const canManageEmployees = requirePermission(
  "employee:update",
  "employee:manage"
);

// Create employee (employee:create — admin, hr)
router.post(
  "/",
  authorize({
    anyPermissions: ["employee:create"],
  }),
  validateBody(createEmployeeSchema),
  createEmployee
);

// Get employees
router.get(
  "/",
  canReadEmployees,
  getEmployees
);

// Lifecycle stage, history and onboarding/exit checklist
router.get(
  "/:publicId/lifecycle",
  canReadEmployees,
  getEmployeeLifecycle
);

router.post(
  "/:publicId/stage",
  canManageEmployees,
  validateBody(changeEmployeeStageSchema),
  changeEmployeeStage
);

router.put(
  "/:publicId/checklist",
  canManageEmployees,
  validateBody(updateEmployeeChecklistSchema),
  updateEmployeeChecklist
);

// Get one employee
router.get(
  "/:publicId",
  canReadEmployees,
  getEmployee
);

// Update employee (admin, hr)
router.put(
  "/:publicId",
  canManageEmployees,
  validateBody(updateEmployeeSchema),
  updateEmployee
);

// Delete employee (employee:delete — admin)
router.delete(
  "/:publicId",
  authorize({
    anyPermissions: ["employee:delete"],
  }),
  deleteEmployee
);

export default router;
