// server/src/routes/payrollRoutes.js

import express from "express";

import {
  createPayroll,
  getPayrolls,
  updatePayrollStatus,
  deletePayroll,
} from "../controllers/payrollController.js";

import authenticate from "../middleware/authenticate.js";
import { requireRole } from "../middleware/authorize.js";

const router = express.Router();

router.use(authenticate);

// Get payrolls
router.get(
  "/",
  requireRole(
    "super_admin",
    "admin",
    "hr",
    "employee"
  ),
  getPayrolls
);

// Create payroll
router.post(
  "/",
  requireRole(
    "super_admin",
    "admin",
    "hr"
  ),
  createPayroll
);

// Update payroll status
router.put(
  "/:publicId/status",
  requireRole(
    "super_admin",
    "admin",
    "hr"
  ),
  updatePayrollStatus
);

// Delete payroll
router.delete(
  "/:publicId",
  requireRole(
    "super_admin",
    "admin",
    "hr"
  ),
  deletePayroll
);

export default router;