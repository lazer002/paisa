import express from "express";
import { createPayroll, getPayrolls, updatePayrollStatus, deletePayroll } from "../controllers/payrollController.js";
import { authMiddleware, allowRoles } from "../middleware/auth.js";

const router = express.Router();
router.use(authMiddleware);

router.get("/", allowRoles("super_admin", "admin", "hr", "employee"), getPayrolls);
router.post("/", allowRoles("super_admin", "admin", "hr"), createPayroll);
router.put("/:id/status", allowRoles("super_admin", "admin", "hr"), updatePayrollStatus);
router.delete("/:id", allowRoles("super_admin", "admin", "hr"), deletePayroll);

export default router;
