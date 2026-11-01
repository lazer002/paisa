// server/src/routes/leaveRoutes.js

import express from "express";

import {
  applyLeave,
  getLeaves,
  updateLeaveStatus,
  cancelLeave,
} from "../controllers/leaveController.js";
import {
  getPolicies,
  createPolicy,
  updatePolicy,
  deletePolicy,
  getBalances,
  getAllBalances,
  adjustBalance,
} from "../controllers/leavePolicyController.js";

import authenticate from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import {
  validateApplyLeave,
  validateLeaveStatus,
  validateCancelLeave,
  validateCreatePolicy,
  validateUpdatePolicy,
  validateAdjustBalance,
} from "../validators/leaveValidator.js";

const router = express.Router();

router.use(authenticate);

// Gates run before body validation so forbidden roles get 403, not 400.
const canRead = authorize({ anyPermissions: ["leave:read"] });
const canManage = authorize({ anyPermissions: ["leave:manage"] });
const canApprove = authorize({
  anyPermissions: ["leave:approve", "leave:manage"],
});

/* ---------------- policies & balances ---------------- */

router.get("/policies", canRead, getPolicies);
router.post("/policies", canManage, validateCreatePolicy, createPolicy);
router.put(
  "/policies/:publicId",
  canManage,
  validateUpdatePolicy,
  updatePolicy
);
router.delete("/policies/:publicId", canManage, deletePolicy);

// Own balance (approvers may pass ?userId=)
router.get("/balances", canRead, getBalances);
// Everyone's balance (approvers)
router.get("/balances/all", canApprove, getAllBalances);
router.put(
  "/balances/:userId/adjust",
  canManage,
  validateAdjustBalance,
  adjustBalance
);

/* ---------------- leave requests ---------------- */

// Get leaves (self-only roles are scoped to their own leaves)
router.get("/", canRead, getLeaves);

// Apply for leave
router.post(
  "/",
  authorize({
    anyPermissions: ["leave:create"],
  }),
  validateApplyLeave,
  applyLeave
);

// Approve / reject (super_admin, admin, principal, hr hold these)
router.put(
  "/:publicId/status",
  canApprove,
  validateLeaveStatus,
  updateLeaveStatus
);

// Cancel leave (owner, or an approver; checked in the controller)
router.put(
  "/:publicId/cancel",
  canRead,
  validateCancelLeave,
  cancelLeave
);

export default router;
