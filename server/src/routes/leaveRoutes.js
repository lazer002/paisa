import express from "express";
import { applyLeave, getLeaves, updateLeaveStatus, cancelLeave } from "../controllers/leaveController.js";
import { authMiddleware, allowRoles } from "../middleware/auth.js";

const router = express.Router();
router.use(authMiddleware);

router.get("/", getLeaves);
router.post("/", applyLeave);
router.put("/:id/status", allowRoles("super_admin", "admin", "hr"), updateLeaveStatus);
router.put("/:id/cancel", cancelLeave);

export default router;
