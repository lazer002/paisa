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
import { authorize } from "../middleware/authorize.js";
import {
  validateCreatePayroll,
  validatePayrollStatus,
  validateGeneratePayroll,
  validateAssignSalaryStructure,
} from "../validators/payrollValidator.js";

const router = express.Router();

router.use(authenticate);

// Gates run before body validation so forbidden roles get 403, not 400.
// super_admin passes every permission check.

// payroll:read = admin, principal, hr, accountant + self-service roles
// (employee, teacher, counselor, support), who are scoped to their own
// payslips in the controller.
const canRead = authorize({ anyPermissions: ["payroll:read"] });
// payroll:create / update / delete = admin, hr
const canRun = authorize({ anyPermissions: ["payroll:create"] });
const canUpdate = authorize({ anyPermissions: ["payroll:update"] });
const canDelete = authorize({ anyPermissions: ["payroll:delete"] });

// Get payrolls (non-viewers are scoped to their own in the controller)
router.get("/", canRead, getPayrolls);

// Calculation from salary structure + attendance + leaves
router.get("/preview", canRun, previewPayroll);
router.post("/generate", canRun, validateGeneratePayroll, generatePayroll);

// Employee -> salary structure assignment
router.get("/salary-assignments", canRun, getSalaryAssignments);
router.put(
  "/salary-assignments/:userId",
  canRun,
  validateAssignSalaryStructure,
  assignSalaryStructure
);

// Create payroll
router.post("/", canRun, validateCreatePayroll, createPayroll);

// Payslip (own, or any in the org for payroll viewers)
router.get("/:publicId", canRead, getPayslip);

// Update payroll status
router.put(
  "/:publicId/status",
  canUpdate,
  validatePayrollStatus,
  updatePayrollStatus
);

// Delete payroll
router.delete("/:publicId", canDelete, deletePayroll);

export default router;
