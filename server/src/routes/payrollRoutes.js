// server/src/routes/payrollRoutes.js

import express from "express";

import {
  createPayroll,
  getPayrolls,
  updatePayrollStatus,
  deletePayroll,
  getPayslip,
  getSalaryAssignments,
  assignSalaryStructure,
  previewPayroll,
  generatePayroll,
} from "../controllers/payrollController.js";

import authenticate from "../middleware/authenticate.js";
import {
  requireRole,
  authorize,
} from "../middleware/authorize.js";

const router = express.Router();

router.use(authenticate);

// payroll:create = admin, hr (super_admin passes every check)
const canRun = authorize({ anyPermissions: ["payroll:create"] });

// Get payrolls (non-viewers are scoped to their own in the controller)
router.get(
  "/",
  requireRole(
    "super_admin",
    "admin",
    "hr",
    "employee",
    "principal",
    "accountant"
  ),
  getPayrolls
);

// Calculation from salary structure + attendance + leaves
router.get("/preview", canRun, previewPayroll);
router.post("/generate", canRun, generatePayroll);

// Employee -> salary structure assignment
router.get("/salary-assignments", canRun, getSalaryAssignments);
router.put("/salary-assignments/:userId", canRun, assignSalaryStructure);

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

// Payslip (own, or any in the org for payroll viewers)
router.get(
  "/:publicId",
  authorize({ anyPermissions: ["payroll:read"] }),
  getPayslip
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
